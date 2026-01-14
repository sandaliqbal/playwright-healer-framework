import { Rule, FailureContext, DecisionType } from './models';
import { matchWhen, matchFailure, buildDecision } from './match';

export class ExecutionEngine {
    private rules: Rule[];

    constructor(rules: Rule[]) {
        // sort by priority descending
        this.rules = [...rules].sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));
    }

    /**
     * Evaluates the rules against a given failure context.
     * Returns the first matching rule's decision or NOOP if none match.
     */
    evaluate(ctx: FailureContext): Record<string, any> {
        for (const rule of this.rules) {
            if (!matchWhen(rule.when, ctx)) continue;

            if (matchFailure(rule.match, ctx)) {
                return buildDecision(rule);
            }
        }

        return ExecutionEngine.defaultNoop();
    }

    /**
     * Default NOOP decision when no rules match.
     */
    static defaultNoop(): Record<string, any> {
        return {
            decision: DecisionType.NOOP,
            confidence: 0.0,
            explain: 'No matching rule found',
        };
    }
}
