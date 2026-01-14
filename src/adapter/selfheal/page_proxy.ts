import { Page, Locator } from '@playwright/test';
import { ILocatorHealer } from './healer_interface';
import { HealingLocatorProxy } from './locator_proxy';
import { toAriaRole } from './roles';

export class HealingPage {
  private readonly page: Page;
  private readonly healer: ILocatorHealer;

  constructor(page: Page, healer: ILocatorHealer) {
    this.page = page;
    this.healer = healer;
  }

  getByRole(
    role: string,
    options?: Parameters<Page['getByRole']>[1]
  ) {
    const locator: Locator = this.page.getByRole(toAriaRole(role)!, options)
    return new HealingLocatorProxy(locator, this.healer);
  }

  getByAltText(
    text: string,
    options?: Parameters<Page['getByAltText']>[1]
  ) {
    const locator: Locator = this.page.getByAltText(text, options);
    return new HealingLocatorProxy(locator, this.healer);
  }

  getByText(
    text: string,
    options?: Parameters<Page['getByText']>[1]
  ) {
    const locator: Locator = this.page.getByText(text, options);
    return new HealingLocatorProxy(locator, this.healer);
  }

  getByLabel(
    text: string,
    options?: Parameters<Page['getByLabel']>[1]
  ) {
    const locator: Locator = this.page.getByLabel(text, options);
    return new HealingLocatorProxy(locator, this.healer);
  }

  getByPlaceholder(
    text: string,
    options?: Parameters<Page['getByPlaceholder']>[1]
  ) {
    const locator: Locator = this.page.getByPlaceholder(text, options);
    return new HealingLocatorProxy(locator, this.healer);
  }

  getByTitle(
    text: string,
    options?: Parameters<Page['getByTitle']>[1]
  ) {
    const locator: Locator = this.page.getByTitle(text, options);
    return new HealingLocatorProxy(locator, this.healer);
  }

  getByTestId(
    text: string | RegExp,
  ) {
    const locator: Locator = this.page.getByTestId(text);
    return new HealingLocatorProxy(locator, this.healer);
  }

  locator(
    text: string,
    options?: Parameters<Page['locator']>[1]
  ) {
    const locator: Locator = this.page.locator(text, options);
    return new HealingLocatorProxy(locator, this.healer);
  }

  getPage() {
    return this.page
  }

  async goto(
    url: string,
    options?: Parameters<Page['goto']>[1]
  ) {
    return await this.page.goto(url, options);
  }

  async close(
    options?: Parameters<Page['close']>[0]
  ) {
    return await this.page.close(options);
  }
}
