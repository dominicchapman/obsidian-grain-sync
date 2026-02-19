import { vi } from "vitest";

export const requestUrl = vi.fn();

export function normalizePath(path: string): string {
  return path.replace(/\\/g, "/");
}

export class Notice {
  constructor(_message: string, _timeout?: number) {}
}

export class Plugin {
  app: unknown;
  manifest: unknown;
  addCommand = vi.fn();
  addSettingTab = vi.fn();
  addStatusBarItem = vi.fn(() => ({
    setText: vi.fn(),
    remove: vi.fn(),
  }));
  registerInterval = vi.fn();
  loadData = vi.fn();
  saveData = vi.fn();
}

export class PluginSettingTab {
  app: unknown;
  plugin: unknown;
  containerEl = { empty: vi.fn(), createEl: vi.fn() };
}

export class Setting {
  constructor(_containerEl: unknown) {}
  setName = () => this;
  setDesc = () => this;
  addText = () => this;
  addToggle = () => this;
  setHeading = () => this;
}
