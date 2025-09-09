import { TracePretty } from '../src/index';

/**
 * Test script to demonstrate trace-pretty functionality
 */
async function testStackTrace() {
  const tracePretty = new TracePretty();

  // Exemple de stack trace V8 (Node.js/Chrome)
  const v8StackTrace = `Error: Cannot read properties of undefined (reading 'id')
    at getUser (/app/src/services/user.ts:42:17)
    at Object.handleRequest (/app/src/controllers/userController.js:15:23)
    at /app/src/routes/users.ts:18:13
    at async /app/node_modules/express/lib/router/layer.js:46:13
    at node:internal/process/task_queues:95:5`;

  console.log('🔍 Testing V8 Stack Trace Parser...\n');
  console.log('Original stack trace:');
  console.log(v8StackTrace);
  console.log('\n' + '='.repeat(60) + '\n');

  try {
    const result = await tracePretty.parse(v8StackTrace);
    
    console.log('🎯 Parsed Result:');
    console.log(`Engine detected: ${result.engine}`);
    console.log(`Frames found: ${result.frames.length}`);
    console.log(`Warnings: ${result.warnings.length}`);
    
    console.log('\n📋 Frame Details:');
    result.frames.forEach((frame, index) => {
      console.log(`\n${index + 1}. [${frame.type.toUpperCase()}] ${frame.functionName || '<anonymous>'}`);
      if (frame.file) {
        console.log(`   File: ${frame.file}`);
      }
      if (frame.line && frame.column) {
        console.log(`   Position: ${frame.line}:${frame.column}`);
      }
      if (frame.source) {
        console.log(`   Source: ${frame.source}`);
      }
    });

    if (result.warnings.length > 0) {
      console.log('\n⚠️ Warnings:');
      result.warnings.forEach((warning, index) => {
        console.log(`${index + 1}. [${warning.type}] ${warning.message}`);
      });
    }

  } catch (error) {
    console.error('❌ Error parsing stack trace:', error);
  }

  console.log('\n' + '='.repeat(60) + '\n');

  // Test Firefox stack trace
  const firefoxStackTrace = `getUser@/app/src/services/user.ts:42:17
handleRequest@/app/src/controllers/userController.js:15:23
@/app/src/routes/users.ts:18:13`;

  console.log('🦊 Testing Firefox Stack Trace Parser...\n');
  console.log('Original stack trace:');
  console.log(firefoxStackTrace);
  console.log('\n' + '='.repeat(60) + '\n');

  try {
    const result = await tracePretty.parse(firefoxStackTrace);
    
    console.log('🎯 Parsed Result:');
    console.log(`Engine detected: ${result.engine}`);
    console.log(`Frames found: ${result.frames.length}`);
    
    console.log('\n📋 Frame Details:');
    result.frames.forEach((frame, index) => {
      console.log(`\n${index + 1}. [${frame.type.toUpperCase()}] ${frame.functionName || '<anonymous>'}`);
      if (frame.file) {
        console.log(`   File: ${frame.file}`);
      }
      if (frame.line && frame.column) {
        console.log(`   Position: ${frame.line}:${frame.column}`);
      }
    });

  } catch (error) {
    console.error('❌ Error parsing stack trace:', error);
  }
}

// Test edge cases
async function testEdgeCases() {
  const tracePretty = new TracePretty();
  
  console.log('\n🧪 Testing Edge Cases...\n');
  
  // Empty stack trace
  console.log('1. Empty stack trace:');
  const emptyResult = await tracePretty.parse('');
  console.log(`   Frames: ${emptyResult.frames.length}, Warnings: ${emptyResult.warnings.length}`);
  
  // Invalid format
  console.log('\n2. Invalid format:');
  const invalidResult = await tracePretty.parse('This is not a stack trace');
  console.log(`   Frames: ${invalidResult.frames.length}, Warnings: ${invalidResult.warnings.length}`);
  
  // Mixed content
  console.log('\n3. Mixed content with error message:');
  const mixedTrace = `TypeError: Cannot read property 'length' of undefined
    at myFunction (file.js:10:5)
Some other output here
    at anotherFunction (other.js:20:15)`;
  const mixedResult = await tracePretty.parse(mixedTrace);
  console.log(`   Frames: ${mixedResult.frames.length}, Engine: ${mixedResult.engine}`);
}

// Run tests
async function main() {
  console.log('🚀 trace-pretty Test Suite');
  console.log('=' .repeat(60));
  
  await testStackTrace();
  await testEdgeCases();
  
  console.log('\n✅ Tests completed!');
}

main().catch(console.error);