import { RawFrame, ParseResult, Warning } from '@/types';
import { BaseParser } from './base-parser';

/**
 * Parser for WebKit stack traces (Safari, JSC)
 * 
 * WebKit format examples:
 * - functionName@file:line:column
 * - global code@file:line:column
 * - eval code@file:line:column
 * - [native code]
 */
export class WebKitParser extends BaseParser {
  private static readonly WEBKIT_FRAME_REGEX = /^(.*?)@(.*?):(\d+):(\d+)$/;
  private static readonly WEBKIT_NATIVE_REGEX = /^\[native code\]$/;
  private static readonly WEBKIT_EVAL_REGEX = /^eval code@/;
  private static readonly WEBKIT_GLOBAL_REGEX = /^global code@/;

  constructor() {
    super('webkit');
  }

  supports(trace: string): boolean {
    const lines = trace.split('\n').filter(line => line.trim());
    
    // Check for WebKit-specific patterns
    let matchCount = 0;
    let relevantLines = 0;

    for (const line of lines.slice(0, 10)) { // Check first 10 lines
      const trimmed = line.trim();
      if (trimmed) {
        relevantLines++;
        if (this.isWebKitFormat(trimmed)) {
          matchCount++;
        }
      }
    }

    // WebKit traces often have fewer lines, so lower threshold
    return relevantLines > 0 && (matchCount / relevantLines) >= 0.3;
  }

  parse(trace: string): ParseResult<readonly RawFrame[]> {
    const lines = trace.split('\n').filter(line => line.trim());
    const frames: RawFrame[] = [];
    const warnings: Warning[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line?.trim();
      
      if (!trimmed) {
        continue;
      }

      try {
        const frame = this.parseWebKitFrame(trimmed);
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

  private isWebKitFormat(line: string): boolean {
    return (
      WebKitParser.WEBKIT_FRAME_REGEX.test(line) ||
      WebKitParser.WEBKIT_NATIVE_REGEX.test(line) ||
      WebKitParser.WEBKIT_EVAL_REGEX.test(line) ||
      WebKitParser.WEBKIT_GLOBAL_REGEX.test(line)
    );
  }

  private parseWebKitFrame(line: string): RawFrame | null {
    // Handle native code
    if (WebKitParser.WEBKIT_NATIVE_REGEX.test(line)) {
      return {
        functionName: '[native code]',
        source: line
      };
    }

    // Handle regular frames
    const match = line.match(WebKitParser.WEBKIT_FRAME_REGEX);
    if (match) {
      const [, functionName, file, lineStr, columnStr] = match;
      const { line: lineNum, column } = this.validatePosition(
        lineStr ? parseInt(lineStr, 10) : undefined,
        columnStr ? parseInt(columnStr, 10) : undefined
      );

      let normalizedFunctionName = this.normalizeFunctionName(functionName);

      // Handle WebKit-specific function names
      if (WebKitParser.WEBKIT_EVAL_REGEX.test(line)) {
        normalizedFunctionName = 'eval';
      } else if (WebKitParser.WEBKIT_GLOBAL_REGEX.test(line)) {
        normalizedFunctionName = '<global>';
      }

      return {
        functionName: normalizedFunctionName || undefined,
        file: file || undefined,
        line: lineNum,
        column,
        source: line
      };
    }

    return null;
  }
}