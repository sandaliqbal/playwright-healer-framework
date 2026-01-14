import { test as base, Page } from '@playwright/test';
import { HealingPage } from '../src/adapter/selfheal/page_proxy';
import { SimpleSelfHealer } from '../src/adapter/selfheal/self_healer';


type Fixtures = {
  healer: HealingPage;
};

export const test = base.extend<Fixtures>({
  healer: async ({ page }: { page: Page }, use: (arg0: any) => any) => {
    const healer = new SimpleSelfHealer();
    const healingPage = new HealingPage(page, healer);
    await use(healingPage);
    await healingPage.close();
  },
});

export { expect } from '@playwright/test';
