import { LocatorDescriptor } from './models';

export const BASE_WEIGHTS: Record<string, number> = {
  role: 100,
  label: 95,
  placeholder: 90,
  text: 70,
  css: 40,
  xpath: 20,
};

export const ROLE_PRIORITY: Record<string, number> = {
  button: 30,
  combobox: 25,
  textbox: 25,
  checkbox: 20,
  radio: 20,
  link: 15,
};

export const LANDMARK_PRIORITY: Record<string, number> = {
  main: 30,          // primary content → best
  search: 25,        // forms / search boxes
  navigation: 15,    // menus
  banner: 5,         // header
  contentinfo: -20,  // footer → usually duplicated
};

export function scoreLocator(locator: LocatorDescriptor): number {
  let score = BASE_WEIGHTS[locator.strategy!] ?? 10;

  // Landmark-aware scoring
  score += scoreLandmark(locator);
  score += scoreRole(locator);

  locator.rank = Number(score.toFixed(2));
  return locator.rank;
}

export function scoreLandmark(locator: LocatorDescriptor): number {
  if (!locator.landmark) return 0;
  return LANDMARK_PRIORITY[locator.landmark] ?? 0;
}

export function scoreRole(locator: LocatorDescriptor): number {
  if (!locator.value) return 0;
  return ROLE_PRIORITY[locator.value] ?? 0;
}

export function rankLocators(
  locators: LocatorDescriptor[]
): LocatorDescriptor[] {
  return [...locators].sort(
    (a, b) => scoreLocator(b) - scoreLocator(a)
  );
}
