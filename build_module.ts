/// <reference types="bun" />
import vuePlugin from "@eckidevs/bun-plugin-vue";
import { readdir } from "node:fs/promises";

console.log("Building Foundry Module...");

const output = "./build" as const;

//const output = "./dist" as const;

await Bun.$`rm -rf ${output}/`.quiet();

const scripts = (
  await readdir("./src/scripts", {
    recursive: false,
    withFileTypes: true,
  })
)
  .filter((item) => item.isDirectory() === false)
  .map((f) => `${f.parentPath}/${f.name}`);

await Bun.build({
  entrypoints: scripts,
  root: "./src",
  outdir: output,
  minify: false,
  splitting: true,
  plugins: [
    vuePlugin({
      prodDevTools: false,
    }),
  ],
});

// Copy files to output
await Bun.$`cp ./src/module.json ${output}/`.quiet();
await Bun.$`cp -r ./src/lang ${output}/`.quiet();

await Bun.$`mkdir -p ${output}/styles/`.quiet();
await Bun.$`mv ${output}/**/*.css ${output}/styles/`.quiet();

const foundry = "./foundry/data/Data/modules/beast" as const;
await Bun.$`rm -rf ${foundry}`.quiet();
await Bun.$`mkdir -p ${foundry}`.quiet();

await Bun.$`cp -r ${output}/* ${foundry}/`.quiet();
