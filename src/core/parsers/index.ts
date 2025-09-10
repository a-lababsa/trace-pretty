import { RawFrame, ParseResult, TraceEngine, Warning } from '@/types';
import { BaseParser } from './base-parser';
import { V8Parser } from './v8-parser';
import { FirefoxParser } from './firefox-parser';
import { WebKitParser } from './webkit-parser';

/**
 * Multi-engine stack trace parser that automatically detects format
 */
export class StackTraceParser {
  private readonly parsers: readonly BaseParser[];

  constructor() {
    this.parsers = [
      new V8Parser(),
      new FirefoxParser(),
      new WebKitParser()
    ];
  }

  /**
   * Parse a stack trace using the best matching parser
   */
  parse(trace: string): ParseResult<readonly RawFrame[]> {
    if (!trace || typeof trace !== 'string') {
      return {
        result: [],
        warnings: [{
          type: 'parse_error',
          message: 'Invalid or empty stack trace provided'
        }]
      };
    }

    // Try each parser to find the best match
    const candidateParsers = this.parsers.filter(parser => parser.supports(trace));

    if (candidateParsers.length === 0) {
      return {
        result: [],
        warnings: [{
          type: 'parse_error',
          message: 'No parser found for stack trace format'
        }]
      };
    }

    // Use the first matching parser (priority: V8 > Firefox > WebKit)
    const selectedParser = candidateParsers[0];
    if (!selectedParser) {
      return {
        result: [],
        warnings: [{
          type: 'parse_error',
          message: 'No suitable parser found'
        }]
      };
    }
    
    const result = selectedParser.parse(trace);

    // Add engine info to warnings if needed
    if (candidateParsers.length > 1) {
      result.warnings.push({
        type: 'parse_error',
        message: `Multiple parsers matched, using ${selectedParser.getEngine()}`
      });
    }

    return result;
  }

  /**
   * Parse with a specific engine
   */
  parseWithEngine(trace: string, engine: TraceEngine): ParseResult<readonly RawFrame[]> {
    const parser = this.parsers.find(p => p.getEngine() === engine);
    
    if (!parser) {
      return {
        result: [],
        warnings: [{
          type: 'parse_error',
          message: `No parser found for engine: ${engine}`
        }]
      };
    }

    return parser.parse(trace);
  }

  /**
   * Get supported engines
   */
  getSupportedEngines(): readonly TraceEngine[] {
    return this.parsers.map(p => p.getEngine());
  }

  /**
   * Detect the most likely engine for a trace
   */
  detectEngine(trace: string): TraceEngine | null {
    const supportingParsers = this.parsers.filter(parser => parser.supports(trace));
    return supportingParsers.length > 0 ? supportingParsers[0]?.getEngine() ?? null : null;
  }
}

// Re-export parser components
export { BaseParser } from './base-parser';
export { V8Parser } from './v8-parser';
export { FirefoxParser } from './firefox-parser';
export { WebKitParser } from './webkit-parser';
export { ChainedErrorParser } from './chained-error-parser';