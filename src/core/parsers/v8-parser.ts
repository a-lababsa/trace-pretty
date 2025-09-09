import { RawFrame, ParseResult, Warning } from '@/types';
import { BaseParser } from './base-parser';

/**
 * Parser for V8 engine stack traces (Node.js, Chrome)
 * 
 * V8 format examples:
 * - at functionName (file:line:column)
 * - at file:line:column
 * - at Object.functionName (file:line:column)
 * - at async functionName (file:line:column)
 */
export class V8Parser extends BaseParser {
  private static readonly V8_FRAME_REGEX = /^\s*at\s+(?:(.+?)\s+\()?(.+?):(\d+):(\d+)\)?$/;
  private static readonly V8_ASYNC_REGEX = /^\s*at\s+async\s+(.+?)(?:\s+\((.+?):(\d+):(\d+)\))?$/;
  private static readonly V8_NATIVE_REGEX = /^\s*at\s+(.+?)\s+\(native\)$/;

  constructor() {
    super('v8');
  }

  supports(trace: string): boolean {
    const lines = trace.split('\n').filter(line => line.trim());
    
    // Check if at least 50% of lines match V8 format
    let matchCount = 0;
    let relevantLines = 0;

    for (const line of lines.slice(0, 10)) { // Check first 10 lines
      if (line.trim().startsWith('at ')) {
        relevantLines++;
        if (this.isV8Format(line)) {
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
      
      if (!line || !line.trim().startsWith('at ')) {
        continue; // Skip non-stack lines (error message, etc.)
      }

      try {
        const frame = this.parseV8Frame(line);
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

  private isV8Format(line: string): boolean {
    return (
      V8Parser.V8_FRAME_REGEX.test(line) ||
      V8Parser.V8_ASYNC_REGEX.test(line) ||
      V8Parser.V8_NATIVE_REGEX.test(line)
    );
  }

  private parseV8Frame(line: string): RawFrame | null {
    // Handle native frames
    const nativeMatch = line.match(V8Parser.V8_NATIVE_REGEX);
    if (nativeMatch) {
      return {
        functionName: this.normalizeFunctionName(nativeMatch[1]) || undefined,
        source: line.trim()
      };
    }

    // Handle async frames
    const asyncMatch = line.match(V8Parser.V8_ASYNC_REGEX);
    if (asyncMatch) {
      const [, functionName, file, lineStr, columnStr] = asyncMatch;
      const { line: lineNum, column } = this.validatePosition(
        lineStr ? parseInt(lineStr, 10) : undefined,
        columnStr ? parseInt(columnStr, 10) : undefined
      );

      return {
        functionName: this.normalizeFunctionName(`async ${functionName || ''}`) || undefined,
        file: file || undefined,
        line: lineNum,
        column,
        source: line.trim()
      };
    }

    // Handle regular frames
    const frameMatch = line.match(V8Parser.V8_FRAME_REGEX);
    if (frameMatch) {
      const [, functionName, file, lineStr, columnStr] = frameMatch;
      const { line: lineNum, column } = this.validatePosition(
        lineStr ? parseInt(lineStr, 10) : undefined,
        columnStr ? parseInt(columnStr, 10) : undefined
      );

      return {
        functionName: this.normalizeFunctionName(functionName) || undefined,
        file: file || undefined,
        line: lineNum,
        column,
        source: line.trim()
      };
    }

    return null;
  }
}