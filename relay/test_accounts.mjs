// Accounts protocol: node test_accounts.mjs [base] [tgSecret]   (default: local wrangler dev, secret from .dev.vars)
const BASE = process.argv[2] || "http://127.0.0.1:8787", SECRET = process.argv[3] || "localtestsecret";
const ok = (c, m) => { console.log(c ? "ok  " : "FAIL", m); if (!c) process.exitCode = 1; };
const call = async (path, body, tok) => { const r = await fetch(BASE + path, { method: body ? "POST" : "GET", headers: Object.assign({ "content-type": "application/json" }, tok ? { authorization: "Bearer " + tok } : {}), body: body ? JSON.stringify(body) : undefined }); let j = {}; try { j = await r.json(); } catch (e) {} return { st: r.status, j }; };
const tg = (text, from) => fetch(`${BASE}/tg/${SECRET}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ message: { text, from: { id: from }, chat: { id: from } } }) });
const un = "t" + Math.random().toString(36).slice(2, 10);

let r = await call("/acc/signup", { uname: "ab", pass: "secret1" }); ok(r.st === 400 && r.j.err === "uname", "username shorter than 3 is refused");
r = await call("/acc/signup", { uname: un, pass: "123" }); ok(r.st === 400 && r.j.err === "pass", "password shorter than 6 is refused");
r = await call("/acc/signup", { uname: un, pass: "secret1" }); ok(r.st === 200 && /^[a-f0-9]{64}$/.test(r.j.tok) && r.j.user.display === un, "sign up returns a session and a profile");
let tok = r.j.tok; const uid = r.j.user.id;
r = await call("/acc/signup", { uname: un.toUpperCase(), pass: "secret1" }); ok(r.st === 409, "same username (any case) is taken");
r = await call("/acc/login", { uname: un, pass: "nope123" }); ok(r.st === 401, "wrong password refused");
r = await call("/acc/login", { uname: un, pass: "secret1" }); ok(r.st === 200 && r.j.tok !== tok, "right password signs in");
r = await call("/acc/me", null, tok); ok(r.st === 200 && r.j.user.uname === un && !r.j.user.tg, "/me with the session works");
r = await call("/acc/me", null, "f".repeat(64)); ok(r.st === 401, "/me with a fake session is refused");
const img = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";
r = await call("/acc/profile", { display: "Al Hassan", fav: "detective", avatar: img }, tok); ok(r.st === 200 && r.j.user.display === "Al Hassan" && r.j.user.fav === "detective" && r.j.user.avatar === "i:1", "profile saves name, favourite role and an uploaded photo");
const a = await fetch(`${BASE}/a/${uid}`); ok(a.status === 200 && a.headers.get("content-type") === "image/png" && (await a.arrayBuffer()).byteLength > 40, "photo is served at /a/<id>");
r = await call("/acc/profile", { avatar: "p:5" }, tok); ok(r.j.user.avatar === "p:5", "preset avatar can replace the photo");
r = await call("/acc/profile", { avatar: "javascript:alert(1)" }, tok); ok(r.st === 400, "anything that is not a preset or an image is refused");
// forgot password without Telegram
r = await call("/acc/reset/start", { uname: un }); ok(r.st === 409 && r.j.err === "notg", "reset needs a linked Telegram");
// link Telegram
r = await call("/acc/tglink", {}, tok); ok(/^L[a-f0-9]{24}$/.test(r.j.code) && r.j.bot, "link code + bot name");
await tg("/start " + r.j.code, 777001); r = await call("/acc/me", null, tok); ok(r.j.user.tg === true, "Telegram /start with the code links the account");
// reset: wrong Telegram, then the right one
r = await call("/acc/reset/start", { uname: un }); const code = r.j.code; ok(/^R[a-f0-9]{24}$/.test(code), "reset code issued");
await tg("/start " + code, 999999); r = await call("/acc/reset/status?code=" + code); ok(!r.j.ok, "a different Telegram account cannot verify the reset");
r = await call("/acc/reset/finish", { code, pass: "newpass1" }); ok(r.st === 403, "finishing before verification is refused");
await tg("/start " + code, 777001); r = await call("/acc/reset/status?code=" + code); ok(r.j.ok, "the linked Telegram verifies the reset");
r = await call("/acc/reset/finish", { code, pass: "newpass1" }); ok(r.st === 200 && r.j.tok, "new password set, signed in");
const tok2 = r.j.tok;
r = await call("/acc/me", null, tok); ok(r.st === 401, "old sessions are signed out after a reset");
r = await call("/acc/login", { uname: un, pass: "secret1" }); ok(r.st === 401, "old password no longer works");
r = await call("/acc/login", { uname: un, pass: "newpass1" }); ok(r.st === 200, "new password works");
// lockout after 5 wrong tries
for (let i = 0; i < 5; i++) r = await call("/acc/login", { uname: un, pass: "bad" + i + "xx" });
ok(r.st === 429, "5 wrong passwords lock the account");
r = await call("/acc/login", { uname: un, pass: "newpass1" }); ok(r.st === 429, "even the right password waits while locked");
// online room: the relay stamps the verified account, ignoring what the phone claims
const code6 = String(100000 + Math.floor(Math.random() * 900000)), KEY = "k".repeat(10) + Math.random().toString(36).slice(2, 12), WS = BASE.replace(/^http/, "ws");
const open = q => new Promise((res, rej) => { const ws = new WebSocket(`${WS}/r/${code6}?${q}`); ws.got = []; ws.onmessage = e => ws.got.push(JSON.parse(e.data)); ws.onopen = () => res(ws); ws.onerror = rej; });
const host = await open(`role=host&key=${KEY}`);
const pl = await open(`role=p&id=aaaaaaaa&tok=${tok2}`), anon = await open("role=p&id=bbbbbbbb");
pl.send(encodeURIComponent(JSON.stringify({ t: "hello", name: "Fake", uid: "someone-else", id: "aaaaaaaa" })));
anon.send(encodeURIComponent(JSON.stringify({ t: "hello", name: "Anon", uid: uid, uname: "Al Hassan", id: "bbbbbbbb" })));
await new Promise(r => setTimeout(r, 1200));
const msgs = host.got.filter(m => m.a).map(m => JSON.parse(decodeURIComponent(m.a)));
const m1 = msgs.find(m => m.id === "aaaaaaaa"), m2 = msgs.find(m => m.id === "bbbbbbbb");
ok(m1 && m1.uid === uid && m1.uname === "Al Hassan", "signed-in player: relay stamps the real account and name");
ok(m2 && !m2.uid && !m2.uname, "a phone without a session cannot claim someone's account");
for (const w of [host, pl, anon]) w.close();
// friends (v2.9)
const unB = un + "b", unC = un + "c";
const tB = (await call("/acc/signup", { uname: unB, pass: "secret1" })).j.tok, tC = (await call("/acc/signup", { uname: unC, pass: "secret1" })).j.tok;
const idB = (await call("/acc/me", null, tB)).j.user.id, idC = (await call("/acc/me", null, tC)).j.user.id;
r = await call("/acc/friend/request", { uname: "@" + unB.toUpperCase() }, tok2); ok(r.st === 200 && r.j.rel === "out" && r.j.user.id === idB && !("tg" in r.j.user), "request by @username (any case)");
r = await call("/acc/friend/request", { id: idB }, tok2); ok(r.j.rel === "out", "asking again changes nothing");
r = await call("/acc/friend/request", { uname: un }, tok2); ok(r.st === 400 && r.j.err === "self", "you can't add yourself");
r = await call("/acc/friend/request", { uname: "nobody_" + un }, tok2); ok(r.st === 404 && r.j.err === "nouser", "unknown username");
r = await call("/acc/invite", { id: idB, code: "123456" }, tok2); ok(r.st === 403, "no invites before the request is accepted");
r = await call("/acc/inbox", { st: "" }, tB); ok(r.j.req === 1 && r.j.rel[uid] === "in" && r.j.on === 0, "the other side sees the request in its inbox");
r = await call("/acc/friends", null, tB); ok(r.j.inc.length === 1 && r.j.inc[0].id === uid && !r.j.friends.length, "and in its friends list");
r = await call("/acc/friend/accept", { id: uid }, tB); ok(r.j.rel === "ok", "accept");
r = await call("/acc/friends", null, tok2); let fB = r.j.friends.find(f => f.id === idB); ok(fB && fB.on === true && fB.st === "" && fB.uname === unB, "friends both ways; online after an inbox check");
await call("/acc/inbox", { st: "room" }, tB); r = await call("/acc/friends", null, tok2); ok(r.j.friends.find(f => f.id === idB).st === "room", "\"in a room\" shows");
await call("/acc/inbox", { st: "game", hide: true }, tB); r = await call("/acc/friends", null, tok2); fB = r.j.friends.find(f => f.id === idB); ok(fB.on === false && fB.st === "", "\"Show me as online\" off: looks offline");
await call("/acc/inbox", { st: "", hide: false }, tB);
await call("/acc/friend/request", { id: uid }, tC); r = await call("/acc/friend/request", { id: idC }, tok2); ok(r.j.rel === "ok", "asking someone who already asked you makes you friends");
r = await call("/acc/inbox", {}, tok2); ok(r.j.on === 1 && r.j.rel[idB] === "ok" && r.j.rel[idC] === "ok", "inbox: online friends count and relations");
r = await call("/acc/invite", { id: idB, code: "12345" }, tok2); ok(r.st === 400, "invite needs a 6-digit room code");
r = await call("/acc/invite", { id: idB, code: code6 }, tok2); ok(r.j.ok && r.j.tg === false, "invite an online friend (no Telegram)");
r = await call("/acc/invite", { id: idB, code: code6 }, tok2); ok(r.j.dup, "one invite per friend per room");
r = await call("/acc/inbox", {}, tB); const iv = r.j.inv[0]; ok(r.j.inv.length === 1 && iv.code === code6 && iv.from.id === uid && iv.from.display === "Al Hassan", "the friend's inbox has the invite with who sent it");
await call("/acc/invite/done", { id: iv.id }, tB); r = await call("/acc/inbox", {}, tB); ok(!r.j.inv.length, "a joined or dismissed invite is gone");
r = await call("/acc/tglink", {}, tC); await tg("/start " + r.j.code, 777003);
r = await call("/acc/invite", { id: idC, code: code6 }, tok2); ok(r.j.ok && r.j.tg === true, "invite a friend whose app is closed: goes to their Telegram");
r = await call("/acc/user/" + idB, null, tok2); ok(r.j.user.rel === "ok" && r.j.user.uname === unB && "on" in r.j.user, "friend profile card");
r = await call("/acc/user/" + uid, null, tok2); ok(r.j.user.rel === "me", "own card");
r = await call("/acc/friend/remove", { id: idB }, tok2); r = await call("/acc/friends", null, tok2); ok(!r.j.friends.some(f => f.id === idB), "remove friend");
r = await call("/acc/inbox", {}, tB); ok(!r.j.rel[uid], "removed on the other side too (without telling them)");
await call("/acc/friend/request", { id: uid }, tB); r = await call("/acc/friend/decline", { id: idB }, tok2); r = await call("/acc/inbox", {}, tB); ok(!r.j.rel[uid], "declined request is gone");
r = await call("/acc/delete", { pass: "secret1" }, tC); r = await call("/acc/friends", null, tok2); ok(!r.j.friends.some(f => f.id === idC), "a deleted account leaves no friendship behind");
r = await call("/acc/inbox", {}, tok2); ok(r.j.on === 0 && !Object.keys(r.j.rel).length, "and no invites or relations");
// delete account
r = await call("/acc/delete", { pass: "wrongpass" }, tok2); ok(r.st === 401, "deleting needs the password");
console.log(process.exitCode ? "FAILED" : "all passed"); setTimeout(() => process.exit(), 200);
