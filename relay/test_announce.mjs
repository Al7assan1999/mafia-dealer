// v2.18: /acc/announce (publish.py tells Telegram-linked accounts about a new version, once per version) and the /u update page.
// Needs the local relay: npx wrangler dev --port 8787   then: node test_announce.mjs [http://127.0.0.1:8787]
import { readFileSync } from "fs";
const B = process.argv[2] || "http://127.0.0.1:8787";
const KEY = (readFileSync(new URL("./.dev.vars", import.meta.url), "utf8").match(/^TG_SECRET=(.*)$/m) || [])[1].trim().replace(/^"|"$/g, "");
let fails = 0; const ok = (c, m) => { console.log(c ? "ok  " : "FAIL", m); if (!c) fails++; };
const ann = (body, key) => fetch(B + "/acc/announce", { method: "POST", headers: Object.assign({ "content-type": "application/json" }, key ? { "x-key": key } : {}), body: JSON.stringify(body) });
const code = Math.floor(Date.now() / 1000);  // above anything announced on this local relay before
ok((await ann({ code, name: "9.1", bullets: ["a"] })).status === 403, "no key: refused");
ok((await ann({ code, name: "9.1", bullets: ["a"] }, "wrong")).status === 403, "wrong key: refused");
ok((await ann({ code, name: "<b>", bullets: [] }, KEY)).status === 400, "a bad version name: refused");
const r1 = await (await ann({ code, name: "9.1", bullets: ["New chat", "Fixes"] }, KEY)).json();
ok(typeof r1.sent === "number" && !r1.already, `announced (sent to ${r1.sent} linked accounts)`);
const r2 = await (await ann({ code, name: "9.1", bullets: ["New chat"] }, KEY)).json();
ok(r2.already === true && r2.sent === 0, "the same version again: not sent twice");
const r3 = await (await ann({ code: code - 5, name: "9.0", bullets: [] }, KEY)).json();
ok(r3.already === true, "an older version: not sent");
const u = await fetch(B + "/u"), h = await u.text();
ok(u.status === 200 && h.includes("intent://") && h.includes("/u#Intent;scheme=https;package=com.mafiadealer.app") && h.includes("/MafiaDealer.apk"), "/u: opens the app, or downloads the update");
process.exit(fails ? 1 : 0);
