#!/usr/bin/env ts-node

import { TracePretty } from '../src/index';

const complexTrace = `Logged Error: Failed to fetch posts for user
Stack trace: AppError: Failed to fetch posts for user
    at getPostsForUser (/Users/alex/projet/services/post.service.ts:13:15)
    at async main (/Users/alex/projet/app.ts:6:9)
    at Object.<anonymous> (/Users/alex/projet/app.ts:12:1)
    at Module._compile (node:internal/modules/cjs/loader:1218:14)
    at Module._extensions..js (node:internal/modules/cjs/loader:1272:10)
    at Module.load (node:internal/modules/cjs/loader:1081:32)
    at Module._load (node:internal/modules/cjs/loader:922:12)
    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:81:12)
    at node:internal/main/run_main_module:23:47
Caused by: AppError: Failed to get user by ID
    at getUserById (/Users/alex/projet/services/user.service.ts:15:15)
    at async getPostsForUser (/Users/alex/projet/services/post.service.ts:5:20)
Caused by: AppError: Invalid user ID
    at getUserById (/Users/alex/projet/services/user.service.ts:5:15)
    at async getPostsForUser (/Users/alex/projet/services/post.service.ts:5:20)
Logged Error: Error re-emitted by logger
Stack trace: AppError: Error re-emitted by logger
    at logError (/Users/alex/projet/utils/logger.ts:8:11)
    at main (/Users/alex/projet/app.ts:9:9)
    at processTicksAndRejections (node:internal/process/task_queues:95:5)
Caused by: AppError: Failed to fetch posts for user
    at getPostsForUser (/Users/alex/projet/services/post.service.ts:13:15)`;

async function testComplexTrace() {
  console.log('🧪 Testing Complex Chained Error Stack Trace');
  console.log('=' .repeat(60));
  
  const tracePretty = new TracePretty({
    projectRoot: '/Users/alex/projet',
    codeFrame: 2
  });
  
  const result = await tracePretty.format(complexTrace);
  console.log(result.text);
  
  console.log('\n📊 Analysis:');
  console.log(`✅ Processing time: ${result.metadata.processingTime.toFixed(2)}ms`);
  console.log(`✅ Total frames: ${result.frames.length}`);
  console.log(`✅ App frames: ${result.frames.filter(f => f.type === 'app').length}`);
  console.log(`✅ Node frames: ${result.frames.filter(f => f.type === 'node').length}`);
  console.log(`✅ Warnings: ${result.warnings.length}`);
}

testComplexTrace().catch(console.error);