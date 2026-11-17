// Shapes of the app's main state. Types only: nothing here runs.

type Role = 'mafia' | 'doctor' | 'detective' | 'citizen';
type Winner = 'mafia' | 'citizens';

interface Rules {
  skip: boolean; decoy: boolean; self: boolean; rep: boolean; reveal: boolean; timer: number;
  norep: boolean; saverev: boolean; nightT: number; ghost: boolean; skipVote: boolean;
  voice?: boolean; sfx?: boolean;  // pre-v2.4 settings, moved to S.vol on load
}

interface User { id: string; uname: string; display: string; avatar: string; fav: string; tg?: boolean }

/** Everything saved on the phone (localStorage 'mafiaDealer.v1'). */
interface Settings {
  lang: string; theme?: string; intro?: number;
  players: string[]; roster: string[];
  counts: { mafia: number; doctor: number; detective: number };
  rules: Rules;
  vol: { voice: number; sfx: number } | null;
  host: { buzzMax: number; kick: 'lobby' | 'any' };
  game: Game | null; log: LogEntry[];
  mpName?: string; mpLastHost?: string; relay?: string;
  acct?: { tok: string; u: User } | null;
  latest?: { code: number; name: string; url: string; notes: string; at: number };
  devKey?: string; group?: { code: string } | null; gcache?: LogEntry[] | null; gsent?: number[]; gsync?: number;
  hideOnline?: boolean;  // "Show me as online" switched off
  fpanel?: boolean;  // friends drawer left open
  ftabY?: number;
  bellSeen?: number;
  nlog?: NLog[];
  lastVer?: number;  // the version that last ran here ("Updated to" once after an update)  // the bell's history, 24 h  // when the bell was last opened (newer notes count as new)  // where the friends tab was dragged to (px from the top)
}

/** Another account as the relay shows it. rel: 'ok' friends, 'out' I asked, 'in' they asked, '' none, 'me'. on/st only for friends. */
interface Friend { id: string; uname: string; display: string; avatar: string; fav: string; rel: string; on?: boolean; st?: string; op?: boolean }  // op: in an online lobby (can ask to join)
/** A room invite from a friend (relay /acc/inbox). */
interface Invite { id: number; code: string; at: number; from: Friend; ans?: number }  // ans: "let you in" (v2.13)
/** A note from the relay (v2.11): kind 'acc' = from accepted my friend request. */
interface Note { id: number; kind: string; at: number; from: Friend }
/** The bell's history on this phone (v2.12): k inv | jr | req | acc; st '' waiting, else joined | letin | accepted | declined | dismissed | expired | gone. */
interface NLog { key: string; k: string; id: any; from: Friend; at: number; code?: string; st: string; done?: number; ans?: number }

/** What happened in a game, for the recap and the stats. Indexes are seats. */
interface GameEv { first: number | null; saves: number[]; caught: string[]; kills?: number[]; outs?: number[] }

/** The game being played (G). Single phone and the multiplayer host share it; mp fields are host-only. */
interface Game {
  names: string[]; roles: Role[]; alive: boolean[]; acc: (string | null)[]; ev: GameEv;
  day: number; phase: string; i: number; order?: number[];
  sel: any;  // seat number, 'skip', 'none' or null
  mode: string; revealed: boolean;
  skipUsed: boolean; lastTarget?: number | null; savedP?: number | null;
  act: { mafia?: Record<number, any>; doctor?: Record<number, any>; detective?: Record<number, any> };
  lastProt: Record<number, any>; hist: string[]; morning: number | null; ballots: Record<number, any>;
  verdict: { j: number | null; kind: string; tally: string } | null; winner: Winner | null;
  logId?: number; logValid?: boolean;
  mp?: boolean; ids?: string[]; done?: Record<number, boolean>; votes?: Record<number, any>;
  hostTurn?: boolean; hostRes?: boolean; nightEnd?: number; skipped?: number; voteId?: number; open?: boolean;
}

/** A finished game in the history (S.log, or S.gcache in a group). */
interface LogEntry {
  id: number; names: string[]; roles: Role[]; alive: boolean[]; winner: Winner; days: number; hist: string[];
  valid: boolean; ev: GameEv; acc: (string | null)[] | null; mine?: boolean;
}

/** A player in the room list every phone gets (room.players). */
interface RoomPlayer { name: string; on: boolean; host?: boolean; uid?: string | null; av?: string; old?: boolean; c?: number; out?: boolean }  // c: chat handle, out: out of the game

/** A player in the host's room. */
interface MpPlayer { name: string; seen: number; on: boolean; v: number; uid: string | null; uav: string; buzz?: number; cn?: number }

/** Roles dealt in a room, before the game starts (MP.game). */
interface MpDeal { deal: number; ids: string[]; names: string[]; roles: Role[]; ready: Record<string, boolean> }

/** The host's link to the players: native Net (Wi-Fi) or onlineNet() (relay). */
interface HostNet {
  start(port: number): void; put(k: string, v: string): void; take(): string | null; clear(): void; ip(): string;
  bc?(v: any): void; close?(): void; to?(id: string, v: any): boolean;
}

/** Multiplayer state (MP), for both the host and the players. */
interface Mp {
  role: 'host' | 'client' | null; status: string; online?: { code: string; key?: string } | null; lastMode?: string;
  // host
  players: Record<string, MpPlayer>; kicked?: Record<string, any>; seq: number; pubAt?: number; game?: MpDeal | null; myIp?: string;
  // player
  id?: string; host: { ip: string; name: string } | null; room: any; last?: string; roomName?: string; hostOn?: number;
  ws?: WebSocket | null; wsAt?: number; everOk?: boolean; joinedAt?: number; lat: number; lastOk?: number; hb?: number; busy?: boolean;
  helloAt?: number; hellos?: number[]; scanTok: number; pct: number; sig: string; rescan?: boolean; rescanAt?: number;
  sel?: any; selKey?: string; sent?: { k: string; sel: any } | null; sentDeal?: number; readyDeal?: number; endHide?: number;
  timer: any;
}
