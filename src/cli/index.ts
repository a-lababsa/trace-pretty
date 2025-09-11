#!/usr/bin/env node

import { TracePretty } from '../index';
import * as yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

/**
 * CLI interface for trace-pretty
 * Supports both piped input and file input
 * 
 * Usage examples:
 * - npm test | npx trace-pretty
 * - cat error.log | npx trace-pretty --fast
 * - npx trace-pretty --file error.log
 * - npx trace-pretty --help
 */

interface CliOptions {
  fast?: boolean;
  projectRoot?: string;
  codeFrame?: number | false;
  file?: string;
  noColor?: boolean;
}

async function readStdin(): Promise<string> {
  return new Promise((resolve, reject) => {
    let data = '';
    
    // Check if stdin has data (is being piped to)
    if (process.stdin.isTTY) {
      reject(new Error('No input provided. Use --file or pipe input via stdin.\n\nExamples:\n  npm test | npx trace-pretty\n  cat error.log | npx trace-pretty'));
      return;
    }
    
    process.stdin.setEncoding('utf8');
    
    process.stdin.on('data', (chunk) => {
      data += chunk;
    });
    
    process.stdin.on('end', () => {
      resolve(data);
    });
    
    process.stdin.on('error', (err) => {
      reject(err);
    });
  });
}

async function readFile(filePath: string): Promise<string> {
  const fs = await import('fs').then(m => m.promises);
  return fs.readFile(filePath, 'utf8');
}

async function main(): Promise<void> {
  const argv = await yargs.default(hideBin(process.argv))
    .usage('Usage: $0 [options]')
    .option('fast', {
      alias: 'f',
      type: 'boolean',
      description: 'Enable fast mode (no source maps)',
      default: false
    })
    .option('project-root', {
      alias: 'p',
      type: 'string',
      description: 'Project root path for relative paths'
    })
    .option('code-frame', {
      alias: 'c',
      type: 'number',
      description: 'Number of context lines in code frames (or false to disable)',
      default: 3
    })
    .option('file', {
      type: 'string',
      description: 'Read from file instead of stdin'
    })
    .option('no-color', {
      type: 'boolean',
      description: 'Disable colored output',
      default: false
    })
    .example('npm test | $0', 'Format piped test output')
    .example('cat error.log | $0 --fast', 'Format log file with fast mode')
    .example('$0 --file error.log --project-root /app', 'Format from file with project root')
    .help()
    .alias('help', 'h')
    .version()
    .alias('version', 'v')
    .parseAsync() as CliOptions;

  try {
    // Set color environment if --no-color is specified
    if (argv.noColor) {
      process.env.NO_COLOR = '1';
    }

    // Get input - either from file or stdin
    let input: string;
    if (argv.file) {
      input = await readFile(argv.file);
    } else {
      input = await readStdin();
    }

    // Initialize trace-pretty with options
    const options: { fast?: boolean; projectRoot?: string; codeFrame?: number | false } = {};
    if (argv.fast !== undefined) options.fast = argv.fast;
    if (argv.projectRoot !== undefined) options.projectRoot = argv.projectRoot;
    if (argv.codeFrame !== undefined) options.codeFrame = argv.codeFrame === false ? false : (argv.codeFrame || 3);
    
    const tracePretty = new TracePretty(options);

    // Process the input
    const result = await tracePretty.format(input);
    
    // Output the formatted result
    console.log(result.text);

    // Exit with success
    process.exit(0);

  } catch (error) {
    // Handle errors gracefully
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    // If it's a parsing error or no input, show usage hint
    if (errorMessage.includes('No input provided') || errorMessage.includes('No parser found')) {
      console.error('Error:', errorMessage);
      console.error('\nTry: npm test | npx trace-pretty');
      process.exit(1);
    }
    
    // For other errors, show the error and exit
    console.error('Error processing stack trace:', errorMessage);
    process.exit(1);
  }
}

// Handle process termination gracefully
process.on('SIGINT', () => {
  process.exit(0);
});

process.on('SIGTERM', () => {
  process.exit(0);
});

// Only run main if this file is executed directly
if (require.main === module) {
  main().catch((error) => {
    console.error('Unexpected error:', error);
    process.exit(1);
  });
}

export { main };