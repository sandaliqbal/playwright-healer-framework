import { Page } from '@playwright/test';
import { LocatorDescriptor, ErrorInfo, LocatorStrategy } from './models';
import { v4 as uuidv4 } from 'uuid';
import { collectDom, collectA11y, collectScreenshot } from './collector';
import { Failure, FailureContext, Artifact } from '../../rule_engine/models';
import { toAriaRole } from './roles';

const WAITING_FOR_RE =
    /waiting for\s+(?:page\.)?(getBy[A-Z][a-zA-Z]+|locator)\((?<args>.*)\)/i;

const LOCATOR_PATTERNS: Record<string, RegExp> = {
    role: /page\.getByRole\(\s*['"](?<role>[^'"]+)['"]\s*,\s*\{\s*name\s*:\s*['"](?<name>[^'"]+)['"]\s*(.*)\}\s*\)/,
    text: /page\.getByText\(\s*['"](?<value>.*?)['"](?<options>.*)\s*\)/,
    label: /page\.getByLabel\(\s*'(?<value>[^']+)'\s*\)/,
    placeholder: /page\.getByPlaceholder\(\s*'(?<value>[^']+)'\s*\)/,
    test_id: /page\.getByTestId\(\s*'(?<value>[^']+)'\s*\)/,
    locator: /page\.locator\(\s*'(?<value>.+?)'\s*\)/,
};

const CSS_PATTERNS = [
    /#[\w-]+/, // #id
    /\.[\w-]+/, // .class
    /\[[\w-]+(=.*?)?\]/, // [attr] or [attr=value]
    /:[\w-]+(\(.*?\))?/, // pseudo
    /^[a-zA-Z][\w-]*$/, // tag only
    /^[a-zA-Z][\w-]*[.#]/, // tag.class or tag#id
    /\s+[>+~]?\s*[\w.#\[]+/, // combinators
];

const STRATEGY_MAP: Record<string, string> = {
    get_by_text: 'text',
    get_by_label: 'label',
    get_by_placeholder: 'placeholder',
    get_by_role: 'role',
    locator: 'css',
};

export async function normalizeFailure(params: {
    tool: string;
    page: Page;
    exception: any;
    testType: string;
    environment?: string;
    runId?: string;
}): Promise<FailureContext> {
    const { tool, page, exception, testType, environment = 'QA' } = params;

    const error: ErrorInfo = exception instanceof Error
        ? { type: exception.name, subtype: "", message: exception.message }
        : { type: 'UnknownError', subtype: "", message: String(exception) };

    const failureType = classifyFailure(error);
    const originalLocator = parsePlaywrightError(error.message);

    const failure: Failure = {
        id: uuidv4(),
        type: failureType,
        error,
        originalLocator: originalLocator!,
    };

    const ctx: FailureContext = {
        tool,
        page,
        testType,
        environment,
        failure,
        artifacts: {
            domSnapshot: await collectDom(page, failure.id),
            a11ySnapshot: await collectA11y(page, failure.id),
            screenshot: await collectScreenshot(page, failure.id)
        }
    };

    return ctx;
}

export function classifyFailure(error: ErrorInfo): string {
    const WAITING_FOR_LOCATOR_RE = /waiting for (locator\()?(page\.)?(getBy[A-Z][a-zA-Z]+|locator)\(.*?\)\)?/i;

    if (error.type.includes('TimeoutError')) {
        if (WAITING_FOR_LOCATOR_RE.test(error.message)) return 'LOCATOR_NOT_FOUND';
        if (error.message.includes('waiting until "load"')) return 'PAGE_LOAD_TIMEOUT';
    }

    if (error.message.toLowerCase().includes('strict mode violation')) return 'STRICT_MODE_VIOLATION';
    if (error.type.includes('AssertionError')) return 'ASSERTION_FAILURE';
    if (error.message.includes('net::ERR')) return 'NETWORK_FAILURE';

    return 'UNKNOWN_FAILURE';
}

export function parsePlaywrightError(message: string): LocatorDescriptor | null {
    const match = WAITING_FOR_RE.exec(message);
    if (!match) return null;

    const args = normalize(match.groups?.args ?? '');
    const code = `page.${match[1]}(${args})`;

    return parsePlaywrightLocator(code);
}

export function normalize(s: string): string {
    return s.trim().replace(/"/g, "'");
}

export function inferLocatorStrategy(selector: string): LocatorStrategy {
    selector = selector.trim();
    if (selector.startsWith('/') || selector.startsWith('(')) return 'xpath' as LocatorStrategy;
    if (selector.startsWith('#') || selector.startsWith('.') || selector.includes('[')) return 'css' as LocatorStrategy;
    return 'css' as LocatorStrategy;
}

export function parsePlaywrightLocator(code: string): LocatorDescriptor {
    code = code.trim();

    // Role
    let m: RegExpExecArray | null;
    if ((m = LOCATOR_PATTERNS.role.exec(code))) {
        return new LocatorDescriptor({
            strategy: 'role',
            role: toAriaRole(m.groups?.role ?? '')!,
            name: m.groups?.name ?? '',
            value: m.groups?.name ?? '',
            options: m.groups?.options,
        });
    }

    // Text
    if ((m = LOCATOR_PATTERNS.text.exec(code))) {
        return new LocatorDescriptor({ strategy: 'text', value: m.groups?.value ?? '' });
    }

    // Label
    if ((m = LOCATOR_PATTERNS.label.exec(code))) {
        return new LocatorDescriptor({ strategy: 'label', value: m.groups?.value ?? '' });
    }

    // Placeholder
    if ((m = LOCATOR_PATTERNS.placeholder.exec(code))) {
        return new LocatorDescriptor({ strategy: 'placeholder', value: m.groups?.value ?? '' });
    }

    // Test ID
    if ((m = LOCATOR_PATTERNS.test_id.exec(code))) {
        return new LocatorDescriptor({ strategy: 'test_id', value: m.groups?.value ?? '' });
    }

    // page.locator(...)
    if ((m = LOCATOR_PATTERNS.locator.exec(code))) {
        const selector = m.groups?.value ?? '';
        const locStrategy = inferLocatorStrategy(selector);
        return new LocatorDescriptor({ strategy: locStrategy, value: selector });
    }

    throw new Error(`Unsupported Playwright locator syntax: ${code}`);
}

export function isXpath(s: string): boolean {
    return s.startsWith('/') || s.startsWith('./') || s.startsWith('(') || s.includes('::') || s.startsWith('xpath=');
}

export function isCssSelector(s: string): boolean {
    if (s.startsWith('/') || s.startsWith('.//') || s.includes('@') || s.includes('text()')) return false;

    return CSS_PATTERNS.some((pattern) => pattern.test(s));
}
