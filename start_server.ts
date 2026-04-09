/// <reference types="bun" />

Bun.spawn({
  cwd: "./foundry/runtime",
  cmd: ["bun", "run", "./main.js", "--dataPath=../data"],
  stdin: "inherit",
  stdout: "inherit",
});
