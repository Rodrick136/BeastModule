/// <reference types="bun" />
export { }
console.log("Building release...");

// run build_module.ts
await Bun.$`bun run ./build_module.ts`;

const build = "./build" as const;

// take build and zip it to dist
const dist = "./dist" as const;
await Bun.$`rm -rf ${dist}/`.quiet();
await Bun.$`mkdir -p ${dist}/`.quiet();
await Bun.$`zip -r ${dist}/beast.zip ${build}/*`.quiet();

// copy manifest to dist
await Bun.$`cp ${build}/module.json ${dist}/`.quiet();