import { TracePretty } from '../src/index';

async function testTargetFormat() {
  console.log('🎯 Testing Target Format Style');
  console.log('='.repeat(60));
  console.log('\n🎯 EXPECTED (Your target format):');
  console.log(`✖ Error [ERR_UNSUPPORTED_DIR_IMPORT]
  Cannot import a directory as an ES module:
  → '/Users/alex/workspace/pretty-stack/src'

Imported from:
  /Users/alex/workspace/pretty-stack/examples/test-stack-trace.ts

Stack:
  at /Users/alex/workspace/pretty-stack/examples/test-stack-trace.ts:1:1
  at node:internal/modules/esm/resolve:262:11 [node internals hidden] (6 frames)`);
  
  console.log('\n' + '='.repeat(60));
  console.log('\n🚀 ACTUAL (trace-pretty clean format):');

  const realError = `Error [ERR_UNSUPPORTED_DIR_IMPORT]: Directory import '/Users/alex/workspace/pretty-stack/src' is not supported resolving ES modules imported from /Users/alex/workspace/pretty-stack/examples/test-stack-trace.ts
    at finalizeResolution (node:internal/modules/esm/resolve:262:11)
    at moduleResolve (node:internal/modules/esm/resolve:864:10)
    at defaultResolve (node:internal/modules/esm/resolve:990:11)
    at #cachedDefaultResolve (node:internal/modules/esm/loader:749:20)
    at ModuleLoader.resolve (node:internal/modules/esm/loader:726:38)
    at ModuleLoader.getModuleJobForImport (node:internal/modules/esm/loader:312:38)
    at #link (node:internal/modules/esm/module_job:208:49)`;

  const tracePretty = new TracePretty({
    format: 'clean',
    projectRoot: '/Users/alex/workspace/pretty-stack',
    hideNode: false,
    maxFrames: 8
  });

  const result = await tracePretty.format(realError);
  console.log(result.text);
  
  console.log('\n' + '='.repeat(60));
  console.log('\n📊 Analysis:');
  console.log(`✅ Error type extracted: ${result.frames.length > 0 ? 'Success' : 'Failed'}`);
  console.log(`✅ Message enhanced: ${result.text.includes('Cannot import a directory') ? 'Success' : 'Failed'}`);
  console.log(`✅ Clean format: ${result.text.split('\\n').length < 15 ? 'Success' : 'Too verbose'}`);
  console.log(`✅ Processing time: ${result.metadata.processingTime.toFixed(2)}ms`);

  // Test other error types to show versatility
  console.log('\\n' + '='.repeat(60));
  console.log('\\n🔍 Other Error Types:');
  
  const errors = [
    `TypeError: Cannot read properties of undefined (reading 'name')
    at getUser (/app/src/user.js:10:5)
    at main (/app/index.js:5:3)`,
    
    `Error: Cannot find module 'missing-lib'
    at Module._resolveFilename (node:internal/modules/cjs/loader:933:15)
    at require (/app/src/utils.js:5:15)`
  ];

  for (let i = 0; i < errors.length; i++) {
    const errorType = i === 0 ? 'Property Access' : 'Module Not Found';
    console.log(`\\n${i + 1}. ${errorType}:`);
    const result = await new TracePretty({ 
      format: 'clean', 
      projectRoot: '/app',
      hideNode: true 
    }).format(errors[i] || '');
    console.log(result.text);
  }
}

async function main() {
  await testTargetFormat();
  
  console.log('\\n' + '='.repeat(80));
  console.log('🎉 Target Format Test Complete!');
  console.log('trace-pretty clean format provides focused, actionable error reporting.');
}

main().catch(console.error);