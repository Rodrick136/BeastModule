/// <reference types="bun" />
import { glob, readdir } from "node:fs/promises";
import path from "node:path";
import ModuleJSON from "./src/module.json" with { type: "json" };
import PackageJSON from "./package.json" with { type: "json" };

console.log("Building Foundry Module...");

await Bun.$`bun run vite build`.quiet();

const VERSION = PackageJSON.version;
const output = "./build" as const;

//const output = "./dist" as const;

await Bun.$`rm -rf ${output}/`.quiet();
await Bun.$`mkdir -p ${output}/styles`.quiet();
await Bun.$`mkdir -p ${output}/scripts`.quiet();

await Bun.$`cp ./script-build/*.css ${output}/styles/`.quiet();
await Bun.$`cp ./script-build/*.js ${output}/scripts/`.quiet();
await Bun.$`cp -r ./src/styles/*.css ${output}/styles/`.quiet();
await Bun.$`cp -r ./src/lang ${output}/`.quiet();
await Bun.$`cp -r ./src/assets ${output}/`.quiet();

const SCRIPTS = [];
const STYLES = [];
{
  const vite_files: string[] = []
  for await (const script of glob("./script-build/*")) {
    vite_files.push(script);
  }
  console.log(`Found ${vite_files.length} vite build files`, vite_files);


  for await (const src of glob("./src/scripts/*.ts")) {
    const name = path.basename(src, ".ts");
    const vite_reg = new RegExp(`${name}-.*\.js$`);

    const built_script = vite_files.find((f) => vite_reg.test(f));
    if (built_script) {
      SCRIPTS.push(path.basename(built_script));
    }
  }
  console.log(`Found ${SCRIPTS.length} scripts as top level modules`, SCRIPTS);

  for await (const style of glob(`${output}/styles/*.css`)) {
    STYLES.push(path.basename(style));
  }
  console.log(`Found ${STYLES.length} vite css files`, STYLES);
}



// Copy files to output
{
  const module_json = JSON.parse(JSON.stringify(ModuleJSON)) as typeof ModuleJSON;
  module_json.version = VERSION;
  const version_label = VERSION.replace(/\./g, "_");



  const change_name = async (file: string) => {
    const basename = path.basename(file);
    const file_name = basename.replace(/\..*$/, "");
    const extension = path.extname(file);

    const name = `${file_name}__${version_label}${extension}`;
    const move_to = `${path.dirname(file)}/${name}`;
    console.log("Change Name:", {
      file,
      move_to,
    })
    await Bun.$`mv ${file} ${move_to}`.quiet();

    return name;
  }
  for (let i = 0; i < SCRIPTS.length; i++) {
    const file = SCRIPTS[i];
    const name = await change_name(`${output}/scripts/${file}`);
    SCRIPTS[i] = name;
  }
  for await (const file of glob('./src/styles/*.css')) {
    const og_name = path.basename(file);
    const name = await change_name(`${output}/styles/${og_name}`);
    const index = STYLES.findIndex((s) => s === og_name) as number;
    STYLES[index] = name;
  }

  const esmodules: string[] = [];
  for (const file of SCRIPTS) {
    esmodules.push(`scripts/${file}`);
  }

  const styles: string[] = [];
  for (const file of STYLES) {
    styles.push(`styles/${file}`);
  }

  //throw new Error("Stop here for testing");

  //@ts-expect-error
  module_json.esmodules = esmodules;
  //@ts-expect-error
  module_json.styles = styles;

  module_json.download = module_json.download.replace("VERSION", `v${VERSION}`);

  const module_contents = JSON.stringify(module_json, null, 2);
  await Bun.write(`${output}/module.json`, module_contents);
}

{
  const modules = path.resolve("./foundry/data/Data/modules");
  const beast = path.join(modules, "beast");
  await Bun.$`rm -rf ${beast}`.quiet();

  console.log(`Linking to ${modules}`);
  const build = path.resolve(output);
  await Bun.$`ln -sfn ${build} ${beast}`.quiet();
}
