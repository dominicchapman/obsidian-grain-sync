import { readFileSync, copyFileSync, existsSync } from "fs";
import { join } from "path";
import { homedir, platform } from "os";

const PLUGIN_NAME = "grain-sync";

function obsidianConfigDir() {
  const home = homedir();
  switch (platform()) {
    case "darwin":
      return join(home, "Library", "Application Support", "obsidian");
    case "win32":
      return join(process.env.APPDATA ?? join(home, "AppData", "Roaming"), "obsidian");
    default:
      return join(home, ".config", "obsidian");
  }
}

function findPluginDirs() {
  const configPath = join(obsidianConfigDir(), "obsidian.json");
  if (!existsSync(configPath)) {
    throw new Error(`Obsidian config not found at ${configPath}`);
  }

  const config = JSON.parse(readFileSync(configPath, "utf-8"));
  const dirs = [];

  for (const vault of Object.values(config.vaults)) {
    const pluginDir = join(vault.path, ".obsidian", "plugins", PLUGIN_NAME);
    if (existsSync(pluginDir)) {
      dirs.push(pluginDir);
    }
  }

  return dirs;
}

const source = join(import.meta.dirname, "..", "main.js");
if (!existsSync(source)) {
  console.error("main.js not found — run `npm run build` first.");
  process.exit(1);
}

const dirs = findPluginDirs();
if (dirs.length === 0) {
  console.error(`No Obsidian vaults found with ${PLUGIN_NAME} plugin installed.`);
  process.exit(1);
}

for (const dir of dirs) {
  const dest = join(dir, "main.js");
  copyFileSync(source, dest);
  console.log(`Copied to ${dest}`);
}
