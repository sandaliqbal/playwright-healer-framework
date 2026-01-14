import { test } from './fixtures';

test('test with no healing', async ({ healer }) => {
    await healer.goto('https://www.facebook.com/');
    await healer.getByRole("button", { name: "Log in", exact: true }).click();
});

test('test with deterministic healing', async ({ healer }) => {
    await healer.goto('https://www.facebook.com/');
    await healer.getByText("Log").click();
    console.log("deterministic healing applied successfully");
});

test('test with healing not possible', async ({ healer }) => {
    await healer.goto('https://www.facebook.com/');
    await healer.getByRole("button", { name: "artist" }).click();
    console.log("deterministic healing counld not be applied");
});

test('test with LLM healing', async ({ healer }) => {
    await healer.goto("https://www.facebook.com/")
    await healer.locator("//button[.//text()[normalize-space()='Log']]").click()
    console.log("LLM healing applied successfully");
});

