import { TracePretty } from '../src/index';

async function testAdvancedFormat() {
  console.log('🚀 Testing Advanced Format Style');
  console.log('='.repeat(60));

  const realTrace = `Error: Cannot read properties of undefined (reading 'userId')
    at getUser (/Users/alex/workspace/app/src/services/user.ts:42:17)
    at processTicksAndRejections (node:internal/process/task_queues:95:5)
    at async fetchOrder (/Users/alex/workspace/app/src/services/order.ts:27:15)
    at async /Users/alex/workspace/app/src/controllers/orderController.ts:14:20
    at async Layer.handle [as handle_request] (/Users/alex/workspace/app/node_modules/express/lib/router/layer.js:95:5)
    at async next (/Users/alex/workspace/app/node_modules/express/lib/router/route.js:144:13)
    at async Route.dispatch (/Users/alex/workspace/app/node_modules/express/lib/router/route.js:114:3)
    at async /Users/alex/workspace/app/node_modules/express/lib/router/index.js:284:22
    at async Function.process_params (/Users/alex/workspace/app/node_modules/express/lib/router/index.js:346:12)
    at async Immediate.<anonymous> (node:internal/timers:466:21)`;

  console.log('📋 EXPECTED Result:');
  console.log(`✖ TypeError: Cannot read properties of undefined (reading 'userId')

  Attempted to access property on undefined value:
  → userId

Location:
  src/services/user.ts:42

Code frame:
  40 | export async function getUser(id: string) {
  41 |   const row = await db.users.find(id)
> 42 |   return { id: row.userId, name: row.name }
       |                  ^
  43 | }

Call chain (async):
  at getUser (src/services/user.ts:42:17)
  at fetchOrder (src/services/order.ts:27:15)
  at orderController (src/controllers/orderController.ts:14:20)

Stack (hidden frames):
  [5 Node internal frames hidden]
  [3 Native frames hidden]`);

  console.log('\n' + '='.repeat(60));
  console.log('\n📋 ACTUAL Result (Advanced Format):');

  const tracePrettyAdvanced = new TracePretty({
    projectRoot: '/Users/alex/workspace/app',
    codeFrame: 3,
    hideDeps: false,
    hideNode: false
  });

  const result = await tracePrettyAdvanced.format(realTrace);
  console.log(result.text);

  console.log('\n📊 Analysis:');
  console.log(`✅ Processing time: ${result.metadata.processingTime.toFixed(2)}ms`);
  console.log(`✅ Total frames: ${result.frames.length}`);
  console.log(`✅ App frames: ${result.frames.filter(f => f.type === 'app').length}`);
  console.log(`✅ Node frames: ${result.frames.filter(f => f.type === 'node').length}`);
  console.log(`✅ Deps frames: ${result.frames.filter(f => f.type === 'deps').length}`);
  console.log(`✅ Warnings: ${result.warnings.length}`);

  // Test with mock code frame
  console.log('\n' + '='.repeat(60));
  console.log('\n🧪 Test with Mock Code Frame:');

  // Create a simple error with mock content
  try {
    throw new Error("Cannot read properties of undefined (reading 'userId')");
  } catch (error) {
    const mockResult = await tracePrettyAdvanced.format(error as Error);
    console.log(mockResult.text);
  }

  // Test performance
  console.log('\n' + '='.repeat(60));
  console.log('\n⚡ Performance Test:');

  const performanceTest = new TracePretty({
    projectRoot: '/Users/alex/workspace/app',
    codeFrame: 3,
    fast: false
  });
  
  const perfResult = await performanceTest.format(realTrace);
  console.log(`✅ Full processing: ${perfResult.metadata.processingTime.toFixed(2)}ms`);
  
  const fastTest = new TracePretty({
    projectRoot: '/Users/alex/workspace/app',
    fast: true
  });
  
  const fastResult = await fastTest.format(realTrace);
  console.log(`⚡ Fast mode: ${fastResult.metadata.processingTime.toFixed(2)}ms`);
  console.log(`🎯 Speed improvement: ${(perfResult.metadata.processingTime / fastResult.metadata.processingTime).toFixed(1)}x faster`);
}

async function main() {
  await testAdvancedFormat();
  
  console.log('\n' + '='.repeat(80));
  console.log('🎉 Advanced Format Test Complete!');
  console.log('The advanced format provides structured, highly informative error analysis.');
}

main().catch(console.error);