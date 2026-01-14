import { Rule, FailureContext, DecisionType } from './models';

/**
 * Matches the "when" conditions of a rule against the failure context.
 */
export function matchWhen(
  when: Record<string, any>,
  ctx: FailureContext
): boolean {
  for (const [key, expected] of Object.entries(when)) {
    const actual = (ctx as any)[key];

    if (Array.isArray(expected)) {
      if (!expected.includes(actual)) return false;
    } else if (typeof expected === 'string') {
      if (expected !== actual) return false;
    } else {
      return false; // unsupported type
    }
  }

  return true;
}

/**
 * Matches the "failure" part of a rule against the context.
 */
export function matchFailure(
  match: Record<string, any>,
  ctx: FailureContext
): boolean {
  const failure = ctx.failure;

  for (const [key, expected] of Object.entries(match)) {
    switch (key) {
      case 'failure_type':
        if (failure.type !== expected) return false;
        break;

      case 'error_contains': {
        const errorMsg = failure.error.message ?? '';
        if (Array.isArray(expected)) {
          if (!expected.some((e: string) => errorMsg.includes(e))) return false;
        } else if (typeof expected === 'string') {
          if (!errorMsg.includes(expected)) return false;
        }
        break;
      }

      case 'locator_contains': {
        const locatorStr = JSON.stringify(failure.originalLocator);
        if (!locatorStr.includes(expected)) return false;
        break;
      }

      case 'attempts_exhausted': {
        // Assuming ctx has 'attempt' property
        if (expected && (ctx as any).attempt < 2) return false;
        break;
      }

      case 'requires': {
        if (!Array.isArray(expected)) break;
        for (const artifact of expected) {
          if (!(ctx.artifacts as any)[artifact]) return false;
        }
        break;
      }

      default:
        return false; // unknown match key
    }
  }

  return true;
}

/**
 * Builds the decision object from a rule.
 */
export function buildDecision(rule: Rule) {
  return {
    decision: rule.action.type as DecisionType,
    ruleId: rule.id,
    confidence: rule.confidence?.score ?? 0.0,
    details: rule.action?.transform,
    explain: rule.explain,
  };
}
