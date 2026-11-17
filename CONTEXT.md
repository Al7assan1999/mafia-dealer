# Handoff: Mafia Dealer (read this first)

You are continuing work on **Mafia Dealer**, an Android app for the Mafia party game, built for Alhassan and his friends. This file carries over everything from the previous chat. The code is in this folder; the README explains the build and tests.

## Who and how
- Owner: Alhassan (software engineer). Plays with friends: Dareer, Halawy, Farouq, Sami, Hokan, Fater, Khaddour.
- He tests every build on real Android phones and reports back. He wants a short plan and approval **before** big changes, then wants the work done end to end.
- Wants realistic, practical answers; not looking for reassurance.
- All narration and sounds must be **English only**. The UI is English and Arabic (toggle).
- Deliver each build as `MafiaDealer.apk` and say what changed and how to test it.

## Current state: v2.13 (versionCode 32), published on the relay 2026-11-17 (relay version 9c882d0b)
Alhassan's list (plan approved):
- "X let you in" is its own message: the relay marks the invite that answers an Ask to join (`invites.ans`); the asker sees "Dareer let you in" (banner / bell / Telegram text) and joins by itself, even after restarting the app (no longer depends on `jrAsked`). The host sees "Sami can join now". Fixed on the way: Let in also deleted the request at the same moment as sending the invite, so the relay sometimes no longer saw the request and sent a plain invite (the asker then did not join); Let in now leaves the request for the relay to remove.
- A friend already in my room shows "In your room" instead of Invite (host and players, `roomUids`).
- While the friends drawer, the bell or the chat is open the screen behind does not scroll (`html.lock`, `scrollLock()`).
- Updating: the in-app install now uses ACTION_INSTALL_PACKAGE with EXTRA_RETURN_RESULT, so Android's installer should skip its last "App installed: Done / Open" page (the app restarts by itself). This only takes effect from the update AFTER v2.13 (the installed app version starts the install), and some brands' own installers (Xiaomi) may still show it. After an update the app shows "Updated to vX" once (`S.lastVer`). Not seen on a real phone yet.
- Tests: new `test_v213_app.js` (13, local relay); `relay/test_accounts.mjs` now 75; `test_social_app.js` and `test_chat_wifi.js` waits hardened.

## Previous: v2.12 (versionCode 31), published on the relay 2026-11-17 (relay version aa11b100)
Alhassan's list (plan approved; his choices: minimize "Lobby only", return "Bar at the top", bell history "On this phone"):
- Minimize a room (lobby only, host and players): a Minimize button in the lobby header (`roomMin`) goes Home while the room keeps running. On every menu screen a bar at the top (`#rbar`, `rbarDraw`) says "Your room · N players" / "In X's room" and goes back (`roomBack`); the chat button stays. Minimized players are pulled back when roles are dealt (with buzzFx) or when the room ends for them (kicked, closed...). Starting an Offline game, hosting or joining another room while minimized asks "Leave this room?" first (`leaveFirst`). `roomMinned()` counts only a live room (host, or a player whose status is ok/lost/joining/search). During a game nothing changes.
- The invite / Ask-to-join banner comes from the top, just under the header row (and under the room bar), so Back, profile and bell stay tappable.
- Bell history (`S.nlog`, 24 h on this phone): invites, join requests, friend requests and "accepted" notes stay after being handled, read-only with their result (Joined, Let in, Accepted, Declined, Dismissed, Expired after 30 min, No longer available). "Accepted" notes are taken off the relay when they reach the phone. A request still waiting stays past 24 h. The count is only what still needs an answer plus new notes. Clear removes the handled items and the notes.
- Tests: new `test_room212.js` (17, Wi-Fi mock); `test_notify_app.js` now 26.

## Previous: v2.11 (versionCode 30), published on the relay 2026-11-17 (relay version d0131aa9)
Open question for Alhassan (decide later): Let in currently sends a normal invite back (the asker auto-joins if their app still remembers asking); option: make it its own "X let you in" message.
Alhassan's list of 2026-11-17 (plan approved; his choices: Friends "Tabs + status pills", bell "Banner + bell", accepted notes kept 7 days, Telegram "App link + fallback page"):
- Fixed: the tutorial was see-through in Noir. Noir's `--bgfx` ends with a colour, so `background:var(--bgfx),var(--bg)` was invalid (a colour may only be the last layer) and dropped; Noir now uses `var(--bgfx)` alone.
- Fixed: Rules presets (Classic / Beginner / Custom) stay at the top while scrolling (sticky).
- Fixed: Home scrolled on phones shorter than ~815 px (content ~723 px + the 92 px bottom padding other screens need). `body.home` drops that padding and the hero is tighter under 780 px; no scroll down to 360x700.
- Role counts: + / - are disabled at the limits (`deckOk`), the Mafia row says "Max {m} Mafia for {n} players"; removing players pulls the counts back inside the limits, so "Too many special roles" / "Mafia must be at least 2 fewer" no longer show at the bottom (Need 4 players and same names still do).
- Invite / Ask to join again: "Invited"/"Asked" for 5 s, then "Invite again"/"Ask again". The relay ignores a repeat within 5 s and otherwise replaces the old invite or request with a new one (new banner; Telegram again if the app is closed). 30 per hour still.
- Friends screen: my card (@username, Share my username), the add box, tabs Friends / Requests / Sent with counts, friends grouped Online / Offline with a status ring and pill (green online, amber in a room, red in a game) and the main action (Invite in an online lobby, Ask to join for a friend in one). The drawer uses the same rows and groups.
- Bell (Home, next to the profile): invites (Join / x), join requests (Let in / x), friend requests (Accept / Decline) and "X accepted your friend request" (relay `notes` table, 7 days, `/acc/note/done`; inbox returns `nt`). The count = invites + join requests + friend requests + notes newer than the last time the bell was opened (`S.bellSeen`). The pop-up banner stays.
- Telegram invite: the message carries `https://<relay>/j/<code>` instead of the code. The APK now has a verified app link for that path (`autoVerify`, `launchMode singleTask`), `MainActivity` keeps the link (`Net.L`, read once by `Net.link()`) and `onNewIntent` calls `deepLink()`; the page joins the room (asking first when in a room or game). The relay serves `/.well-known/assetlinks.json` (package + the signing key's SHA-256) and, for phones without the app or with an old one, a page at `/j/<code>` with Open the app (intent:// with the APK as fallback), Download, and the code. **Not tried on a real phone yet**: Android must verify the link (needs the new relay live before the APK is installed, or it re-verifies later), and Telegram may open the page first, where "Open Mafia Dealer" opens the app.
- Tests: new `test_ui211.js` (24, no relay), `test_notify_app.js` (20, local relay); `relay/test_accounts.mjs` now 73; `test_friends_app.js` / `test_social_app.js` follow the new screens.

## Previous: v2.10.1 (versionCode 29), published on the relay 2026-11-17
Alhassan's notes after trying v2.10:
- Chat: the keyboard closed on every send (tapping Send took the focus; Send now keeps it in the box), a long chat could not be scrolled back and reopened at the start. Likely cause (not reproduced on a desktop browser): the messages were redrawn on every screen update (room changes, game ticks) and pulled back to the newest whenever you were near it, so on a phone you could never scroll away. Now they are redrawn only when they change, the view follows new messages only when you are at the newest, and it goes to the newest on opening, after layout, when sending and when the keyboard opens or closes (resize). The box and bubbles use dir=auto (Arabic types right to left). Up to 100 messages per player.
- Online screen, his choice: Host online on its own row first, then "Or join a friend's room" with the code box and Join on one row. The box keeps digits only (a pasted "482 913" becomes 482913), Join is enabled at exactly 6 digits, and `joinOnline` refuses anything that is not exactly 6 digits after dropping spaces.
- Tests: `test_chat_wifi.js` now 33, new `test_online_ui.js` (14, no relay). Desktop Chromium could not reproduce the phone scroll problem, so it needs a check on a real phone.

## Previous: v2.10 (versionCode 28), published on the relay 2026-11-17 (relay version 0f039169)
Alhassan's list of 2026-11-17 (he approved the plan; more requests are coming):
- Fixed: profile > friends drawer > another profile > Back looped on the profile (`profRet` was set to 'profile'); `openAcct`/`openProfile` keep the first return screen.
- Ask to join (the other way round from an invite), his choice "friend lets you in": in the drawer, a friend in an **online lobby** (users.op, sent by the inbox check; not a Wi-Fi room, not a game) has "Ask to join". The friend gets a banner "X wants to join your room" with Let in; Let in sends a normal invite and the asker's app joins by itself (`jrAsked`, inbox checked every 3 s for 2 min). Relay: `invites.kind` 'i' invite / 'j' join request, `/acc/joinreq` (friend, online lobby, one at a time, shares the 30/hour limit), an invite back deletes the request; inbox returns `jr` and `sg` (friends' status digest, so the list reloads when someone enters a room). No Telegram for join requests.
- Room chat (`app/src/chat.ts`), his choices: 1:1 **and** an Everyone chat, in the lobby and during the game, out players reach only out players (their 1:1s to players still in are refused, their Everyone messages only out players see; checked by the host). Nothing is saved anywhere: host memory only (not in the resume snapshot), Wi-Fi rides in the player's state on the host phone, online goes as a live relay message `{t:'to'}` → `{c}` that the relay never stores (player chat is not queued when the host is away; the phone resends for 60 s). Players are addressed by chat handles (`cn`), never by their private ids. 200 characters, 8 per 10 s, last 50 per player. Old (<28) phones are left out of the list. Chat button under the friends tab with an unread count; + Add next to non-friends in the chat list.
- + Add in a game's history (host only, his choice "Game history only") for seats that had an account.
- The friends tab and chat button form one side column that drags up/down (`S.ftabY`); a tap right after a drag is ignored.
- Top icons: profile on the left (right in Arabic), round and bigger, tap = menu Show profile / Sign out (signed out: straight to sign-in); language = the current language's flag emoji (UK / Saudi; desktop Chromium shows "GB"/"SA" letters, Android shows flags); theme = a palette icon.
- Home: the second button is just "Wi-Fi / Hotspot" («واي فاي / نقطة اتصال»); share texts say "Wi-Fi / Hotspot > Join". The Telegram invite text says "tap Online" (was Play Together).
- Tests: new `tests/multiplayer/test_chat_wifi.js` (21, mock server) and `test_social_app.js` (21, local relay); `relay/test_accounts.mjs` now 63.
- Released with the relay (Ask to join and online chat need it). Right after a deploy the plain APK link can serve the old file for a few seconds (edge cache); a cache-busted URL shows the new one.

## Previous: v2.9.2 (versionCode 27), published on the relay 2026-11-16
- Home: "Offline game" (was New game), "Local Network (Wi-Fi/Hotspot)" (was Play Together > Same room) and "Online" are the three main buttons; the Play Together screen is gone, its name box moved to Local Network. Share texts and the sign-in note use the new names.
- Friends tab moved to the top of the screen edge (under the corner buttons) so it no longer covers the first Home button.

## Previous: v2.9.1 (versionCode 26), published 2026-11-16
- Friends drawer (Alhassan's choice, like MLBB/PUBG): a tab on the screen edge (right; left in Arabic) with online friends' avatars, count and a red dot for requests; it slides out over menus and room lobbies (never during a game, never signed out). Requests, friends online first, Invite buttons in an online lobby; + opens the Friends screen; Back, the dim area, › or a swipe minimize it; `S.fpanel` remembers it. Replaces the Home "Friends" button and the invite sheet. Opening edge swipes are left to Android's Back gesture.
- Fixed: the update download sheet was rebuilt every 64 KB and replayed its fade-in (flicker); the Friends screen redraws only its lists, so a username being typed is kept. Phones on 2.9 still see the flicker once, while updating to 2.9.1 (the old version's code runs the download).
- Tests: `test_friends_app.js` 30 checks, `test_inapp.js` checks the progress sheet is built once.

## Previous: v2.9 (versionCode 25), published 2026-11-16
**Friends (2026-11-16)**, Alhassan's decisions: request + accept (only mutual friends can invite); an invite reaches the friend as an in-app banner and, when their app is closed and Telegram is linked, a bot message; anyone in an online room can invite; friends see Online / In a room / In a game, with a "Show me as online" switch in Settings.
- Relay `Accounts`: tables `friends(a,b,state 'req'|'ok')`, `invites` (30 min, one per friend per room, 30 per hour), users `seen/st/hide` (online = inbox check in the last 2 min). Endpoints `/acc/inbox` (every 10 s while the app is open), `/acc/friends`, `/acc/user/<id>`, `/acc/friend/request|accept|decline|remove`, `/acc/invite`, `/acc/invite/done`. Account delete removes friendships and invites.
- App `app/src/friends.ts`: Friends screen (Home, signed in), invite sheet in online lobbies, "+ Add" next to signed-in players in a room, account card + Add/Accept/Remove on profiles, invite banner `#inv` (outside `#app`).
- Not done: real push (needs Firebase, comes with Capacitor), opening the app from the Telegram message, joining a friend's room without an invite.
- Tests: `relay/test_accounts.mjs` (now 54 checks), `tests/multiplayer/test_friends_app.js` (local wrangler dev).

## Previous: v2.8 (versionCode 24)
v2.8 = fixes from the 7-hour game night (first batch, online mode):
- **Critical:** players were skipped at night from the second game on. The phone keyed its sent night choice by night number only, so after Play again it thought it had already chosen and re-sent last game's choice, which the host accepted. Now keyed by deal + night (`nkeyN`), cleared on a new deal, and the host checks `o.deal===MP.game.deal`.
- Rejoin: host rejections carry the hello stamp `h`; phones ignore stale rejections still stored on the relay/Net store (they blocked rejoining after "started"/"kicked"). Kicked players may rejoin.
- End of game: every phone gets the recap card (`recap` in mpPriv), players have "Back to lobby" (`MP.endHide`); host end = Play again / Back to lobby. Vote tallies shown to players.
- Log: each night records "Doctor protected X" and "The Mafia did not choose".
- Share = just the code/address (no APK link); Copy buttons (native `Net.copy`, execCommand fallback); codes are selectable.
- Ghost view and night timer work in Same room too; players see the host's rules in the lobby; Rules screen notes that the host's rules count.
- Live table vote in multiplayer (`mpStartVote(true)`, `G.open`, `voteBoard()`).
- New rule `skipVote` (default on): off = skip votes don't count, most-voted player is out.
- Leaving returns to the mode's screen (`MP.lastMode`).
- Test: `tests/multiplayer/test_feedback.js` (19 checks).
## Previous: v2.7.1 (versionCode 23)
**Accounts (v2.7)**, his decisions: username + password; a forgotten password is reset only through the linked Telegram; profile = display name, avatar (10 presets or own photo), favourite role; history keyed by account, names as fallback; single-phone and same-room work without an account; online needs one.
- Relay `Accounts` Durable Object (singleton "global", SQLite tables users/sessions/codes). Passwords PBKDF2-SHA256 100k + salt; sessions are random 32-byte tokens stored as SHA-256; 5 wrong logins lock 15 min; reset/link codes expire in 15 min; a reset signs out other phones.
- API: POST /acc/signup, /acc/login, /acc/profile, /acc/tglink, /acc/logout, /acc/delete, /acc/reset/start, /acc/reset/finish; GET /acc/me, /acc/reset/status; GET /a/<uid> avatar image; POST /tg/<TG_SECRET> Telegram webhook.
- Telegram bot **@MafiaDealer7058bot**; token in `C:/Users/WGN/Desktop/Mafia/tg.key`; Worker secrets TG_TOKEN, TG_SECRET (copy in `relay/.tgsecret`), TG_BOT. Webhook set with setWebhook. Local dev uses `relay/.dev.vars` (no token, so no messages are sent).
- Online rooms: phones connect with `&tok=`; the Room asks Accounts to verify and stamps uid/uname/uav on every message (phones can't claim another account). Wi-Fi hello carries uid unverified.
- App: `S.acct={tok,u}`, `me()`, account/forgot screens, avatar in the corner, `avatarHtml()`, name from profile (`needName`), games store `acc[]` per seat, stats use `seatKey()` (account first). Native `Chrome` WebChromeClient + `onActivityResult` make `<input type=file>` open the photo picker; photos are cropped to 192 px JPEG on the phone.
- Tests: `relay/test_accounts.mjs [base] [secret]` (28), `tests/multiplayer/test_accounts_app.js [ws] [secret]` (16); online tests sign up via a `signup()` helper.

## Previous: v2.6 (versionCode 21)
- v2.5.x: home spacing, smoother intro, share room code/Wi-Fi address from host and player lobbies. v2.6: role rules + warnings (see Game design). Test: `test_rules.js`.
- Next under discussion: sign-up/sign-in with verification, cloud profiles, online mode requiring a profile.
- v2.4.1: "Check for updates" (Settings > More, and the version line on Home); the automatic check runs on every app start.
- v2.5: in-app updates. Update downloads the APK inside the app with a progress bar (`doUpdate`), hands it to native `Net.saveApk(b64)` (cache/update.apk), then `Net.install()` opens Android's "Update this app?" via the `Apk` ContentProvider (`content://com.mafiadealer.app.apk/update.apk`, read-only, granted per intent). Needs REQUEST_INSTALL_PACKAGES; Android asks once to allow installs from Mafia Dealer. Falls back to the browser link on any failure. Silent updates are impossible for sideloaded apps. Test: `tests/multiplayer/test_inapp.js`.
v2.4 added (all from his 13-point list, 2026-11-15):
- **Settings split**: Game rules screen (`rulesView`: presets Classic/Beginner/Custom, rules grouped Night / Day and reveals / Online games) opened from a summary card on setup and in the host lobby; Settings screen (`settingsView`, gear icon in the corner: Look, Sound volumes, When you host, Group history, More).
- **Volumes** `S.vol.voice` / `S.vol.sfx` (0-1) replace the old on/off rules; effects go through their own gain bus `E`.
- **Recommended Mafia** = round(players/4), one-tap Apply on setup.
- **Online player screen**: header shows the room or phase, no fake latency online, Leave asks mid-game, discussion and night countdowns on every phone (host publishes the end time, phones count locally), Share room code (native `Net.share` share sheet).
- **Host controls** (`S.host`): buzz limit (mute after N, host can unmute), kick (`'lobby'` or `'any'`; mid-game kick = elimination written to the log; kicked ids can't rejoin the room).
- **Online rules**: night timer `S.rules.nightT` (skips unfinished turns, `G.nightEnd`), ghost view `S.rules.ghost` (dead players get all roles).
- **Recap card** on the end screen (screenshot-friendly: winner, player of the game via `mvp()`, roles, timeline). Games now also record `ev.kills` (night victims) and `ev.outs` (voted out).
- **Player profiles**: tap a leaderboard row (`profileView`: win rate, best role, as Mafia / Citizens side, killed most by, wins by role, moments, recent form).
- **Intro**: 3 cards on first launch (skipped when `navigator.webdriver`, i.e. test browsers), replay in Settings.
- **Transitions**: screen fade + sheet slide; small labels ~1 px bigger.
- **Shared group history**: relay `Group` Durable Object (`GET /g/<CODE>`, `POST /add`, `POST /edit`), 8-char codes, `x-dev` = per-phone secret `S.devKey`, owner stored as SHA-256; only the uploading phone can edit/delete. App: `LOG()` returns `S.gcache` in a group, else `S.log`; `gSync()` uploads unsent games (`S.gsent`) and pulls; joining uploads the phone's old games (dupes skipped).
- Update check now runs on every app start.
- Tests: `tests/multiplayer/test_v24.js [wss://…]` (32 checks). The live relay holds a few test groups/rooms from these runs (harmless).
- v2.1 Play Online was confirmed by Alhassan on 4 real devices (2026-11-15).
- v2.2 = brand-new UI with two switchable themes (Home -> Theme pill, saved in `S.theme`):
  - **Neon** (default): glassy cards, pink-orange gradients, Readex Pro (Arabic + Latin).
  - **Noir**: black / bone / blood red, Special Elite typewriter headings (El Messiri for Arabic), IBM Plex Sans Arabic body, paper "CLASSIFIED" role card.
  - Everything is CSS tokens on `<html data-theme>`; role colours come from `RCS[theme]`. Fonts are bundled in `app/assets/fonts/` (OFL licenses included); `build_apk.py` now packs asset subfolders and stores woff2 uncompressed.
  - Home has the three modes as buttons (`#mode-offline`, `#mode-wifi`, `#mode-online`; v2.9.2, the Play Together screen is gone). The name box is on the Local Network screen (`wifiView`); Online (`onlineView`) needs an account. Back from host/join returns to the right one.
  - `design/mockups.py` rebuilds the 3-direction comparison page (he chose Noir + Neon, not Moonlit).
- **Pass & Play** (one phone): complete and stable.
- **Play Together** (every player on their own phone, same Wi-Fi or hotspot):
  - Stage 1, connection test: confirmed on real phones, over a phone hotspot and over a third phone's hotspot (the router-like case). Auto-discovery works and is fast; keep the manual address option.
  - Stage 2, lobby and dealing roles: confirmed on real phones.
  - Stage 3, the full game (simultaneous night turns, morning report, secret vote on phones, end screen, history): built and tested in simulation; **real-phone test is pending**.
  - Stage 3 real-phone status: Alhassan only tried connecting two phones (host owns the hotspot, host on another player's hotspot, home router). No full game yet.
  - **Stage 4, build 1 = v2.0 (done, waiting for his test):** reconnection.
    - Host snapshots room + game to localStorage `mafiaDealer.mp` on every publish; "Resume hosted game" on home and Play Together. Quitting/closing the room clears it.
    - Players remember the room (`mafiaDealer.join`) and rejoin automatically on app start; Leave, a closed room or a blocked join clears it.
    - A player unreachable for 8 s rescans the subnet for a room with the same host name (handles a new host address).
    - Native `Keep` foreground service (type connectedDevice) with a partial wake lock and Wi-Fi lock while hosting, started via `Net.keep(on)`; Android 8+ only.
- **Play Online (v2.1, done, waiting for his test)**: third mode, friends anywhere over the internet (talk on a WhatsApp/Discord call).
  - Relay: `relay/` (Cloudflare Worker + one SQLite Durable Object per 6-digit room code), deployed at `wss://mafia-relay.mafiadealer.workers.dev` on his Cloudflare account (free plan; workers.dev subdomain `mafiadealer`). Never runs game logic.
  - Protocol: host `?role=host&key=<24-char secret>` sends `{t:'put',k,v}` / `{t:'clear'}` / `{t:'bc',v}`; players `?role=p&id=<id>` send URL-encoded action JSON (same as LAN `/a?`). Relay delivers each `p_<id>` only to that player, queues actions while the host is away, tells players `{host:0|1}`, and auto-answers "ping" with "pong" (no wake, not billed). Values are stored only when changed.
  - App: host code talks to `HN` = native `Net` (Wi-Fi) or `onlineNet()` (same put/take/clear). Online players read pushed state instead of polling. Every `NARR.*` call on an online host is broadcast so narration plays on all phones. 7 s pong watchdog replaces silently dead sockets. Host snapshot and player auto-rejoin carry the room code. The relay address is built in (`RELAY`); the settings field was removed at his request, but `S.relay` still overrides it (the tests use it to point at a local `wrangler dev`). Moving the relay means a new build.
  - Deploy: from `relay/`, `CLOUDFLARE_API_TOKEN` from `C:/Users/WGN/Desktop/Mafia/cf.key` and `CLOUDFLARE_ACCOUNT_ID` from `relay/.account` (gitignored), then `npx wrangler deploy`. Local: `npx wrangler dev --port 8787`.
  - Free-plan budget: WebSocket messages count 20:1 as requests and only incoming ones count; host-side and relay-side de-duplication keep a game far below 100k requests/day.
  - **Stage 4, build 2 = v2.2 (after online is confirmed on phones):** UI redesign (2-3 mockups first, keep screens/flow, bundled Arabic-capable fonts, night/day colours on player phones), offline voice regeneration, role-neutral sound cues on player phones.

## How the app is built (important)
- **Google's dl.google.com depends on the connection**: on 2026-11-16 it first returned 404 for SDK files, then served them later the same day. When it was blocked: the Android SDK, Google Maven, adb, emulator and Flutter-for-Android can't be downloaded. A Kotlin move was approved, then dropped for this reason (2026-11-15). Don't route around the block (VPN, mirrors, cloud runners). Maven Central, PyPI, npm, GitHub and Hugging Face work.
- **Code layout (2026-11-16, branch `refactor/ts-split`):** the game moved from one inline `<script>` into TypeScript files in `app/src/` (one shared global scope, joined in `app/tsconfig.json` order by `app/build.mjs` into `app/assets/app.js`, gitignored). `npm run check` / `npm run build`; `build_apk.py` runs both. CSS is in `app/assets/style.css`. `const APP` stays inline in `index.html`. See README "The code". Next planned steps: Capacitor shell (Gradle, AAB) and Google Play.
- So the app is one HTML page (`app/assets/index.html`) in a WebView, and the APK is produced by Python scripts: `build/dexasm.py` (a small Dalvik assembler; supports `sget` and `if-lt` too), `build/app_dex.py` (the native classes), `build/build_apk.py` (manifest, resources, zip, v2 signing).
- Native classes in `app_dex.py`:
  - `MainActivity`: full-screen WebView, keeps the screen on, Back goes to the WebView history. Creating `Net` is wrapped in try/catch so a failure only disables multiplayer.
  - `Voice`: old text-to-speech bridge, no longer used (Alhassan found the phone voice too robotic).
  - `Net`: JS bridge exposing `start(port)`, `put(k,v)`, `take()`, `clear()`, `ip()`, `running()`, `keep(on)`. Its store and queue are static.
  - `Keep`: foreground service while hosting (notification, partial wake lock, Wi-Fi lock); stops when the app is swiped away.
  - `Srv`: HTTP server thread on port 8765. `GET /a?<x>` queues x, `GET /s?<k>` returns the stored value, anything else returns `mafia-dealer`.
- Manifest: INTERNET, ACCESS_WIFI_STATE, CHANGE_WIFI_STATE, WAKE_LOCK, FOREGROUND_SERVICE(_CONNECTED_DEVICE), VIBRATE, the `Keep` service, the TTS query, `usesCleartextTraffic=true`, minSdk 24, targetSdk 34, portrait.
- Signing: the key is `C:/Users/WGN/Desktop/Mafia/mafia-dealer-signing-key.pem` on his laptop (outside the repo; cert CN=Mafia Dealer, SHA-256 e813d5ac...646471). Build from `build/` with `python build_apk.py out/MafiaDealer.apk ../app/assets icon.png ../../../mafia-dealer-signing-key.pem`; the script refuses to run without the key instead of generating a new one. Every build must use it, or updates won't install over the old app and uninstalling wipes the game history. **Bump versionCode and versionName in `build_apk.py` for every release.**
- Verification: `build/verify_apk.py` checks the zip, the v2 signature, the dex (via androguard), the manifest and the resources. androguard's decompiler garbles methods that have try/catch, so check those at instruction level.

## Releasing (v2.3+)
1. Bump `APP` in `app/assets/index.html`. 2. `cd build && python build_apk.py out/MafiaDealer.apk ../app/assets icon.png ../../../mafia-dealer-signing-key.pem && python verify_apk.py out/MafiaDealer.apk`.
3. `cd relay && python publish.py "what changed"`: copies the APK and a `version.json` into `relay/public/` and deploys. The APK is then public at `https://mafia-relay.mafiadealer.workers.dev/MafiaDealer.apk`.
- Apps from v2.3 check `version.json` on start (at most every 6 h; quiet offline) and show "Update available" on Home; `Net.open(url)` (native, added in v2.3) hands the link to the browser. Lobby shows "old version" next to players behind the host, and players with an older app than the host see a warning (hello carries `v`, room carries `hv`).
- Play Protect warns on every sideloaded install (unknown developer/app, background permissions). Google Play publishing is under discussion (2026-11-16); Google's planned developer verification for sideloaded apps may matter later.

## Game design decisions
- Roles (v2.6, his rules): exactly 1 Doctor; at most 1 Detective and only with 2+ Mafia; Mafia must be at least 2 fewer than everyone else (Mafia <= (players-2)/2); Citizens fill the rest; at least 4 players. All enforced in `fixCounts()`/`deckErr()`.
- Every leave/remove/delete asks first (v2.6): close room, leave room (lobby too), header arrow and phone Back in a room (`inRoom()`/`askLeaveRoom()`/`leaveNow()`), removing a player in setup; kick, discard, delete game, clear history, quit, leave group already did.
- Rules (toggles): one-time Mafia skip (counts as used only when the skip actually wins the vote); Mafia can't target the same player two nights in a row; announce who the Doctor saved; decoy turns for Citizens; Doctor can protect themselves; Doctor can't repeat protection; reveal role on elimination; discussion timer.
- Several Mafia: each sees teammates' picks live; the most-picked target wins, and ties are broken at random.
- Suspense reveals: the morning, vote and winner screens show a waiting screen until the narrator says the name.
- History: last 100 finished games. At the end the phone holder marks a game valid or invalid (can be changed later); only valid games count in stats. Quit games aren't logged.
- Stats: ranked by win rate with a 3-game minimum (ties go to more wins). Mafia and Citizen-side records are shown separately. Titles: Best Player, Best Mafia, Best Detective, Best Doctor, Most Killed First.
- Saved player names appear as chips on the setup screen; duplicate names are blocked.
- Rematch (v2.3): after marking a game valid/invalid, Play again deals new roles to the same players at once (single phone: same names; host: same phones in the room). "Change players" / "Back to room" still available.
- Multiplayer: the host phone is the table display (narrator, sounds, reveals) and is also a player; its private screens use press-and-hold. Players poll every 0.7 s. The host can continue without offline players. Late joiners are blocked; known players can rejoin and get their role back. Leaving or quitting on the host returns everyone to the room.

## Audio
- Narrator (v2.3): rewritten script with two characters, generated on the laptop CPU with Chatterbox (`voice/script.py`), each phrase separate and joined with real pauses (he complained the old voice ignored commas):
  - S = fairy-tale storyteller (Chatterbox copying Kokoro `bm_george`, light hall echo); M = monster (copying Kokoro `am_onyx`, pitched down with a sub-octave and dark echo).
  - He accepted all 28 lines except the laugh; laugh version B ("Heh heh heh... Ha ha ha ha ha!", lighter FX) chosen.
  - Only approved names are spoken (he said not to generate the full list): the 8 friends in `spellings.json` + default "Player 1-20". Other names show on screen without a voice; `pack.py` filters to that list. To add a friend: audition with `names2.py`, add to `spellings.json`, generate, pack.
  - Names exist in both voices: `n_<key>` storyteller, `m_<key>` monster. `VOX.name(n,1)` picks the monster one (deaths, Mafia win); saves, votes and Citizens win use the storyteller.
  - Friends' approved spellings are in `voice/spellings.json` (he preferred syllable spellings like "Ha-la-wee", "Khad-door"; "Al Hassan" and "Fahter" kept).
  - `voice/pack.py` builds `audio.js`, cutting the preview name ("Halawy") off the lines that end before a name, at -24 LUFS like the old clips.
- Name clips: about 180 common Arabic and English names plus "Player 1–20" (`voice/names.json`, which includes Arabic-script aliases). His friends' names were added; pronunciation not yet confirmed by him.
- Sound effects are synthesized in code (WebAudio). Pixabay blocks downloads from here; Freesound works but needs his free account's API key.
- **ElevenLabs is geo-blocked on this connection** (redirects to geo-restriction.elevenlabs.io; rechecked 2026-11-16). He has a free key at `C:/Users/WGN/Desktop/Mafia/elevenlabs.key`, 0 credits used. He asked to route it through WireGuard; declined. Regenerate voices offline: Kokoro (phoneme input to fix names one by one) or Chatterbox on CPU (no GPU on his i7-8550U laptop).
- He reported the name clips sound very bad.
- Copyrighted game or movie audio (Dota 2, films) was declined.

## Testing
- Playwright tests: `tests/test7.js` (7 single-phone games plus history and stats), `tests/test9.js` (the two newer rules).
- Multiplayer (run from `tests/multiplayer`; each spawns `mock_srv.py`, a byte-for-byte stand-in for the in-app server, except `test_mp.js` which needs it started by hand): `test_s2.js` (dealing; app restart now rejoins by itself), `test_s3.js cit|maf` (full games), `test_s3b.js` (two Mafia and an offline player), `test_lost.js` (reconnect), `test_drop.js` (stage 4: vote while offline, app restart, stale host address, host killed and resumed), `test_update.js` (rematch both modes, update banner, old-version warnings), `test_online.js [wss://…]` (full online game through the relay: codes, private roles, narration on every phone, dead socket, host resume, wrong code; default local wrangler dev).
- Relay protocol: `node relay/test_relay.mjs [https://…]` (13 checks).
- Windows: `python3` is the Store stub, so tests spawn `python` on win32. Playwright, TypeScript and esbuild are devDependencies in the root `package.json` (`npm install`); run `npm run build` before the tests.
- Pitfall: Playwright `text=` selectors match any text containing the words, such as a hint sentence. Use `button:has-text("…")`.
- Bugs already fixed: name clips overwriting each other (each name now has its own file key); the Detective missing their result when acting last (the result now stays visible until the next night).

## Next step
Get Alhassan's real-phone results for v2.1: an online game over mobile data in different places, plus the v2.0 Wi-Fi checks (Wi-Fi off/on, host app closed and resumed, hosting notification). Then the voice lines (`voice/script.py`, monster/storyteller, preview page with Accept/Change) and the design mockups for v2.2.
