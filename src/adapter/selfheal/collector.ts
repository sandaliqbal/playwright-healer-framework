import { Page } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

// Create artifact directory
export const ARTIFACT_DIR = path.join(process.cwd(), 'test_artifacts');

if (!fs.existsSync(ARTIFACT_DIR)) {
  fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
}

export async function collectDom(
  page: Page,
  failureId: string
): Promise<string | null> {
  let domPath: string | null = null;

  try {
    const dom = await page.content();
    const filePath = path.join(ARTIFACT_DIR, `${failureId}_dom.html`);
    fs.writeFileSync(filePath, dom, 'utf-8');
    domPath = filePath;
  } catch (e) {
    console.error(e);
  }

  return domPath;
}

export async function collectA11y(
  page: Page,
  failureId: string
): Promise<string | null> {
  let a11yPath: string | null = null;

  try {
    const snapshot = await page.locator('body').ariaSnapshot();
    const filePath = path.join(ARTIFACT_DIR, `${failureId}_a11y.yaml`);

    fs.writeFileSync(filePath, snapshot, 'utf-8');
    a11yPath = filePath;
  } catch (e) {
    console.error(e);
  }

  return a11yPath;
}

export async function collectScreenshot(
  page: Page,
  failureId: string
): Promise<string | null> {
  let screenshotPath: string | null = null;

  try {
    const filePath = path.join(
      ARTIFACT_DIR,
      `${failureId}_screenshot.png`
    );

    await page.screenshot({ path: filePath });
    screenshotPath = filePath;
  } catch (e) {
    console.error(e);
  }

  return screenshotPath;
}
