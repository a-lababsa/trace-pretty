import { SourceMapConsumer } from 'source-map';
import { promises as fs } from 'fs';
import path from 'path';
import { StackFrame, SourcePosition, FilePath, LineNumber, ColumnNumber } from '@/types';

/**
 * Cache entry for source maps
 */
interface SourceMapCacheEntry {
  consumer: SourceMapConsumer;
  lastAccessed: number;
  sourceContent: Map<string, string>;
}

/**
 * Source map resolution options
 */
export interface SourceMapOptions {
  readonly enabled: boolean;
  readonly searchPaths: readonly string[];
  readonly cacheSize: number;
  readonly cacheTtl: number; // Time to live in milliseconds
  readonly timeout: number; // Operation timeout in milliseconds
}

/**
 * Default source map options
 */
const DEFAULT_OPTIONS: SourceMapOptions = {
  enabled: true,
  searchPaths: ['.', 'dist', 'build', 'lib'],
  cacheSize: 100,
  cacheTtl: 5 * 60 * 1000, // 5 minutes
  timeout: 5000 // 5 seconds
};

/**
 * Source map resolver with caching and performance optimizations
 */
export class SourceMapResolver {
  private readonly options: SourceMapOptions;
  private readonly cache = new Map<string, SourceMapCacheEntry>();
  private readonly pendingResolves = new Map<string, Promise<SourceMapCacheEntry | null>>();

  constructor(options: Partial<SourceMapOptions> = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }

  /**
   * Resolve original position for a stack frame
   */
  async resolve(frame: StackFrame): Promise<StackFrame> {
    if (!this.options.enabled || !frame.file || !frame.line || !frame.column) {
      return frame;
    }

    try {
      const resolved = await this.resolvePosition(
        frame.file,
        frame.line,
        frame.column
      );

      if (resolved) {
        return {
          ...frame,
          original: resolved
        };
      }
    } catch (error) {
      // Silently fail and return original frame
      // In production, you might want to log this
    }

    return frame;
  }

  /**
   * Resolve multiple frames in parallel
   */
  async resolveFrames(frames: readonly StackFrame[]): Promise<readonly StackFrame[]> {
    const promises = frames.map(frame => this.resolve(frame));
    return Promise.all(promises);
  }

  /**
   * Clear the source map cache
   */
  clearCache(): void {
    // Dispose of all source map consumers to free memory
    for (const entry of this.cache.values()) {
      entry.consumer.destroy();
    }
    
    this.cache.clear();
    this.pendingResolves.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; entries: number } {
    return {
      size: this.cache.size,
      entries: this.cache.size
    };
  }

  private async resolvePosition(
    file: FilePath,
    line: LineNumber,
    column: ColumnNumber
  ): Promise<SourcePosition | null> {
    const consumer = await this.getSourceMapConsumer(file);
    
    if (!consumer) {
      return null;
    }

    const original = consumer.consumer.originalPositionFor({
      line,
      column
    });

    if (!original.source) {
      return null;
    }

    return {
      file: original.source as FilePath,
      line: (original.line || line) as LineNumber,
      column: (original.column || column) as ColumnNumber,
      name: original.name ?? undefined
    };
  }

  private async getSourceMapConsumer(file: FilePath): Promise<SourceMapCacheEntry | null> {
    const cacheKey = file;
    
    // Check cache first
    const cached = this.cache.get(cacheKey);
    if (cached) {
      // Update last accessed time
      cached.lastAccessed = Date.now();
      return cached;
    }

    // Check if already resolving
    const pending = this.pendingResolves.get(cacheKey);
    if (pending) {
      return pending;
    }

    // Start new resolution
    const promise = this.loadSourceMapConsumer(file);
    this.pendingResolves.set(cacheKey, promise);

    try {
      const result = await promise;
      
      if (result) {
        // Clean cache if needed
        this.cleanCache();
        
        // Store in cache
        this.cache.set(cacheKey, result);
      }

      return result;
    } finally {
      this.pendingResolves.delete(cacheKey);
    }
  }

  private async loadSourceMapConsumer(file: FilePath): Promise<SourceMapCacheEntry | null> {
    const sourceMapPath = await this.findSourceMap(file);
    
    if (!sourceMapPath) {
      return null;
    }

    try {
      // Set up timeout
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Source map loading timeout')), this.options.timeout)
      );

      const loadPromise = this.doLoadSourceMap(sourceMapPath);
      
      const rawSourceMap = await Promise.race([loadPromise, timeoutPromise]);
      const consumer = await new SourceMapConsumer(rawSourceMap);

      return {
        consumer,
        lastAccessed: Date.now(),
        sourceContent: new Map()
      };
    } catch (error) {
      // Failed to load or parse source map
      return null;
    }
  }

  private async doLoadSourceMap(sourceMapPath: string): Promise<any> {
    const content = await fs.readFile(sourceMapPath, 'utf8');
    return JSON.parse(content);
  }

  private async findSourceMap(file: FilePath): Promise<string | null> {
    const possibleNames = [
      `${file}.map`,
      `${path.basename(file)}.map`
    ];

    // Try in same directory as the file
    const fileDir = path.dirname(file);
    for (const name of possibleNames) {
      const fullPath = path.join(fileDir, name);
      if (await this.fileExists(fullPath)) {
        return fullPath;
      }
    }

    // Try in search paths
    for (const searchPath of this.options.searchPaths) {
      for (const name of possibleNames) {
        const fullPath = path.join(searchPath, name);
        if (await this.fileExists(fullPath)) {
          return fullPath;
        }
      }
    }

    return null;
  }

  private async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  private cleanCache(): void {
    if (this.cache.size <= this.options.cacheSize) {
      return;
    }

    const now = Date.now();
    const entries = Array.from(this.cache.entries());

    // Remove expired entries
    for (const [key, entry] of entries) {
      if (now - entry.lastAccessed > this.options.cacheTtl) {
        entry.consumer.destroy();
        this.cache.delete(key);
      }
    }

    // If still over limit, remove least recently used
    if (this.cache.size > this.options.cacheSize) {
      const sortedEntries = entries
        .filter(([key]) => this.cache.has(key)) // Still in cache
        .sort(([,a], [,b]) => a.lastAccessed - b.lastAccessed);

      const toRemove = sortedEntries.slice(0, sortedEntries.length - this.options.cacheSize);
      
      for (const [key, entry] of toRemove) {
        entry.consumer.destroy();
        this.cache.delete(key);
      }
    }
  }
}