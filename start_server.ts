/// <reference types="bun" />

const runtime = Bun.spawn({
  cwd: "./foundry/runtime",
  cmd: ["bun", "run", "./main.js", "--dataPath=../data"],
  stdin: "inherit",
  stdout: "inherit",
});

await runtime.exited;
