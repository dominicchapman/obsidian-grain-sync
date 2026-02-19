import { Plugin } from "obsidian";

export default class GrainSync extends Plugin {
  async onload() {
    console.debug("[Grain Sync] loaded");
  }

  async onunload() {
    console.debug("[Grain Sync] unloaded");
  }
}
