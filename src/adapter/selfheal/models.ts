import { AriaRole } from "./roles";

export interface ErrorInfo {
    type: string;     // TIMEOUT / ASSERTION
    subtype: string;  // SELECTOR_NOT_FOUND
    message: string;
}

export type LocatorStrategy =
    | 'text'
    | 'role'
    | 'css'
    | 'xpath'
    | 'label'
    | 'placeholder'
    | 'test_id'
    | 'scoped_role';

export class LocatorDescriptor {
    strategy!: LocatorStrategy;
    value: string = "";

    role!: AriaRole;
    attributes?: string;
    name?: string;
    exact?: boolean = false;
    landmark?: string;
    scope?: string;
    options?: string;

    rank: number = 0;
    confidence: number = 0;

    constructor(init: Partial<LocatorDescriptor> & {
        strategy: LocatorStrategy;
        value: string;
    }) {
        Object.assign(this, init);
    }

    toPlaywright(): string {
        if (this.strategy === 'text') {
            return `page.getByText("${this.value}")`;
        }

        if (this.strategy === 'css' || this.strategy === 'xpath') {
            return `page.locator("${this.value}")`;
        }

        if (this.strategy === 'role') {
            const args: string[] = [];

            if (this.name) {
                args.push(`name: "${this.name}"`);
            }

            if (this.exact !== undefined) {
                args.push(`exact: ${this.exact}`);
            }

            if (this.options) {
                args.push(this.options);
            }

            const options =
                args.length > 0 ? `, { ${args.join(', ')} }` : '';

            return `page.getByRole("${this.role}"${options})`;
        }

        if (this.strategy === 'scoped_role') {
            return (
                `page.getByRole("${this.landmark}")` +
                `.getByRole("${this.value}", { name: "${this.name}" })`
            );
        }

        throw new Error('Unsupported locator strategy');
    }

    toString() {
        return `Locator(strategy=${this.strategy}, value=${this.value}, confidence=${this.confidence})`;
    }
}

export interface ValidationResult {
    locator: LocatorDescriptor;
    locatorRank: number;
    count: number;
    isUnique: boolean;
    error?: string | null;
}

