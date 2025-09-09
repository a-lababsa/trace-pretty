import { TraceEngine, RawFrame, ParseResult, Warning } from '@/types';

/**
 * Abstract base class for stack trace parsers
 */
export abstract class BaseParser {
  protected readonly engine: TraceEngine;

  constructor(engine: TraceEngine) {
    this.engine = engine;
  }

  /**
   * Parse a stack trace string into raw frames
   */
  abstract parse(trace: string): ParseResult<readonly RawFrame[]>;

  /**
   * Check if this parser can handle the given trace format
   */
  abstract supports(trace: string): boolean;

  /**
   * Get the engine type this parser handles
   */
  getEngine(): TraceEngine {
    return this.engine;
  }

  /**
   * Create a warning object
   */
  protected createWarning(
    type: Warning['type'],
    message: string,
    frame?: RawFrame
  ): Warning {
    return {
      type,
      message,
      ...(frame && { frame: frame as any }) // Type conversion will be handled in classifier
    };
  }

  /**
   * Clean and normalize function names
   */
  protected normalizeFunctionName(name: string | undefined): string | undefined {
    if (!name || name.trim() === '') {
      return undefined;
    }

    // Remove common prefixes and suffixes
    return name
      .replace(/^Object\./, '')
      .replace(/^Function\./, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Validate line and column numbers
   */
  protected validatePosition(line: number | undefined, column: number | undefined): {
    line?: number;
    column?: number;
  } {
    const result: { line?: number; column?: number } = {};

    if (typeof line === 'number' && line > 0) {
      result.line = line;
    }

    if (typeof column === 'number' && column >= 0) {
      result.column = column;
    }

    return result;
  }
}