(# Dropbox form fetching & year-based listing — notes from the app
)

Summary
-------
This repo uses a single Dropbox helper (`src/utils/drive.js`) plus local form storage and a lightweight history index (`src/utils/formStorage.js` and `src/utils/formHistory.js`) to list, download and import saved forms. The app groups saved forms by `savedAt` (timestamp recorded in history) and builds a year->months map in the Saved Forms UI (`src/screens/FormSavesScreen.js`).

Key pieces and how they work
--------------------------------
- Auth & tokens: `drive.signInAsync()` performs OAuth (PKCE) and stores `access_token`, `dropbox_refresh_token`, and expiry in `expo-secure-store`. `getAccessToken()` will refresh tokens with `refreshAccessToken()` when expired.
- Listing files: `drive.listFilesInFolder`, `drive.listFilesInFolderPaginated`, `drive.listFilesRecursive`, and `drive.listFilesByDateRange` wrap Dropbox `/2/files/list_folder` (and `/continue`) calls. `listFilesByDateRange` implements server-side paging and filters entries by parsing dates from folder segments (YYYY-MM-DD) or by timestamps embedded in filenames.
- Downloading: `drive.downloadFile()` calls `/2/files/download` and returns parsed JSON (forms stored as JSON payloads). `restoreFilesBatch()` lists entries then calls `downloadFile()` for each selected file.
- Deduping & import: `restoreFilesBatch()` avoids re-importing forms by checking form UUIDs (in filename or payload) against `formHistory`. It then calls `formStorage.importForm()` to write the wrapped payload to local FS and register a history entry (`addFormHistory`).
- Local storage & history: `formStorage.saveForm()` writes form payloads under `FileSystem.documentDirectory + 'forms/<formId>/payload.json'`. `addFormHistory()` keeps a lightweight index at `forms/history.json` used by the Saved Forms screen. History entries include `savedAt`, `meta.filePath`, and optional `payload`.
- UI grouping: `FormSavesScreen` loads `getFormHistory()`, reverses it, then builds `yearMap` by reading `entry.savedAt`. UI shows year chips, tapping a year opens month list built from `yearMap` (same approach you want for desktop).

Important helper functions to reuse or port
-----------------------------------------
- `listFilesByDateRange(options)` — pages and returns files filtered by `year`, `fromDate`, `toDate`. It parses YYYY-MM-DD segments from paths and attempts to derive dates from filename timestamps.
- `restoreFilesBatch(options)` — orchestrates listing → download → import, and de-duplicates by formUUID. Also reports progress via `onProgress` and uses `formStorage.importForm`.
- `computeJsonHash()` and `computeRemoteFileHash()` — useful to dedupe by content hash when filenames/UUIDs are unreliable.
- `getMasterFolderPath()` — resolves whether app backups live under `/Apps/<container>` or a legacy `checklistapp_backups` folder. Useful for locating your app folder in Dropbox.

Desktop porting tips (practical)
-------------------------------
- Authentication
	- Use OAuth PKCE and persist tokens in secure OS storage (Windows Credential Manager / macOS Keychain / Linux keyring). The mobile code uses `expo-secure-store`; on desktop use an appropriate secure store.
	- Ensure you capture and persist a refresh token for long-lived offline sync.

- Listing strategy
	- Prefer server-side listing with `files/list_folder` and `recursive=true` when you need full index; page with `files/list_folder/continue` to avoid large responses.
	- If the backup structure uses date folders (YYYY-MM-DD), list the master backup folder and group by those segments. Otherwise parse filenames for timestamps as `drive.listFilesByDateRange` does.
	- Provide a fast metadata-only listing UI: fetch file metadata first and show years/months grouped by `savedAt` or parsed folder names; download content only when user requests a file.

- Year & month UI
	- Build a `yearMap` from history entries or from remote metadata: group entries by `new Date(savedAt).getFullYear()` or by folder name segment. Show year chips and, on tap, list months (YYYY-MM) for that year.

- Import & dedupe
	- Keep a local history index (same as `forms/history.json`) containing `savedAt`, `title`, `meta` (remote path/id) and optional `payload`.
	- Deduplicate by: (1) formUUID embedded in payload/filename, (2) SHA-256 hash of JSON content (`computeJsonHash`), (3) remote file-id. Use whichever is most reliable for your files.

- Performance & UX
	- Lazy-load file content on demand to avoid large downloads. Show remote metadata (name, date, size) in the list first.
	- Use pagination (list_folder/continue) and a “Load more” button for long history ranges.
	- Allow filtering by year, month, and free-text search (title/location/metadata). `FormSavesScreen` provides a reference implementation for filtering and grouping.

- Robustness
	- Handle token expiry with automatic refresh (refresh token) and fall back to re-auth flow on failure.
	- Respect Dropbox rate limits: add exponential backoff on 429/503 responses.
	- Treat path conflicts as skipped uploads/imports (mobile code checks for conflict strings and skips duplicates).

Implementation pointers (where to look in this repo)
-------------------------------------------------
- Dropbox helper: `src/utils/drive.js` — auth, list, download, upload, pagination, hash helpers.
- Import path: `restoreFilesBatch()` in `drive.js` shows full download→import→history flow and uses `formStorage.importForm()`.
- Local storage and history: `src/utils/formStorage.js` and `src/utils/formHistory.js` — saving, draft vs final save, and the `forms/history.json` index.
- UI example: `src/screens/FormSavesScreen.js` — builds `yearMap` and shows years → months UI plus search and date-range filters.
- Drive UI component: `src/components/DriveFloatingButton.js` (used inline in FormSavesScreen) — shows how the UI triggers sync and refresh.

Quick checklist to implement desktop view by year
------------------------------------------------
1. Implement Dropbox OAuth PKCE and persist tokens securely.
2. Implement a `listFilesByDateRange` equivalent (use `files/list_folder` + `continue`) and detect date folder segments (YYYY-MM-DD) or filenames with timestamps.
3. Build a local history index (small JSON) that stores `savedAt`, `title`, `meta` (remote path/id) and optional `payload`.
4. Populate the UI year list from the history index (map years -> months). Show counts per year/month and lazy-load file list for the chosen month.
5. On demand, `downloadFile` the JSON payload and `import` it (or preview it). Deduplicate using formUUID or content hash.
6. Provide manual refresh / sync button that calls your Dropbox listing and then runs an incremental `restoreFilesBatch` to import new entries.

Short example: how `listFilesByDateRange` decides year
-----------------------------------------------------
- It first looks for a YYYY-MM-DD segment anywhere in the file path (preferred).
- If not found it attempts to parse a timestamp suffix in the filename (e.g. `_1633024800000.json`).
- If the caller supplied `year`, it filters out entries that don't parse to that year.



