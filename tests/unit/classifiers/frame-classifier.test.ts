import { FrameClassifier } from '../../../src/core/classifiers/frame-classifier';
import { RawFrame } from '../../../src/types';

describe('FrameClassifier', () => {
  let classifier: FrameClassifier;

  beforeEach(() => {
    classifier = new FrameClassifier();
  });

  describe('classify', () => {
    it('should classify application frames', () => {
      const frame: RawFrame = {
        functionName: 'myFunction',
        file: 'src/services/user.ts',
        line: 42,
        column: 17
      };

      const result = classifier.classify(frame);
      
      expect(result.type).toBe('app');
      expect(result.functionName).toBe('myFunction');
      expect(result.file).toBe('src/services/user.ts');
      expect(result.line).toBe(42);
      expect(result.column).toBe(17);
    });

    it('should classify dependency frames', () => {
      const frame: RawFrame = {
        functionName: 'someLibFunction',
        file: 'node_modules/express/lib/complex-router.js',
        line: 123,
        column: 45
      };

      const result = classifier.classify(frame);
      
      expect(result.type).toBe('deps');
    });

    it('should classify Node.js internal frames', () => {
      const frame: RawFrame = {
        functionName: 'Module._compile',
        file: 'internal/modules/cjs/loader.js',
        line: 999,
        column: 30
      };

      const result = classifier.classify(frame);
      
      expect(result.type).toBe('node');
    });

    it('should classify native frames', () => {
      const frame: RawFrame = {
        functionName: 'nativeFunction',
        file: '(native)'
      };

      const result = classifier.classify(frame);
      
      expect(result.type).toBe('native');
    });

    it('should classify frames with [native code] pattern', () => {
      const frame: RawFrame = {
        functionName: '[native code]'
      };

      const result = classifier.classify(frame);
      
      expect(result.type).toBe('native');
    });

    it('should handle frames with no file information', () => {
      const frame: RawFrame = {
        functionName: 'anonymousFunction'
      };

      const result = classifier.classify(frame);
      
      expect(result.type).toBe('native');
      expect(result.functionName).toBe('anonymousFunction');
      expect(result.file).toBeUndefined();
    });
  });

  describe('classifyFrames', () => {
    it('should classify multiple frames', () => {
      const frames: RawFrame[] = [
        {
          functionName: 'appFunction',
          file: 'src/app.ts',
          line: 10,
          column: 5
        },
        {
          functionName: 'libFunction',
          file: 'node_modules/lib/complex-library.js',
          line: 20,
          column: 10
        },
        {
          functionName: 'nodeFunction',
          file: 'internal/process.js',
          line: 30,
          column: 15
        }
      ];

      const results = classifier.classifyFrames(frames);
      
      expect(results).toHaveLength(3);
      expect(results[0]?.type).toBe('app');
      expect(results[1]?.type).toBe('deps');
      expect(results[2]?.type).toBe('node');
    });
  });

  describe('with project root', () => {
    beforeEach(() => {
      classifier = new FrameClassifier({}, '/Users/alex/workspace/my-project');
    });

    it('should classify files under project root as app', () => {
      const frame: RawFrame = {
        functionName: 'myFunction',
        file: 'utils/helper.ts',
        line: 10,
        column: 5
      };

      const result = classifier.classify(frame);
      
      expect(result.type).toBe('app');
    });

    it('should classify files outside project root as deps', () => {
      const frame: RawFrame = {
        functionName: 'externalFunction',
        file: '/external/path/some-external-lib.so',
        line: 10,
        column: 5
      };

      const result = classifier.classify(frame);
      
      expect(result.type).toBe('deps');
    });
  });

  describe('updateRules', () => {
    it('should update classification rules', () => {
      const customRules = {
        appPaths: ['custom-src/']
      };

      classifier.updateRules(customRules);

      const frame: RawFrame = {
        functionName: 'customFunction',
        file: 'custom-src/module.ts',
        line: 10,
        column: 5
      };

      const result = classifier.classify(frame);
      
      expect(result.type).toBe('app');
    });
  });
});