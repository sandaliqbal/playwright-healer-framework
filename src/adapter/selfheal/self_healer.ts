import { Page, Locator } from "playwright";
import { ILocatorHealer } from "./healer_interface";
import { LocatorDescriptor } from "./models";
import { normalizeFailure } from "./parser";
import { buildLocator } from "./retry";
import { manageFailure } from "./orchestrator";

export class SimpleSelfHealer implements ILocatorHealer {
  async heal(params: { page: Page; exception: Error }): Promise<Locator> {
    const { page, exception } = params;

    // Normalize the failure into a canonical FailureContext
    const ctx = await normalizeFailure({
      tool: "playwright",
      page,
      exception,
      testType: "REGRESSION",
    });

    // Pass the failure context to the self-healing engine
    const result = await manageFailure(ctx);

    console.info("Healing engine result:", JSON.stringify(result));

    if (result && Object.keys(result).length > 0 && Object.keys(result.healedLocator).length > 0) {
      const loc: LocatorDescriptor = result.healedLocator;

      // Check thresholds for rank or confidence
      if (loc.rank >= 100 || loc.confidence >= 0.9) {
        const healedLocator: Locator = buildLocator(page, loc);
        console.info("Returning healed locator:", healedLocator);
        return healedLocator;
      } else {
        const message =
          `Manual review required as locator score doesn't meet the required threshold. ` +
          `Suggested locator: ${loc.toPlaywright()}. ` +
          `Locator rank: ${loc.rank}, confidence: ${loc.confidence}`;
        throw new Error(message, { cause: exception });
      }
    } else {
      throw exception;
    }
  }
}
