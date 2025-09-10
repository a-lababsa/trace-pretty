import { ErrorInfo, ChainedError, StackFrame } from '@/types';
import { V8Parser } from './v8-parser';
import { FrameClassifier } from '../classifiers';

/**
 * Parser for chained errors with "Caused by:" structure
 * 
 * Handles patterns like:
 * - Error: Main message
 *     at stack1...
 * - Caused by: Error: Nested message
 *     at stack2...
 */
export class ChainedErrorParser {
  private readonly v8Parser: V8Parser;
  private readonly frameClassifier: FrameClassifier;
  
  constructor() {
    this.v8Parser = new V8Parser();
    this.frameClassifier = new FrameClassifier();
  }
  
  /**
   * Parse a trace that may contain chained errors
   */
  parseChainedErrors(trace: string): ChainedError | null {
    const lines = trace.split('\n').map(line => line.trim()).filter(Boolean);
    const errors: ErrorInfo[] = [];
    let currentError: Partial<ErrorInfo> | null = null;
    let currentStackLines: string[] = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (!line) continue;
      
      // Check for error message patterns
      const errorMatch = this.matchErrorLine(line);
      if (errorMatch && errorMatch.name && errorMatch.message) {
        // Save previous error if exists
        if (currentError && currentError.name && currentError.message && currentStackLines.length > 0) {
          const frames = this.parseStackLines(currentStackLines);
          if (frames.length > 0) {
            errors.push({
              name: currentError.name,
              message: currentError.message,
              frames
            });
          }
        }
        
        // Start new error
        currentError = {
          name: errorMatch.name,
          message: errorMatch.message
        };
        currentStackLines = [];
        continue;
      }
      
      // Check for "Caused by:" pattern
      const causedByMatch = line.match(/^Caused by:\s*(.+?):\s*(.*)$/);
      if (causedByMatch && causedByMatch[1] && causedByMatch[2]) {
        // Save previous error if exists
        if (currentError && currentError.name && currentError.message && currentStackLines.length > 0) {
          const frames = this.parseStackLines(currentStackLines);
          if (frames.length > 0) {
            errors.push({
              name: currentError.name,
              message: currentError.message,
              frames
            });
          }
        }
        
        // Start caused by error
        currentError = {
          name: causedByMatch[1],
          message: causedByMatch[2]
        };
        currentStackLines = [];
        continue;
      }
      
      // Check if this is a stack frame line
      if (line.trim().startsWith('at ')) {
        currentStackLines.push(line);
        continue;
      }
      
      // Skip other lines (logged messages, etc.)
    }
    
    // Add final error
    if (currentError && currentError.name && currentError.message && currentStackLines.length > 0) {
      const frames = this.parseStackLines(currentStackLines);
      if (frames.length > 0) {
        errors.push({
          name: currentError.name,
          message: currentError.message,
          frames
        });
      }
    }
    
    if (errors.length === 0) {
      return null;
    }

    const primaryError = errors[0];
    if (!primaryError) {
      return null;
    }
    
    return {
      errors,
      primaryError
    };
  }
  
  /**
   * Check if line contains an error message
   */
  private matchErrorLine(line: string): { name: string; message: string } | null {
    // Pattern: ErrorName: error message
    const match = line.match(/^([A-Za-z_][A-Za-z0-9_]*Error):\s*(.*)$/);
    if (match && match[1] && match[2] !== undefined) {
      return {
        name: match[1],
        message: match[2]
      };
    }
    
    // Pattern: Stack trace: ErrorName: error message
    const stackTraceMatch = line.match(/^Stack trace:\s*([A-Za-z_][A-Za-z0-9_]*Error):\s*(.*)$/);
    if (stackTraceMatch && stackTraceMatch[1] && stackTraceMatch[2] !== undefined) {
      return {
        name: stackTraceMatch[1],
        message: stackTraceMatch[2]
      };
    }
    
    return null;
  }
  
  /**
   * Parse stack frame lines into StackFrame objects
   */
  private parseStackLines(stackLines: string[]): readonly StackFrame[] {
    const stackTrace = stackLines.join('\n');
    const parseResult = this.v8Parser.parse(stackTrace);
    
    if (!parseResult.result || parseResult.result.length === 0) {
      return [];
    }
    
    // Classify frames
    return this.frameClassifier.classifyFrames(parseResult.result);
  }
  
  /**
   * Check if trace contains chained errors
   */
  hasChainedErrors(trace: string): boolean {
    return trace.includes('Caused by:') || 
           (trace.match(/Stack trace:/g) || []).length > 1;
  }
}