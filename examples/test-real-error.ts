import { TracePretty } from '../src/index';

async function testRealNodeError() {
  const tracePretty = new TracePretty();

  // Stack trace réelle de votre erreur Node.js
  const realNodeTrace = `node:internal/modules/esm/resolve:262
    throw new ERR_UNSUPPORTED_DIR_IMPORT(path, basePath, String(resolved));
          ^

Error [ERR_UNSUPPORTED_DIR_IMPORT]: Directory import '/Users/alex/workspace/pretty-stack/src' is not supported resolving ES modules imported from /Users/alex/workspace/pretty-stack/examples/test-stack-trace.ts
    at finalizeResolution (node:internal/modules/esm/resolve:262:11)
    at moduleResolve (node:internal/modules/esm/resolve:864:10)
    at defaultResolve (node:internal/modules/esm/resolve:990:11)
    at #cachedDefaultResolve (node:internal/modules/esm/loader:749:20)
    at ModuleLoader.resolve (node:internal/modules/esm/loader:726:38)
    at ModuleLoader.getModuleJobForImport (node:internal/modules/esm/loader:312:38)
    at #link (node:internal/modules/esm/module_job:208:49)`;

  console.log('🔴 Testing Real Node.js Error Stack Trace');
  console.log('=' .repeat(70));
  console.log('\n📋 Original Error:');
  console.log(realNodeTrace);
  console.log('\n' + '='.repeat(70));

  try {
    const result = await tracePretty.parse(realNodeTrace);
    
    console.log('\n🎯 Parsed Analysis:');
    console.log(`🔧 Engine detected: ${result.engine || 'unknown'}`);
    console.log(`📊 Total frames: ${result.frames.length}`);
    console.log(`⚠️  Warnings: ${result.warnings.length}`);
    
    console.log('\n🗂️ Stack Frame Breakdown:');
    console.log('-'.repeat(50));
    
    result.frames.forEach((frame, index) => {
      const typeIcon = {
        'app': '🟢',
        'deps': '🟡', 
        'node': '🔵',
        'native': '⚪'
      }[frame.type] || '❓';
      
      console.log(`\n${index + 1}. ${typeIcon} [${frame.type.toUpperCase()}] ${frame.functionName || '<anonymous>'}`);
      
      if (frame.file) {
        // Highlight the specific file path from your error
        const isYourFile = frame.file.includes('pretty-stack');
        const filePrefix = isYourFile ? '👤 Your code: ' : '🏗️  System: ';
        console.log(`   ${filePrefix}${frame.file}`);
      }
      
      if (frame.line && frame.column) {
        console.log(`   📍 Position: line ${frame.line}, column ${frame.column}`);
      }
      
      if (frame.source) {
        console.log(`   📝 Source: ${frame.source.trim()}`);
      }
      
      // Special analysis for Node internal frames
      if (frame.type === 'node') {
        console.log(`   ℹ️  Node.js internal - usually not your bug`);
      } else if (frame.type === 'app') {
        console.log(`   🎯 Your application code - check this!`);
      }
    });

    // Error analysis
    console.log('\n' + '='.repeat(70));
    console.log('🕵️ Error Analysis:');
    
    const appFrames = result.frames.filter(f => f.type === 'app');
    const nodeFrames = result.frames.filter(f => f.type === 'node');
    
    console.log(`\n📊 Frame Distribution:`);
    console.log(`   🟢 Application frames: ${appFrames.length}`);
    console.log(`   🔵 Node.js internal: ${nodeFrames.length}`);
    
    if (appFrames.length > 0) {
      console.log(`\n🎯 Root cause likely in:`);
      appFrames.forEach((frame, i) => {
        console.log(`   ${i + 1}. ${frame.file} at ${frame.line}:${frame.column}`);
      });
    }
    
    console.log(`\n💡 Error Summary:`);
    console.log(`   • Type: ES Module Import Error`);
    console.log(`   • Issue: Directory import not supported`);
    console.log(`   • File: ${appFrames[0]?.file || 'unknown'}`);
    console.log(`   • Fix: Import specific file, not directory`);

    if (result.warnings.length > 0) {
      console.log('\n⚠️ Parser Warnings:');
      result.warnings.forEach((warning, i) => {
        console.log(`   ${i + 1}. [${warning.type}] ${warning.message}`);
      });
    }

  } catch (error) {
    console.error('❌ Failed to parse stack trace:', error);
  }
  
  console.log('\n' + '='.repeat(70));
  console.log('✅ Analysis Complete!');
}

// Test additional Node.js patterns
async function testMoreNodePatterns() {
  const tracePretty = new TracePretty();
  
  console.log('\n🧪 Testing Additional Node.js Error Patterns...\n');
  
  // Async/await error
  const asyncError = `Error: Async operation failed
    at async getData (/app/src/service.js:45:15)
    at async processRequest (/app/src/controller.js:20:12)
    at async /app/src/routes.js:18:5`;
  
  console.log('1️⃣ Async/Await Error:');
  const asyncResult = await tracePretty.parse(asyncError);
  console.log(`   Frames: ${asyncResult.frames.length}, Engine: ${asyncResult.engine}`);
  asyncResult.frames.forEach((frame, i) => {
    console.log(`   ${i + 1}. [${frame.type}] ${frame.functionName || 'anonymous'} @ ${frame.file}`);
  });
  
  // Module loading error  
  const moduleError = `Error: Cannot find module 'missing-package'
    at Function.Module._resolveFilename (node:internal/modules/cjs/loader:985:15)
    at Function.Module._load (node:internal/modules/cjs/loader:833:27)
    at Module.require (node:internal/modules/cjs/loader:1057:19)
    at require (node:internal/modules/cjs/helpers:103:18)
    at Object.<anonymous> (/app/index.js:1:15)`;
  
  console.log('\n2️⃣ Module Loading Error:');
  const moduleResult = await tracePretty.parse(moduleError);
  console.log(`   Frames: ${moduleResult.frames.length}, Node frames: ${moduleResult.frames.filter(f => f.type === 'node').length}`);
}

async function main() {
  await testRealNodeError();
  await testMoreNodePatterns();
}

main().catch(console.error);