import { Locator, Page } from '@playwright/test';
import { ILocatorHealer } from './healer_interface';

export class HealingLocatorProxy {
  private readonly locator: Locator;
  private readonly page: Page;
  private readonly healer: ILocatorHealer;

  constructor(locator: Locator, healer: ILocatorHealer) {
    this.locator = locator;
    this.page = locator.page();
    this.healer = healer;
  }

  async click(options?: Parameters<Locator['click']>[0]) {
    return await this.execute('click', options);
  }

  async fill(
    value: string,
    options?: Parameters<Locator['fill']>[1]
  ) {
    return this.execute('fill', value, options);
  }

  private async execute<
    T extends keyof Locator
  >(action: T, ...args: any[]) {
    try {
      this.page.setDefaultTimeout(3000);
      // @ts-ignore – dynamic method dispatch
      return await (this.locator[action] as any)(...args);
    } catch (error) {
      const healedLocator = await this.healer.heal({
        page: this.page,
        exception: error as Error
      });

      // @ts-ignore – dynamic method dispatch
      return await (healedLocator[action] as any)(...args);
    }
  }
}
