import fs from "fs";
import path from "path";

interface Frame {
  functionName: string;
  file: string;
  line: number;
  column: number;
  internal: boolean;
  native?: boolean;
}

function parseStack(stack: string): { message: string; frames: Frame[] } {
  const lines = stack.split("\n");
  const message = lines[0] || "Error";
  const frames: Frame[] = [];

  const stackRegex = /^\s*at\s+(.*?)\s+\((.*?):(\d+):(\d+)\)$/;
  const simpleRegex = /^\s*at\s+(.*?):(\d+):(\d+)$/;

  for (const line of lines.slice(1)) {
    let m = line.match(stackRegex);
    if (m) {
      const [_, fn, fileRaw, lineNum, colNum] = m;
      const file = fileRaw || "(unknown)";
      frames.push({
        functionName: fn || "(anonymous)",
        file,
        line: Number(lineNum),
        column: Number(colNum),
        internal: file.startsWith("node:internal"),
      });
      continue;
    }

    m = line.match(simpleRegex);
    if (m) {
      const [_, fileRaw, lineNum, colNum] = m;
      const file = fileRaw || "(unknown)";
      frames.push({
        functionName: "(anonymous)",
        file,
        line: Number(lineNum),
        column: Number(colNum),
        internal: file.startsWith("node:internal"),
      });
    }
  }

  return { message, frames };
}

function formatStack(stack: string): string {
  const { message, frames } = parseStack(stack);

  const firstAppFrame = frames.find(f => !f.internal);
  let codeFrame = "";
  if (firstAppFrame) {
    try {
      const fileContent = fs.readFileSync(firstAppFrame.file, "utf-8").split("\n");
      const start = Math.max(0, firstAppFrame.line - 2);
      const end = Math.min(fileContent.length, firstAppFrame.line + 1);
      codeFrame = fileContent.slice(start, end)
        .map((line, i) => {
          const lineNum = start + i + 1;
          const caret = lineNum === firstAppFrame.line ? "  → " : "    ";
          return `${caret}${lineNum} | ${line}`;
        })
        .join("\n");
    } catch {}
  }

  const appFrames = frames.filter(f => !f.internal);
  const hiddenFrames = frames.filter(f => f.internal || f.native);

  let output = `✖ ${message}\n\n`;
  if (firstAppFrame) {
    output += `Code frame:\n${codeFrame}\n\n`;
  }
  if (appFrames.length) {
    output += "Call chain (async):\n";
    output += appFrames
      .map(f => `  at ${f.functionName} (${f.file}:${f.line}:${f.column})`)
      .join("\n");
    output += "\n\n";
  }
  if (hiddenFrames.length) {
    output += `Stack (hidden frames):\n  [${hiddenFrames.length} Node/internal frames hidden]\n`;
  }

  return output;
}

// ---------------------
// Example usage:

const rawStack = `Error: Cannot read properties of undefined (reading 'userId')
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

console.log(formatStack(rawStack));