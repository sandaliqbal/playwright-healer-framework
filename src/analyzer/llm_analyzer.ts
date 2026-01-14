import fs from 'fs';
import { ChatOllama } from '@langchain/ollama';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';

const logger = console;

const llm = new ChatOllama({
  model: 'llama3.1:8b',
  temperature: 0,
});

/**
 * Attempts to convert LLM-generated "almost JSON" into valid JSON.
 *
 * Fixes:
 * - Invalid \' escapes
 * - Trailing commas
 * - Wraps single object into array
 */
export function sanitizeLlmJson(raw: string): any {
  if (!raw || !raw.trim()) {
    throw new Error('Empty input');
  }

  let text = raw.trim();

  // 1. Remove invalid escaped single quotes: \' → '
  text = text.replace(/\\'/g, "'");

  // 2. Remove trailing commas before ] or }
  text = text.replace(/,\s*([\]}])/g, '$1');

  // 3. Ensure wrapped in array if object-only
  if (text.startsWith('{') && text.endsWith('}')) {
    text = `[${text}]`;
  }

  try {
    return JSON.parse(text);
  } catch (e) {
    throw new Error(
      `Failed to sanitize JSON.\nError: ${(e as Error).message}\nSanitized text:\n${text}`
    );
  }
}

export async function analyzeWithLlm(
  snapshotPath: string,
  selector: string
): Promise<any> {
  const snapshotText = fs.readFileSync(snapshotPath, 'utf-8');

  const LLM_SYSTEM_PROMPT = `
You are a Playwright automation expert in typescript language.

Analyze the Snapshot and the Original  Selector.
Return a ranked JSON list of Playwright locators alongwith confidence and reason
for the locators that may be probable match for the Original Selector. The locator should
be playwright locator in typescript language which are generated using the rules as mentioned below.
Return the output ONLY in the Return format below as a valid json string without
any comments.

Snapshot:
${snapshotText}

Original Selector:
${selector}

Rules:
You MUST return STRICT JSON that:
- Uses double quotes for all keys and string values
- Never uses single-quote escaping (\\')
- Use text and name attibutes in selector to look for matches.
- Only uses valid JSON escape sequences: \\", \\\\ , \\n, \\t, \\r
- ALWAYS uses single quotes (') inside the locator and for attribute names
  eg: page.locator('//button[@type='submit']')
- For xpath and css locators uses page.locator('...')
- ONLY following locators are supported:
    page.getByAltText
    page.getByLabel
    page.getByPlaceholder
    page.getByRole
    page.getByTestId
    page.getByText
    page.getByTitle
    page.locator
- "strategy" MUST be exactly one of:
  "role", "text", "css", "xpath", "label", "placeholder", "test_id"
- role locators should be preferred more.
- NEVER use composite values like "role|name"
- "attributes" MUST be a string, never an object
- For role locators:
  - Put accessible name ONLY in the "name" field
  - "attributes" should be a string like "name=Log in" or empty
- Output ONLY raw JSON
- No markdown
- No explanations
- No logging prefixes
- Output must begin with '[' and end with ']'

Return:
[
  {
    "locator": "...",
    "value": "...",
    "role": "...",
    "attributes": "...",
    "confidence": 0.0,
    "strategy": "role|testid|text|attribute|xpath",
    "reason": "..."
  }
]
`;

  const prompt = {
    snapshot: snapshotText,
    language: 'tyoescript',
    tool: 'playwright',
    original_selector: selector,
  };

  const llmResponseText = await callLlm(
    LLM_SYSTEM_PROMPT,
    JSON.stringify(prompt)
  );

  logger.info('LLM Response:', llmResponseText);

  try {
    return sanitizeLlmJson(llmResponseText);
  } catch (e) {
    logger.error((e as Error).message);
    return {
      action: 'FLAG_FOR_REVIEW',
      details: {},
      reasoning: 'LLM returned invalid JSON',
    };
  }
}

export async function callLlm(
  system: string,
  user: string
): Promise<string> {
  const messages = [
    new SystemMessage(system),
    new HumanMessage(user),
  ];

  const response = await llm.invoke(messages);
  return response.content as string;
}

