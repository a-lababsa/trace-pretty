import { FrameType, RawFrame, StackFrame, FilePath, LineNumber, ColumnNumber, ClassificationRules } from '@/types';
import path from 'path';

/**
 * Default classification rules for common patterns
 */
const DEFAULT_RULES: ClassificationRules = {
  appPaths: [
    'src/',
    'lib/',
    'app/',
    'components/',
    'pages/',
    'utils/',
    'services/',
    'controllers/',
    'routes/'
  ],
  depsPaths: [
    'node_modules/',
    '/node_modules/',
    '\\node_modules\\',
    '.pnpm/',
    '.yarn/'
  ],
  nodePaths: [
    'node:',
    'internal/',
    'nodejs/',
    '/usr/local/',
    '/usr/lib/',
    'C:\\Program Files\\nodejs\\'
  ],
  nativePaths: [
    '[native code]',
    '(native)',
    '<anonymous>',
    'eval',
    '<eval>'
  ]
};

/**
 * Frame classifier that categorizes stack frames by type
 */
export class FrameClassifier {
  private rules: ClassificationRules;
  private projectRoot?: string | undefined;

  constructor(rules: Partial<ClassificationRules> = {}, projectRoot?: string | undefined) {
    this.rules = {
      appPaths: [...DEFAULT_RULES.appPaths, ...(rules.appPaths || [])],
      depsPaths: [...DEFAULT_RULES.depsPaths, ...(rules.depsPaths || [])],
      nodePaths: [...DEFAULT_RULES.nodePaths, ...(rules.nodePaths || [])],
      nativePaths: [...DEFAULT_RULES.nativePaths, ...(rules.nativePaths || [])]
    };
    this.projectRoot = projectRoot;
  }

  /**
   * Classify a raw frame into a typed stack frame
   */
  classify(rawFrame: RawFrame): StackFrame {
    const type = this.determineFrameType(rawFrame);
    
    return {
      type,
      functionName: rawFrame.functionName ?? undefined,
      file: rawFrame.file ? (rawFrame.file as FilePath) : undefined,
      line: rawFrame.line ? (rawFrame.line as LineNumber) : undefined,
      column: rawFrame.column ? (rawFrame.column as ColumnNumber) : undefined,
      original: null, // Will be populated by source map resolver
      source: rawFrame.source ?? undefined
    };
  }

  /**
   * Classify multiple frames
   */
  classifyFrames(rawFrames: readonly RawFrame[]): readonly StackFrame[] {
    return rawFrames.map(frame => this.classify(frame));
  }

  /**
   * Update classification rules
   */
  updateRules(rules: Partial<ClassificationRules>): void {
    this.rules = {
      appPaths: rules.appPaths || this.rules.appPaths,
      depsPaths: rules.depsPaths || this.rules.depsPaths,
      nodePaths: rules.nodePaths || this.rules.nodePaths,
      nativePaths: rules.nativePaths || this.rules.nativePaths
    };
  }

  /**
   * Set project root for relative path resolution
   */
  setProjectRoot(projectRoot: string): void {
    this.projectRoot = projectRoot;
  }

  private determineFrameType(frame: RawFrame): FrameType {
    const filePath = frame.file;
    const functionName = frame.functionName;

    // Check for native code patterns
    if (this.matchesPatterns(functionName, this.rules.nativePaths) ||
        this.matchesPatterns(filePath, this.rules.nativePaths)) {
      return 'native';
    }

    // Check for Node.js internal patterns
    if (this.matchesPatterns(filePath, this.rules.nodePaths) ||
        (filePath && this.isNodeInternal(filePath))) {
      return 'node';
    }

    // Check for dependency patterns
    if (this.matchesPatterns(filePath, this.rules.depsPaths)) {
      return 'deps';
    }

    // Check for application patterns
    if (this.matchesPatterns(filePath, this.rules.appPaths) ||
        this.isApplicationCode(filePath)) {
      return 'app';
    }

    // Default classification based on file characteristics
    return this.classifyByFileCharacteristics(filePath);
  }

  private matchesPatterns(target: string | undefined, patterns: readonly string[]): boolean {
    if (!target) return false;

    return patterns.some(pattern => {
      if (pattern.includes('*')) {
        // Simple glob pattern matching
        const regex = new RegExp(pattern.replace(/\*/g, '.*'), 'i');
        return regex.test(target);
      }
      return target.includes(pattern);
    });
  }

  private isNodeInternal(filePath: string): boolean {
    // Node.js internal modules
    if (filePath.startsWith('node:')) return true;
    if (filePath.includes('internal/')) return true;
    if (filePath.includes('/nodejs/')) return true;
    
    // Common Node.js patterns
    if (/^[a-z_]+\.js$/.test(path.basename(filePath))) {
      // Built-in modules like fs.js, path.js, etc.
      return true;
    }

    return false;
  }

  private isApplicationCode(filePath: string | undefined): boolean {
    if (!filePath) return false;

    // If project root is set, check if file is under project root
    if (this.projectRoot) {
      try {
        const absolutePath = path.resolve(filePath);
        const relativePath = path.relative(this.projectRoot, absolutePath);
        
        // File is under project root and not going up directories
        if (!relativePath.startsWith('..') && !path.isAbsolute(relativePath)) {
          return true;
        }
      } catch {
        // Path resolution failed, fall through to other checks
      }
    }

    // Check for common application file patterns
    const filename = path.basename(filePath);
    const extension = path.extname(filePath);
    
    // Application-like file extensions
    if (['.ts', '.tsx', '.js', '.jsx', '.vue', '.svelte'].includes(extension)) {
      return true;
    }

    // Avoid test files being classified as app unless explicitly in app paths
    if (filename.includes('.test.') || filename.includes('.spec.')) {
      return false;
    }

    return false;
  }

  private classifyByFileCharacteristics(filePath: string | undefined): FrameType {
    if (!filePath) return 'native';

    // Absolute paths are likely system/dependency code
    if (path.isAbsolute(filePath)) {
      return 'deps';
    }

    // Relative paths are more likely application code
    return 'app';
  }
}