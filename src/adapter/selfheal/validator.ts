import { Page, Locator } from '@playwright/test';
import { LocatorDescriptor, ValidationResult } from './models';
import { buildLocator } from './retry';

export async function validateLocatorUniqueness(
  page: Page,
  locatorExp: LocatorDescriptor,
  timeout: number = 2000
): Promise<ValidationResult> {
  try {
    // Build Playwright locator safely
    const locator: Locator = buildLocator(page, locatorExp);

    // Wait briefly for DOM stability
    await locator.first().waitFor({ timeout });

    const count = await locator.count();

    return {
      locator: locatorExp,
      locatorRank: locatorExp.rank,
      count,
      isUnique: count === 1,
      error: null,
    };
  } catch (e) {
    return {
      locator: locatorExp,
      locatorRank: locatorExp.rank,
      count: 0,
      isUnique: false,
      error: (e as Error).message,
    };
  }
}
