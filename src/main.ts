import { Notice, Plugin, normalizePath } from "obsidian";
import {
  type GrainSyncSettings,
  DEFAULT_SETTINGS,
  GrainSyncSettingTab,
} from "./settings";
import { fetchRecordings, fetchRecordingDetail, fetchTranscript } from "./grain";
import { buildNote, buildPersonNote, toFilename } from "./note";

export default class GrainSync extends Plugin {
  settings!: GrainSyncSettings;
  private statusBarEl: HTMLElement | null = null;

  async onload() {
    await this.loadSettings();

    this.addCommand({
      id: "sync-recordings",
      name: "Sync recordings",
      callback: () => this.sync(),
    });

    this.addSettingTab(new GrainSyncSettingTab(this.app, this));
    this.statusBarEl = this.addStatusBarItem();
  }

  onunload() {
    this.statusBarEl = null;
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }

  private setStatus(text: string) {
    this.statusBarEl?.setText(text);
  }

  private async sync() {
    if (!this.settings.apiToken) {
      new Notice("Grain Sync: Set your API token in settings first.");
      return;
    }

    this.setStatus("Grain Sync: Starting...");

    const afterDatetime = computeAfterDatetime(this.settings.syncDaysBack, this.settings.lastSyncedAt);

    let recordings;
    try {
      recordings = await fetchRecordings(this.settings.apiToken, afterDatetime);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Unknown error";
      new Notice(`Grain Sync: ${msg}`);
      this.setStatus("");
      return;
    }

    if (recordings.length === 0) {
      new Notice("Grain Sync: No recordings found.");
      this.setStatus("");
      return;
    }

    let synced = 0;
    const total = recordings.length;
    const peopleToCreate = new Set<string>();
    const today = new Date().toISOString().split("T")[0];

    for (const recording of recordings) {
      this.setStatus(`Grain Sync: ${synced + 1}/${total}`);

      try {
        const existing = this.settings.knownRecordings[recording.id];

        // Skip if we already have it and the remote hasn't changed
        if (existing) {
          const file = this.app.vault.getFileByPath(normalizePath(existing));
          if (file) {
            const cache = this.app.metadataCache.getFileCache(file);
            const localUpdated = cache?.frontmatter?.updated as string | undefined;
            if (localUpdated && recording.updated_at && recording.updated_at <= localUpdated) {
              synced++;
              continue;
            }
          }
        }

        const detail = await fetchRecordingDetail(this.settings.apiToken, recording.id);
        const transcript = await fetchTranscript(this.settings.apiToken, recording.id);
        const content = buildNote(detail, transcript);
        const filename = toFilename(detail.title, detail.start_datetime);
        const path = normalizePath(filename);

        const existingFile = this.app.vault.getFileByPath(path);
        if (existingFile) {
          await this.app.vault.modify(existingFile, content);
        } else {
          await this.app.vault.create(path, content);
        }

        // Collect active speakers for person note creation
        const speakers = new Set(transcript.map((e) => e.speaker));
        for (const p of detail.participants) {
          if (p.name && speakers.has(p.name)) {
            peopleToCreate.add(p.name);
          }
        }

        this.settings.knownRecordings[recording.id] = filename;
        synced++;
      } catch (e) {
        console.error(`[Grain Sync] Failed to sync recording ${recording.id}:`, e);
      }
    }

    // Create stub person notes for speakers who don't have one yet
    if (peopleToCreate.size > 0) {
      const peopleDir = normalizePath("People");
      if (!this.app.vault.getFolderByPath(peopleDir)) {
        await this.app.vault.createFolder(peopleDir);
      }
      for (const name of peopleToCreate) {
        const personPath = normalizePath(`People/${name}.md`);
        if (!this.app.vault.getFileByPath(personPath)) {
          try {
            await this.app.vault.create(personPath, buildPersonNote(name, today));
          } catch (e) {
            console.error(`[Grain Sync] Failed to create person note for ${name}:`, e);
          }
        }
      }
    }

    this.settings.lastSyncedAt = new Date().toISOString();
    await this.saveSettings();
    new Notice(`Grain Sync: Synced ${synced} recording${synced === 1 ? "" : "s"}.`);
    this.setStatus("");
  }
}

function computeAfterDatetime(daysBack: number, lastSyncedAt: string | null): string {
  const daysBackDate = new Date();
  daysBackDate.setHours(0, 0, 0, 0);
  if (daysBack > 0) {
    daysBackDate.setDate(daysBackDate.getDate() - daysBack);
  }

  if (!lastSyncedAt) return daysBackDate.toISOString();

  const lastSync = new Date(lastSyncedAt);
  return lastSync < daysBackDate ? lastSync.toISOString() : daysBackDate.toISOString();
}
