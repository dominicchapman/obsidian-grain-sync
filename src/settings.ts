import { App, PluginSettingTab, Setting } from "obsidian";
import type GrainSync from "./main";

export interface GrainSyncSettings {
  apiToken: string;
  syncDaysBack: number;
  lastSyncedAt: string | null;
  knownRecordings: Record<string, string>; // grain_id → filename
}

export const DEFAULT_SETTINGS: GrainSyncSettings = {
  apiToken: "",
  syncDaysBack: 0,
  lastSyncedAt: null,
  knownRecordings: {},
};

function formatLastSynced(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export class GrainSyncSettingTab extends PluginSettingTab {
  plugin: GrainSync;

  constructor(app: App, plugin: GrainSync) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    new Setting(containerEl)
      .setName("API token")
      .setDesc(
        "Your Grain personal access token. Generate one at grain.com → Settings → API.",
      )
      .addText((text) => {
        text.inputEl.type = "password";
        text.inputEl.style.width = "300px";
        text
          .setPlaceholder("gra_pat_...")
          .setValue(this.plugin.settings.apiToken)
          .onChange(async (value) => {
            this.plugin.settings.apiToken = value;
            await this.plugin.saveSettings();
          });
      });

    new Setting(containerEl)
      .setName("Initial sync history (days)")
      .setDesc(
        "How many days of recordings to import on your very first sync. 0 means today only. After the first sync, the plugin automatically picks up where it left off.",
      )
      .addText((text) => {
        text.inputEl.type = "number";
        text.inputEl.style.width = "80px";
        text
          .setValue(String(this.plugin.settings.syncDaysBack))
          .onChange(async (value) => {
            const num = parseInt(value, 10);
            if (!isNaN(num) && num >= 0) {
              this.plugin.settings.syncDaysBack = num;
              await this.plugin.saveSettings();
            }
          });
      });

    const lastSynced = this.plugin.settings.lastSyncedAt;
    new Setting(containerEl)
      .setName("Last synced")
      .setDesc(lastSynced ? formatLastSynced(lastSynced) : "Never");
  }
}
