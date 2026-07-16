import { defineConfig, type UserConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { readdir } from "node:fs/promises";

// https://vite.dev/config/
export default defineConfig(async ({ command, mode }) => {
  const cwd = process.cwd();
  const scripts = (
    await readdir("./src/scripts", {
      recursive: false,
      withFileTypes: true,
    })
  )
    .filter((item) => item.isDirectory() === false)
    .map((f) => `${f.parentPath}/${f.name}`);
  console.log("Found scripts:", scripts);

  return {
    base: '/modules/beast/scripts/',
    plugins: [vue()],
    resolve: {
      alias: {
        "@": `${cwd}/src`
      }
    },
    build: {
      outDir: 'script-build',
      assetsDir: './',
      minify: false,
      sourcemap: "inline",
      cssCodeSplit: false,
      modulePreload: false,
      rolldownOptions: {
        input: scripts
      }
    }
  } satisfies UserConfig;
})