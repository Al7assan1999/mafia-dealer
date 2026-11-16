// Mafia Dealer online relay. One Durable Object per room code; it never runs game logic.
//   host:   wss://…/r/<code>?role=host&key=<secret>   sends {t:'put',k,v} | {t:'clear'} | {t:'bc',v}
//   player: wss://…/r/<code>?role=p&id=<playerId>     sends raw action strings (same JSON as the LAN /a?<x>)
// Both send "ping" every ~2 s and get "pong" (auto-response), so a dead connection is noticed within seconds.
// The relay sends players {k,v} (their own p_<id> and 'room'), {bc} broadcasts and {host:0|1};
// it sends the host {a:<action>} (queued while the host is away).
const CODE = /^\d{6}$/, ID = /^[a-z0-9]{6,24}$/, MAX = 65536, QMAX = 200;

// Group history: GET /g/<code> -> {exists, games}; POST /g/<code>/add {games}; POST /g/<code>/edit {id, valid|del}.
// Header x-dev = the phone's secret device key; only the phone that added a game may edit or delete it (stored as a hash).
const GCODE = /^[A-Z2-9]{8}$/, CORS = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET,POST,OPTIONS", "Access-Control-Allow-Headers": "content-type,x-dev" };

// Accounts: one SQLite Durable Object ("global"). /acc/* JSON API (Authorization: Bearer <session>), /a/<uid> avatar images,
// /tg/<secret> Telegram webhook (link the account / verify a password reset).
const ACORS = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET,POST,OPTIONS", "Access-Control-Allow-Headers": "content-type,authorization" };
const accounts = env => env.ACCOUNTS.get(env.ACCOUNTS.idFromName("global"));

export default {
  async fetch(req, env) {
    const u = new URL(req.url);
    if (/^\/(acc|a|tg)\//.test(u.pathname)) {
      if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: ACORS });
      return accounts(env).fetch(req);
    }
    const g = u.pathname.match(/^\/g\/([A-Z2-9]+)(\/(add|edit))?$/);
    if (g) {
      if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });
      if (!GCODE.test(g[1])) return Response.json({ err: "bad code" }, { status: 400, headers: CORS });
      return env.GROUP.get(env.GROUP.idFromName(g[1])).fetch(req);
    }
    const m = u.pathname.match(/^\/r\/(\d+)$/);
    if (!m) return new Response("mafia-dealer relay", { headers: { "Access-Control-Allow-Origin": "*" } });
    if (!CODE.test(m[1])) return new Response("bad room", { status: 400 });
    if (req.headers.get("Upgrade") !== "websocket") return new Response("websocket only", { status: 426 });
    return env.ROOM.get(env.ROOM.idFromName(m[1])).fetch(req);
  },
};

export class Room {
  constructor(ctx, env) {
    this.ctx = ctx; this.s = ctx.storage; this.env = env;
    ctx.setWebSocketAutoResponse(new WebSocketRequestResponsePair("ping", "pong"));  // heartbeat without waking the object
  }

  async fetch(req) {
    const u = new URL(req.url), role = u.searchParams.get("role");
    const [client, server] = Object.values(new WebSocketPair());
    if (role === "host") {
      const key = u.searchParams.get("key") || "", have = await this.s.get("key");
      if (key.length < 16 || (have && have !== key)) return this.reject(client, server, "taken");
      if (!have) await this.s.put("key", key);
      for (const old of this.ctx.getWebSockets("host")) try { old.close(4002, "replaced"); } catch (e) {}
      this.ctx.acceptWebSocket(server, ["host"]);
      const q = (await this.s.get("q")) || [];
      if (q.length) { server.send(JSON.stringify({ q })); await this.s.delete("q"); }
      this.toPlayers({ host: 1 });
    } else if (role === "p") {
      const id = u.searchParams.get("id") || "";
      if (!ID.test(id)) return this.reject(client, server, "bad id");
      // signed-in players: the relay checks the session itself and stamps the real account on everything they send
      let who = null; const tok = u.searchParams.get("tok");
      if (tok) try { const r = await accounts(this.env).fetch("https://acc/internal/verify", { method: "POST", body: JSON.stringify({ tok }) }); if (r.ok) who = await r.json(); } catch (e) {}
      this.ctx.acceptWebSocket(server, ["p", "p:" + id]);
      server.serializeAttachment(who && who.uid ? who : null);
      server.send(JSON.stringify({ k: "room", v: (await this.s.get("v:room")) || "" }));
      const mine = await this.s.get("v:p_" + id);
      if (mine) server.send(JSON.stringify({ k: "p_" + id, v: mine }));
      server.send(JSON.stringify({ host: this.ctx.getWebSockets("host").length ? 1 : 0 }));
    } else return new Response("bad role", { status: 400 });
    return new Response(null, { status: 101, webSocket: client });
  }

  reject(client, server, why) {
    server.accept(); server.send(JSON.stringify({ err: why })); server.close(4001, why);
    return new Response(null, { status: 101, webSocket: client });
  }

  toPlayers(o, tag = "p") {
    const s = JSON.stringify(o);
    for (const ws of this.ctx.getWebSockets(tag)) try { ws.send(s); } catch (e) {}
  }

  async webSocketMessage(ws, msg) {
    if (typeof msg !== "string" || msg.length > MAX) return;
    const tags = this.ctx.getTags(ws);
    if (tags.includes("host")) {
      let o; try { o = JSON.parse(msg); } catch (e) { return; }
      if (o.t === "put" && typeof o.k === "string" && typeof o.v === "string") {
        const k = "v:" + o.k;
        if (((await this.s.get(k)) || "") === o.v) return;  // unchanged: no write, no send
        if (o.v) await this.s.put(k, o.v); else await this.s.delete(k);
        if (o.k === "room") this.toPlayers({ k: "room", v: o.v });
        else if (o.k.startsWith("p_")) this.toPlayers({ k: o.k, v: o.v }, "p:" + o.k.slice(2));
      } else if (o.t === "clear") {
        const keys = [...(await this.s.list({ prefix: "v:" })).keys()];
        if (keys.length) await this.s.delete(keys);
        await this.s.delete("q");
        for (const p of this.ctx.getWebSockets("p")) {
          const id = this.ctx.getTags(p).find(t => t.startsWith("p:")).slice(2);
          try { p.send(JSON.stringify({ k: "room", v: "" })); p.send(JSON.stringify({ k: "p_" + id, v: "" })); } catch (e) {}
        }
      } else if (o.t === "bc") this.toPlayers({ bc: o.v });
    } else {
      const who = ws.deserializeAttachment();
      try {  // replace any account fields the phone sent with the verified ones (or remove them)
        const o = JSON.parse(decodeURIComponent(msg)); delete o.uid; delete o.uname; delete o.uav;
        if (who) { o.uid = who.uid; o.uname = who.display; o.uav = who.av; }
        msg = encodeURIComponent(JSON.stringify(o));
      } catch (e) { return; }
      const hosts = this.ctx.getWebSockets("host");
      if (hosts.length) for (const h of hosts) try { h.send(JSON.stringify({ a: msg })); } catch (e) {}
      else {  // host away: keep the action until it reconnects
        const q = (await this.s.get("q")) || [];
        q.push(msg); await this.s.put("q", q.slice(-QMAX));
      }
    }
  }

  async webSocketClose(ws, code) {
    try { ws.close(code === 1005 ? 1000 : code, "bye"); } catch (e) {}
    if (this.ctx.getTags(ws).includes("host") && !this.ctx.getWebSockets("host").some(h => h !== ws)) this.toPlayers({ host: 0 });
  }
  async webSocketError(ws) { return this.webSocketClose(ws, 1011); }
}

export class Group {
  constructor(ctx) { this.s = ctx.storage; }
  async fetch(req) {
    const u = new URL(req.url), act = u.pathname.split("/")[3] || "", dev = req.headers.get("x-dev") || "";
    const me = dev.length >= 16 ? await sha(dev) : null, out = (o, st) => Response.json(o, { status: st || 200, headers: CORS });
    if (req.method === "GET") {
      if (!(await this.s.get("created"))) return out({ exists: false, games: [] });
      const rows = [...(await this.s.list({ prefix: "g:" })).values()].sort((a, b) => b.game.id - a.game.id).slice(0, 300);
      return out({ exists: true, games: rows.map(r => Object.assign({}, r.game, { mine: r.owner === me })) });
    }
    if (req.method !== "POST" || !me) return out({ err: "forbidden" }, 403);
    const body = await req.text(); if (body.length > 1048576) return out({ err: "too big" }, 413);
    let o; try { o = JSON.parse(body); } catch (e) { return out({ err: "bad json" }, 400); }
    if (act === "add") {
      await this.s.put("created", 1); let added = 0;
      for (const game of (o.games || []).slice(0, 200)) {
        if (!game || typeof game.id !== "number" || !Array.isArray(game.names) || JSON.stringify(game).length > 20000) continue;
        const k = "g:" + game.id; if (await this.s.get(k)) continue;  // already there (uploaded by someone): keep the first owner
        delete game.mine; await this.s.put(k, { game, owner: me }); added++;
      }
      return out({ ok: true, added });
    }
    if (act === "edit") {
      const k = "g:" + Number(o.id), row = await this.s.get(k);
      if (!row) return out({ err: "not found" }, 404);
      if (row.owner !== me) return out({ err: "not yours" }, 403);
      if (o.del) await this.s.delete(k); else { row.game.valid = !!o.valid; await this.s.put(k, row); }
      return out({ ok: true });
    }
    return out({ err: "unknown" }, 404);
  }
}
async function sha(x) { return [...new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(x)))].map(b => b.toString(16).padStart(2, "0")).join(""); }

// ---------------------------------------------------------------- accounts
const UNAME = /^[A-Za-z0-9_.]{3,20}$/, ROLES = ["", "mafia", "doctor", "detective", "citizen"], CODE_TTL = 15 * 60e3;
const rnd = n => [...crypto.getRandomValues(new Uint8Array(n))].map(b => b.toString(16).padStart(2, "0")).join("");
async function pbkdf2(pass, salt) {
  const k = await crypto.subtle.importKey("raw", new TextEncoder().encode(pass), "PBKDF2", false, ["deriveBits"]);
  const b = await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt: new TextEncoder().encode(salt), iterations: 100000 }, k, 256);
  return [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, "0")).join("");
}
const same = (a, b) => { if (a.length !== b.length) return false; let d = 0; for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i); return d === 0; };

export class Accounts {
  constructor(ctx, env) {
    this.env = env; this.sql = ctx.storage.sql;
    this.sql.exec(`CREATE TABLE IF NOT EXISTS users(id TEXT PRIMARY KEY, uname TEXT UNIQUE COLLATE NOCASE, salt TEXT, hash TEXT,
      display TEXT, avatar TEXT DEFAULT 'p:0', av INTEGER DEFAULT 0, fav TEXT DEFAULT '', tg TEXT, fails INTEGER DEFAULT 0, lock INTEGER DEFAULT 0, created INTEGER)`);
    this.sql.exec("CREATE TABLE IF NOT EXISTS sessions(th TEXT PRIMARY KEY, uid TEXT, created INTEGER)");
    this.sql.exec("CREATE TABLE IF NOT EXISTS codes(code TEXT PRIMARY KEY, kind TEXT, uid TEXT, ok INTEGER DEFAULT 0, created INTEGER)");
  }
  one(q, ...b) { return this.sql.exec(q, ...b).toArray()[0] || null; }
  pub(r) { return { id: r.id, uname: r.uname, display: r.display, fav: r.fav || "", avatar: r.avatar && r.avatar.startsWith("data:") ? "i:" + r.av : (r.avatar || "p:0"), tg: !!r.tg }; }
  async session(uid) { const tok = rnd(32); this.sql.exec("INSERT INTO sessions VALUES(?,?,?)", await sha(tok), uid, Date.now()); return tok; }
  async user(req) {
    const m = (req.headers.get("authorization") || "").match(/^Bearer ([a-f0-9]{64})$/); if (!m) return null;
    const s = this.one("SELECT uid FROM sessions WHERE th=?", await sha(m[1])); return s && this.one("SELECT * FROM users WHERE id=?", s.uid);
  }
  async tg(chat, text) {
    if (!this.env.TG_TOKEN) return;  // local tests run without a bot
    await fetch(`https://api.telegram.org/bot${this.env.TG_TOKEN}/sendMessage`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ chat_id: chat, text }) }).catch(() => {});
  }
  async fetch(req) {
    const u = new URL(req.url), p = u.pathname, out = (o, st) => Response.json(o, { status: st || 200, headers: ACORS });
    let body = {};
    if (req.method === "POST") { const t = await req.text(); if (t.length > 300000) return out({ err: "too big" }, 413); try { body = t ? JSON.parse(t) : {}; } catch (e) { return out({ err: "bad json" }, 400); } }
    this.sql.exec("DELETE FROM codes WHERE created<?", Date.now() - CODE_TTL);

    if (p === "/internal/verify") {  // called by Room objects only (this path is not routed from outside)
      const m = String(body.tok || ""); if (!/^[a-f0-9]{64}$/.test(m)) return out({}, 403);
      const s = this.one("SELECT uid FROM sessions WHERE th=?", await sha(m)), r = s && this.one("SELECT * FROM users WHERE id=?", s.uid);
      return r ? out({ uid: r.id, display: r.display, av: this.pub(r).avatar }) : out({}, 403);
    }
    if (p.startsWith("/a/")) {  // avatar image
      const r = this.one("SELECT avatar FROM users WHERE id=?", p.slice(3));
      const m = r && /^data:(image\/(?:jpeg|png|webp));base64,(.+)$/.exec(r.avatar || "");
      if (!m) return new Response("no avatar", { status: 404, headers: ACORS });
      return new Response(Uint8Array.from(atob(m[2]), c => c.charCodeAt(0)), { headers: Object.assign({ "content-type": m[1], "cache-control": "public, max-age=86400" }, ACORS) });
    }
    if (p.startsWith("/tg/")) {  // Telegram webhook
      if (!this.env.TG_SECRET || p !== "/tg/" + this.env.TG_SECRET) return new Response("no", { status: 403 });
      const msg = body.message || {}, from = msg.from && String(msg.from.id), chat = msg.chat && msg.chat.id, m = /^\/start ([LR][a-f0-9]{24})$/.exec(msg.text || "");
      if (!from) return new Response("ok");
      const c = m && this.one("SELECT * FROM codes WHERE code=?", m[1]);
      if (!c) { await this.tg(chat, "Hi! I help Mafia Dealer players link their account and reset a forgotten password. Use the buttons in the app to start."); return new Response("ok"); }
      const r = this.one("SELECT * FROM users WHERE id=?", c.uid);
      if (c.kind === "link" && r) {
        this.sql.exec("UPDATE users SET tg=? WHERE id=?", from, r.id); this.sql.exec("DELETE FROM codes WHERE code=?", c.code);
        await this.tg(chat, `Done! Your Telegram is now linked to the Mafia Dealer account "${r.uname}". You can use it to reset a forgotten password.`);
      } else if (c.kind === "reset" && r) {
        if (r.tg === from) { this.sql.exec("UPDATE codes SET ok=1 WHERE code=?", c.code); await this.tg(chat, `Verified. Go back to Mafia Dealer to set a new password for "${r.uname}".`); }
        else await this.tg(chat, "This Telegram account is not the one linked to that Mafia Dealer account, so the password can't be reset from here.");
      }
      return new Response("ok");
    }
    const bot = this.env.TG_BOT || "";
    if (p === "/acc/signup") {
      const un = String(body.uname || "").trim(), pw = String(body.pass || "");
      if (!UNAME.test(un)) return out({ err: "uname" }, 400);
      if (pw.length < 6 || pw.length > 100) return out({ err: "pass" }, 400);
      if (this.one("SELECT id FROM users WHERE uname=?", un)) return out({ err: "taken" }, 409);
      const id = rnd(8), salt = rnd(16);
      this.sql.exec("INSERT INTO users(id,uname,salt,hash,display,created) VALUES(?,?,?,?,?,?)", id, un, salt, await pbkdf2(pw, salt), un.slice(0, 18), Date.now());
      return out({ tok: await this.session(id), user: this.pub(this.one("SELECT * FROM users WHERE id=?", id)) });
    }
    if (p === "/acc/login") {
      const r = this.one("SELECT * FROM users WHERE uname=?", String(body.uname || "").trim());
      if (!r) return out({ err: "wrong" }, 401);
      if (r.lock > Date.now()) return out({ err: "locked", until: r.lock }, 429);
      if (!same(await pbkdf2(String(body.pass || ""), r.salt), r.hash)) {
        const f = r.fails + 1; this.sql.exec("UPDATE users SET fails=?, lock=? WHERE id=?", f >= 5 ? 0 : f, f >= 5 ? Date.now() + CODE_TTL : 0, r.id);
        return out({ err: f >= 5 ? "locked" : "wrong" }, f >= 5 ? 429 : 401);
      }
      this.sql.exec("UPDATE users SET fails=0, lock=0 WHERE id=?", r.id);
      return out({ tok: await this.session(r.id), user: this.pub(r) });
    }
    if (p === "/acc/reset/start") {
      const r = this.one("SELECT * FROM users WHERE uname=?", String(body.uname || "").trim());
      if (!r) return out({ err: "nouser" }, 404);
      if (!r.tg) return out({ err: "notg" }, 409);
      const code = "R" + rnd(12); this.sql.exec("INSERT INTO codes(code,kind,uid,created) VALUES(?,?,?,?)", code, "reset", r.id, Date.now());
      return out({ code, bot });
    }
    if (p === "/acc/reset/status") { const c = this.one("SELECT ok FROM codes WHERE code=? AND kind='reset'", u.searchParams.get("code") || ""); return out({ ok: !!(c && c.ok), gone: !c }); }
    if (p === "/acc/reset/finish") {
      const c = this.one("SELECT * FROM codes WHERE code=? AND kind='reset' AND ok=1", String(body.code || "")), pw = String(body.pass || "");
      if (!c) return out({ err: "code" }, 403);
      if (pw.length < 6 || pw.length > 100) return out({ err: "pass" }, 400);
      const salt = rnd(16);
      this.sql.exec("UPDATE users SET salt=?, hash=?, fails=0, lock=0 WHERE id=?", salt, await pbkdf2(pw, salt), c.uid);
      this.sql.exec("DELETE FROM sessions WHERE uid=?", c.uid); this.sql.exec("DELETE FROM codes WHERE code=?", c.code);  // other phones are signed out
      return out({ tok: await this.session(c.uid), user: this.pub(this.one("SELECT * FROM users WHERE id=?", c.uid)) });
    }
    // everything below needs a signed-in phone
    const me = await this.user(req); if (!me) return out({ err: "auth" }, 401);
    if (p === "/acc/me") return out({ user: this.pub(me) });
    if (p === "/acc/profile") {
      const d = String(body.display ?? me.display).trim().slice(0, 18) || me.uname, fav = ROLES.includes(body.fav) ? body.fav : me.fav;
      let av = me.avatar, ver = me.av;
      if (typeof body.avatar === "string" && body.avatar !== this.pub(me).avatar) {
        if (/^p:\d{1,2}$/.test(body.avatar)) av = body.avatar;
        else if (/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(body.avatar) && body.avatar.length < 200000) av = body.avatar;
        else return out({ err: "avatar" }, 400);
        ver++;
      }
      this.sql.exec("UPDATE users SET display=?, fav=?, avatar=?, av=? WHERE id=?", d, fav, av, ver, me.id);
      return out({ user: this.pub(this.one("SELECT * FROM users WHERE id=?", me.id)) });
    }
    if (p === "/acc/tglink") { const code = "L" + rnd(12); this.sql.exec("INSERT INTO codes(code,kind,uid,created) VALUES(?,?,?,?)", code, "link", me.id, Date.now()); return out({ code, bot }); }
    if (p === "/acc/logout") { const m = (req.headers.get("authorization") || "").slice(7); this.sql.exec("DELETE FROM sessions WHERE th=?", await sha(m)); return out({ ok: true }); }
    if (p === "/acc/delete") {
      if (!same(await pbkdf2(String(body.pass || ""), me.salt), me.hash)) return out({ err: "wrong" }, 401);
      for (const t of ["sessions", "codes"]) this.sql.exec(`DELETE FROM ${t} WHERE uid=?`, me.id);
      this.sql.exec("DELETE FROM users WHERE id=?", me.id); return out({ ok: true });
    }
    return out({ err: "unknown" }, 404);
  }
}
