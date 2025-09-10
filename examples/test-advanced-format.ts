import { TracePretty } from '../src/index';

async function main() {
  const fastTest = new TracePretty({
    projectRoot: '/Users/alex/workspace/app',
    fast: true
  });
  
  const fastResult = await fastTest.format(`Logged Error: Failed to fetch posts for user
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
    at getPostsForUser (/Users/alex/projet/services/post.service.ts:13:15)`);
 console.log(fastResult.text)

 const test = await fastTest.format(`
[LOGGER] message: Controller failed to get posts
AppError: Controller failed to get posts
    at getUserPostsHandler (/Users/alex/projet/src/controllers/post.controller.ts:12:12)
    at Layer.handle [as handle_request] (/Users/alex/projet/node_modules/express/lib/router/layer.js:95:5)
    at next (/Users/alex/projet/node_modules/express/lib/router/route.js:144:13)
    at Route.dispatch (/Users/alex/projet/node_modules/express/lib/router/route.js:114:3)
    at async /Users/alex/projet/src/controllers/post.controller.ts:8:5
Caused by: AppError: Failed to fetch posts AND emitter failed
    at getPostsForUser (/Users/alex/projet/src/services/post.service.ts:35:13)
    at processTicksAndRejections (node:internal/process/task_queues:95:5)
Caused by: Error: Event handler crashed while handling posts:failed
    at EventEmitter.emitter.on (/Users/alex/projet/src/services/post.service.ts:7:11)
    at emit (events.js:198:13)
    at getPostsForUser (/Users/alex/projet/src/services/post.service.ts:29:7)
Caused by: AppError: Timeout fetching posts
    at Timeout._onTimeout (/Users/alex/projet/src/services/post.service.ts:23:23)
    at listOnTimeout (node:internal/timers:573:11)
    at processTimers (node:internal/timers:514:7)
[LOGGER] message: Logger re-emitted AppError
AppError: Logger re-emitted AppError
    at logError (/Users/alex/projet/src/utils/logger.ts:12:11)
    at errorHandler (/Users/alex/projet/src/middlewares/errorHandler.ts:6:5)
    at Layer.handle [as handle_request] (/Users/alex/projet/node_modules/express/lib/router/layer.js:95:5)
    at trim_prefix (/Users/alex/projet/node_modules/express/lib/router/index.js:317:13)
    at /Users/alex/projet/node_modules/express/lib/router/index.js:284:7
Caused by: AppError: Failed in getUserById
    at getUserById (/Users/alex/projet/src/services/user.service.ts:22:13)
    at Promise.all (internal/process/task_queues.js:100:45)
    at getPostsForUser (/Users/alex/projet/src/services/post.service.ts:12:5)
Caused by: Error: External API unreachable
    at Timeout._onTimeout (/Users/alex/projet/src/services/user.service.ts:15:17)
    at listOnTimeout (node:internal/timers:573:11)
    at processTimers (node:internal/timers:514:7)
    at async getUserById (/Users/alex/projet/src/services/user.service.ts:11:9)
    at async Promise.all (index 0)
    at async getPostsForUser (/Users/alex/projet/src/services/post.service.ts:11:5)
    at async getUserPostsHandler (/Users/alex/projet/src/controllers/post.controller.ts:8:9)
    at Layer.handle [as handle_request] (/Users/alex/projet/node_modules/express/lib/router/layer.js:95:5)
    at processTicksAndRejections (node:internal/process/task_queues:95:5)
... 12 more internal frames ...
    `)

    console.log(test.text)
}

main().catch(console.error);