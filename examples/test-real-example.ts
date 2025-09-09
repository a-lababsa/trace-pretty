import { TracePretty } from '../src/index';

async function testRealExample() {
  console.log('🎯 Testing Your Real Example');
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

  at getUser (src/services/user.ts:42:17)
      40 | export async function getUser(id: string) {
      41 |   const row = await db.users.find(id)
   >  42 |   return { id: row.userId, name: row.name }
         |                  ^
      43 | }

  at fetchOrder (src/services/order.ts:27:15)
  at /src/controllers/orderController.ts:14:20

  [Express internals hidden: 5 frames]
  [Node internals hidden: 2 frames]`);

  console.log('\n' + '='.repeat(60));
  console.log('\n📋 ACTUAL Result (Clean Format):');

  const tracePrettyClean = new TracePretty({
    format: 'clean',
    projectRoot: '/Users/alex/workspace/app',
    codeFrame: 3,
    hideDeps: false,
    hideNode: false,
    maxFrames: 10
  });

  const cleanResult = await tracePrettyClean.format(realTrace);
  console.log(cleanResult.text);

  console.log('\n' + '='.repeat(60));
  console.log('\n📋 ACTUAL Result (Elegant Format):');

  const tracePrettyElegant = new TracePretty({
    format: 'elegant',
    projectRoot: '/Users/alex/workspace/app',
    codeFrame: 3,
    hideDeps: false,
    hideNode: false,
    relativePaths: true,
    maxFrames: 10
  });

  const elegantResult = await tracePrettyElegant.format(realTrace);
  console.log(elegantResult.text);

  // Test with filtering to match expected output
  console.log('\n' + '='.repeat(60));
  console.log('\n📋 ACTUAL Result (Optimized for your format):');

  const tracePrettyOptimized = new TracePretty({
    format: 'elegant',
    projectRoot: '/Users/alex/workspace/app',
    codeFrame: 3,
    hideDeps: true, // Hide Express internals
    hideNode: true, // Hide Node internals  
    relativePaths: true,
    onlyApp: false, // Show app frames primarily
    maxFrames: 6
  });

  const optimizedResult = await tracePrettyOptimized.format(realTrace);
  console.log(optimizedResult.text);

  console.log('\n📊 Comparison Analysis:');
  console.log(`Original frames: ${realTrace.split('\\n').filter(l => l.trim().startsWith('at ')).length}`);
  console.log(`Clean result frames: ${cleanResult.frames.length}`);
  console.log(`Elegant result frames: ${elegantResult.frames.length}`);
  console.log(`Optimized result frames: ${optimizedResult.frames.length}`);
  console.log(`Processing time: ${optimizedResult.metadata.processingTime.toFixed(2)}ms`);
}

async function testWithCodeFrames() {
  console.log('\\n' + '='.repeat(80));
  console.log('\\n🔍 Testing Code Frame Extraction (if files exist)');
  console.log('='.repeat(60));

  // Create mock files for testing
  const mockUserService = `import { db } from '../db';

export async function getUser(id: string) {
  const row = await db.users.find(id)
  return { id: row.userId, name: row.name }
}

export function updateUser(id: string, data: any) {
  // implementation
}`;

  const mockOrderService = `import { getUser } from './user';

export async function fetchOrder(orderId: string) {
  const user = await getUser(orderId); // This line causes the error
  return { orderId, user };
}`;

  console.log('📁 Mock user.ts content:');
  console.log(mockUserService);
  
  console.log('\\n📁 Mock order.ts content:');  
  console.log(mockOrderService);

  console.log('\\n💡 trace-pretty would extract these code frames and show:');
  console.log('   → Line 42 in user.ts with caret pointing to `row.userId`');
  console.log('   → Line 27 in order.ts showing the function call');
  console.log('   → Context lines around each error location');
}

async function main() {
  await testRealExample();
  await testWithCodeFrames();
  
  console.log('\\n' + '='.repeat(80));
  console.log('🎉 Real Example Test Complete!');
  console.log('Your trace-pretty tool transforms messy stack traces into clean, actionable output.');
}

main().catch(console.error);