import { defineConfig, type Plugin } from "vite";
import { readFileSync, copyFileSync, mkdirSync } from "fs";
import { resolve } from "path";
import builtinModules from "builtin-modules";

const manifest = JSON.parse(readFileSync("manifest.json", "utf-8"));

function copyToVault(): Plugin {
  return {
    name: "copy-to-vault",
    closeBundle() {
      if (process.env.NODE_ENV === "production") return;
      const vaultPath = process.env.OBSIDIAN_VAULT_PATH;
      if (!vaultPath) return;
      const dest = resolve(vaultPath, ".obsidian/plugins/grain-sync");
      mkdirSync(dest, { recursive: true });
      copyFileSync("main.js", resolve(dest, "main.js"));
      copyFileSync("manifest.json", resolve(dest, "manifest.json"));
      console.log(`→ Copied to ${dest}`);
    },
  };
}

export default defineConfig({
  build: {
    lib: {
      entry: "src/main.ts",
      formats: ["cjs"],
      fileName: () => "main.js",
    },
    rollupOptions: {
      external: [
        "obsidian",
        "electron",
        "@codemirror/autocomplete",
        "@codemirror/collab",
        "@codemirror/commands",
        "@codemirror/language",
        "@codemirror/lint",
        "@codemirror/search",
        "@codemirror/state",
        "@codemirror/view",
        "@lezer/common",
        "@lezer/highlight",
        "@lezer/lr",
        ...builtinModules,
      ],
    },
    outDir: ".",
    emptyOutDir: false,
    sourcemap: process.env.NODE_ENV !== "production" ? "inline" : false,
    minify: process.env.NODE_ENV === "production",
  },
  plugins: [copyToVault()],
  define: {
    PLUGIN_VERSION: JSON.stringify(manifest.version),
  },
  test: {
    globals: true,
    environment: "node",
    alias: {
      obsidian: new URL("tests/__mocks__/obsidian.ts", import.meta.url).pathname,
    },
  },
});
