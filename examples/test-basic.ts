import { TracePretty } from '../src/index';

async function main() {
  const tracePretty1 = new TracePretty({
  });

  const result1 = await tracePretty1.format(`Erreur attrapée : Error: Invalid user ID
    at getUser (/Users/alex/projet/app.ts:2:11)
    at processTicksAndRejections (node:internal/process/task_queues:95:5)
    at getPosts (/Users/alex/projet/app.ts:7:18)
    at printUserPosts (/Users/alex/projet/app.ts:14:19)
    at main (/Users/alex/projet/app.ts:20:9)
    at Object.<anonymous> (/Users/alex/projet/app.ts:24:1)
    at Module._compile (node:internal/modules/cjs/loader:1218:14)
    at Module._extensions..js (node:internal/modules/cjs/loader:1272:10)
    at Module.load (node:internal/modules/cjs/loader:1081:32)
    at Module._load (node:internal/modules/cjs/loader:922:12)
    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:81:12)
    at node:internal/main/run_main_module:23:47`);

    console.log(result1.text)
}

main().catch(console.error);