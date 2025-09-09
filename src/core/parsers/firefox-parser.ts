import { RawFrame, ParseResult, Warning } from '@/types';
import { BaseParser } from './base-parser';

/**
 * Parser for Firefox/SpiderMonkey stack traces
 * 
 * Firefox format examples:
 * - functionName@file:line:column
 * - @file:line:column (anonymous)
 * - functionName@file:line (no column)
 */
export class FirefoxParser extends BaseParser {
  private static readonly FIREFOX_FRAME_REGEX = /^(.*)@(.*?):(\d+)(?::(\d+))?$/;

  constructor() {
    super('firefox');
  }

  supports(trace: string): boolean {
    const lines = trace.split('\n').filter(line => line.trim());
    
    // Check if at least 50% of lines match Firefox format
    let matchCount = 0;
    let relevantLines = 0;

    for (const line of lines.slice(0, 10)) { // Check first 10 lines
      const trimmed = line.trim();
      if (trimmed && trimmed.includes('@')) {
        relevantLines++;
        if (FirefoxParser.FIREFOX_FRAME_REGEX.test(trimmed)) {
          matchCount++;
        }
      }
    }

    return relevantLines > 0 && (matchCount / relevantLines) >= 0.5;
  }

  parse(trace: string): ParseResult<readonly RawFrame[]> {
    const lines = trace.split('\n').filter(line => line.trim());
    const frames: RawFrame[] = [];
    const warnings: Warning[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line?.trim();
      
      if (!trimmed || !trimmed.includes('@')) {
        continue; // Skip non-stack lines
      }

      try {
        const frame = this.parseFirefoxFrame(trimmed);
        if (frame) {
          frames.push(frame);
        }
      } catch (error) {
        warnings.push(
          this.createWarning(
            'parse_error',
            `Failed to parse line ${i + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`
          )
        );
      }
    }

    return {
      result: frames,
      warnings
    };
  }

  private parseFirefoxFrame(line: string): RawFrame | null {
    const match = line.match(FirefoxParser.FIREFOX_FRAME_REGEX);
    if (!match) {
      return null;
    }

    const [, functionName, file, lineStr, columnStr] = match;
    const { line: lineNum, column } = this.validatePosition(
      lineStr ? parseInt(lineStr, 10) : undefined,
      columnStr ? parseInt(columnStr, 10) : undefined
    );

    return {
      functionName: this.normalizeFunctionName(functionName) || undefined,
      file: file || undefined,
      line: lineNum,
      column,
      source: line
    };
  }
}