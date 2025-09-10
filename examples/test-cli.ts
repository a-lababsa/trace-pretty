#!/usr/bin/env ts-node

/**
 * Test script to simulate an error and pipe it to trace-pretty CLI
 */

const errorTrace = `Error: Failed to fetch user data
    at getUserById (/Users/alex/app/src/services/user.service.ts:25:15)
    at async getUserProfile (/Users/alex/app/src/controllers/user.controller.ts:12:20)
    at async /Users/alex/app/src/routes/user.routes.ts:8:5
    at Layer.handle [as handle_request] (/Users/alex/app/node_modules/express/lib/router/layer.js:95:5)
    at next (/Users/alex/app/node_modules/express/lib/router/route.js:144:13)
    at Route.dispatch (/Users/alex/app/node_modules/express/lib/router/route.js:114:3)
    at Layer.handle [as handle_request] (/Users/alex/app/node_modules/express/lib/router/layer.js:95:5)
    at /Users/alex/app/node_modules/express/lib/router/index.js:284:7
    at Function.process_params (/Users/alex/app/node_modules/express/lib/router/index.js:346:12)
    at next (/Users/alex/app/node_modules/express/lib/router/index.js:280:10)
    at expressInit (/Users/alex/app/node_modules/express/lib/middleware/init.js:40:5)
    at Layer.handle [as handle_request] (/Users/alex/app/node_modules/express/lib/router/layer.js:95:5)`;

// Simulate piping to trace-pretty CLI
console.error(errorTrace);
process.exit(1);