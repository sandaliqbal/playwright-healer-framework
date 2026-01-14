import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';

import { Rule, DecisionType } from './models';

export function loadRulesFromYaml(filePath: string): Rule[] {
    const yamlPath = path.resolve(filePath);

    if (!fs.existsSync(yamlPath)) {
        throw new Error(`Rule file not found: ${filePath}`);
    }

    const raw = fs.readFileSync(yamlPath, 'utf-8');
    const data = yaml.load(raw);

    validateRoot(data);

    const rules: Rule[] = [];

    const policies = (data as any).policies ?? [];
    for (const policy of policies) {
        for (const ruleDef of policy.rules ?? []) {
            rules.push(parseRule(ruleDef));
        }
    }

    return rules;
}

function validateRoot(data: unknown): void {
    if (!data || typeof data !== 'object' || Array.isArray(data)) {
        throw new Error('Rules YAML must be an object');
    }

    if (!('policies' in data)) {
        throw new Error("Rules YAML must contain 'policies'");
    }
}

const REQUIRED_FIELDS = new Set([
    'id',
    'when',
    'match',
    'action',
    'confidence',
    'explain',
]);

function parseRule(ruleDef: Record<string, any>): Rule {
    const missing: string[] = [];

    for (const field of REQUIRED_FIELDS) {
        if (!(field in ruleDef)) {
            missing.push(field);
        }
    }

    if (missing.length > 0) {
        throw new Error(
            `Rule '${ruleDef.id ?? '<unknown>'}' missing fields: ${missing.join(', ')}`
        );
    }

    const actionType = ruleDef.action?.type;

    if (!Object.values(DecisionType).includes(actionType)) {
        throw new Error(`Invalid action type: ${actionType}`);
    }

    return {
        id: ruleDef.id,
        when: ruleDef.when,
        match: ruleDef.match,
        action: ruleDef.action,
        confidence: ruleDef.confidence,
        decision: "",
        explain: ruleDef.explain,
        priority: ruleDef.priority ?? 0,
    };
}
