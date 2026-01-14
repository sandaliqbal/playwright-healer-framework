import { Page, Locator } from '@playwright/test';

export interface ILocatorHealer {
  heal(params: {
    page: Page;
    exception: Error;
  }): Promise<Locator>;
}
