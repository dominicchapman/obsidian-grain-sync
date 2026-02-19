import { defineConfig } from "vite";
import { readFileSync } from "fs";
import builtinModules from "builtin-modules";

const manifest = JSON.parse(readFileSync("manifest.json", "utf-8"));

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
  define: {
    PLUGIN_VERSION: JSON.stringify(manifest.version),
  },
  test: {
    globals: true,
    environment: "node",
  },
});
