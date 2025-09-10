import { StackFrame, FormatOptions, Warning, ErrorInfo } from '@/types';
import { CodeFrame } from '@/infrastructure/file-system';
import { ColorTheme, getTheme } from '../../infrastructure/colors';

/**
 * Advanced formatter that creates highly structured, informative output
 * Separates error analysis, code frames, call chain, and hidden frame summaries
 */
export class AdvancedFormatter {
  private theme: ColorTheme;

  constructor(private options: FormatOptions = {}) {
    this.theme = getTheme();
  }

  /**
   * Format error in advanced structured style
   */
  formatError(
    error: Error,
    frames: readonly StackFrame[],
    codeFrames: readonly (CodeFrame | null)[],
    warnings: readonly Warning[] = []
  ): string {
    const sections: string[] = [];

    // 1. Error header with property analysis
    sections.push(this.formatErrorHeader(error, frames));

    // 2. Code frame section (if available)
    const codeFrameSection = this.formatCodeFrameSection(frames, codeFrames);
    if (codeFrameSection) {
      sections.push(codeFrameSection);
    }

    // 3. Call chain (async app frames only)
    const callChainSection = this.formatCallChain(frames);
    if (callChainSection) {
      sections.push(callChainSection);
    }

    // 4. Hidden frames summary
    const hiddenSection = this.formatHiddenFrames(frames);
    if (hiddenSection) {
      sections.push(hiddenSection);
    }

    return sections.join('\n\n');
  }

  /**
   * Format multiple chained errors with hierarchical structure
   */
  formatChainedErrors(
    errors: readonly ErrorInfo[],
    codeFrames: readonly (CodeFrame | null)[],
    warnings: readonly Warning[] = []
  ): string {
    const sections: string[] = [];
    
    if (errors.length === 0) {
      return '';
    }
    
    // 1. Primary error header (Rouge vif + gras)
    const primaryError = errors[0];
    if (!primaryError) return '';
    
    const mockError = new Error(primaryError.message);
    mockError.name = primaryError.name;
    const primaryErrorText = this.formatErrorHeaderPlain(mockError, primaryError.frames);
    sections.push(this.theme.primaryError(primaryErrorText));
    
    // 2. Caused by chain (hierarchical)
    if (errors.length > 1) {
      let causedBySection = this.theme.section('Caused by:');
      for (let i = 1; i < errors.length; i++) {
        const error = errors[i];
        if (!error) continue;
        
        const indent = '  '.repeat(i);
        const prefix = '└─ ';
        const errorText = `${error.name}: ${error.message}`;
        
        // Couleur selon la position : jaune pour intermédiaires, rouge pour la racine
        const coloredError = i === errors.length - 1 
          ? this.theme.rootError(errorText)  // Dernière erreur = erreur racine (rouge)
          : this.theme.intermediateError(errorText);  // Erreurs intermédiaires (jaune)
          
        causedBySection += `\n${indent}${prefix}${coloredError}`;
      }
      sections.push(causedBySection);
    }
    
    // 3. Location for primary error (Cyan pour section + Gris pour chemin)
    if (primaryError.frames.length > 0) {
      const locationSection = this.formatLocationSectionColored(primaryError.frames);
      if (locationSection) {
        sections.push(locationSection);
      }
    }
    
    // 4. Code frame for primary error
    if (codeFrames.length > 0 && codeFrames[0]) {
      const codeFrameSection = this.formatCodeFrameSection(primaryError.frames, codeFrames);
      if (codeFrameSection) {
        sections.push(codeFrameSection);
      }
    }
    
    // 5. Combined call chain from all errors (Cyan pour section)
    const allFrames = errors.flatMap(e => e.frames);
    const uniqueFrames = this.deduplicateFrames(allFrames);
    const callChainSection = this.formatCallChainColored(uniqueFrames);
    if (callChainSection) {
      sections.push(callChainSection);
    }
    
    // 6. Hidden frames summary (Cyan pour section + Gris pour contenu)
    const hiddenSection = this.formatHiddenFramesColored(uniqueFrames);
    if (hiddenSection) {
      sections.push(hiddenSection);
    }
    
    return sections.join('\n\n');
  }

  private formatLocationSection(frames: readonly StackFrame[]): string | null {
    const firstFrame = frames.find(f => f.type === 'app');
    if (!firstFrame || !firstFrame.file || !firstFrame.line) {
      return null;
    }
    
    return `Location:\n  ${this.shortenPath(firstFrame.file)}:${firstFrame.line}`;
  }

  private formatLocationSectionColored(frames: readonly StackFrame[]): string | null {
    const firstFrame = frames.find(f => f.type === 'app');
    if (!firstFrame || !firstFrame.file || !firstFrame.line) {
      return null;
    }
    
    const locationPath = `${this.shortenPath(firstFrame.file)}:${firstFrame.line}`;
    return `${this.theme.section('Location:')}\n  ${this.theme.filePath(locationPath)}`;
  }

  private formatErrorHeaderPlain(error: Error, frames: readonly StackFrame[]): string {
    const icon = '✖';
    const errorName = error.constructor.name;
    const message = error.message;
    
    return `${icon} ${errorName}: ${message}`;
  }

  private formatCallChainColored(frames: readonly StackFrame[]): string | null {
    const appFrames = frames.filter(frame => frame.type === 'app');
    if (appFrames.length === 0) {
      return null;
    }

    const chainItems = appFrames.map(frame => {
      const func = frame.functionName || '<anonymous>';
      const file = frame.file ? this.shortenPath(frame.file) : '<unknown>';
      const location = frame.line ? `${frame.line}` : '';
      
      const functionPart = this.theme.appFunction(func);
      const pathPart = this.theme.filePath(`${file}:${location}`);
      
      return `  at ${functionPart} (${pathPart})`;
    });

    return `${this.theme.section('Call chain (async):')}\n${chainItems.join('\n')}`;
  }

  private formatHiddenFramesColored(frames: readonly StackFrame[]): string | null {
    // Count hidden frames by type
    const hiddenCounts = {
      node: frames.filter(f => f.type === 'node').length,
      deps: frames.filter(f => f.type === 'deps').length,
      native: frames.filter(f => f.type === 'native').length
    };

    const hiddenItems: string[] = [];
    
    if (hiddenCounts.node > 0) {
      hiddenItems.push(`[${hiddenCounts.node} Node internal frames hidden]`);
    }
    if (hiddenCounts.deps > 0) {
      hiddenItems.push(`[${hiddenCounts.deps} Dependency frames hidden]`);  
    }
    if (hiddenCounts.native > 0) {
      hiddenItems.push(`[${hiddenCounts.native} Native frames hidden]`);
    }

    // Count additional app frames that aren't shown in call chain
    const appFrames = frames.filter(f => f.type === 'app');
    const visibleAppFrames = Math.min(appFrames.length, 5); // Assuming we show max 5 in call chain
    const hiddenAppFrames = Math.max(0, appFrames.length - visibleAppFrames);
    
    if (hiddenAppFrames > 0) {
      hiddenItems.push(`[${hiddenAppFrames} Additional app frames hidden]`);
    }

    if (hiddenItems.length === 0) {
      return null;
    }

    const hiddenText = hiddenItems.map(item => this.theme.internalFrame(item)).join('\n  ');
    return `${this.theme.section('Stack (hidden frames):')}\n  ${hiddenText}`;
  }

  /**
   * Remove duplicate frames based on file and line
   */
  private deduplicateFrames(frames: readonly StackFrame[]): StackFrame[] {
    const seen = new Set<string>();
    return frames.filter(frame => {
      const key = `${frame.file}:${frame.line}:${frame.functionName}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  private formatErrorHeader(error: Error, frames: readonly StackFrame[]): string {
    const icon = '✖';
    const errorName = error.constructor.name;
    const message = error.message;
    
    let result = `${icon} ${errorName}: ${message}`;

    // Add property analysis for property access errors
    if (message.includes('Cannot read properties of undefined') || message.includes('Cannot read property')) {
      const propertyMatch = message.match(/reading '([^']+)'/);
      const property = propertyMatch?.[1];
      
      if (property) {
        const location = frames.find(f => f.type === 'app');
        
        result += `\n\n  Attempted to access property on undefined value:`;
        result += `\n  → ${property}`;
        
        if (location?.file && location.line) {
          result += `\n\nLocation:`;
          result += `\n  ${this.shortenPath(location.file)}:${location.line.toString()}`;
        }
      }
    }

    return result;
  }

  private formatCodeFrameSection(
    frames: readonly StackFrame[],
    codeFrames: readonly (CodeFrame | null)[]
  ): string | null {
    // Find the first app frame with a code frame
    for (let i = 0; i < frames.length; i++) {
      const frame = frames[i];
      const codeFrame = codeFrames[i];
      
      if (frame?.type === 'app' && codeFrame && codeFrame.lines.length > 0) {
        return this.formatSingleCodeFrame(codeFrame);
      }
    }
    return null;
  }

  private formatSingleCodeFrame(codeFrame: CodeFrame): string {
    const lines = codeFrame.lines.map(line => {
      const lineNumStr = line.number.toString().padStart(3);
      const prefix = line.isTarget ? '>' : ' ';
      const lineNum = `${lineNumStr} |`;
      
      if (line.isTarget) {
        // Target line with caret
        const content = line.content || '';
        const indent = content.match(/^\s*/)?.[0] || '';
        const caretLine = `${' '.repeat(6)}|${indent}^`;
        
        return [
          `${prefix} ${lineNum} ${content}`,
          caretLine
        ].join('\n');
      }
      
      return `  ${lineNum} ${line.content || ''}`;
    }).join('\n');

    return `Code frame:\n${lines}`;
  }

  private formatCallChain(frames: readonly StackFrame[]): string | null {
    // Extract async app frames only
    const appFrames = frames.filter(frame => 
      frame.type === 'app' && 
      frame.functionName && 
      frame.file
    ).slice(0, 5); // Limit to 5 most relevant

    if (appFrames.length === 0) return null;

    const chainItems = appFrames.map(frame => {
      const func = frame.functionName || '<anonymous>';
      const file = this.shortenPath(frame.file || '');
      const location = frame.line && frame.column ? 
        `${frame.line}:${frame.column}` : 
        frame.line ? `${frame.line}` : '';
      
      return `  at ${func} (${file}:${location})`;
    });

    return `Call chain (async):\n${chainItems.join('\n')}`;
  }

  private formatHiddenFrames(frames: readonly StackFrame[]): string | null {
    // Count hidden frames by type
    const appFrames = frames.filter(f => f.type === 'app');
    const nodeFrames = frames.filter(f => f.type === 'node');
    const depsFrames = frames.filter(f => f.type === 'deps');
    const nativeFrames = frames.filter(f => f.type === 'native');
    
    // Calculate hidden (we show max 5 app frames in call chain)
    const hiddenApp = Math.max(0, appFrames.length - 5);
    const hiddenNode = nodeFrames.length;
    const hiddenDeps = depsFrames.length;
    const hiddenNative = nativeFrames.length;

    const parts: string[] = [];
    
    if (hiddenNode > 0) {
      parts.push(`[${hiddenNode} Node internal frames hidden]`);
    }
    if (hiddenNative > 0) {
      parts.push(`[${hiddenNative} Native frames hidden]`);
    }
    if (hiddenDeps > 0) {
      parts.push(`[${hiddenDeps} Dependency frames hidden]`);
    }
    if (hiddenApp > 0) {
      parts.push(`[${hiddenApp} Additional app frames hidden]`);
    }

    if (parts.length === 0) return null;

    return `Stack (hidden frames):\n  ${parts.join('\n  ')}`;
  }

  private shortenPath(filePath: string): string {
    if (!filePath) return '';

    // Apply project root shortening
    if (this.options.projectRoot) {
      const relative = filePath.replace(this.options.projectRoot, '');
      if (relative !== filePath) {
        // Remove leading slash and return clean relative path
        return relative.replace(/^\/+/, '');
      }
    }

    // Fallback: show relative format
    const parts = filePath.split('/');
    if (parts.length > 3 && filePath.includes('/src/')) {
      const srcIndex = parts.findIndex(p => p === 'src');
      if (srcIndex > 0) {
        return parts.slice(srcIndex).join('/');
      }
    }

    // Last fallback: just filename and parent
    if (parts.length > 2) {
      return parts.slice(-2).join('/');
    }

    return filePath;
  }
}