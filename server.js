import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { extname, join, resolve } from "node:path";
import { spawn } from "node:child_process";
import { createHash, randomBytes, createCipheriv, createDecipheriv } from "node:crypto";
import pg from "pg";

const root = resolve(".");
const publicDir = join(root, "public");
const port = Number(process.env.PORT || 5173);
const tnoodleBaseUrl = process.env.TNOODLE_BASE_URL || "http://127.0.0.1:2014";
const tnoodleJar = process.env.TNOODLE_JAR || join(root, "vendor", "TNoodle-WCA-1.2.3.jar");
const javaExe = process.env.JAVA_EXE || findPortableJava();
const javaHelperDir = join(root, "build", "java");
const appUrl = process.env.APP_URL || `http://127.0.0.1:${port}`;
const googleClientId = process.env.GOOGLE_CLIENT_ID || "";
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET || "";
const cookieName = "cubehub_session";
const { Pool } = pg;
const pool = process.env.DATABASE_URL ? new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : undefined
}) : null;
const encryptionKey = loadEncryptionKey();

const events = {
  "222": {
    id: "222",
    label: "2x2",
    tnoodleId: "222",
    fallbackLength: 11
  },
  "333": {
    id: "333",
    label: "3x3",
    tnoodleId: "333",
    fallbackLength: 21
  },
  "444": {
    id: "444",
    label: "4x4",
    tnoodleId: "444",
    fallbackLength: 40
  },
  "555": {
    id: "555",
    label: "5x5",
    tnoodleId: "555",
    fallbackLength: 60
  },
  "666": {
    id: "666",
    label: "6x6",
    tnoodleId: "666",
    fallbackLength: 80
  },
  "777": {
    id: "777",
    label: "7x7",
    tnoodleId: "777",
    fallbackLength: 100
  },
  "333bf": {
    id: "333bf",
    label: "3x3 Blindfolded",
    tnoodleId: "333bf",
    fallbackLength: 21
  },
  "333fm": {
    id: "333fm",
    label: "3x3 Fewest Moves",
    tnoodleId: "333fm",
    fallbackLength: 21
  },
  "333oh": {
    id: "333oh",
    label: "3x3 One-Handed",
    tnoodleId: "333oh",
    fallbackLength: 21
  },
  "clock": {
    id: "clock",
    label: "Clock",
    tnoodleId: "clock",
    fallbackLength: 18
  },
  "minx": {
    id: "minx",
    label: "Megaminx",
    tnoodleId: "minx",
    fallbackLength: 70
  },
  "pyram": {
    id: "pyram",
    label: "Pyraminx",
    tnoodleId: "pyram",
    fallbackLength: 12
  },
  "skewb": {
    id: "skewb",
    label: "Skewb",
    tnoodleId: "skewb",
    fallbackLength: 10
  },
  "sq1": {
    id: "sq1",
    label: "Square-1",
    tnoodleId: "sq1",
    fallbackLength: 14
  },
  "444bf": {
    id: "444bf",
    label: "4x4 Blindfolded",
    tnoodleId: "444bf",
    fallbackLength: 40
  },
  "555bf": {
    id: "555bf",
    label: "5x5 Blindfolded",
    tnoodleId: "555bf",
    fallbackLength: 60
  },
  "333mbf": {
    id: "333mbf",
    label: "3x3 Multi-Blind",
    tnoodleId: "333mbf",
    fallbackLength: 21
  }
};

let tnoodleStarted = false;
let tnoodleProcess = null;
let scrambleChain = Promise.resolve();

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml; charset=utf-8"
};

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url || "/", `http://${req.headers.host}`);
    if (url.pathname === "/auth/google") return startGoogleLogin(req, res);
    if (url.pathname === "/auth/google/callback") return finishGoogleLogin(req, url, res);
    if (url.pathname === "/api/logout" && req.method === "POST") return logout(req, res);
    if (url.pathname === "/api/me") return json(res, { user: await currentUser(req) });
    if (url.pathname === "/api/account" && req.method === "GET") return getAccount(req, res);
    if (url.pathname === "/api/account" && req.method === "POST") return saveAccount(req, res);
    if (url.pathname === "/api/solves" && req.method === "GET") return listSolves(req, res);
    if (url.pathname === "/api/solves" && req.method === "POST") return saveSolve(req, res);
    if (url.pathname.startsWith("/api/solves/") && req.method === "PATCH") return updateSolve(req, url, res);
    if (url.pathname.startsWith("/api/solves/") && req.method === "DELETE") return deleteSolve(req, url, res);
    if (url.pathname === "/api/timer-settings" && req.method === "GET") return getTimerSettings(req, res);
    if (url.pathname === "/api/timer-settings" && req.method === "POST") return saveTimerSettings(req, res);
    if (url.pathname === "/api/rooms" && req.method === "GET") return listRooms(req, res);
    if (url.pathname === "/api/rooms/join" && req.method === "POST") return joinRoom(req, res);
    if (url.pathname === "/api/rooms/finish" && req.method === "POST") return finishRoomSolve(req, res);
    if (url.pathname === "/api/events") {
      return json(res, { events: Object.values(events) });
    }

    if (url.pathname === "/api/scramble") {
      const eventId = url.searchParams.get("event") || "333";
      return json(res, await queuedGetScramble(eventId));
    }

    return serveStatic(url.pathname, res);
  } catch (error) {
    console.error(error);
    json(res, { error: "Server fail." }, 500);
  }
});

server.listen(port, () => {
  console.log(`Cube timer running at http://127.0.0.1:${port}`);
});

initDatabase().catch((error) => {
  console.error("Database init failed:", error.message);
});

process.on("exit", () => {
  if (tnoodleProcess) tnoodleProcess.kill();
});

async function getScramble(eventId) {
  const event = events[eventId];
  if (!event) {
    return { error: "Unknown event.", supportedEvents: Object.keys(events) };
  }

  const official = await getTnoodleScramble(event);
  if (official) return official;

  const scramble = generateFallbackScramble(event.fallbackLength);
  return {
    event: event.id,
    source: "development-fallback",
    official: false,
    scramble,
    imageSvg: cubeSvgForScramble(scramble),
    note: "TNoodle no run. Install Java and set TNOODLE_JAR or TNOODLE_BASE_URL for official scrambles."
  };
}

function queuedGetScramble(eventId) {
  const task = scrambleChain.catch(() => {}).then(() => getScramble(eventId));
  scrambleChain = task.catch(() => {});
  return task;
}

async function getTnoodleScramble(event) {
  const direct = await getDirectTnoodleScramble(event);
  if (direct) return direct;

  await ensureTnoodleStarted();

  const endpoints = [
    `/api/scramble?event=${encodeURIComponent(event.tnoodleId)}`,
    `/scramble/${encodeURIComponent(event.tnoodleId)}.json`,
    `/scramble/.json?event=${encodeURIComponent(event.tnoodleId)}`,
    `/wca/scramble?event=${encodeURIComponent(event.tnoodleId)}`
  ];

  for (const endpoint of endpoints) {
    try {
      const response = await fetch(`${tnoodleBaseUrl}${endpoint}`, {
        signal: AbortSignal.timeout(2500)
      });
      if (!response.ok) continue;
      const contentType = response.headers.get("content-type") || "";
      const payload = contentType.includes("json")
        ? await response.json()
        : await response.text();
      const parsed = normalizeTnoodlePayload(payload, event.id);
      if (parsed) return parsed;
    } catch {
      // Try next known TNoodle shape.
    }
  }

  return null;
}

async function ensureTnoodleStarted() {
  if (tnoodleStarted || process.env.TNOODLE_BASE_URL) return;
  tnoodleStarted = true;
  if (!existsSync(tnoodleJar)) return;

  try {
    if (!javaExe) return;
    tnoodleProcess = spawn(javaExe, ["-classpath", tnoodleJar, "org.worldcubeassociation.tnoodle.deployable.jar.WebscramblesServer", "--noReexec"], {
      cwd: root,
      stdio: "ignore",
      windowsHide: true
    });
    tnoodleProcess.unref();
    await sleep(1500);
  } catch {
    tnoodleProcess = null;
  }
}

async function getDirectTnoodleScramble(event) {
  if (!javaExe || !existsSync(tnoodleJar) || !existsSync(join(javaHelperDir, "TNoodleSingleScramble.class"))) {
    return null;
  }

  try {
    const classpath = `${tnoodleJar}${process.platform === "win32" ? ";" : ":"}${javaHelperDir}`;
    const output = await runProcess(javaExe, ["-classpath", classpath, "TNoodleSingleScramble", event.id], 45000);
    const payload = JSON.parse(output);
    return officialPayload(event.id, payload.scramble, payload.imageSvg);
  } catch (error) {
    console.error("Direct TNoodle failed:", error.message);
    return null;
  }
}

function normalizeTnoodlePayload(payload, eventId) {
  if (typeof payload === "string") {
    const scramble = extractScrambleText(payload);
    if (!scramble) return null;
    return officialPayload(eventId, scramble, cubeSvgForScramble(scramble));
  }

  const scramble =
    payload.scramble ||
    payload.scramble_string ||
    payload.scrambles?.[0]?.scramble ||
    payload.scrambles?.[0]?.scramble_string ||
    payload.scrambles?.[0] ||
    payload[eventId]?.scramble ||
    payload[eventId]?.[0];

  if (typeof scramble !== "string") return null;
  const imageSvg = payload.imageSvg || payload.svg || payload.image || cubeSvgForScramble(scramble);
  return officialPayload(eventId, scramble, imageSvg);
}

function officialPayload(eventId, scramble, imageSvg) {
  return {
    event: eventId,
    source: "tnoodle",
    official: true,
    scramble: scramble.trim(),
    imageSvg
  };
}

function extractScrambleText(text) {
  const trimmed = text.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  const match = trimmed.match(/(?:[URFDLB][2']?\s*){15,}/);
  return match?.[0]?.trim() || null;
}

function generateFallbackScramble(length) {
  const faces = ["U", "D", "R", "L", "F", "B"];
  const suffixes = ["", "'", "2"];
  const axis = { U: "y", D: "y", R: "x", L: "x", F: "z", B: "z" };
  const moves = [];
  let lastFace = "";
  let lastAxis = "";

  while (moves.length < length) {
    const face = faces[Math.floor(Math.random() * faces.length)];
    if (face === lastFace || axis[face] === lastAxis) continue;
    const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];
    moves.push(`${face}${suffix}`);
    lastFace = face;
    lastAxis = axis[face];
  }

  return moves.join(" ");
}

function cubeSvgForScramble(scramble) {
  const stickers = createSolvedStickers();
  for (const move of scramble.split(/\s+/).filter(Boolean)) applyMove(stickers, move);

  const faceOrder = [
    ["", "U", ""],
    ["L", "F", "R"],
    ["", "D", ""],
    ["", "B", ""]
  ];
  const tile = 22;
  const gap = 2;
  const faceGap = 8;
  const origin = 8;
  const colors = { U: "#ffffff", D: "#ffd500", F: "#009b48", B: "#0046ad", R: "#b71234", L: "#ff5800" };
  let body = `<rect width="100%" height="100%" rx="10" fill="#16181f"/>`;

  for (let row = 0; row < faceOrder.length; row += 1) {
    for (let col = 0; col < faceOrder[row].length; col += 1) {
      const face = faceOrder[row][col];
      if (!face) continue;
      const x = origin + col * (tile * 3 + gap * 2 + faceGap);
      const y = origin + row * (tile * 3 + gap * 2 + faceGap);
      body += drawFace(stickers, face, x, y, tile, gap, colors);
    }
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 250 330" role="img" aria-label="Scrambled 3x3 cube net">${body}</svg>`;
}

function drawFace(stickers, face, x, y, tile, gap, colors) {
  const normalByFace = {
    U: [0, 1, 0],
    D: [0, -1, 0],
    F: [0, 0, 1],
    B: [0, 0, -1],
    R: [1, 0, 0],
    L: [-1, 0, 0]
  };
  const normal = normalByFace[face];
  let markup = "";

  for (const sticker of stickers.filter((item) => sameVec(item.normal, normal))) {
    const [r, c] = faceRowCol(face, sticker.pos);
    markup += `<rect x="${x + c * (tile + gap)}" y="${y + r * (tile + gap)}" width="${tile}" height="${tile}" rx="3" fill="${colors[sticker.color]}" stroke="#0b0c10" stroke-width="1.4"/>`;
  }

  return markup;
}

function createSolvedStickers() {
  const stickers = [];
  const faces = [
    ["U", [0, 1, 0]],
    ["D", [0, -1, 0]],
    ["F", [0, 0, 1]],
    ["B", [0, 0, -1]],
    ["R", [1, 0, 0]],
    ["L", [-1, 0, 0]]
  ];

  for (const [color, normal] of faces) {
    for (const a of [-1, 0, 1]) {
      for (const b of [-1, 0, 1]) {
        stickers.push({ color, normal: [...normal], pos: positionForNormal(normal, a, b) });
      }
    }
  }
  return stickers;
}

function positionForNormal([x, y, z], a, b) {
  if (y === 1) return [a, 1, -b];
  if (y === -1) return [a, -1, b];
  if (z === 1) return [a, -b, 1];
  if (z === -1) return [-a, -b, -1];
  if (x === 1) return [1, -b, -a];
  return [-1, -b, a];
}

function faceRowCol(face, [x, y, z]) {
  if (face === "U") return [z + 1, x + 1];
  if (face === "D") return [1 - z, x + 1];
  if (face === "F") return [1 - y, x + 1];
  if (face === "B") return [1 - y, 1 - x];
  if (face === "R") return [1 - y, 1 - z];
  return [1 - y, z + 1];
}

function applyMove(stickers, move) {
  const face = move[0];
  const turns = move.endsWith("2") ? 2 : move.endsWith("'") ? 3 : 1;
  for (let i = 0; i < turns; i += 1) {
    for (const sticker of stickers) {
      if (inLayer(sticker.pos, face)) {
        sticker.pos = rotateVec(sticker.pos, face);
        sticker.normal = rotateVec(sticker.normal, face);
      }
    }
  }
}

function inLayer([x, y, z], face) {
  return (
    (face === "U" && y === 1) ||
    (face === "D" && y === -1) ||
    (face === "F" && z === 1) ||
    (face === "B" && z === -1) ||
    (face === "R" && x === 1) ||
    (face === "L" && x === -1)
  );
}

function rotateVec([x, y, z], face) {
  if (face === "U") return [z, y, -x];
  if (face === "D") return [-z, y, x];
  if (face === "F") return [y, -x, z];
  if (face === "B") return [-y, x, z];
  if (face === "R") return [x, z, -y];
  return [x, -z, y];
}

function sameVec(a, b) {
  return a[0] === b[0] && a[1] === b[1] && a[2] === b[2];
}

async function serveStatic(pathname, res) {
  const safePath = pathname === "/" ? "/index.html" : pathname;
  const filePath = resolve(publicDir, `.${decodeURIComponent(safePath)}`);
  if (!filePath.startsWith(publicDir)) return text(res, "Forbidden", 403);

  try {
    const content = await readFile(filePath);
    res.writeHead(200, { "content-type": mimeTypes[extname(filePath)] || "application/octet-stream" });
    res.end(content);
  } catch {
    text(res, "Not found", 404);
  }
}

function json(res, payload, status = 200) {
  res.writeHead(status, { "content-type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(payload));
}

function text(res, payload, status = 200) {
  res.writeHead(status, { "content-type": "text/plain; charset=utf-8" });
  res.end(payload);
}

function sleep(ms) {
  return new Promise((resolveSleep) => setTimeout(resolveSleep, ms));
}

function runProcess(command, args, timeoutMs) {
  return new Promise((resolveRun, rejectRun) => {
    const child = spawn(command, args, {
      cwd: root,
      windowsHide: true
    });
    let stdout = "";
    let stderr = "";
    const timer = setTimeout(() => {
      child.kill();
      rejectRun(new Error("TNoodle timeout."));
    }, timeoutMs);

    child.stdout.on("data", (chunk) => {
      stdout += chunk;
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk;
    });
    child.on("error", (error) => {
      clearTimeout(timer);
      rejectRun(error);
    });
    child.on("close", (code) => {
      clearTimeout(timer);
      if (code === 0) {
        resolveRun(stdout);
      } else {
        rejectRun(new Error(stderr || `Process exited ${code}.`));
      }
    });
  });
}

function findPortableJava() {
  const candidates = [
    join(root, "tools", "java", "jdk-21.0.11+10", "bin", process.platform === "win32" ? "java.exe" : "java"),
    process.platform === "win32" ? "java.exe" : "java"
  ];
  return candidates.find((candidate) => candidate === "java.exe" || candidate === "java" || existsSync(candidate)) || null;
}

async function initDatabase() {
  if (!pool) return;
  await pool.query(`
    create table if not exists users (
      id bigserial primary key,
      google_sub text unique not null,
      email text not null,
      username text not null,
      avatar_url text,
      description_enc text,
      main_events_enc text,
      prs_enc text,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    );
    create table if not exists sessions (
      token_hash text primary key,
      user_id bigint not null references users(id) on delete cascade,
      created_at timestamptz not null default now(),
      expires_at timestamptz not null
    );
    create table if not exists room_participants (
      room_id text not null,
      user_id bigint not null references users(id) on delete cascade,
      event_id text not null,
      room_number int not null,
      status text not null default 'waiting',
      scramble text,
      joined_at timestamptz not null default now(),
      last_active_at timestamptz not null default now(),
      primary key (room_id, user_id)
    );
    create table if not exists solves (
      id uuid primary key,
      user_id bigint not null references users(id) on delete cascade,
      event_id text not null,
      solve_enc text not null,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    );
    create index if not exists solves_user_event_created_idx on solves (user_id, event_id, created_at desc);
    create table if not exists timer_settings (
      user_id bigint primary key references users(id) on delete cascade,
      settings_enc text not null,
      updated_at timestamptz not null default now()
    );
  `);
}

async function startGoogleLogin(req, res) {
  if (!googleClientId || !googleClientSecret || !pool || !encryptionKey) return text(res, "Google login not configured.", 503);
  const state = randomBytes(18).toString("base64url");
  res.setHeader("set-cookie", `cubehub_oauth_state=${state}; HttpOnly; SameSite=Lax; Path=/; Max-Age=600${secureCookie()}`);
  const params = new URLSearchParams({
    client_id: googleClientId,
    redirect_uri: `${appUrl}/auth/google/callback`,
    response_type: "code",
    scope: "openid email profile",
    state,
    access_type: "online",
    prompt: "select_account"
  });
  res.writeHead(302, { location: `https://accounts.google.com/o/oauth2/v2/auth?${params}` });
  res.end();
}

async function finishGoogleLogin(req, url, res) {
  if (!googleClientId || !googleClientSecret || !pool || !encryptionKey) return text(res, "Google login not configured.", 503);
  const state = url.searchParams.get("state") || "";
  const code = url.searchParams.get("code") || "";
  const cookieState = parseCookie(req.headers.cookie || "", "cubehub_oauth_state");
  if (!state || state !== cookieState || !code) return text(res, "Bad OAuth state.", 400);

  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: googleClientId,
      client_secret: googleClientSecret,
      redirect_uri: `${appUrl}/auth/google/callback`,
      grant_type: "authorization_code"
    })
  });
  if (!tokenResponse.ok) return text(res, "Google token exchange failed.", 502);
  const tokenPayload = await tokenResponse.json();
  const userInfoResponse = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
    headers: { authorization: `Bearer ${tokenPayload.access_token}` }
  });
  if (!userInfoResponse.ok) return text(res, "Google userinfo failed.", 502);
  const profile = await userInfoResponse.json();
  const user = await upsertGoogleUser(profile);
  const token = randomBytes(32).toString("base64url");
  await pool.query(
    "insert into sessions (token_hash, user_id, expires_at) values ($1, $2, now() + interval '30 days')",
    [hashToken(token), user.id]
  );
  res.writeHead(302, {
    "set-cookie": [
      `${cookieName}=${token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${60 * 60 * 24 * 30}${secureCookie()}`,
      `cubehub_oauth_state=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0${secureCookie()}`
    ],
    location: "/"
  });
  res.end();
}

async function upsertGoogleUser(profile) {
  const username = profile.name || profile.email?.split("@")[0] || "CubeHub user";
  const result = await pool.query(`
    insert into users (google_sub, email, username, avatar_url)
    values ($1, $2, $3, $4)
    on conflict (google_sub) do update set
      email = excluded.email,
      username = excluded.username,
      avatar_url = excluded.avatar_url,
      updated_at = now()
    returning id, google_sub, email, username, avatar_url, description_enc, main_events_enc, prs_enc
  `, [profile.sub, profile.email, username, profile.picture || null]);
  return result.rows[0];
}

async function currentUser(req) {
  if (!pool || !encryptionKey) return null;
  const token = parseCookie(req.headers.cookie || "", cookieName);
  if (!token) return null;
  const result = await pool.query(`
    select u.* from sessions s
    join users u on u.id = s.user_id
    where s.token_hash = $1 and s.expires_at > now()
  `, [hashToken(token)]);
  const user = result.rows[0];
  return user ? publicUser(user) : null;
}

async function requireUser(req, res) {
  const user = await currentUser(req);
  if (!user) {
    json(res, { error: "Login required." }, 401);
    return null;
  }
  return user;
}

async function getAccount(req, res) {
  const user = await requireUser(req, res);
  if (!user) return;
  json(res, { user });
}

async function saveAccount(req, res) {
  const user = await requireUser(req, res);
  if (!user) return;
  const body = await readJson(req);
  await pool.query(`
    update users set description_enc = $1, main_events_enc = $2, prs_enc = $3, updated_at = now()
    where id = $4
  `, [
    encryptText(body.description || ""),
    encryptText(body.mainEvents || ""),
    encryptText(JSON.stringify(body.prs || {})),
    user.id
  ]);
  json(res, { ok: true, user: await currentUser(req) });
}

async function listSolves(req, res) {
  const user = await requireUser(req, res);
  if (!user) return;
  const result = await pool.query(
    "select solve_enc from solves where user_id = $1 order by created_at desc",
    [user.id]
  );
  json(res, { solves: result.rows.map((row) => JSON.parse(decryptText(row.solve_enc))).filter(Boolean) });
}

async function saveSolve(req, res) {
  const user = await requireUser(req, res);
  if (!user) return;
  const solve = await readJson(req);
  if (!solve.id || !solve.event) return json(res, { error: "Bad solve." }, 400);
  await pool.query(`
    insert into solves (id, user_id, event_id, solve_enc, created_at)
    values ($1, $2, $3, $4, $5)
    on conflict (id) do update set solve_enc = excluded.solve_enc, updated_at = now()
  `, [
    solve.id,
    user.id,
    solve.event,
    encryptText(JSON.stringify(solve)),
    solve.createdAt ? new Date(solve.createdAt) : new Date()
  ]);
  json(res, { ok: true });
}

async function updateSolve(req, url, res) {
  const user = await requireUser(req, res);
  if (!user) return;
  const id = decodeURIComponent(url.pathname.split("/").pop() || "");
  const solve = await readJson(req);
  if (!id || solve.id !== id || !solve.event) return json(res, { error: "Bad solve." }, 400);
  const result = await pool.query(`
    update solves set event_id = $1, solve_enc = $2, updated_at = now()
    where id = $3 and user_id = $4
  `, [solve.event, encryptText(JSON.stringify(solve)), id, user.id]);
  if (result.rowCount === 0) return json(res, { error: "Solve not found." }, 404);
  json(res, { ok: true });
}

async function deleteSolve(req, url, res) {
  const user = await requireUser(req, res);
  if (!user) return;
  const id = decodeURIComponent(url.pathname.split("/").pop() || "");
  if (!id) return json(res, { error: "Bad solve." }, 400);
  const result = await pool.query("delete from solves where id = $1 and user_id = $2", [id, user.id]);
  if (result.rowCount === 0) return json(res, { error: "Solve not found." }, 404);
  json(res, { ok: true });
}

async function getTimerSettings(req, res) {
  const user = await requireUser(req, res);
  if (!user) return;
  const result = await pool.query("select settings_enc from timer_settings where user_id = $1", [user.id]);
  const settings = result.rows[0]?.settings_enc ? JSON.parse(decryptText(result.rows[0].settings_enc)) : null;
  json(res, { settings });
}

async function saveTimerSettings(req, res) {
  const user = await requireUser(req, res);
  if (!user) return;
  const settings = await readJson(req);
  await pool.query(`
    insert into timer_settings (user_id, settings_enc)
    values ($1, $2)
    on conflict (user_id) do update set settings_enc = excluded.settings_enc, updated_at = now()
  `, [user.id, encryptText(JSON.stringify(settings))]);
  json(res, { ok: true });
}

async function logout(req, res) {
  if (pool) {
    const token = parseCookie(req.headers.cookie || "", cookieName);
    if (token) await pool.query("delete from sessions where token_hash = $1", [hashToken(token)]);
  }
  res.writeHead(204, { "set-cookie": `${cookieName}=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0${secureCookie()}` });
  res.end();
}

async function listRooms(req, res) {
  const user = await requireUser(req, res);
  if (!user) return;
  await pool.query("delete from room_participants where status = 'waiting' and last_active_at < now() - interval '2 minutes'");
  const result = await pool.query(`
    select rp.room_id, rp.event_id, rp.room_number, rp.status, rp.scramble, u.id, u.username, u.email, u.avatar_url,
      u.description_enc, u.main_events_enc, u.prs_enc
    from room_participants rp
    join users u on u.id = rp.user_id
    order by rp.event_id, rp.room_number, u.username
  `);
  json(res, { rooms: result.rows.map((row) => ({ ...row, user: publicUser(row) })) });
}

async function joinRoom(req, res) {
  const user = await requireUser(req, res);
  if (!user) return;
  const body = await readJson(req);
  const event = events[body.eventId];
  const roomNumber = Number(body.roomNumber);
  if (!event || ![1, 2, 3].includes(roomNumber)) return json(res, { error: "Bad room." }, 400);
  const roomId = `${event.id}-${roomNumber}`;
  const existing = await pool.query("select scramble from room_participants where room_id = $1 limit 1", [roomId]);
  const scramble = existing.rows[0]?.scramble || (await getScramble(event.id)).scramble;
  await pool.query(`
    insert into room_participants (room_id, user_id, event_id, room_number, status, scramble)
    values ($1, $2, $3, $4, 'waiting', $5)
    on conflict (room_id, user_id) do update set status = 'waiting', scramble = excluded.scramble, last_active_at = now()
  `, [roomId, user.id, event.id, roomNumber, scramble]);
  json(res, { ok: true, roomId, scramble });
}

async function finishRoomSolve(req, res) {
  const user = await requireUser(req, res);
  if (!user) return;
  const body = await readJson(req);
  await pool.query("update room_participants set status = 'finished', last_active_at = now() where room_id = $1 and user_id = $2", [body.roomId, user.id]);
  const counts = await pool.query("select count(*)::int total, count(*) filter (where status = 'finished')::int finished, min(event_id) event_id from room_participants where room_id = $1", [body.roomId]);
  const row = counts.rows[0];
  if (row.total > 0 && row.total === row.finished) {
    const scramble = (await getScramble(row.event_id)).scramble;
    await pool.query("update room_participants set status = 'waiting', scramble = $1, last_active_at = now() where room_id = $2", [scramble, body.roomId]);
    return json(res, { ok: true, newScramble: scramble });
  }
  json(res, { ok: true });
}

function publicUser(user) {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    avatarUrl: user.avatar_url,
    description: decryptText(user.description_enc) || "",
    mainEvents: decryptText(user.main_events_enc) || "",
    prs: JSON.parse(decryptText(user.prs_enc) || "{}")
  };
}

function loadEncryptionKey() {
  const value = process.env.DATA_ENCRYPTION_KEY || "";
  if (!value) return null;
  const raw = /^[0-9a-f]{64}$/i.test(value) ? Buffer.from(value, "hex") : Buffer.from(value, "base64");
  return raw.length === 32 ? raw : null;
}

function encryptText(value) {
  if (!value) return null;
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey, iv);
  const encrypted = Buffer.concat([cipher.update(String(value), "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, encrypted]).toString("base64");
}

function decryptText(value) {
  if (!value) return "";
  const payload = Buffer.from(value, "base64");
  const iv = payload.subarray(0, 12);
  const tag = payload.subarray(12, 28);
  const encrypted = payload.subarray(28);
  const decipher = createDecipheriv("aes-256-gcm", encryptionKey, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString("utf8");
}

function hashToken(token) {
  return createHash("sha256").update(token).digest("hex");
}

async function readJson(req) {
  let body = "";
  for await (const chunk of req) body += chunk;
  return body ? JSON.parse(body) : {};
}

function parseCookie(header, name) {
  return header.split(";").map((part) => part.trim()).find((part) => part.startsWith(`${name}=`))?.slice(name.length + 1) || "";
}

function secureCookie() {
  return process.env.NODE_ENV === "production" ? "; Secure" : "";
}
