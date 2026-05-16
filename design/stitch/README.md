# Stitch Design Assets — Echoes

**Project:** Echoes: AI Memory Preservation  
**Project ID:** `2713172289002767391`  
**Fetched:** 2026-05-16

## Screens

| Screen | Folder | Stitch screen ID |
| --- | --- | --- |
| Welcome to Echoes | `welcome/` | `8135c78993e34e50b1461b2cc0dcb5a9` |
| Personas | `personas/` | `ea87795b77f94262a9df2d96ba4faaea` |
| New Persona | `new-persona/` | `fb2ae106ec864818a62cf9f572d4907e` |
| Your Archive (Dark Mode) | `your-archive/` | `3b8a1928851c4a62bae8907c86727953` |
| Conversation with Mom | `conversation-with-mom/` | `852a6d662e3640f7afd64eca4aca0e6e` |
| The Vault | `the-vault/` | `73f1ac252b614978a2c774ecaa01f54f` |
| Settings | `settings/` | `4ffa23fd67cd433db3b0bd4d39bb62e8` |

Each folder contains:

- `screen.html` — Stitch-generated HTML/CSS
- `screenshot.png` — screen preview image
- `metadata.json` — raw API response (includes signed download URLs)

See `manifest.json` for the full index.

## Re-fetch

```bash
STITCH_API_KEY=your-key node scripts/fetch-stitch-screens.mjs
```

Signed URLs in `metadata.json` expire; re-run the script to refresh assets.
