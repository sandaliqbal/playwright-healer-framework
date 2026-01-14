# Playwright Healer Framework

A self-healing framework for Playwright tests that automatically fixes failing selectors using deterministic rules and AI-powered analysis.

## Features

- **Deterministic Healing**: Uses predefined rules to fix common selector failures
- **LLM-Powered Healing**: Leverages AI (via LangChain and Ollama) for intelligent selector repair
- **DOM Analysis**: Captures and analyzes DOM snapshots for better healing decisions
- **Accessibility Analysis**: Includes accessibility information in healing decisions
- **Seamless Integration**: Extends Playwright's Page object with healing capabilities

## Installation

```bash
npm install
```

## Dependencies

- Node.js
- Playwright
- LangChain with Ollama integration
- js-yaml for configuration

## Usage

### Basic Setup

1. Import the healing fixtures in your tests:

```typescript
import { test } from './fixtures';
```

2. Use the `healer` fixture instead of the regular `page`:

```typescript
test('my test', async ({ healer }) => {
    await healer.goto('https://example.com');
    await healer.getByRole("button", { name: "Click me" }).click();
});
```

### Healing Modes

The framework supports different healing strategies:

- **No Healing**: Standard Playwright behavior
- **Deterministic Healing**: Applies predefined rules to fix selectors
- **LLM Healing**: Uses AI to intelligently repair selectors

## Architecture

- **Adapter**: Contains the self-healing implementation and page proxy
- **Analyzer**: LLM-based analysis for complex healing scenarios
- **Rule Engine**: Manages deterministic healing rules and execution

## Configuration

Configure Playwright as usual in `playwright.config.ts`. The healing framework integrates seamlessly with existing Playwright configurations.

## Running Tests

```bash
npx playwright test
```

## Test Artifacts

The framework generates test artifacts including:
- DOM snapshots (`.html` files)
- Accessibility analysis (`.yaml` files)

These are stored in the `test_artifacts/` directory for debugging and analysis.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

ISC