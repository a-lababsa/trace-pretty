# trace-pretty

> **Professional stack trace formatter for JavaScript and TypeScript applications.**  
> Transform cryptic error traces into readable, actionable debugging information with chained error support and beautiful terminal colors.

## Installation

```bash
# Global installation for CLI usage
npm install -g trace-pretty

# Use without installation
npx trace-pretty

# Local project dependency
npm install trace-pretty
```

## Quick Start

```bash
# Pipe any command output to trace-pretty
npm test | trace-pretty
node app.js 2>&1 | trace-pretty --project-root $(pwd)
```

[![npm version](https://badge.fury.io/js/trace-pretty.svg)](https://www.npmjs.com/package/trace-pretty)
[![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

## Table of Contents

- [Overview](#overview)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [Development](#development)
- [Testing](#testing)
- [License](#license)

## Overview

trace-pretty is a production-ready tool designed to transform raw JavaScript/TypeScript stack traces into human-readable, contextual error reports. Inspired by [pino-pretty](https://github.com/pinojs/pino-pretty), it specializes in error formatting with advanced source mapping, code frame generation, and intelligent frame classification.

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

### Usage Examples

```bash
# Pipe from any command
npm test | trace-pretty
node app.js 2>&1 | trace-pretty

# Process log files  
trace-pretty --file error.log

# Set project root for relative paths
npm test | trace-pretty --project-root $(pwd)

# Chain with other commands
npm test 2>&1 | trace-pretty | tee test-output.log
```

## Development

### Building the Project

```bash
# Install dependencies
npm install

# Build TypeScript to JavaScript
npm run build

# Run tests
npm test

# Run linting
npm run lint
```

## Testing

Run the comprehensive test suite:

```bash
# Run all tests
npm test

# Run tests in watch mode  
npm run test:watch

# Run with coverage
npm run test:coverage

```

## License

MIT License

Copyright (c) 2024 Alexandre Lababsa

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
