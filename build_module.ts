/// <reference types="bun" />
import vuePlugin from "@eckidevs/bun-plugin-vue";
import { readdir } from "node:fs/promises";
import path from "node:path";

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
import ModuleJSON from "./src/module.json" with { type: "json" };
{
  await Bun.$`cp -r ./src/styles ${output}`.quiet();
  await Bun.$`mv ${output}/**/*.css ${output}/styles/`.quiet();

  const { version } = ModuleJSON;
  const module_json = JSON.parse(JSON.stringify(ModuleJSON)) as typeof ModuleJSON;

  const version_label = version.replace(/\./g, "_");
  const output_scripts = (await readdir(output, {
    recursive: true,
    withFileTypes: true,
  })
  ).filter((item) => {
    const isDir = item.isDirectory() === false;
    return isDir && !item.name.endsWith(".json");
  });

  const esmodules: string[] = [];
  const styles: string[] = [];
  for (const script of output_scripts) {
    const part1 = script.name.split(".")[0];
    const part2 = script.name.split(".")[1];

    const name = `${part1}__${version_label}.${part2}`;
    const start = `${script.parentPath}/${script.name}`;
    const end = `${script.parentPath}/${name}`;
    await Bun.$`mv ${start} ${end}`.quiet();

    if (part2 === "js") {
      esmodules.push(`scripts/${name}`);
    } else if (part2 === "css") {
      styles.push(`styles/${name}`);
    }
  }

  //@ts-expect-error
  module_json.esmodules = esmodules;
  //@ts-expect-error
  module_json.styles = styles;

  module_json.download = module_json.download.replace("VERSION", `v${version}`);

  const module_contents = JSON.stringify(module_json, null, 2);
  await Bun.write(`${output}/module.json`, module_contents);

  await Bun.$`cp -r ./src/lang ${output}/`.quiet();
  await Bun.$`cp -r ./src/assets ${output}/`.quiet();
}

{
  const modules = path.resolve("./foundry/data/Data/modules");
  const beast = path.join(modules, "beast");
  await Bun.$`rm -rf ${beast}`.quiet();

  console.log(`Linking to ${modules}`);
  const build = path.resolve(output);
  await Bun.$`ln -sfn ${build} ${beast}`.quiet();
}
