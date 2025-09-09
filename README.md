# trace-pretty

> **Professional stack trace formatter for JavaScript and TypeScript applications.**  
> Transform cryptic error traces into readable, actionable debugging information.

[![npm version](https://badge.fury.io/js/trace-pretty.svg)](https://www.npmjs.com/package/trace-pretty)
[![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Node.js CI](https://github.com/your-org/trace-pretty/workflows/Node.js%20CI/badge.svg)](https://github.com/your-org/trace-pretty/actions)

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [CLI Reference](#cli-reference)
- [API Documentation](#api-documentation)
- [Configuration](#configuration)
- [Integration Examples](#integration-examples)
- [Security Considerations](#security-considerations)
- [Performance Guidelines](#performance-guidelines)
- [Testing](#testing)
- [Contributing](#contributing)
- [Troubleshooting](#troubleshooting)
- [License](#license)

## Overview

trace-pretty is a production-ready tool designed to transform raw JavaScript/TypeScript stack traces into human-readable, contextual error reports. Inspired by [pino-pretty](https://github.com/pinojs/pino-pretty), it specializes in error formatting with advanced source mapping, code frame generation, and intelligent frame classification.

### Use Cases

- **Development**: Enhanced debugging experience with contextual code frames
- **Production Monitoring**: Clean error logs for monitoring systems
- **CI/CD**: Structured error reporting for automated testing
- **Documentation**: HTML exports for error analysis and sharing

## Features

### Core Capabilities

- **Multi-Engine Support**: Compatible with Node.js/V8, Firefox, and WebKit stack trace formats
- **Intelligent Classification**: Automatic categorization of stack frames (`app` | `deps` | `node` | `native`)
- **Source Map Resolution**: Full TypeScript and source map support with original position mapping
- **Contextual Code Frames**: Displays surrounding code with syntax highlighting and error indicators
- **Professional Formatting**: Clean typography with customizable themes and IDE-compatible links

### Advanced Features

- **Error Chain Support**: Handles `Error.cause` and `AggregateError` hierarchies
- **Smart Filtering**: Configurable noise reduction with dependency hiding and frame grouping
- **Security Features**: Built-in secret redaction and safe output sanitization
- **Performance Modes**: Fast mode for high-throughput scenarios
- **Internationalization**: Multi-language support (English, French, extensible)
- **Multiple Output Formats**: Text, JSON, and HTML export capabilities

### Integration Support

- **CLI Tool**: Standalone command-line interface
- **Node.js Library**: Programmatic API for custom integrations
- **Framework Plugins**: Ready-to-use middleware for Express, Fastify, and others
- **Test Framework Integration**: Custom reporters for Jest, Vitest, and similar tools

## Installation

### Production Installation

```bash
npm install trace-pretty
```

### Development Installation

```bash
npm install --save-dev trace-pretty
```

### Global Installation (CLI)

```bash
npm install -g trace-pretty
```

## Quick Start

### Command Line Usage

```bash
# Pipe errors from your application
node app.js 2>&1 | trace-pretty

# Process error log files
trace-pretty < error.log

# Real-time error monitoring
tail -f app.log | trace-pretty --only-app
```

### Programmatic Usage

```typescript
import { format, install } from 'trace-pretty';

// Format a single error
try {
  // Your application code
  throw new Error('Something went wrong');
} catch (error) {
  const formatted = format(error, {
    codeFrame: 3,
    theme: 'auto',
    onlyApp: true
  });
  
  console.error(formatted.text);
}

// Install global error handler
install({
  onlyApp: true,
  hideNode: true,
  theme: 'dark'
});
```

### Sample Output

```
✗ TypeError: Cannot read properties of undefined (reading 'id')
    at getUser (src/services/user.ts:42:17)
      40 | export async function getUser(id: string): Promise<User> {
      41 |   const row = await db.users.findById(id);
   >  42 |   return { id: row.id, name: row.name, email: row.email };
         |                 ^
      43 | }
      44 |

    → async boundary
    at handleUserRequest (/app/src/routes/users.ts:18:13)
    at Layer.handle [as handle_request] (/app/node_modules/express/lib/router/layer.js:95:5)
    [node internals hidden] (8 additional frames)

  Caused by: DatabaseConnectionError: Connection timeout
    at DatabasePool.connect (src/db/pool.ts:156:11)
    at async Database.query (src/db/client.ts:89:5)
```

## CLI Reference

### Core Options

| Option | Description | Default | Example |
|--------|-------------|---------|---------|
| `--code-frame [lines]` | Show code context around error | `3` | `--code-frame 5` |
| `--no-code-frame` | Disable code frame display | `false` | `--no-code-frame` |
| `--theme <theme>` | Color theme selection | `auto` | `--theme dark` |
| `--locale <locale>` | Language selection | `en` | `--locale fr` |

### Filtering Options

| Option | Description | Example |
|--------|-------------|---------|
| `--only-app` | Show only application frames | `--only-app` |
| `--hide-deps` | Hide dependency frames | `--hide-deps` |
| `--hide-node` | Hide Node.js internal frames | `--hide-node` |
| `--max-frames <n>` | Limit total frames displayed | `--max-frames 10` |

### Path and Link Options

| Option | Description | Example |
|--------|-------------|---------|
| `--relative` | Use relative file paths | `--relative` |
| `--absolute` | Use absolute file paths | `--absolute` |
| `--links <type>` | IDE link format | `--links vscode` |

### Security and Performance

| Option | Description | Example |
|--------|-------------|---------|
| `--redact <pattern>` | Redact sensitive information | `--redact "password\|token"` |
| `--fast` | High-performance mode | `--fast` |
| `--strict` | Strict parsing mode | `--strict` |

### Output Options

| Option | Description | Example |
|--------|-------------|---------|
| `--json` | JSON output format | `--json` |
| `--html` | HTML output format | `--html` |
| `--config <path>` | Configuration file path | `--config ./trace.config.js` |

### Advanced Usage Examples

```bash
# Production monitoring setup
trace-pretty --only-app --hide-node --redact "api_key|password" --json

# Development debugging
trace-pretty --code-frame 5 --links vscode --theme dark

# CI/CD integration
trace-pretty --html --max-frames 20 > error-report.html

# High-throughput logging
trace-pretty --fast --no-code-frame --json
```

## API Documentation

### Core Functions

#### `format(error: Error, options?: FormatOptions): FormattedError`

Formats a single error with specified options.

**Parameters:**
- `error`: The Error object to format
- `options`: Formatting configuration (optional)

**Returns:** `FormattedError` object with `text` and `frames` properties

**Example:**
```typescript
import { format } from 'trace-pretty';

const error = new Error('Database connection failed');
const result = format(error, {
  codeFrame: 3,
  onlyApp: true,
  theme: 'dark'
});

console.error(result.text);
// Access structured data
console.log(`Error occurred in ${result.frames[0].file}`);
```

#### `install(options?: InstallOptions): void`

Installs global error handlers for automatic formatting.

**Parameters:**
- `options`: Global formatting configuration (optional)

**Example:**
```typescript
import { install } from 'trace-pretty';

// Install with custom configuration
install({
  onlyApp: true,
  hideNode: true,
  codeFrame: 5,
  redact: [/password=\w+/g, 'api_key']
});

// All unhandled errors will now be formatted automatically
```

#### `parse(stackTrace: string): StackFrame[]`

Parses a raw stack trace string into structured frame objects.

**Parameters:**
- `stackTrace`: Raw stack trace string

**Returns:** Array of `StackFrame` objects

**Example:**
```typescript
import { parse } from 'trace-pretty';

const rawTrace = `Error: Something went wrong
    at getUser (/app/src/user.js:42:17)
    at main (/app/index.js:10:5)`;

const frames = parse(rawTrace);
console.log(frames[0].functionName); // 'getUser'
```

### Type Definitions

#### `FormatOptions`

```typescript
interface FormatOptions {
  /** Number of code lines to show around error, or false to disable */
  codeFrame?: number | false;
  
  /** Show only application code frames */
  onlyApp?: boolean;
  
  /** Hide dependency frames */
  hideDeps?: boolean;
  
  /** Hide Node.js internal frames */
  hideNode?: boolean;
  
  /** Maximum number of frames to display */
  maxFrames?: number;
  
  /** Patterns to redact from output */
  redact?: (string | RegExp)[];
  
  /** Use relative instead of absolute paths */
  relativePaths?: boolean;
  
  /** Color theme selection */
  theme?: 'auto' | 'light' | 'dark';
  
  /** IDE link format */
  links?: 'none' | 'vscode' | 'jetbrains' | 'web';
  
  /** Enable fast mode (disables source maps and code frames) */
  fast?: boolean;
  
  /** Strict parsing mode */
  strict?: boolean;
  
  /** Language locale */
  locale?: 'en' | 'fr';
  
  /** Project root directory for relative paths */
  projectRoot?: string;
  
  /** Additional source map search paths */
  sourceMapPaths?: string[];
}
```

#### `StackFrame`

```typescript
interface StackFrame {
  /** Frame type classification */
  type: 'app' | 'deps' | 'node' | 'native';
  
  /** Function name (if available) */
  functionName?: string;
  
  /** Source file path */
  file?: string;
  
  /** Line number */
  line?: number;
  
  /** Column number */
  column?: number;
  
  /** Original source position (after source map resolution) */
  original?: {
    file: string;
    line: number;
    column: number;
    name?: string;
  } | null;
  
  /** Whether this frame represents an async boundary */
  isAsync?: boolean;
  
  /** Additional context information */
  context?: {
    code?: string[];
    errorLine?: number;
  };
}
```

#### `FormattedError`

```typescript
interface FormattedError {
  /** Formatted text output */
  text: string;
  
  /** Structured frame data */
  frames: StackFrame[];
  
  /** Error metadata */
  error: {
    name: string;
    message: string;
    cause?: FormattedError;
  };
  
  /** Processing statistics */
  stats: {
    totalFrames: number;
    hiddenFrames: number;
    processingTime: number;
  };
}
```

### Error Handling

The API provides comprehensive error handling with specific error types:

```typescript
import { format, TraceParseError, SourceMapError } from 'trace-pretty';

try {
  const result = format(error, options);
} catch (err) {
  if (err instanceof TraceParseError) {
    console.error('Failed to parse stack trace:', err.message);
  } else if (err instanceof SourceMapError) {
    console.error('Source map resolution failed:', err.message);
    // Fallback to raw stack trace
  } else {
    console.error('Unexpected error:', err);
  }
}
```

## Configuration

### Configuration File

Create `trace-pretty.config.js`, `trace-pretty.config.json`, or `trace-pretty.config.ts` in your project root:

```javascript
// trace-pretty.config.js
module.exports = {
  codeFrame: 3,
  onlyApp: true,
  hideNode: true,
  theme: 'auto',
  links: 'vscode',
  redact: [
    /password=[\w\d]+/gi,
    /api_key[:=]\s*[\w\d-]+/gi,
    'secret_token'
  ],
  projectRoot: process.cwd(),
  sourceMapPaths: ['./dist', './build']
};
```

```typescript
// trace-pretty.config.ts
import { FormatOptions } from 'trace-pretty';

const config: FormatOptions = {
  codeFrame: 5,
  onlyApp: true,
  theme: 'dark',
  links: 'jetbrains',
  redact: [/token:\s*"[^"]+"/g],
  strict: true,
  locale: 'en'
};

export default config;
```

### Environment Variables

```bash
# Set default theme
TRACE_PRETTY_THEME=dark

# Set project root
TRACE_PRETTY_PROJECT_ROOT=/app

# Enable fast mode
TRACE_PRETTY_FAST=true

# Set locale
TRACE_PRETTY_LOCALE=en
```

### Package.json Integration

```json
{
  "scripts": {
    "start:debug": "node app.js 2>&1 | trace-pretty --code-frame 5 --links vscode",
    "test:trace": "jest 2>&1 | trace-pretty --only-app --json > test-errors.json"
  },
  "trace-pretty": {
    "codeFrame": 3,
    "onlyApp": true,
    "theme": "auto"
  }
}
```

## Integration Examples

### Express.js Middleware

```typescript
import express from 'express';
import { format } from 'trace-pretty';

const app = express();

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  // Format error for logging
  const formatted = format(err, {
    onlyApp: true,
    redact: [/password=[\w\d]+/gi]
  });
  
  // Log formatted error
  console.error(formatted.text);
  
  // Send safe error response
  res.status(500).json({
    error: 'Internal Server Error',
    requestId: req.headers['x-request-id']
  });
});
```

### Fastify Plugin

```typescript
import Fastify from 'fastify';
import { format } from 'trace-pretty';

const fastify = Fastify();

fastify.setErrorHandler((error, request, reply) => {
  const formatted = format(error, {
    onlyApp: true,
    hideDeps: true,
    theme: 'auto'
  });
  
  request.log.error(formatted.text);
  
  reply.status(500).send({
    error: 'Internal Server Error',
    timestamp: new Date().toISOString()
  });
});
```

### Jest Custom Reporter

```typescript
// jest-trace-reporter.js
const { format } = require('trace-pretty');

class TracePrettyReporter {
  onTestResult(test, testResult) {
    testResult.testResults.forEach(result => {
      if (result.status === 'failed') {
        result.failureMessages.forEach(message => {
          try {
            const error = new Error(message);
            const formatted = format(error, {
              codeFrame: 3,
              onlyApp: true,
              links: 'vscode'
            });
            console.error(formatted.text);
          } catch {
            console.error(message);
          }
        });
      }
    });
  }
}

module.exports = TracePrettyReporter;
```

### Vitest Integration

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import { format } from 'trace-pretty';

export default defineConfig({
  test: {
    setupFiles: ['./test-setup.ts'],
    reporters: ['custom']
  }
});

// test-setup.ts
import { format } from 'trace-pretty';

// Override console.error to format stack traces
const originalError = console.error;
console.error = (...args) => {
  const formatted = args.map(arg => {
    if (arg instanceof Error) {
      return format(arg, { onlyApp: true }).text;
    }
    return arg;
  });
  originalError(...formatted);
};
```

### Webpack Dev Server Integration

```javascript
// webpack.config.js
const { format } = require('trace-pretty');

module.exports = {
  // ... other config
  devServer: {
    setupMiddlewares: (middlewares, devServer) => {
      devServer.app.use((err, req, res, next) => {
        const formatted = format(err, {
          codeFrame: 5,
          links: 'vscode',
          theme: 'dark'
        });
        console.error(formatted.text);
        next(err);
      });
      return middlewares;
    }
  }
};
```

### Docker Integration

```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

# Install trace-pretty globally for container debugging
RUN npm install -g trace-pretty

COPY . .

# Use trace-pretty in production for better error visibility
CMD ["sh", "-c", "node app.js 2>&1 | trace-pretty --json --only-app"]
```

## Security Considerations

### Secret Redaction

trace-pretty includes built-in protection against accidentally logging sensitive information:

```typescript
import { format } from 'trace-pretty';

// Configure redaction patterns
const options = {
  redact: [
    // Common secret patterns
    /password[:=]\s*["']?[\w\d!@#$%^&*()]+["']?/gi,
    /api_?key[:=]\s*["']?[\w\d-]+["']?/gi,
    /token[:=]\s*["']?[\w\d.-]+["']?/gi,
    /secret[:=]\s*["']?[\w\d.-]+["']?/gi,
    
    // Custom patterns
    /db_connection_string[:=].*/gi,
    /private_key[:=].*/gi,
    
    // Specific strings
    'production_database_url',
    'stripe_secret_key'
  ]
};

const formatted = format(error, options);
```

### Safe Output Sanitization

```typescript
// Automatic sanitization is applied to all output
const sanitized = format(error, {
  // Sanitizes ANSI escape sequences in production
  sanitizeOutput: process.env.NODE_ENV === 'production',
  
  // Limits output size to prevent memory issues
  maxOutputLength: 10000,
  
  // Validates file paths to prevent directory traversal
  validatePaths: true
});
```

### Production Deployment

```typescript
// production-error-handler.ts
import { format } from 'trace-pretty';

export function createProductionErrorHandler() {
  return (error: Error) => {
    const formatted = format(error, {
      // Security-focused configuration
      onlyApp: true,           // Hide internal implementation details
      hideDeps: true,          // Hide dependency information
      hideNode: true,          // Hide Node.js internals
      fast: true,              // Disable source map resolution in production
      redact: [
        /password[:=].+/gi,
        /api_key[:=].+/gi,
        /token[:=].+/gi,
        /secret[:=].+/gi,
        /connection_string[:=].+/gi
      ],
      maxFrames: 5,            // Limit trace depth
      codeFrame: false,        // Disable code frame display
      relativePaths: true      // Use relative paths only
    });
    
    // Log to secure logging service
    secureLogger.error({
      error: formatted.error,
      frames: formatted.frames,
      timestamp: new Date().toISOString(),
      environment: 'production'
    });
  };
}
```

## Performance Guidelines

### High-Throughput Scenarios

For applications with high error rates or performance-critical requirements:

```typescript
import { format } from 'trace-pretty';

// Fast mode configuration
const fastOptions = {
  fast: true,              // Disables source map resolution
  codeFrame: false,        // Disables code frame generation
  maxFrames: 3,           // Limits processing overhead
  onlyApp: true,          // Reduces frame processing
  theme: 'none'           // Disables color processing
};

// Batch processing for multiple errors
function formatErrorBatch(errors: Error[]) {
  return errors.map(error => format(error, fastOptions));
}
```

### Memory Management

```typescript
import { format, clearSourceMapCache } from 'trace-pretty';

// Periodic cache cleanup in long-running applications
setInterval(() => {
  clearSourceMapCache();
}, 300000); // Every 5 minutes

// Monitor memory usage
const formatWithMemoryMonitoring = (error: Error) => {
  const memBefore = process.memoryUsage().heapUsed;
  const result = format(error, options);
  const memAfter = process.memoryUsage().heapUsed;
  
  if (memAfter - memBefore > 10 * 1024 * 1024) { // 10MB threshold
    console.warn('High memory usage detected in trace formatting');
  }
  
  return result;
};
```

### Benchmarking

```typescript
// benchmark.ts
import { format } from 'trace-pretty';
import { performance } from 'perf_hooks';

function benchmarkFormatting(error: Error, iterations: number = 1000) {
  const start = performance.now();
  
  for (let i = 0; i < iterations; i++) {
    format(error, { fast: true });
  }
  
  const end = performance.now();
  const avgTime = (end - start) / iterations;
  
  console.log(`Average formatting time: ${avgTime.toFixed(2)}ms`);
  console.log(`Throughput: ${(1000 / avgTime).toFixed(0)} errors/second`);
}
```

### Production Monitoring

```typescript
// monitoring.ts
import { format } from 'trace-pretty';

let errorCount = 0;
let totalProcessingTime = 0;

export function monitoredFormat(error: Error, options: any) {
  const start = performance.now();
  
  try {
    const result = format(error, options);
    const processingTime = performance.now() - start;
    
    errorCount++;
    totalProcessingTime += processingTime;
    
    // Alert if processing time is consistently high
    if (errorCount % 100 === 0) {
      const avgTime = totalProcessingTime / errorCount;
      if (avgTime > 50) { // 50ms threshold
        console.warn(`High average processing time: ${avgTime.toFixed(2)}ms`);
      }
    }
    
    return result;
  } catch (formatError) {
    // Fallback to basic error logging
    console.error('trace-pretty formatting failed:', formatError.message);
    console.error('Original error:', error.stack);
    throw formatError;
  }
}
```

## Testing

### Unit Testing

```typescript
// __tests__/trace-pretty.test.ts
import { format, parse } from 'trace-pretty';

describe('trace-pretty', () => {
  describe('format', () => {
    it('should format basic errors correctly', () => {
      const error = new Error('Test error');
      error.stack = `Error: Test error
    at testFunction (/app/src/test.js:42:17)
    at main (/app/index.js:10:5)`;

      const result = format(error, { codeFrame: false });
      
      expect(result.text).toContain('Test error');
      expect(result.frames).toHaveLength(2);
      expect(result.frames[0].functionName).toBe('testFunction');
    });

    it('should handle malformed stack traces gracefully', () => {
      const error = new Error('Test error');
      error.stack = 'Invalid stack trace format';

      expect(() => format(error)).not.toThrow();
      
      const result = format(error);
      expect(result.frames).toHaveLength(0);
      expect(result.text).toContain('Test error');
    });

    it('should redact sensitive information', () => {
      const error = new Error('Database error: password=secret123');
      
      const result = format(error, {
        redact: [/password=[\w\d]+/gi]
      });
      
      expect(result.text).not.toContain('secret123');
      expect(result.text).toContain('[REDACTED]');
    });
  });

  describe('parse', () => {
    it('should parse V8 stack traces', () => {
      const stackTrace = `Error: Test error
    at Object.<anonymous> (/app/index.js:1:13)
    at Module._compile (module.js:653:30)`;

      const frames = parse(stackTrace);
      
      expect(frames).toHaveLength(2);
      expect(frames[0].file).toBe('/app/index.js');
      expect(frames[0].line).toBe(1);
      expect(frames[0].column).toBe(13);
    });

    it('should classify frame types correctly', () => {
      const stackTrace = `Error: Test error
    at myFunction (/app/src/main.js:10:5)
    at express (/app/node_modules/express/lib/express.js:20:10)
    at Module._compile (module.js:653:30)`;

      const frames = parse(stackTrace);
      
      expect(frames[0].type).toBe('app');
      expect(frames[1].type).toBe('deps');
      expect(frames[2].type).toBe('node');
    });
  });
});
```

### Integration Testing

```typescript
// __tests__/integration.test.ts
import { spawn } from 'child_process';
import { join } from 'path';

describe('CLI Integration', () => {
  it('should process piped input correctly', (done) => {
    const cli = spawn('node', [join(__dirname, '../bin/cli.js')], {
      stdio: ['pipe', 'pipe', 'pipe']
    });

    const testError = `Error: Test error
    at testFunction (/app/src/test.js:42:17)
    at main (/app/index.js:10:5)`;

    let output = '';
    cli.stdout.on('data', (data) => {
      output += data.toString();
    });

    cli.on('close', (code) => {
      expect(code).toBe(0);
      expect(output).toContain('Test error');
      expect(output).toContain('testFunction');
      done();
    });

    cli.stdin.write(testError);
    cli.stdin.end();
  });
});
```

### Performance Testing

```typescript
// __tests__/performance.test.ts
import { format } from 'trace-pretty';
import { performance } from 'perf_hooks';

describe('Performance', () => {
  it('should format errors within acceptable time limits', () => {
    const error = new Error('Performance test');
    const iterations = 1000;
    
    const start = performance.now();
    
    for (let i = 0; i < iterations; i++) {
      format(error, { fast: true });
    }
    
    const end = performance.now();
    const avgTime = (end - start) / iterations;
    
    expect(avgTime).toBeLessThan(5); // Should be under 5ms per format
  });

  it('should handle large stack traces efficiently', () => {
    // Create a large stack trace
    const largeStack = Array.from({ length: 100 }, (_, i) => 
      `    at function${i} (/app/src/file${i}.js:${i + 1}:10)`
    ).join('\n');
    
    const error = new Error('Large stack test');
    error.stack = `Error: Large stack test\n${largeStack}`;
    
    const start = performance.now();
    const result = format(error, { maxFrames: 50 });
    const end = performance.now();
    
    expect(end - start).toBeLessThan(100); // Should be under 100ms
    expect(result.frames.length).toBeLessThanOrEqual(50);
  });
});
```

### Test Configuration

```javascript
// jest.config.js
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  collectCoverage: true,
  coverageThreshold: {
    global: {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90
    }
  },
  testMatch: [
    '**/__tests__/**/*.test.ts'
  ],
  setupFilesAfterEnv: ['<rootDir>/test/setup.ts']
};
```

## Contributing

### Development Setup

```bash
# Clone the repository
git clone https://github.com/your-org/trace-pretty.git
cd trace-pretty

# Install dependencies
npm install

# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Build the project
npm run build

# Lint code
npm run lint

# Format code
npm run format
```

### Code Standards

#### TypeScript Guidelines

```typescript
// Use strict type definitions
interface StrictOptions {
  readonly codeFrame: number | false;
  readonly theme: 'auto' | 'light' | 'dark';
}

// Prefer readonly for immutable data
type StackFrame = Readonly<{
  type: FrameType;
  functionName?: string;
  file?: string;
  line?: number;
  column?: number;
}>;

// Use branded types for better type safety
type FilePath = string & { readonly _brand: 'FilePath' };
type LineNumber = number & { readonly _brand: 'LineNumber' };
```

#### Error Handling Patterns

```typescript
// Use Result pattern for operations that can fail
type Result<T, E = Error> = 
  | { success: true; data: T }
  | { success: false; error: E };

// Example implementation
function parseStackTrace(trace: string): Result<StackFrame[]> {
  try {
    const frames = parseFrames(trace);
    return { success: true, data: frames };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error : new Error(String(error))
    };
  }
}
```

#### Testing Standards

```typescript
// Use descriptive test names
describe('StackFrame parser', () => {
  describe('when parsing V8 stack traces', () => {
    it('should extract function name, file path, line and column numbers', () => {
      // Test implementation
    });

    it('should handle anonymous functions gracefully', () => {
      // Test implementation
    });

    it('should classify frame types correctly based on file paths', () => {
      // Test implementation
    });
  });
});

// Use test data builders for complex objects
class StackFrameBuilder {
  private frame: Partial<StackFrame> = {};

  functionName(name: string): this {
    this.frame.functionName = name;
    return this;
  }

  file(path: string): this {
    this.frame.file = path;
    return this;
  }

  build(): StackFrame {
    return {
      type: 'app',
      ...this.frame
    } as StackFrame;
  }
}
```

### Pull Request Guidelines

1. **Feature Branches**: Create feature branches from `main`
2. **Commit Messages**: Use conventional commit format
3. **Tests**: Include comprehensive tests for new features
4. **Documentation**: Update relevant documentation
5. **Performance**: Include performance impact analysis for changes
6. **Security**: Address security implications of changes

#### Commit Message Format

```
type(scope): description

[optional body]

[optional footer]
```

Examples:
```
feat(parser): add support for Firefox stack traces

Adds parsing logic for Firefox-specific stack trace format.
Includes comprehensive tests and performance benchmarks.

Closes #123

fix(security): prevent path traversal in file resolution

Validates file paths to prevent directory traversal attacks.
Updates path resolution logic with proper sanitization.

BREAKING CHANGE: File path validation may reject previously accepted paths
```

### Release Process

1. **Version Bump**: Follow semantic versioning
2. **Changelog**: Update CHANGELOG.md
3. **Documentation**: Update version-specific documentation
4. **Testing**: Run full test suite including integration tests
5. **Security Scan**: Run security vulnerability scan
6. **Performance Regression**: Run performance regression tests

```bash
# Release checklist
npm run test:full
npm run security:audit
npm run performance:baseline
npm run build
npm run docs:generate
npm version patch|minor|major
git push origin main --tags
npm publish
```

## Troubleshooting

### Common Issues

#### Source Maps Not Resolving

**Problem**: Source maps are not being resolved correctly.

**Solutions**:
```typescript
// Check source map configuration
const options = {
  sourceMapPaths: [
    './dist',
    './build',
    './src'
  ],
  projectRoot: process.cwd()
};

// Verify source map files exist
import { existsSync } from 'fs';
import { join } from 'path';

function validateSourceMaps(file: string) {
  const mapFile = `${file}.map`;
  if (!existsSync(mapFile)) {
    console.warn(`Source map not found: ${mapFile}`);
  }
}
```

#### Performance Issues

**Problem**: Slow formatting performance.

**Solutions**:
```typescript
// Enable fast mode
const fastOptions = {
  fast: true,
  codeFrame: false,
  maxFrames: 5
};

// Profile performance
import { performance } from 'perf_hooks';

const start = performance.now();
const result = format(error, options);
const end = performance.now();

if (end - start > 50) {
  console.warn(`Slow formatting detected: ${end - start}ms`);
}
```

#### Memory Leaks

**Problem**: Memory usage grows over time.

**Solutions**:
```typescript
import { clearSourceMapCache, clearParserCache } from 'trace-pretty';

// Periodic cleanup
setInterval(() => {
  clearSourceMapCache();
  clearParserCache();
}, 300000); // Every 5 minutes

// Monitor memory usage
const formatWithMonitoring = (error: Error) => {
  const memBefore = process.memoryUsage().heapUsed;
  const result = format(error, options);
  const memAfter = process.memoryUsage().heapUsed;
  
  if (memAfter - memBefore > 10 * 1024 * 1024) {
    console.warn('High memory usage in trace formatting');
  }
  
  return result;
};
```

### Debug Mode

Enable detailed debugging information:

```bash
# Enable debug mode
DEBUG=trace-pretty:* node app.js

# Enable specific debug categories
DEBUG=trace-pretty:parser,trace-pretty:sourcemap node app.js
```

```typescript
// Programmatic debug configuration
import { setDebugLevel } from 'trace-pretty';

setDebugLevel('verbose');

// Debug specific operations
const result = format(error, {
  debug: {
    parser: true,
    sourceMaps: true,
    performance: true
  }
});
```

### Error Reporting

When reporting issues, please include:

1. **Environment Information**:
   - Node.js version
   - Operating system
   - trace-pretty version

2. **Reproduction Case**:
   - Minimal code example
   - Stack trace that causes issues
   - Configuration used

3. **Expected vs Actual Behavior**:
   - What you expected to see
   - What actually happened
   - Screenshots if applicable

4. **Debug Output**:
   - Debug logs with `DEBUG=trace-pretty:*`
   - Performance metrics if relevant

```bash
# Generate environment report
npx trace-pretty --version --env-info
```

### FAQ

**Q: Why are my TypeScript source maps not working?**

A: Ensure your TypeScript compiler is generating source maps and they're accessible to trace-pretty:

```json
// tsconfig.json
{
  "compilerOptions": {
    "sourceMap": true,
    "inlineSourceMap": false
  }
}
```

**Q: How do I customize the redaction patterns?**

A: Use the `redact` option with regular expressions or strings:

```typescript
const options = {
  redact: [
    /password[:=]\s*["']?[\w\d]+["']?/gi,
    /api[_-]?key[:=]\s*["']?[\w\d-]+["']?/gi,
    'specific_secret_string'
  ]
};
```

**Q: Can I use trace-pretty in browser environments?**

A: trace-pretty is designed for Node.js environments. For browser use cases, consider:
- Using the JSON output format for client-side processing
- Implementing a lightweight browser-compatible version
- Sending traces to a server endpoint for formatting

**Q: How do I handle circular references in error objects?**

A: trace-pretty automatically handles circular references using safe JSON serialization:

```typescript
// Circular references are automatically handled
const error = new Error('Circular reference test');
error.circular = error;

const result = format(error); // Works safely
```

## License

MIT License

Copyright (c) 2024 trace-pretty Contributors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

---

**Built with craftsmanship by the trace-pretty team.**

For support, please visit our [GitHub Issues](https://github.com/your-org/trace-pretty/issues) page.  
