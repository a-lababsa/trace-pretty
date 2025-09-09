import { TracePretty } from '../src/index';

async function testCleanFormat() {
  console.log('🧹 Testing Clean Format Style');
  console.log('='.repeat(60));

  // Test 1: The exact error from your example
  const realNodeError = `node:internal/modules/esm/resolve:262
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

  console.log('\n📋 Test 1: ES Module Directory Import Error\n');

  const tracePretty1 = new TracePretty({
    format: 'clean',
    projectRoot: '/Users/alex/workspace/pretty-stack',
    hideNode: false,
    maxFrames: 8
  });

  const result1 = await tracePretty1.format(realNodeError);
  console.log(result1.text);

  // Test 2: Property access error
  console.log('\n' + '='.repeat(60));
  console.log('\n📋 Test 2: Property Access Error\n');

  const propertyError = `TypeError: Cannot read properties of undefined (reading 'id')
    at getUser (/app/src/services/user.ts:42:17)
    at Object.handleRequest (/app/src/controllers/userController.js:15:23)
    at /app/node_modules/express/lib/router/layer.js:46:13
    at node:internal/process/task_queues:95:5`;

  const tracePretty2 = new TracePretty({
    format: 'clean',
    projectRoot: '/app',
    hideDeps: true
  });

  const result2 = await tracePretty2.format(propertyError);
  console.log(result2.text);

  // Test 3: Module not found
  console.log('\n' + '='.repeat(60));
  console.log('\n📋 Test 3: Module Not Found\n');

  const moduleError = `Error: Cannot find module 'missing-package'
    at Function.Module._resolveFilename (node:internal/modules/cjs/loader:985:15)
    at Function.Module._load (node:internal/modules/cjs/loader:833:27)
    at Module.require (node:internal/modules/cjs/loader:1057:19)
    at require (node:internal/modules/cjs/helpers:103:18)
    at Object.<anonymous> (/app/src/index.js:1:15)`;

  const tracePretty3 = new TracePretty({
    format: 'clean',
    projectRoot: '/app'
  });

  const result3 = await tracePretty3.format(moduleError);
  console.log(result3.text);

  // Test 4: Comparison with elegant format
  console.log('\n' + '='.repeat(60));
  console.log('\n🔍 Comparison: Clean vs Elegant\n');

  const testError = `TypeError: Cannot read properties of undefined (reading 'name')
    at getUserName (/app/src/utils/helper.ts:25:12)
    at processUser (/app/src/services/user.ts:18:5)
    at /app/node_modules/lodash/index.js:1234:56
    at /app/node_modules/express/lib/router/layer.js:95:5
    at node:internal/process/task_queues:95:5
    at node:internal/process/task_queues:62:5`;

  // Clean format
  console.log('🧹 CLEAN Format:');
  console.log('-'.repeat(30));
  const cleanResult = await new TracePretty({
    format: 'clean',
    projectRoot: '/app'
  }).format(testError);
  console.log(cleanResult.text);

  // Elegant format  
  console.log('\n🎨 ELEGANT Format:');
  console.log('-'.repeat(30));
  const elegantResult = await new TracePretty({
    format: 'elegant',
    projectRoot: '/app',
    codeFrame: false // Disable for fair comparison
  }).format(testError);
  console.log(elegantResult.text);
}

async function main() {
  await testCleanFormat();
  
  console.log('\n' + '='.repeat(80));
  console.log('✨ Clean Format Test Complete!');
  console.log('The clean format provides focused, actionable error information.');
}

main().catch(console.error);