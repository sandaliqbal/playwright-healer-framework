import { Page, Locator } from '@playwright/test';
import { LocatorDescriptor } from './models';

export function buildLocator(
  page: Page,
  d: LocatorDescriptor
): Locator {
  switch (d.strategy) {
    case 'role':
      return page.getByRole(d.role!, {
        name: d.value,
        exact: d.exact ?? false
      });

    case 'text':
      return page.getByText(d.value, {
        exact: d.exact ?? false
      });

    case 'label':
      return page.getByLabel(d.value);

    case 'placeholder':
      return page.getByPlaceholder(d.value);

    case 'xpath':
    case 'css':
      return page.locator(d.value);

    default:
      throw new Error(`Unsupported locator strategy: ${d.strategy}`);
  }
}
