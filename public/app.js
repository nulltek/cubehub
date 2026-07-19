const timerEl = document.querySelector("#timer");
const timerStateEl = document.querySelector("#timerState");
const scrambleEl = document.querySelector("#scramble");
const cubeImageEl = document.querySelector("#cubeImage");
const timeListEl = document.querySelector("#timeList");
const statsEl = document.querySelector("#stats");
const historyPanelEl = document.querySelector("#historyPanel");
const openPanelEl = document.querySelector("#openPanel");
const closePanelEl = document.querySelector("#closePanel");
const newScrambleEl = document.querySelector("#newScramble");
const solveDetailEl = document.querySelector("#solveDetail");
const detailTimeEl = document.querySelector("#detailTime");
const detailScrambleEl = document.querySelector("#detailScramble");
const detailCommentEl = document.querySelector("#detailComment");
const closeDetailEl = document.querySelector("#closeDetail");
const penaltyNoneEl = document.querySelector("#penaltyNone");
const penaltyPlusTwoEl = document.querySelector("#penaltyPlusTwo");
const penaltyDnfEl = document.querySelector("#penaltyDnf");
const eventNameEl = document.querySelector("#eventName");
const panelTitleEl = document.querySelector("#panelTitle");
const eventSelectEl = document.querySelector("#eventSelect");
const cubePreviewEventEl = document.querySelector("#cubePreviewEvent");
const cubePreviewEl = document.querySelector(".cube-preview");
const dockTimesEl = document.querySelector("#dockTimes");
const dockImageEl = document.querySelector("#dockImage");
const dockHomeEl = document.querySelector("#dockHome");
const dockTimerEl = document.querySelector("#dockTimer");
const dockStatsEl = document.querySelector("#dockStats");
const dockReviewsEl = document.querySelector("#dockReviews");
const dockRoomsEl = document.querySelector("#dockRooms");
const dockAlgorithmsEl = document.querySelector("#dockAlgorithms");
const dockSettingsEl = document.querySelector("#dockSettings");
const homeViewEl = document.querySelector("#homeView");
const timerViewEl = document.querySelector("#timerView");
const homeStartButtonEl = document.querySelector("#homeStartButton");
const homeTimerCardEl = document.querySelector("#homeTimerCard");
const homeReviewsCardEl = document.querySelector("#homeReviewsCard");
const homeRoomsCardEl = document.querySelector("#homeRoomsCard");
const homeAlgorithmsCardEl = document.querySelector("#homeAlgorithmsCard");
const timesViewEl = document.querySelector("#timesView");
const backToTimerEl = document.querySelector("#backToTimer");
const timesScreenTitleEl = document.querySelector("#timesScreenTitle");
const mobileStatsEl = document.querySelector("#mobileStats");
const mobileTimeListEl = document.querySelector("#mobileTimeList");
const loginViewEl = document.querySelector("#loginView");
const accountViewEl = document.querySelector("#accountView");
const loginFormEl = document.querySelector("#loginForm");
const accountFormEl = document.querySelector("#accountForm");
const accountDescriptionEl = document.querySelector("#accountDescription");
const accountMainEventsEl = document.querySelector("#accountMainEvents");
const prGridEl = document.querySelector("#prGrid");
const reviewsViewEl = document.querySelector("#reviewsView");
const roomsViewEl = document.querySelector("#roomsView");
const algorithmsViewEl = document.querySelector("#algorithmsView");
const settingsViewEl = document.querySelector("#settingsView");
const settingsTitleEl = document.querySelector("#settingsTitle");
const settingsCopyEl = document.querySelector("#settingsCopy");
const holdDurationInputEl = document.querySelector("#holdDurationInput");
const inspectionToggleEl = document.querySelector("#inspectionToggle");
const blindInspectionToggleEl = document.querySelector("#blindInspectionToggle");
const inspectionDirectionSelectEl = document.querySelector("#inspectionDirectionSelect");
const displayModeSelectEl = document.querySelector("#displayModeSelect");
const beepToggleEl = document.querySelector("#beepToggle");
const inputModeSelectEl = document.querySelector("#inputModeSelect");
const manualEntryEl = document.querySelector("#manualEntry");
const manualEntryLabelEl = document.querySelector("#manualEntryLabel");
const manualTimeInputEl = document.querySelector("#manualTimeInput");
const rollingStatsEl = document.querySelector("#rollingStats");
const roomListEl = document.querySelector("#roomList");
const activeRoomEl = document.querySelector("#activeRoom");
const profileModalEl = document.querySelector("#profileModal");
const closeProfileEl = document.querySelector("#closeProfile");
const profileNameEl = document.querySelector("#profileName");
const profileDescriptionEl = document.querySelector("#profileDescription");
const profileMainEventsEl = document.querySelector("#profileMainEvents");
const profilePrsEl = document.querySelector("#profilePrs");

const storageKey = "cube-timer-solves-v1";
const settingsKey = "cube-timer-settings-v2";
const events = [
  { id: "222", label: "2x2" },
  { id: "333", label: "3x3" },
  { id: "333bf", label: "3x3 Blindfolded", blind: true },
  { id: "333fm", label: "3x3 Fewest Moves", fmc: true },
  { id: "333oh", label: "3x3 One-Handed" },
  { id: "444", label: "4x4" },
  { id: "444bf", label: "4x4 Blindfolded", blind: true },
  { id: "555", label: "5x5" },
  { id: "555bf", label: "5x5 Blindfolded", blind: true },
  { id: "666", label: "6x6" },
  { id: "777", label: "7x7" },
  { id: "333mbf", label: "3x3 Multi-Blind", blind: true },
  { id: "clock", label: "Clock" },
  { id: "minx", label: "Megaminx" },
  { id: "pyram", label: "Pyraminx" },
  { id: "skewb", label: "Skewb" },
  { id: "sq1", label: "Square-1" }
];
const defaultSettings = {
  holdDurationMs: 500,
  inspection: true,
  blindInspection: false,
  inspectionDirection: "down",
  displayMode: "decimals",
  beeps: false,
  inputMode: "timer"
};

let currentScramble = null;
let currentEvent = localStorage.getItem("cube-timer-event-v1") || "333";
if (!events.some((event) => event.id === currentEvent)) currentEvent = "333";
let solves = loadSolves();
let settings = loadSettings();
let account = null;
let currentView = "home";
let intendedView = "home";
let activeSolve = null;
let activeRoomId = null;
let roomAfkTimerId = null;
let roomStarted = false;
let roomsSnapshot = [];
let mode = "idle";
let holdBaseMode = "idle";
let holdTimerId = null;
let holdReady = false;
let holdStartedAt = 0;
let startAt = 0;
let elapsed = 0;
let inspectionStartedAt = 0;
let inspectionPenalty = "none";
let rafId = null;
let beepedMarks = new Set();

renderEventSelect();
renderPrGrid();
loadServerAccount();
renderSettings();
renderSolves();
renderRooms();
setPanel(!window.matchMedia("(max-width: 1180px)").matches);
setImagePanel(!window.matchMedia("(max-width: 920px)").matches);
setView("home");
loadScramble();

document.addEventListener("keydown", (event) => {
  if (event.code !== "Space" || event.repeat || isTypingTarget(event.target)) return;
  if (timerViewEl.classList.contains("hidden") || isTypingMode()) return;
  event.preventDefault();
  beginHold();
});

document.addEventListener("keyup", (event) => {
  if (event.code !== "Space" || isTypingTarget(event.target)) return;
  if (timerViewEl.classList.contains("hidden") || isTypingMode()) return;
  event.preventDefault();
  releaseHold();
});

timerEl.addEventListener("pointerdown", (event) => {
  if (timerViewEl.classList.contains("hidden") || isTypingMode()) return;
  event.preventDefault();
  timerEl.setPointerCapture(event.pointerId);
  beginHold();
});

timerEl.addEventListener("pointerup", (event) => {
  if (timerViewEl.classList.contains("hidden") || isTypingMode()) return;
  event.preventDefault();
  releaseHold();
});

timerEl.addEventListener("pointercancel", cancelHold);
manualEntryEl.addEventListener("submit", (event) => {
  event.preventDefault();
  saveManualSolve();
});
loginFormEl.addEventListener("submit", (event) => {
  event.preventDefault();
  window.location.href = "/auth/google";
});
accountFormEl.addEventListener("submit", (event) => {
  event.preventDefault();
  account = {
    ...account,
    description: accountDescriptionEl.value.trim(),
    mainEvents: accountMainEventsEl.value.trim(),
    prs: collectPrs()
  };
  saveServerAccount();
});
newScrambleEl.addEventListener("click", loadScramble);
closePanelEl.addEventListener("click", () => setPanel(false));
openPanelEl.addEventListener("click", () => setPanel(true));
closeDetailEl.addEventListener("click", closeSolveDetail);
detailCommentEl.addEventListener("input", () => updateActiveSolve({ comment: detailCommentEl.value }));
penaltyNoneEl.addEventListener("click", () => updatePenalty("none"));
penaltyPlusTwoEl.addEventListener("click", () => updatePenalty("+2"));
penaltyDnfEl.addEventListener("click", () => updatePenalty("DNF"));
eventSelectEl.addEventListener("change", (event) => selectEvent(event.target.value));
dockTimesEl.addEventListener("click", () => {
  if (!requireAuth("times")) return;
  if (isSmallScreen()) {
    setView("times");
  } else {
    setView("timer");
    setPanel(historyPanelEl.classList.contains("closed"));
  }
});
dockImageEl.addEventListener("click", () => {
  if (!requireAuth("timer")) return;
  setView("timer");
  setImagePanel(cubePreviewEl.classList.contains("closed"));
});
dockStatsEl.addEventListener("click", () => {
  if (!requireAuth("timer")) return;
  setView("timer");
  rollingStatsEl.focus?.();
});
dockHomeEl.addEventListener("click", () => setView("home"));
dockTimerEl.addEventListener("click", () => navigateFeature("timer"));
dockReviewsEl.addEventListener("click", () => navigateFeature("reviews"));
dockRoomsEl.addEventListener("click", () => navigateFeature("rooms"));
dockAlgorithmsEl.addEventListener("click", () => navigateFeature("algorithms"));
dockSettingsEl.addEventListener("click", () => currentView === "home" ? navigateFeature("account") : openTimerSettings());
homeStartButtonEl.addEventListener("click", () => navigateFeature("timer"));
homeTimerCardEl.addEventListener("click", () => navigateFeature("timer"));
homeReviewsCardEl.addEventListener("click", () => navigateFeature("reviews"));
homeRoomsCardEl.addEventListener("click", () => navigateFeature("rooms"));
homeAlgorithmsCardEl.addEventListener("click", () => navigateFeature("algorithms"));
backToTimerEl.addEventListener("click", () => setView("timer"));
closeProfileEl.addEventListener("click", () => profileModalEl.classList.add("hidden"));
for (const input of [holdDurationInputEl, inspectionToggleEl, blindInspectionToggleEl, inspectionDirectionSelectEl, displayModeSelectEl, beepToggleEl, inputModeSelectEl]) {
  input.addEventListener("change", saveSettingsFromForm);
}

async function loadScramble() {
  const event = getCurrentEvent();
  eventNameEl.textContent = event.label;
  cubePreviewEventEl.textContent = event.label;
  scrambleEl.textContent = "Loading scramble...";
  try {
    const response = await fetch(`/api/scramble?event=${encodeURIComponent(currentEvent)}`);
    currentScramble = await response.json();
    scrambleEl.textContent = currentScramble.scramble;
    cubeImageEl.innerHTML = currentScramble.imageSvg;
  } catch {
    scrambleEl.textContent = "Could not load scramble.";
  }
}

function beginHold() {
  if (mode === "running") {
    stopTimer();
    holdReady = false;
    holdBaseMode = "idle";
    return;
  }
  if (!currentScramble?.scramble || mode === "holding") return;
  if (mode !== "idle" && mode !== "inspection") return;
  holdBaseMode = mode;
  if (mode === "idle") mode = "holding";
  holdReady = false;
  holdStartedAt = performance.now();
  timerStateEl.textContent = "HOLD";
  timerEl.classList.add("is-holding");
  clearTimeout(holdTimerId);
  holdTimerId = setTimeout(() => {
    holdReady = true;
    timerStateEl.textContent = holdBaseMode === "inspection" ? "READY" : "RELEASE";
    timerEl.classList.add("is-ready");
  }, settings.holdDurationMs);
}

function releaseHold() {
  clearTimeout(holdTimerId);
  timerEl.classList.remove("is-holding", "is-ready");
  if (mode === "running") return;
  if (!holdReady || performance.now() - holdStartedAt < settings.holdDurationMs) {
    mode = holdBaseMode === "inspection" ? "inspection" : "idle";
    timerStateEl.textContent = mode === "inspection" ? "INSPECTION" : idleLabel();
    return;
  }
  if (holdBaseMode === "inspection") {
    startTimer();
    return;
  }
  shouldInspect() ? startInspection() : startTimer();
}

function cancelHold() {
  clearTimeout(holdTimerId);
  timerEl.classList.remove("is-holding", "is-ready");
  if (mode === "holding") mode = "idle";
  timerStateEl.textContent = mode === "inspection" ? "INSPECTION" : idleLabel();
}

function startInspection() {
  mode = "inspection";
  inspectionStartedAt = performance.now();
  inspectionPenalty = "none";
  beepedMarks = new Set();
  timerStateEl.textContent = "INSPECTION";
  tickInspection();
}

function tickInspection() {
  if (mode !== "inspection") return;
  const seconds = (performance.now() - inspectionStartedAt) / 1000;
  if (settings.beeps) {
    for (const mark of [8, 12, 15, 17]) {
      if (seconds >= mark && !beepedMarks.has(mark)) {
        beepedMarks.add(mark);
        beep();
      }
    }
  }
  inspectionPenalty = seconds >= 17 ? "DNF" : seconds >= 15 ? "+2" : "none";
  const shownSeconds = settings.inspectionDirection === "up" ? Math.floor(seconds) : Math.max(0, Math.ceil(15 - seconds));
  timerEl.textContent = seconds >= 17 ? "DNF" : seconds >= 15 ? "+2" : String(shownSeconds);
  timerStateEl.textContent = seconds >= 17 ? "DNF" : seconds >= 15 ? "+2" : "INSPECTION";
  rafId = requestAnimationFrame(tickInspection);
}

function startTimer() {
  if (!currentScramble?.scramble) return;
  cancelAnimationFrame(rafId);
  if (mode !== "inspection") inspectionPenalty = "none";
  mode = "running";
  elapsed = 0;
  startAt = performance.now();
  timerStateEl.textContent = "RUN";
  document.body.classList.add("is-running");
  tick();
}

function stopTimer() {
  mode = "idle";
  cancelAnimationFrame(rafId);
  elapsed = performance.now() - startAt;
  document.body.classList.remove("is-running");
  createSolve(Math.round(elapsed), inspectionPenalty);
  timerStateEl.textContent = idleLabel();
  timerEl.textContent = "0.00";
}

function tick() {
  elapsed = performance.now() - startAt;
  timerEl.textContent = formatRunningTime(elapsed);
  rafId = requestAnimationFrame(tick);
}

function saveManualSolve() {
  if (!currentScramble?.scramble) return;
  const event = getCurrentEvent();
  const value = manualTimeInputEl.value.trim();
  const parsed = event.fmc ? Number.parseInt(value, 10) : parseTypedTime(value);
  if (!Number.isFinite(parsed) || parsed < 0) return;
  event.fmc ? createSolve(parsed, "none", "moves") : createSolve(parsed, "none");
  manualTimeInputEl.value = "";
}

function createSolve(rawValue, penalty = "none", resultType = "time") {
  const solve = {
    id: crypto.randomUUID(),
    event: currentEvent,
    resultType,
    timeMs: resultType === "time" ? rawValue : null,
    moves: resultType === "moves" ? rawValue : null,
    penalty,
    comment: "",
    scramble: currentScramble.scramble,
    imageSvg: currentScramble.imageSvg,
    source: currentScramble.source,
    official: currentScramble.official,
    createdAt: new Date().toISOString()
  };
  solves.unshift(solve);
  saveSolves(solve, "create");
  renderSolves();
  showSolve(solve);
  loadScramble();
}

function renderSolves() {
  timeListEl.innerHTML = "";
  mobileTimeListEl.innerHTML = "";
  const event = getCurrentEvent();
  panelTitleEl.textContent = `${event.label} times`;
  timesScreenTitleEl.textContent = `${event.label} times`;
  const eventSolves = getEventSolves();
  for (const solve of eventSolves) {
    timeListEl.append(createTimeItem(solve));
    mobileTimeListEl.append(createTimeItem(solve));
  }

  if (eventSolves.length === 0) {
    timeListEl.append(createEmptyItem(event.label));
    mobileTimeListEl.append(createEmptyItem(event.label));
  }

  const best = bestResult(eventSolves);
  const statsMarkup = `
    <div><span>${eventSolves.length}</span><small>solves</small></div>
    <div><span>${best || "--"}</span><small>best</small></div>
  `;
  statsEl.innerHTML = statsMarkup;
  mobileStatsEl.innerHTML = statsMarkup;
  renderRollingStats(eventSolves);
}

function renderRollingStats(eventSolves = getEventSolves()) {
  const mo3 = meanOfLast(eventSolves, 3);
  const ao5 = averageOfLast(eventSolves, 5);
  const ao12 = averageOfLast(eventSolves, 12);
  rollingStatsEl.innerHTML = `
    <div><span>${mo3 || "--"}</span><small>mo3</small></div>
    <div><span>${ao5 || "--"}</span><small>ao5</small></div>
    <div><span>${ao12 || "--"}</span><small>ao12</small></div>
  `;
}

function createTimeItem(solve) {
  const item = document.createElement("li");
  const button = document.createElement("button");
  button.type = "button";
  button.className = "time-row";
  button.innerHTML = `<span>${formatSolveResult(solve)}</span><small>${solve.comment ? "note" : formatDate(solve.createdAt)}</small>`;
  button.addEventListener("click", () => showSolve(solve));
  item.append(button);
  return item;
}

function createEmptyItem(label) {
  const empty = document.createElement("li");
  empty.className = "empty-state";
  empty.textContent = `No ${label} solves yet. Use timer or typing input to add one.`;
  return empty;
}

function showSolve(solve) {
  activeSolve = solve;
  if (isSmallScreen()) setView("timer");
  detailTimeEl.textContent = formatSolveResult(solve);
  detailScrambleEl.textContent = solve.comment ? `${solve.scramble}  Comment: ${solve.comment}` : solve.scramble;
  detailCommentEl.value = solve.comment || "";
  solveDetailEl.classList.remove("hidden");
  if (solve.imageSvg) cubeImageEl.innerHTML = solve.imageSvg;
  setPenaltyButtonState(solve.penalty || "none");
}

function closeSolveDetail() {
  activeSolve = null;
  solveDetailEl.classList.add("hidden");
}

function updatePenalty(penalty) {
  updateActiveSolve({ penalty });
  if (activeSolve) showSolve(activeSolve);
}

function updateActiveSolve(patch) {
  if (!activeSolve) return;
  activeSolve = { ...activeSolve, ...patch };
  solves = solves.map((solve) => solve.id === activeSolve.id ? activeSolve : solve);
  saveSolves(activeSolve, "update");
  renderSolves();
}

function setPenaltyButtonState(penalty) {
  penaltyNoneEl.classList.toggle("is-selected", penalty === "none");
  penaltyPlusTwoEl.classList.toggle("is-selected", penalty === "+2");
  penaltyDnfEl.classList.toggle("is-selected", penalty === "DNF");
}

function setPanel(open) {
  historyPanelEl.classList.toggle("closed", !open);
  openPanelEl.classList.toggle("hidden", open);
  dockTimesEl.classList.toggle("is-active", currentView === "times" || open);
  dockTimesEl.setAttribute("aria-pressed", String(open));
}

function setImagePanel(open) {
  cubePreviewEl.classList.toggle("closed", !open);
  document.body.classList.toggle("image-panel-closed", !open);
  dockImageEl.classList.toggle("is-active", open);
  dockImageEl.setAttribute("aria-pressed", String(open));
}

function setView(view) {
  const home = view === "home";
  const login = view === "login";
  const accountView = view === "account";
  const timer = view === "timer";
  const times = view === "times";
  const reviews = view === "reviews";
  const rooms = view === "rooms";
  const algorithms = view === "algorithms";
  const settingsView = view === "settings";
  currentView = view;
  homeViewEl.classList.toggle("hidden", !home);
  loginViewEl.classList.toggle("hidden", !login);
  accountViewEl.classList.toggle("hidden", !accountView);
  timerViewEl.classList.toggle("hidden", !timer);
  timesViewEl.classList.toggle("hidden", !times);
  reviewsViewEl.classList.toggle("hidden", !reviews);
  roomsViewEl.classList.toggle("hidden", !rooms);
  algorithmsViewEl.classList.toggle("hidden", !algorithms);
  settingsViewEl.classList.toggle("hidden", !settingsView);
  dockHomeEl.classList.toggle("is-active", home);
  dockTimesEl.classList.toggle("is-active", times || !historyPanelEl.classList.contains("closed"));
  dockReviewsEl.classList.toggle("is-active", reviews);
  dockRoomsEl.classList.toggle("is-active", rooms);
  dockAlgorithmsEl.classList.toggle("is-active", algorithms);
  dockSettingsEl.classList.toggle("is-active", settingsView || accountView);
  document.body.classList.toggle("is-home", home);
  document.body.classList.toggle("is-timer", timer || times || settingsView);
  document.body.classList.toggle("is-room", rooms);
  document.body.classList.toggle("is-login", login);
  document.body.classList.toggle("is-account", accountView);
  document.body.classList.toggle("is-timer-page", timer);
  document.body.classList.toggle("is-times", times);
  document.body.classList.toggle("is-settings", settingsView);
  if (!timer) {
    setPanel(false);
    solveDetailEl.classList.add("hidden");
  }
  if (timer) applyInputMode();
  if (rooms) renderRooms();
}

function openTimerSettings() {
  if (!requireAuth("settings")) return;
  settingsTitleEl.textContent = "Timer settings";
  settingsCopyEl.textContent = "Control hold timing, WCA inspection, display behavior, beeps, and manual entry.";
  setView("settings");
}

function navigateFeature(view) {
  if (!requireAuth(view)) return;
  setView(view);
}

function requireAuth(view) {
  if (account?.username) return true;
  intendedView = view;
  setView("login");
  return false;
}

function renderEventSelect() {
  eventSelectEl.innerHTML = "";
  for (const event of events) {
    const option = document.createElement("option");
    option.value = event.id;
    option.textContent = event.label;
    eventSelectEl.append(option);
  }
  eventSelectEl.value = currentEvent;
}

function renderSettings() {
  holdDurationInputEl.value = String(settings.holdDurationMs);
  inspectionToggleEl.checked = settings.inspection;
  blindInspectionToggleEl.checked = settings.blindInspection;
  inspectionDirectionSelectEl.value = settings.inspectionDirection;
  displayModeSelectEl.value = settings.displayMode;
  beepToggleEl.checked = settings.beeps;
  inputModeSelectEl.value = settings.inputMode;
  applyInputMode();
}

function renderPrGrid() {
  prGridEl.innerHTML = "";
  for (const event of events) {
    const label = document.createElement("label");
    label.className = "field-block";
    label.innerHTML = `<span>${event.label} PR</span><input data-pr-event="${event.id}" placeholder="${event.fmc ? "moves" : "time"}" />`;
    prGridEl.append(label);
  }
}

function renderAccount() {
  if (!account) return;
  accountDescriptionEl.value = account.description || "";
  accountMainEventsEl.value = account.mainEvents || "";
  for (const input of prGridEl.querySelectorAll("[data-pr-event]")) {
    input.value = account.prs?.[input.dataset.prEvent] || "";
  }
}

async function loadServerAccount() {
  try {
    const response = await fetch(freshUrl("/api/me"), { cache: "no-store" });
    const payload = await response.json();
    account = payload.user;
    if (account?.username) await loadServerTimerData();
    renderAccount();
    renderRooms();
  } catch {
    account = null;
  }
}

async function saveServerAccount() {
  const response = await fetch("/api/account", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      description: account.description || "",
      mainEvents: account.mainEvents || "",
      prs: account.prs || {}
    })
  });
  if (response.status === 401) return setView("login");
  const payload = await response.json();
  account = payload.user;
  renderAccount();
  renderRooms();
}

async function loadServerTimerData() {
  try {
    const [solvesResponse, settingsResponse] = await Promise.all([
      fetch(freshUrl("/api/solves"), { cache: "no-store" }),
      fetch(freshUrl("/api/timer-settings"), { cache: "no-store" })
    ]);
    if (solvesResponse.ok) {
      const payload = await solvesResponse.json();
      if (Array.isArray(payload.solves)) {
        solves = payload.solves;
        localStorage.setItem(storageKey, JSON.stringify(solves));
        renderSolves();
      }
    }
    if (settingsResponse.ok) {
      const payload = await settingsResponse.json();
      if (payload.settings) {
        settings = normalizeSettings(payload.settings);
        localStorage.setItem(settingsKey, JSON.stringify(settings));
        renderSettings();
      }
    }
  } catch {
    // Local storage remains the offline fallback.
  }
}

async function saveServerSettings() {
  if (!account?.username) return;
  fetch("/api/timer-settings", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(settings)
  }).catch(() => {});
}

function collectPrs() {
  const prs = {};
  for (const input of prGridEl.querySelectorAll("[data-pr-event]")) {
    if (input.value.trim()) prs[input.dataset.prEvent] = input.value.trim();
  }
  return prs;
}

async function renderRooms() {
  if (account?.username) {
    try {
      const response = await fetch(freshUrl("/api/rooms"), { cache: "no-store" });
      if (response.ok) roomsSnapshot = (await response.json()).rooms || [];
    } catch {
      roomsSnapshot = [];
    }
  }
  roomListEl.innerHTML = "";
  for (const event of events) {
    for (let index = 1; index <= 3; index += 1) {
      const roomId = `${event.id}-${index}`;
      const count = roomsSnapshot.filter((entry) => entry.room_id === roomId).length;
      const button = document.createElement("button");
      button.type = "button";
      button.className = "room-card";
      button.innerHTML = `<span>${event.label}</span><strong>Room ${index}</strong><small>${count} users</small>`;
      button.addEventListener("click", () => enterRoom(roomId, event));
      roomListEl.append(button);
    }
  }
}

async function enterRoom(roomId, event) {
  if (!requireAuth("rooms")) return;
  activeRoomId = roomId;
  roomStarted = false;
  clearTimeout(roomAfkTimerId);
  activeRoomEl.innerHTML = `
    <span>${event.label} room</span>
    <strong>Loading scramble...</strong>
    <p class="afk-warning">Do not AFK. Start solving within 2 minutes or you are removed from this local room.</p>
  `;
  try {
    const response = await fetch("/api/rooms/join", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ eventId: event.id, roomNumber: Number(roomId.split("-").at(-1)) })
    });
    if (response.status === 401) return setView("login");
    const payload = await response.json();
    const roomsResponse = await fetch(freshUrl("/api/rooms"), { cache: "no-store" });
    if (roomsResponse.ok) roomsSnapshot = (await roomsResponse.json()).rooms || [];
    renderActiveRoom(roomId, event, payload.scramble);
  } catch {
    renderActiveRoom(roomId, event, "Could not load scramble.");
  }
  roomAfkTimerId = setTimeout(() => {
    if (!roomStarted && activeRoomId === roomId) {
      activeRoomId = null;
      activeRoomEl.innerHTML = `<span>removed</span><strong>You were removed for being AFK.</strong><p>Pick a room again when ready to solve.</p>`;
    }
  }, 120000);
}

function renderActiveRoom(roomId, event, scramble) {
  const users = roomUsers(roomId);
  activeRoomEl.innerHTML = `
    <span>${event.label} room ${roomId.split("-").at(-1)}</span>
    <strong>${scramble}</strong>
    <div class="room-actions">
      <button class="primary-button" id="roomStartSolve" type="button">Start solve</button>
      <button class="ghost-button" id="roomFinishSolve" type="button">Finish solve</button>
    </div>
    <div class="room-users" id="roomUsers"></div>
  `;
  document.querySelector("#roomStartSolve").addEventListener("click", () => {
    roomStarted = true;
    clearTimeout(roomAfkTimerId);
  });
  document.querySelector("#roomFinishSolve").addEventListener("click", () => {
    roomStarted = true;
    clearTimeout(roomAfkTimerId);
    fetch("/api/rooms/finish", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ roomId })
    }).then(() => enterRoom(roomId, event));
  });
  const usersEl = document.querySelector("#roomUsers");
  for (const user of users) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "user-chip";
    button.textContent = user.username;
    button.addEventListener("click", () => showProfile(user));
    usersEl.append(button);
  }
}

function roomUsers(roomId) {
  const users = roomsSnapshot
    .filter((entry) => entry.room_id === roomId && entry.user)
    .map((entry) => entry.user);
  const mine = publicProfile(account);
  if (mine && !users.some((user) => user.id === mine.id || user.username === mine.username)) users.unshift(mine);
  return users;
}

function publicProfile(user) {
  if (!user?.username) return null;
  return {
    username: user.username,
    description: user.description || "No description yet.",
    mainEvents: user.mainEvents || "No main events set.",
    prs: user.prs || {}
  };
}

function showProfile(user) {
  profileNameEl.textContent = user.username;
  profileDescriptionEl.textContent = user.description || "No description yet.";
  profileMainEventsEl.textContent = `Main events: ${user.mainEvents || "Not set"}`;
  profilePrsEl.innerHTML = "";
  for (const event of events) {
    const value = user.prs?.[event.id];
    if (!value) continue;
    const row = document.createElement("div");
    row.innerHTML = `<span>${event.label}</span><strong>${value}</strong>`;
    profilePrsEl.append(row);
  }
  if (!profilePrsEl.children.length) profilePrsEl.innerHTML = "<p>No PRs set.</p>";
  profileModalEl.classList.remove("hidden");
}

function saveSettingsFromForm() {
  settings = {
    holdDurationMs: Number.parseInt(holdDurationInputEl.value, 10),
    inspection: inspectionToggleEl.checked,
    blindInspection: blindInspectionToggleEl.checked,
    inspectionDirection: inspectionDirectionSelectEl.value,
    displayMode: displayModeSelectEl.value,
    beeps: beepToggleEl.checked,
    inputMode: inputModeSelectEl.value
  };
  if (!Number.isFinite(settings.holdDurationMs)) settings.holdDurationMs = defaultSettings.holdDurationMs;
  localStorage.setItem(settingsKey, JSON.stringify(settings));
  saveServerSettings();
  applyInputMode();
}

function applyInputMode() {
  const event = getCurrentEvent();
  const typing = isTypingMode();
  manualEntryEl.classList.toggle("hidden", !typing);
  timerEl.classList.toggle("is-manual", typing);
  manualEntryLabelEl.textContent = event.fmc ? "Type move count" : "Type time";
  manualTimeInputEl.placeholder = event.fmc ? "31" : "1234";
  timerStateEl.textContent = typing ? "TYPE" : idleLabel();
}

function selectEvent(eventId) {
  if (eventId === currentEvent || mode === "running" || mode === "inspection") return;
  currentEvent = eventId;
  localStorage.setItem("cube-timer-event-v1", currentEvent);
  currentScramble = null;
  timerEl.textContent = "0.00";
  closeSolveDetail();
  eventSelectEl.value = currentEvent;
  renderSolves();
  applyInputMode();
  loadScramble();
}

function getCurrentEvent() {
  return events.find((event) => event.id === currentEvent) || events[1];
}

function getEventSolves() {
  return solves.filter((solve) => (solve.event || "333") === currentEvent);
}

function shouldInspect() {
  const event = getCurrentEvent();
  if (!settings.inspection) return false;
  if (event.blind && !settings.blindInspection) return false;
  if (event.fmc) return false;
  return true;
}

function isTypingMode() {
  return settings.inputMode === "typing" || getCurrentEvent().fmc;
}

function idleLabel() {
  return isTypingMode() ? "TYPE" : "SPACE";
}

function loadSolves() {
  try {
    return JSON.parse(localStorage.getItem(storageKey) || "[]");
  } catch {
    return [];
  }
}

function loadSettings() {
  try {
    return normalizeSettings(JSON.parse(localStorage.getItem(settingsKey) || "{}"));
  } catch {
    return { ...defaultSettings };
  }
}

function normalizeSettings(value) {
  const loaded = { ...defaultSettings, ...(value || {}) };
  if (![0, 300, 500, 1000].includes(loaded.holdDurationMs)) loaded.holdDurationMs = defaultSettings.holdDurationMs;
  if (!["up", "down"].includes(loaded.inspectionDirection)) loaded.inspectionDirection = defaultSettings.inspectionDirection;
  if (!["decimals", "seconds", "inspection", "nothing"].includes(loaded.displayMode)) loaded.displayMode = defaultSettings.displayMode;
  if (!["timer", "typing"].includes(loaded.inputMode)) loaded.inputMode = defaultSettings.inputMode;
  return loaded;
}

function saveSolves(changedSolve = null, action = "update") {
  localStorage.setItem(storageKey, JSON.stringify(solves));
  if (!account?.username || !changedSolve) return;
  const create = action === "create";
  fetch(create ? "/api/solves" : `/api/solves/${encodeURIComponent(changedSolve.id)}`, {
    method: create ? "POST" : "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(changedSolve)
  }).catch(() => {});
}

function formatRunningTime(ms) {
  if (settings.displayMode === "nothing") return "";
  if (settings.displayMode === "inspection") return "--";
  if (settings.displayMode === "seconds") return String(Math.floor(ms / 1000));
  return formatTime(ms);
}

function formatSolveResult(solve) {
  if (!solve) return "--";
  if ((solve.penalty || "none") === "DNF") return "DNF";
  if (solve.resultType === "moves") return `${solve.moves ?? solve.timeMs} moves`;
  const base = Number(solve.timeMs || 0);
  const value = (solve.penalty || "none") === "+2" ? base + 2000 : base;
  return `${formatTime(value)}${(solve.penalty || "none") === "+2" ? "+" : ""}`;
}

function resultValue(solve) {
  if (!solve || (solve.penalty || "none") === "DNF") return Infinity;
  if (solve.resultType === "moves") return Number(solve.moves ?? solve.timeMs);
  return Number(solve.timeMs || 0) + ((solve.penalty || "none") === "+2" ? 2000 : 0);
}

function bestResult(eventSolves) {
  const valid = eventSolves.filter((solve) => resultValue(solve) !== Infinity);
  if (!valid.length) return null;
  valid.sort((a, b) => resultValue(a) - resultValue(b));
  return formatSolveResult(valid[0]);
}

function meanOfLast(eventSolves, count) {
  const sample = eventSolves.slice(0, count);
  if (sample.length < count) return null;
  if (sample.some((solve) => resultValue(solve) === Infinity)) return "DNF";
  return formatAverageValue(sample.reduce((sum, solve) => sum + resultValue(solve), 0) / count, sample[0]);
}

function averageOfLast(eventSolves, count) {
  const sample = eventSolves.slice(0, count);
  if (sample.length < count) return null;
  const dnfCount = sample.filter((solve) => resultValue(solve) === Infinity).length;
  if (dnfCount > 1) return "DNF";
  const sorted = [...sample].sort((a, b) => resultValue(a) - resultValue(b));
  const middle = sorted.slice(1, -1);
  if (middle.some((solve) => resultValue(solve) === Infinity)) return "DNF";
  return formatAverageValue(middle.reduce((sum, solve) => sum + resultValue(solve), 0) / middle.length, sample[0]);
}

function formatAverageValue(value, sampleSolve) {
  if (sampleSolve?.resultType === "moves") return `${value.toFixed(2)} moves`;
  return formatTime(value);
}

function parseTypedTime(value) {
  const digits = value.replace(/\D/g, "");
  if (!digits) return NaN;
  const centiseconds = Number.parseInt(digits, 10);
  return centiseconds * 10;
}

function formatTime(ms) {
  const totalSeconds = ms / 1000;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds - minutes * 60;
  if (minutes > 0) return `${minutes}:${seconds.toFixed(2).padStart(5, "0")}`;
  return seconds.toFixed(2);
}

function formatDate(value) {
  return new Intl.DateTimeFormat(undefined, {
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

function beep() {
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return;
  const context = new AudioContext();
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.frequency.value = 880;
  gain.gain.setValueAtTime(0.0001, context.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.08, context.currentTime + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.15);
  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start();
  oscillator.stop(context.currentTime + 0.16);
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function isTypingTarget(target) {
  return ["INPUT", "TEXTAREA", "SELECT"].includes(target?.tagName) || target?.isContentEditable;
}

function isSmallScreen() {
  return window.matchMedia("(max-width: 820px)").matches;
}

function freshUrl(path) {
  const separator = path.includes("?") ? "&" : "?";
  return `${path}${separator}_=${Date.now()}`;
}
