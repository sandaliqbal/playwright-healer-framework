import { Page } from "@playwright/test";
import { ErrorInfo, LocatorDescriptor } from "../adapter/selfheal/models";

export enum DecisionType {
    ALLOW = 'ALLOW',
    DENY = 'DENY',
    TRANSFORM = 'TRANSFORM',
    ESCALATE = 'ESCALATE',
    NOOP = 'NOOP',
}

export interface Rule {
    id: string;
    when: Record<string, any>;
    match: Record<string, any>;
    action: Record<string, any>;
    confidence: Record<string, any>;
    explain: string;
    decision: string,
    priority?: number; // default = 0
}

export interface Artifact {
    domSnapshot: string | null;
    a11ySnapshot: string | null;
    screenshot: string | null;
}

export interface Failure {
    id: string;
    type: string;
    error: ErrorInfo;
    originalLocator: LocatorDescriptor;
}

export interface FailureContext {
    tool: string;
    page: Page;
    testType: string;
    environment: string;
    failure: Failure;
    artifacts: Artifact;
    component?: string;
}

