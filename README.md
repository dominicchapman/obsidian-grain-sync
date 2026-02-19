# Grain Sync

An [Obsidian](https://obsidian.md) plugin that pulls [Grain](https://grain.com) meeting recordings into the vault as structured, linked notes. Each recording becomes a markdown file with YAML frontmatter, a full transcript grouped by speaker, and wikilinks to the people involved. Speaker notes are created automatically in a `People/` folder so meetings and contacts stay connected.

## How it works

Run the **Sync recordings** command from the command palette. The plugin fetches every recording from the Grain API within the configured time window, compares it against existing entries, and creates or updates notes as needed. Recordings that haven't changed on Grain's side are skipped entirely.

Each synced note includes:

- **Frontmatter** with date, participants (as `[[wikilinks]]`), the Grain URL, and a unique recording ID for deduplication
- **Transcript** with speaker labels and timestamps, grouped into continuous blocks per speaker
- **Filenames** derived from the recording title and datetime, e.g. `20260219T1430-weekly-standup.md`

When a recording includes participants who spoke during the meeting, the plugin creates stub person notes under `People/` if they don't already exist. These link back to meetings through Obsidian's Dataview or native backlinks.

## Setup

1. Enable community plugins in Obsidian
2. Copy `main.js` and `manifest.json` into `.obsidian/plugins/grain-sync/`)
3. Open **Settings > Grain Sync**
4. Paste Grain personal access token (generate one at **grain.com > Settings > API**)
5. Set how many days back to sync (0 means today only)

## Development

```sh
bun install
bun run dev       # build with watch
bun run test      # run tests
bun run typecheck # type-check without emitting
bun run lint      # lint with oxlint
```

