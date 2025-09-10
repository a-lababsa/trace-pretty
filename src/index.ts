import { StackTraceParser } from './core/parsers';
import { FrameClassifier } from './core/classifiers';
import { SourceMapResolver } from './core/source-maps';
import { AdvancedFormatter } from './core/formatters';
import { ChainedErrorParser } from './core/parsers/chained-error-parser';
import { CodeFrameExtractor } from './infrastructure/file-system';
import { FormatOptions, FormatResult } from './types';

/**
 * Main trace-pretty API
 */
export class TracePretty {
  private parser: StackTraceParser;
  private classifier: FrameClassifier;
  private sourceMapResolver: SourceMapResolver;
  private formatter: AdvancedFormatter;
  private chainedErrorParser: ChainedErrorParser;
  private codeExtractor: CodeFrameExtractor;

  constructor(private options: FormatOptions = {}) {
    this.parser = new StackTraceParser();
    this.classifier = new FrameClassifier({}, options.projectRoot);
    this.sourceMapResolver = new SourceMapResolver({ enabled: !options.fast });
    this.formatter = new AdvancedFormatter(options);
    this.chainedErrorParser = new ChainedErrorParser();
    this.codeExtractor = new CodeFrameExtractor({
      contextLines: typeof options.codeFrame === 'number' ? Math.floor(options.codeFrame / 2) : 3,
      showLineNumbers: true,
      highlightLine: true
    });
  }

  /**
   * Parse and format a stack trace beautifully
   */
  async format(trace: string | Error): Promise<FormatResult> {
    const startTime = performance.now();
    
    // Handle Error object
    let traceString: string;
    let error: Error;
    
    if (typeof trace === 'string') {
      traceString = trace;
      // Try to extract error info from the trace string
      error = this.parseErrorFromTrace(trace);
    } else {
      traceString = trace.stack || trace.message;
      error = trace;
    }

    // Check for chained errors first
    const chainedErrors = this.chainedErrorParser.parseChainedErrors(traceString);
    if (chainedErrors && chainedErrors.errors.length > 1) {
      return this.formatChainedErrors(chainedErrors, startTime);
    }
    
    // Parse raw stack trace
    const parseResult = this.parser.parse(traceString);
    
    // Classify frames
    const classifiedFrames = this.classifier.classifyFrames(parseResult.result);
    
    // Resolve source maps (unless in fast mode)
    const resolvedFrames = this.options.fast ? 
      classifiedFrames : 
      await this.sourceMapResolver.resolveFrames(classifiedFrames);

    // Extract code frames (unless disabled or in fast mode)
    const codeFrames = (this.options.codeFrame !== false && !this.options.fast) ?
      await this.codeExtractor.extractFrames(resolvedFrames) :
      [];

    // Format with advanced formatter
    const formattedText = this.formatter.formatError(
      error,
      resolvedFrames,
      codeFrames,
      parseResult.warnings
    );

    const processingTime = performance.now() - startTime;
    const sourceMapsTotal = resolvedFrames.length;
    const sourceMapsResolved = resolvedFrames.filter(f => f.original).length;

    return {
      text: formattedText,
      frames: resolvedFrames,
      warnings: parseResult.warnings,
      metadata: {
        processingTime,
        sourceMapsResolved,
        sourceMapsTotal
      }
    };
  }

  /**
   * Parse and classify a stack trace (without formatting)
   */
  async parse(trace: string) {
    // Parse raw stack trace
    const parseResult = this.parser.parse(trace);
    
    // Classify frames
    const classifiedFrames = this.classifier.classifyFrames(parseResult.result);
    
    // Resolve source maps
    const resolvedFrames = await this.sourceMapResolver.resolveFrames(classifiedFrames);

    return {
      frames: resolvedFrames,
      warnings: parseResult.warnings,
      engine: this.parser.detectEngine(trace)
    };
  }

  /**
   * Clear all caches
   */
  clearCaches(): void {
    this.sourceMapResolver.clearCache();
    this.codeExtractor.clearCache();
  }

  /**
   * Format chained errors using the advanced formatter
   */
  private async formatChainedErrors(chainedErrors: import('./types').ChainedError, startTime: number): Promise<FormatResult> {
    const primaryError = chainedErrors.primaryError;
    
    // Extract code frame for primary error
    let codeFrames: readonly (import('./infrastructure/file-system').CodeFrame | null)[] = [];
    if (this.options.codeFrame !== false && !this.options.fast && primaryError.frames.length > 0) {
      codeFrames = await this.codeExtractor.extractFrames(primaryError.frames);
    }
    
    // Format using the advanced formatter
    const formattedText = this.formatter.formatChainedErrors(
      chainedErrors.errors,
      codeFrames
    );
    
    const processingTime = performance.now() - startTime;
    const allFrames = chainedErrors.errors.flatMap(e => e.frames);
    
    return {
      text: formattedText,
      frames: allFrames,
      errors: chainedErrors.errors,
      warnings: [],
      metadata: {
        processingTime,
        sourceMapsResolved: 0,
        sourceMapsTotal: 0
      }
    };
  }

  /**
   * Parse error information from a trace string
   */
  private parseErrorFromTrace(trace: string): Error {
    const lines = trace.split('\n');
    
    // Look for error pattern
    for (const line of lines) {
      // Handle Node.js error codes like [ERR_UNSUPPORTED_DIR_IMPORT]
      if (line.includes('[ERR_') && line.includes(']:')) {
        const errorCodeMatch = line.match(/\[([^\]]+)\]/);
        const messageMatch = line.match(/\]: (.+)$/);
        
        if (errorCodeMatch && messageMatch) {
          const error = new Error(messageMatch[1]);
          error.name = `Error [${errorCodeMatch[1]}]`;
          return error;
        }
      }
      
      // Handle standard error patterns like "TypeError: message"
      if (line.match(/^(Error|TypeError|ReferenceError|SyntaxError|RangeError):/)) {
        const [errorType, ...messageParts] = line.split(': ');
        const error = new Error(messageParts.join(': '));
        error.name = errorType || 'Error';
        return error;
      }
    }
    
    // Fallback
    return new Error('Unknown error');
  }
}

// Export main components
export { StackTraceParser } from './core/parsers';
export { FrameClassifier } from './core/classifiers';
export { SourceMapResolver } from './core/source-maps';
export * from './types';