import { promises as fs } from 'fs';
import path from 'path';
import { StackFrame, FilePath, LineNumber } from '@/types';

/**
 * Configuration for code frame extraction
 */
export interface CodeFrameOptions {
  readonly contextLines: number; // Number of lines before/after the target line
  readonly maxLineLength: number; // Maximum line length before truncation
  readonly showLineNumbers: boolean; // Whether to show line numbers
  readonly highlightLine: boolean; // Whether to highlight the target line
  readonly tabSize: number; // Number of spaces for tab replacement
}

/**
 * Default code frame options
 */
const DEFAULT_OPTIONS: CodeFrameOptions = {
  contextLines: 3,
  maxLineLength: 120,
  showLineNumbers: true,
  highlightLine: true,
  tabSize: 2
};

/**
 * Extracted code frame information
 */
export interface CodeFrame {
  readonly lines: readonly CodeLine[];
  readonly targetLine: number;
  readonly file: string;
  readonly startLine: number;
  readonly endLine: number;
  readonly available: boolean;
}

/**
 * Individual line in a code frame
 */
export interface CodeLine {
  readonly number: number;
  readonly content: string;
  readonly isTarget: boolean;
  readonly isEmpty: boolean;
}

/**
 * Code frame extractor that reads files and extracts contextual code
 */
export class CodeFrameExtractor {
  private readonly options: CodeFrameOptions;
  private readonly fileCache = new Map<string, string[]>();

  constructor(options: Partial<CodeFrameOptions> = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }

  /**
   * Extract code frame for a stack frame
   */
  async extractFrame(frame: StackFrame): Promise<CodeFrame | null> {
    if (!frame.file || !frame.line) {
      return null;
    }

    try {
      const lines = await this.readFileLines(frame.file);
      return this.createCodeFrame(lines, frame.file, frame.line);
    } catch (error) {
      // File not accessible, return null
      return null;
    }
  }

  /**
   * Extract code frames for multiple stack frames
   */
  async extractFrames(frames: readonly StackFrame[]): Promise<readonly (CodeFrame | null)[]> {
    const promises = frames.map(frame => this.extractFrame(frame));
    return Promise.all(promises);
  }

  /**
   * Clear file cache
   */
  clearCache(): void {
    this.fileCache.clear();
  }

  private async readFileLines(filePath: FilePath): Promise<string[]> {
    const normalizedPath = this.normalizePath(filePath);
    
    // Check cache first
    const cached = this.fileCache.get(normalizedPath);
    if (cached) {
      return cached;
    }

    // Read file
    const content = await fs.readFile(normalizedPath, 'utf8');
    const lines = content.split(/\r?\n/);
    
    // Cache for future use
    this.fileCache.set(normalizedPath, lines);
    
    return lines;
  }

  private createCodeFrame(
    allLines: string[],
    filePath: string,
    targetLine: LineNumber
  ): CodeFrame {
    const targetLineIndex = targetLine - 1; // Convert to 0-based index
    const startLine = Math.max(0, targetLineIndex - this.options.contextLines);
    const endLine = Math.min(allLines.length - 1, targetLineIndex + this.options.contextLines);

    const frameLines: CodeLine[] = [];
    
    for (let i = startLine; i <= endLine; i++) {
      const lineNumber = i + 1;
      const rawContent = allLines[i] || '';
      const content = this.processLineContent(rawContent);
      
      frameLines.push({
        number: lineNumber,
        content,
        isTarget: lineNumber === targetLine,
        isEmpty: rawContent.trim().length === 0
      });
    }

    return {
      lines: frameLines,
      targetLine,
      file: filePath,
      startLine: startLine + 1,
      endLine: endLine + 1,
      available: true
    };
  }

  private processLineContent(line: string): string {
    // Replace tabs with spaces
    let processed = line.replace(/\t/g, ' '.repeat(this.options.tabSize));
    
    // Truncate if too long
    if (processed.length > this.options.maxLineLength) {
      processed = processed.slice(0, this.options.maxLineLength - 3) + '...';
    }
    
    return processed;
  }

  private normalizePath(filePath: FilePath): string {
    // Handle different path formats
    let normalized = filePath as string;
    
    // Convert Windows paths
    if (process.platform === 'win32') {
      normalized = normalized.replace(/\//g, path.sep);
    }
    
    // Handle relative paths
    if (!path.isAbsolute(normalized)) {
      normalized = path.resolve(process.cwd(), normalized);
    }
    
    // Handle URL-style paths (webpack, etc.)
    if (normalized.startsWith('webpack://')) {
      normalized = normalized.replace('webpack://', '');
      normalized = normalized.split('?')[0] || normalized; // Remove query params
    }
    
    return normalized;
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { files: number; totalLines: number } {
    let totalLines = 0;
    for (const lines of this.fileCache.values()) {
      totalLines += lines.length;
    }
    
    return {
      files: this.fileCache.size,
      totalLines
    };
  }
}