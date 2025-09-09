/**
 * Core type definitions for trace-pretty
 */

// Engine types
export type TraceEngine = 'v8' | 'firefox' | 'webkit';

// Frame types
export type FrameType = 'app' | 'deps' | 'node' | 'native';

// Branded types for type safety
export type FilePath = string & { readonly __brand: unique symbol };
export type LineNumber = number & { readonly __brand: unique symbol };
export type ColumnNumber = number & { readonly __brand: unique symbol };

// Source position information
export interface SourcePosition {
  readonly file: FilePath;
  readonly line: LineNumber;
  readonly column: ColumnNumber;
  readonly name?: string | undefined;
}

// Raw frame data before processing
export interface RawFrame {
  readonly functionName?: string | undefined;
  readonly file?: string | undefined;
  readonly line?: number | undefined;
  readonly column?: number | undefined;
  readonly source?: string | undefined;
}

// Processed stack frame
export interface StackFrame {
  readonly type: FrameType;
  readonly functionName?: string | undefined;
  readonly file?: FilePath | undefined;
  readonly line?: LineNumber | undefined;
  readonly column?: ColumnNumber | undefined;
  readonly original?: SourcePosition | null | undefined;
  readonly source?: string | undefined;
}

// Result wrapper for error handling
export type Result<T, E = Error> = 
  | { readonly success: true; readonly data: T }
  | { readonly success: false; readonly error: E };

// Parse result with warnings
export interface ParseResult<T> {
  readonly result: T;
  readonly warnings: Warning[];
}

// Warning types
export interface Warning {
  readonly type: 'sourcemap_missing' | 'parse_error' | 'file_not_found' | 'security_redacted';
  readonly message: string;
  readonly frame?: StackFrame | undefined;
}

// Format result with metadata
export interface FormatResult {
  readonly text: string;
  readonly frames: readonly StackFrame[];
  readonly warnings: readonly Warning[];
  readonly metadata: {
    readonly processingTime: number;
    readonly sourceMapsResolved: number;
    readonly sourceMapsTotal: number;
  };
}

// Configuration options
export interface FormatOptions {
  readonly codeFrame?: number | false;
  readonly onlyApp?: boolean;
  readonly hideDeps?: boolean;
  readonly hideNode?: boolean;
  readonly maxFrames?: number;
  readonly redact?: readonly (string | RegExp)[];
  readonly fast?: boolean;
  readonly strict?: boolean;
  readonly projectRoot?: string;
  readonly sourceMapPaths?: readonly string[];
}

// Classification rules
export interface ClassificationRules {
  readonly appPaths: readonly string[];
  readonly depsPaths: readonly string[];
  readonly nodePaths: readonly string[];
  readonly nativePaths: readonly string[];
}

// Security configuration
export interface SecurityConfig {
  readonly enabled: boolean;
  readonly patterns: readonly (string | RegExp)[];
  readonly replacement: string;
}

// Performance monitoring
export interface PerformanceMetrics {
  readonly processingTime: number;
  readonly memoryUsage: number;
  readonly cacheHits: number;
  readonly cacheMisses: number;
}