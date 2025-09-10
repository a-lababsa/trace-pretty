# trace-pretty CLI Usage

The `trace-pretty` CLI tool can be used to format stack traces from various sources.

## Installation

```bash
npm install -g trace-pretty
# or use npx for one-time usage
```

## Basic Usage

### Pipe from command output
```bash
# Format npm test output
npm test | trace-pretty

# Format Node.js application errors
node app.js | trace-pretty

# Format jest test failures
npm run test 2>&1 | trace-pretty
```

### Read from files
```bash
# Format error log file
trace-pretty --file error.log

# Format with project root for relative paths
trace-pretty --file error.log --project-root /path/to/project
```

## Options

- `-f, --fast` - Enable fast mode (no source maps, better performance)
- `-p, --project-root <path>` - Set project root for relative path display
- `-c, --code-frame <lines>` - Number of context lines in code frames (default: 3)
- `--file <path>` - Read input from file instead of stdin
- `--no-color` - Disable colored output
- `-h, --help` - Show help
- `-v, --version` - Show version

## Examples

```bash
# Basic piping with colors
npm test | trace-pretty

# Fast mode for large outputs
npm test 2>&1 | trace-pretty --fast

# With project root for cleaner paths
node app.js 2>&1 | trace-pretty --project-root $(pwd)

# From file with custom code frame size
trace-pretty --file error.log --code-frame 5

# No colors for CI/scripting
npm test 2>&1 | trace-pretty --no-color

# Disable code frames for minimal output
npm test 2>&1 | trace-pretty --code-frame false
```

## Integration Examples

### With npm scripts
```json
{
  "scripts": {
    "test:pretty": "npm test 2>&1 | trace-pretty",
    "dev:debug": "nodemon app.js 2>&1 | trace-pretty --project-root ."
  }
}
```

### With CI/CD
```bash
# In CI environments (auto-detects no TTY)
npm test 2>&1 | npx trace-pretty --no-color
```

### With Docker
```bash
# Forward container output to trace-pretty
docker run my-app 2>&1 | trace-pretty --project-root /app
```

## Output Format

The CLI produces colored, structured output with:
- **Red bold**: Primary errors
- **Yellow**: Intermediate errors in chains
- **Red**: Root cause errors  
- **Cyan bold**: Section headers
- **Green**: Application function names
- **Gray**: File paths and hidden frames

For chained errors, you'll see:
```
✖ Primary Error Message

Caused by:
  └─ Intermediate Error
    └─ Root Cause Error

Location:
  src/file.ts:42

Call chain (async):
  at functionName (src/file.ts:42:15)
  at async otherFunction (src/other.ts:10:20)

Stack (hidden frames):
  [5 Node internal frames hidden]
```