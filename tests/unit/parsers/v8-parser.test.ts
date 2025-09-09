import { V8Parser } from '@/core/parsers/v8-parser';

describe('V8Parser', () => {
  let parser: V8Parser;

  beforeEach(() => {
    parser = new V8Parser();
  });

  describe('supports', () => {
    it('should support V8 stack traces', () => {
      const v8Trace = `Error: Test error
    at functionName (/path/to/file.js:10:5)
    at Object.method (/another/file.js:20:10)`;
      
      expect(parser.supports(v8Trace)).toBe(true);
    });

    it('should support async V8 stack traces', () => {
      const asyncTrace = `Error: Async error
    at async functionName (/path/to/file.js:10:5)
    at /another/file.js:20:10`;
      
      expect(parser.supports(asyncTrace)).toBe(true);
    });

    it('should support native V8 stack traces', () => {
      const nativeTrace = `Error: Native error
    at functionName (native)
    at /path/to/file.js:10:5`;
      
      expect(parser.supports(nativeTrace)).toBe(true);
    });

    it('should not support Firefox traces', () => {
      const firefoxTrace = `functionName@/path/to/file.js:10:5
anotherFunction@/another/file.js:20:10`;
      
      expect(parser.supports(firefoxTrace)).toBe(false);
    });
  });

  describe('parse', () => {
    it('should parse basic V8 stack trace', () => {
      const trace = `    at functionName (/path/to/file.js:10:5)
    at Object.method (/another/file.js:20:10)`;

      const result = parser.parse(trace);
      
      expect(result.result).toHaveLength(2);
      expect(result.result[0]).toEqual({
        functionName: 'functionName',
        file: '/path/to/file.js',
        line: 10,
        column: 5,
        source: 'at functionName (/path/to/file.js:10:5)'
      });
      expect(result.result[1]).toEqual({
        functionName: 'Object.method',
        file: '/another/file.js',
        line: 20,
        column: 10,
        source: 'at Object.method (/another/file.js:20:10)'
      });
    });

    it('should parse async frames', () => {
      const trace = `    at async functionName (/path/to/file.js:10:5)`;

      const result = parser.parse(trace);
      
      expect(result.result).toHaveLength(1);
      expect(result.result[0]).toEqual({
        functionName: 'async functionName',
        file: '/path/to/file.js',
        line: 10,
        column: 5,
        source: 'at async functionName (/path/to/file.js:10:5)'
      });
    });

    it('should parse native frames', () => {
      const trace = `    at functionName (native)`;

      const result = parser.parse(trace);
      
      expect(result.result).toHaveLength(1);
      expect(result.result[0]).toEqual({
        functionName: 'functionName',
        source: 'at functionName (native)'
      });
    });

    it('should handle anonymous functions', () => {
      const trace = `    at /path/to/file.js:10:5`;

      const result = parser.parse(trace);
      
      expect(result.result).toHaveLength(1);
      expect(result.result[0]).toEqual({
        functionName: undefined,
        file: '/path/to/file.js',
        line: 10,
        column: 5,
        source: 'at /path/to/file.js:10:5'
      });
    });

    it('should skip non-stack lines', () => {
      const trace = `Error: Test error
    at functionName (/path/to/file.js:10:5)
Some other output
    at anotherFunction (/another/file.js:20:10)`;

      const result = parser.parse(trace);
      
      expect(result.result).toHaveLength(2);
      expect(result.result[0]?.functionName).toBe('functionName');
      expect(result.result[1]?.functionName).toBe('anotherFunction');
    });
  });
});