# Persistence and URLs

The URL carries the channel for sharing. `localStorage` carries the visitor's own preferences. All storage access is wrapped in try/catch, and the site works with storage blocked.

| Key / URL              | Value                                              | Written when                                  | Read when                             |
| ---------------------- | -------------------------------------------------- | --------------------------------------------- | ------------------------------------- |
| `#chN`                 | Dial position                                      | Every channel change (`history.replaceState`) | Load, and on `hashchange` (re-tunes)  |
| `rv-ch`                | Last zero-based position                           | Every channel change                          | Load, if no hash                      |
| `rv-tv`                | `on` / `off`                                       | Power toggled                                 | Load: `off` starts in List mode       |
| `rv-hint`              | `1`                                                | Note dismissed                                | Load: suppresses the first-visit note |
| `rv-settings`          | JSON of scan/flicker/fx/snd/glow, volume, captions | Any switch, volume or caption change          | Load                                  |
| `rv-save-<channel id>` | Versioned JSON of game progress                    | By the channel through `save`                 | By the channel through `save`         |

- Precedence on load: hash > `rv-ch` > channel 1.
- Hashes and `rv-ch` refer to physical dial positions, including empty ones. An empty position shows NO SIGNAL; it never redirects to the next built channel. Registry positions run from 1 through the highest configured key; convert the zero-based stored value only at the storage boundary. Validate safe integers and the current range. Invalid hashes fall through to a valid saved position, then TV Guide. Never wrap external input.
- `rv-settings` is new in v1 (the prototype doesn't persist switches yet).
- The host owns the captions preference (default on) in `rv-settings`. Channels receive `captions` and `setCaptions`; the C shortcut and visible controls use the same action. Storage failure leaves the preference working in memory.
- Game saves use the versioned `ChannelSave` helper from `channels/_shared/types.ts`; the host scopes it to the current channel ID.
- No cookies, no analytics identifiers.
