import { parsePlaywrightLocator } from "./parser";
import { rankLocators } from "./score_engine";
import { LocatorDescriptor, ValidationResult } from "./models";
import { validateLocatorUniqueness } from "./validator";
import { loadRulesFromYaml } from "../../rule_engine/rule_loader";
import { ExecutionEngine } from "../../rule_engine/execution_engine";
import { FailureContext, Rule } from "../../rule_engine/models";
import { loadSnapshot } from "./snapshot_helper";
import { LocatorTransformer } from "./locator_transformer";
import { analyzeWithLlm } from "../../analyzer/llm_analyzer";


const rules = loadRulesFromYaml("src/rule_engine/rules.yaml");
const engine = new ExecutionEngine(rules);

export function getRuleDecision(context: FailureContext): Rule {
  const ruleDecision = engine.evaluate(context) as Rule;
  console.info("Rule decision:", ruleDecision);
  return ruleDecision;
}

export async function manageFailure(context: FailureContext): Promise<Record<string, any>> {
  const ruleDecision = getRuleDecision(context);
  if (ruleDecision.decision === "ALLOW" || ruleDecision.decision === "TRANSFORM") {
    return await getLocator(context, ruleDecision);
  } else {
    return ruleDecision;
  }
}

async function getLocator(context: FailureContext, ruleDecision: Rule): Promise<Record<string, any>> {
  const candidates = await getCandidateLocators(context, ruleDecision);
  const rankedLocators = rankLocators(candidates);

  const results: ValidationResult[] = [];
  for (const locator of rankedLocators) {
    const result = await validateLocatorUniqueness(context.page, locator);
    results.push(result);
  }

  for (const result of results) {
    if (result.isUnique) {
      return {
        failure: context.failure.type,
        originalLocator: context.failure.originalLocator.toPlaywright(),
        healedLocator: result.locator,
        locatorRank: result.locator.rank,
        decision: ruleDecision.decision,
      };
    }
  }

  // fallback if no unique locator
  return {};
}

async function getCandidateLocators(context: FailureContext, ruleDecision: Rule): Promise<LocatorDescriptor[]> {
  let locators: LocatorDescriptor[] = [];

  if (ruleDecision.decision !== "DENY") {
    const snapshot = await loadSnapshot(context.artifacts.a11ySnapshot!);
    const transformer = new LocatorTransformer();
    const transformed = transformer.transform({
      original: context.failure.originalLocator,
      snapshot,
    });

    locators = transformed ?? [];

    if (locators.length === 0) {
      console.info("No locators found from deterministic search. Calling LLM now...");
      const llmResponse = await analyzeWithLlm(
        context.artifacts.a11ySnapshot!,
        context.failure.originalLocator.toPlaywright()
      );

      for (const item of llmResponse) {
        const parsed = parsePlaywrightLocator(item.locator);
        parsed.confidence = item.confidence;
        locators.push(parsed);
      }

      console.info("List of locators fetched through LLM:", locators.toString());
    }
  }

  return locators;
}

