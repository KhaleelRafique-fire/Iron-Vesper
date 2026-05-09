const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const titleCanvas = document.getElementById("titleCanvas");
const titleCtx = titleCanvas?.getContext("2d");
if (titleCtx) titleCtx.imageSmoothingEnabled = false;

const GAME_RENDER_SCALE = 2;
const W = Number(canvas.getAttribute("width")) || 448;
const H = Number(canvas.getAttribute("height")) || 216;
canvas.width = W * GAME_RENDER_SCALE;
canvas.height = H * GAME_RENDER_SCALE;
ctx.imageSmoothingEnabled = false;
const TITLE_W = titleCanvas?.width || 896;
const TITLE_H = titleCanvas?.height || 432;
const TILE = 12;
const COLS = Math.ceil(W / TILE);
const ROWS = Math.floor(H / TILE);
const FLOOR_ROW = ROWS - 1;
const GROUND_ROW = ROWS - 2;
const FLOOR_Y = FLOOR_ROW * TILE;
const GRAV = 0.36;
const ATTACK_MAX = 18;
const BASIC_ATTACK_COOLDOWN = Math.ceil(0.25 * 60);
const SHIELD_MAX = 10;
const BASH_MAX = 14;
const DASH_MAX = 20;
const DASH_SPEED = 6.4;
const BASH_SPEED = 6.8;
const SUPER_CHARGE_MAX = 180;
const SUPER_SHIELD_CHARGE_MAX = 240;
const SUPER_DASH_SPEED = 8.2;
const TIME_ACTIVE_MAX = 600;
const TIME_COOLDOWN_MAX = 420;
const TIME_COST = 3.4;
const WORLD_RENDER_ZOOM = 1.0;
const BACKGROUND_RENDER_SCALE = 0.86;
const keys = new Set();
const pressed = new Set();
let lastAppliedUiScale = 1;
let sidebarScalePercent = 100;

function fitGameCanvas(settled = false) {
  const wrap = canvas.parentElement;
  const bounds = wrap?.getBoundingClientRect();
  const availableW = Math.max(1, Math.floor(bounds?.width || window.innerWidth || W));
  const availableH = Math.max(1, Math.floor(bounds?.height || window.innerHeight || H));
  const rawScale = Math.max(1, Math.min(availableW / W, availableH / H));
  const fullscreen = document.body.classList.contains("game-fullscreen");
  const displayScale = rawScale;
  const uiScale = Math.max(1, Math.min(fullscreen ? 2.25 : 1.85, rawScale * 0.9));
  const sidebarScale = sidebarScalePercent / 100;
  const shell = document.querySelector(".shell");
  const shellStyle = shell ? getComputedStyle(shell) : null;
  const shellPaddingX = shellStyle
    ? (parseFloat(shellStyle.paddingLeft) || 0) + (parseFloat(shellStyle.paddingRight) || 0)
    : 0;
  const shellGap = shellStyle ? parseFloat(shellStyle.columnGap || shellStyle.gap) || 0 : 0;
  const viewportW = Math.max(1, window.innerWidth || availableW);
  const defaultSidebarW = Math.max(520, Math.min(viewportW * 0.34, 700));
  const defaultLayoutW = viewportW <= 980
    ? Math.max(1, viewportW - shellPaddingX)
    : Math.max(1, viewportW - shellPaddingX - shellGap - defaultSidebarW);
  const defaultRawScale = Math.max(1, Math.min(defaultLayoutW / W, availableH / H));
  const defaultPanelScale = Math.max(1, Math.min(1.85, defaultRawScale * 0.9));
  const panelScale = Math.max(0.85, Math.min(2.6, (fullscreen ? uiScale : defaultPanelScale) * sidebarScale));
  const titleUiScale = fullscreen ? Math.max(1, Math.min(1.35, rawScale * 0.55)) : 1;
  const titleArtScale = fullscreen
    ? Math.max(1, Math.min(1.15, displayScale * 0.28))
    : 1;
  const titleKnightScale = Math.min(1.35, 1.05 * titleUiScale);
  const previousUiScale = lastAppliedUiScale;
  lastAppliedUiScale = uiScale;
  const displayW = Math.floor(W * displayScale);
  const displayH = Math.floor(H * displayScale);
  const mainScale = Math.max(0.45, Math.min(availableW / TITLE_W, availableH / TITLE_H));
  const mainDisplayW = Math.floor(TITLE_W * mainScale);
  const mainDisplayH = Math.floor(TITLE_H * mainScale);
  const root = document.documentElement;
  const uiPx = (name, value) => root.style.setProperty(name, `${Math.round(value * uiScale)}px`);
  const panelPx = (name, value) => root.style.setProperty(name, `${Math.round(value * panelScale)}px`);
  const titlePx = (name, value) => root.style.setProperty(name, `${Math.round(value * titleUiScale)}px`);
  const artPx = (name, value) => root.style.setProperty(name, `${Math.round(value * titleArtScale)}px`);
  canvas.style.width = `${displayW}px`;
  canvas.style.height = `${displayH}px`;
  root.style.setProperty("--ui-scale", uiScale.toFixed(3));
  root.style.setProperty("--title-knight-scale", titleKnightScale.toFixed(3));
  root.style.setProperty("--title-throne-scale", (0.72 * titleArtScale).toFixed(3));
  root.style.setProperty("--title-backdrop-scale", (0.98 * titleArtScale).toFixed(3));
  root.style.setProperty("--title-moon-scale", titleArtScale.toFixed(3));
  root.style.setProperty("--main-screen-scale", mainScale.toFixed(4));
  root.style.setProperty("--main-screen-w", `${mainDisplayW}px`);
  root.style.setProperty("--main-screen-h", `${mainDisplayH}px`);
  uiPx("--ui-space-xs", 8);
  uiPx("--ui-space-sm", 12);
  uiPx("--ui-space-md", 18);
  uiPx("--ui-space-lg", 26);
  uiPx("--ui-space-xl", 34);
  uiPx("--ui-font-xs", 13);
  uiPx("--ui-font-sm", 16);
  uiPx("--ui-font-md", 20);
  uiPx("--ui-font-lg", 26);
  uiPx("--ui-font-xl", 36);
  uiPx("--ui-font-xxl", 44);
  uiPx("--ui-panel-pad", 28);
  uiPx("--ui-card-pad", 20);
  uiPx("--ui-meter-h", 28);
  uiPx("--ui-overlay-w", 210);
  uiPx("--ui-full-overlay-w", 320);
  uiPx("--ui-overlay-meter-h", 14);
  uiPx("--ui-button-h", 62);
  uiPx("--ui-modal-button-h", 64);
  uiPx("--ui-modal-pad", 28);
  uiPx("--ui-close-size", 46);
  uiPx("--ui-crest-w", 68);
  uiPx("--ui-crest-h", 78);
  uiPx("--ui-toast-w", 560);
  uiPx("--ui-settings-w", 560);
  uiPx("--ui-inventory-w", 820);
  uiPx("--ui-inventory-h", 620);
  uiPx("--ui-pause-w", 620);
  panelPx("--panel-space-xs", 8);
  panelPx("--panel-space-sm", 12);
  panelPx("--panel-space-md", 18);
  panelPx("--panel-space-lg", 26);
  panelPx("--panel-space-xl", 34);
  panelPx("--panel-font-xs", 13);
  panelPx("--panel-font-sm", 16);
  panelPx("--panel-font-md", 20);
  panelPx("--panel-font-lg", 26);
  panelPx("--panel-font-xl", 36);
  panelPx("--panel-panel-pad", 28);
  panelPx("--panel-card-pad", 20);
  panelPx("--panel-meter-h", 28);
  panelPx("--panel-button-h", 62);
  panelPx("--panel-crest-w", 68);
  panelPx("--panel-crest-h", 78);
  titlePx("--title-pixel", 8);
  titlePx("--title-border-a", 3);
  titlePx("--title-border-b", 5);
  titlePx("--title-border-offset", -5);
  titlePx("--title-drop", 6);
  titlePx("--title-pad-x", 20);
  titlePx("--title-pad-y", 14);
  titlePx("--title-button-h", 56);
  titlePx("--title-actions-w", 380);
  titlePx("--title-content-w", 720);
  artPx("--title-castle-w", 520);
  artPx("--title-castle-h", 210);
  artPx("--title-ground-h", 60);
  wrap?.style.setProperty("--game-display-w", `${displayW}px`);
  wrap?.style.setProperty("--game-display-h", `${displayH}px`);
  if (!settled && Math.abs(previousUiScale - uiScale) > 0.01) requestAnimationFrame(() => fitGameCanvas(true));
}

function scheduleGameCanvasFit() {
  requestAnimationFrame(() => fitGameCanvas(false));
}

const ui = {
  toast: document.getElementById("toast"),
  titleScreen: document.getElementById("titleScreen"),
  newGameBtn: document.getElementById("newGameBtn"),
  continueBtn: document.getElementById("continueBtn"),
  settingsBtn: document.getElementById("settingsBtn"),
  settingsPanel: document.getElementById("settingsPanel"),
  masterVolume: document.getElementById("masterVolume"),
  musicVolume: document.getElementById("musicVolume"),
  sfxVolume: document.getElementById("sfxVolume"),
  masterVolumeValue: document.getElementById("masterVolumeValue"),
  musicVolumeValue: document.getElementById("musicVolumeValue"),
  sfxVolumeValue: document.getElementById("sfxVolumeValue"),
  inventoryBtn: document.getElementById("inventoryBtn"),
  pauseBtn: document.getElementById("pauseBtn"),
  fullscreenBtn: document.getElementById("fullscreenBtn"),
  sidebarScale: document.getElementById("sidebarScale"),
  sidebarScaleValue: document.getElementById("sidebarScaleValue"),
  fullscreenActions: document.getElementById("fullscreenActions"),
  fullscreenPauseBtn: document.getElementById("fullscreenPauseBtn"),
  fullscreenExitBtn: document.getElementById("fullscreenExitBtn"),
  pauseModal: document.getElementById("pauseModal"),
  resumeBtn: document.getElementById("resumeBtn"),
  saveBtn: document.getElementById("saveBtn"),
  pauseSettingsBtn: document.getElementById("pauseSettingsBtn"),
  titleBtn: document.getElementById("titleBtn"),
  pauseSettingsPanel: document.getElementById("pauseSettingsPanel"),
  pauseMasterVolume: document.getElementById("pauseMasterVolume"),
  pauseMusicVolume: document.getElementById("pauseMusicVolume"),
  pauseSfxVolume: document.getElementById("pauseSfxVolume"),
  pauseMasterVolumeValue: document.getElementById("pauseMasterVolumeValue"),
  pauseMusicVolumeValue: document.getElementById("pauseMusicVolumeValue"),
  pauseSfxVolumeValue: document.getElementById("pauseSfxVolumeValue"),
  inventoryModal: document.getElementById("inventoryModal"),
  closeInventoryBtn: document.getElementById("closeInventoryBtn"),
  questStatus: document.getElementById("questStatus"),
  roomName: document.getElementById("roomName"),
  hpBar: document.getElementById("hpBar"),
  mpBar: document.getElementById("mpBar"),
  hpBarOverlay: document.getElementById("hpBarOverlay"),
  mpBarOverlay: document.getElementById("mpBarOverlay"),
  abilities: document.getElementById("abilities"),
  controlsList: document.getElementById("controlsList")
};

function renderPixelTitle() {
  const glyphs = {
    I: ["11111", "00100", "00100", "00100", "00100", "00100", "11111"],
    R: ["11110", "10001", "10001", "11110", "10100", "10010", "10001"],
    O: ["01110", "10001", "10001", "10001", "10001", "10001", "01110"],
    N: ["10001", "11001", "10101", "10011", "10001", "10001", "10001"],
    K: ["10001", "10010", "10100", "11000", "10100", "10010", "10001"],
    G: ["01110", "10001", "10000", "10111", "10001", "10001", "01110"],
    V: ["10001", "10001", "10001", "10001", "01010", "01010", "00100"],
    E: ["11111", "10000", "10000", "11110", "10000", "10000", "11111"],
    S: ["01111", "10000", "10000", "01110", "00001", "00001", "11110"],
    P: ["11110", "10001", "10001", "11110", "10000", "10000", "10000"],
    " ": ["000", "000", "000", "000", "000", "000", "000"]
  };
  const render = (selector, text, pixelClass) => {
    const title = document.querySelector(selector);
    if (!title) return;
    const rows = Array.from({ length: 7 }, () => "");
    for (const ch of text) {
      const glyph = glyphs[ch] || glyphs[" "];
      for (let y = 0; y < rows.length; y++) rows[y] += glyph[y] + "0";
    }
    const cols = Math.max(...rows.map(row => row.length));
    title.textContent = "";
    title.style.setProperty("--cols", cols);
    title.style.setProperty("--rows", rows.length);
    rows.forEach((row, y) => {
      [...row].forEach((cell, x) => {
        if (cell !== "1") return;
        const pixel = document.createElement("span");
        pixel.className = pixelClass;
        pixel.style.gridColumn = String(x + 1);
        pixel.style.gridRow = String(y + 1);
        title.appendChild(pixel);
      });
    });
  };
  render(".main-pixel-title", "IRON VESPER", "main-title-pixel");
}

renderPixelTitle();

function drawTitleCanvas() {
  if (!titleCtx || ui.titleScreen.classList.contains("hidden")) return;
  const c = titleCtx;
  const r = (x, y, w, h, color) => {
    c.fillStyle = color;
    c.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
  };
  const t = frame;
  const sceneW = 960;
  const sideX = 960;
  const wave = Math.floor(t / 8);
  const idle = Math.floor(t / 28) % 4;
  const capePulse = Math.sin(t / 13);
  c.clearRect(0, 0, TITLE_W, TITLE_H);
  r(0, 0, TITLE_W, TITLE_H, "#07101d");
  for (let y = 0; y < TITLE_H; y += 6) {
    const tint = y < 220 ? "rgba(116,209,199,.025)" : y < 430 ? "rgba(255,231,165,.018)" : "rgba(0,0,0,.05)";
    r(0, y, TITLE_W, 3, tint);
  }
  for (let x = 0; x < TITLE_W; x += 16) r(x, 0, 2, TITLE_H, "rgba(255,255,255,.018)");

  r(142, 58, 88, 88, "#f2a34a");
  r(166, 70, 76, 76, "#07101d");
  for (let i = 0; i < 5; i++) r(118 - i * 7, 36 - i * 5, 142 + i * 18, 128 + i * 12, `rgba(242,163,74,${0.055 - i * 0.008})`);
  r(153, 65, 28, 6, "rgba(255,241,189,.34)");
  r(136, 110, 18, 4, "rgba(255,241,189,.22)");
  r(129, 49, 8, 8, "rgba(255,231,165,.45)");
  r(110, 83, 4, 4, "rgba(255,231,165,.35)");
  for (let i = 0; i < 95; i++) {
    const x = 18 + (i * 97) % (sceneW - 40);
    const y = 22 + (i * 43) % 220;
    const twinkle = (t + i * 11) % 100 < 52;
    const size = i % 9 === 0 ? 4 : i % 4 === 0 ? 3 : 2;
    r(x, y, size, size, twinkle ? "#ffe7a5" : "rgba(116,209,199,.55)");
    if (i % 13 === 0) r(x - 4, y + 1, 3, 1, "rgba(255,231,165,.32)");
  }
  for (let x = 260; x < 880; x += 112) {
    const drift = ((t / 10 + x) % 26) - 13;
    r(x + drift, 112 + (x % 4) * 9, 82, 8, "rgba(255,231,165,.17)");
    r(x + 18 + drift, 101 + (x % 5) * 7, 58, 12, "rgba(116,209,199,.11)");
    r(x + 46 + drift, 122 + (x % 3) * 9, 38, 6, "rgba(255,255,255,.08)");
  }
  for (let x = 18; x < sceneW; x += 48) {
    const y = 292 + ((x * 7) % 34);
    r(x, y, 20, 3, "rgba(116,209,199,.18)");
    r(x + 7, y + 4, 30, 2, "rgba(255,231,165,.11)");
  }

  const mountain = (base, color, shade, start, step, count, minH, range) => {
    for (let i = 0; i < count; i++) {
      const x = start + i * step;
      const h = minH + ((i * 31) % range);
      r(x, base - h, step + 3, h, color);
      r(x, base - h, step + 3, 7, shade);
      if (i % 3 === 0) r(x + step - 8, base - h + 24, 5, Math.max(12, h - 34), "rgba(0,0,0,.14)");
    }
  };
  mountain(386, "#101827", "rgba(255,255,255,.055)", -40, 40, 28, 72, 92);
  mountain(474, "#1f4b2d", "rgba(255,255,255,.08)", -36, 34, 34, 62, 76);
  mountain(518, "#2f6c36", "rgba(255,255,255,.085)", 220, 30, 30, 72, 82);
  for (let y = 180; y < 472; y += 18) {
    const a = (y - 164) / 420;
    r(216 + (y % 36), y, 522 - (y - 180) * 0.42, 5, `rgba(198,66,60,${0.05 * (1 - a)})`);
    r(286 + (y % 54), y + 7, 356 - (y - 180) * 0.28, 3, `rgba(243,204,103,${0.035 * (1 - a)})`);
  }
  for (let x = 0; x < sceneW; x += 22) {
    const y = 456 + ((x / 22) % 6) * 7;
    r(x, y, 17, 5, x % 44 ? "#6ea35f" : "#d59b44");
    if (x % 66 === 0) r(x + 9, y - 7, 4, 8, "#c6423c");
  }

  const waterfall = (x, y, w, h) => {
    r(x - 22, y + h - 4, w + 44, 12, "rgba(116,209,199,.28)");
    r(x, y, w, h, "#1f6477");
    r(x + 4, y, 5, h, "rgba(255,255,255,.34)");
    r(x + w - 8, y + 3, 4, h - 6, "rgba(10,51,64,.28)");
    for (let yy = y + ((wave * 4) % 22) - 22; yy < y + h; yy += 22) {
      r(x + 3, yy, w - 6, 7, "rgba(255,255,255,.78)");
      r(x + w - 10, yy + 10, 6, 8, "rgba(116,209,199,.78)");
      r(x + 9, yy + 15, Math.max(5, w - 18), 3, "rgba(255,231,165,.18)");
    }
  };
  waterfall(116, 382, 26, 118);
  waterfall(808, 390, 24, 94);

  const cx = 192, cy = 214;
  const brick = (x, y, w, h) => {
    r(x, y, w, h, "#151a25");
    for (let yy = y + 10; yy < y + h - 6; yy += 18) {
      for (let xx = x + ((yy / 18) % 2 ? 8 : 0); xx < x + w - 8; xx += 22) r(xx, yy, 14, 2, "rgba(255,255,255,.045)");
    }
    r(x + 5, y + 5, w - 10, 5, "rgba(255,255,255,.035)");
    r(x + w - 8, y + 8, 4, h - 12, "rgba(0,0,0,.18)");
  };
  brick(cx + 136, cy + 125, 402, 172);
  r(cx + 136, cy + 104, 402, 22, "#222737");
  for (let x = cx + 146; x < cx + 530; x += 32) r(x, cy + 92, 20, 34, "#222737");
  const tower = (x, y, w, h, crown = false) => {
    brick(x, y, w, h);
    r(x - 12, y - 26, w + 24, 26, "#141822");
    for (let xx = x - 9; xx < x + w + 12; xx += 24) r(xx, y - 46, 15, 20, "#222737");
    if (crown) {
      r(x + w / 2 - 32, y - 64, 64, 17, "#d59b44");
      r(x + w / 2 - 5, y - 86, 10, 24, "#fff1bd");
      r(x + w / 2 - 21, y - 78, 8, 18, "#f08f31");
      r(x + w / 2 + 14, y - 78, 8, 18, "#f08f31");
    }
    for (let yy = y + 34; yy < y + h - 28; yy += 46) {
      r(x + w / 2 - 12, yy, 24, 32, "#080b12");
      const lit = (Math.floor(t / 18) + yy + x) % 4 !== 0;
      r(x + w / 2 - 8, yy + 6, 16, 8, lit ? "#f08f31" : "#4c2d24");
      r(x + w / 2 - 1, yy + 3, 2, 26, "rgba(255,231,165,.22)");
    }
  };
  tower(cx + 28, cy + 50, 100, 246);
  tower(cx + 292, cy - 14, 118, 310, true);
  tower(cx + 552, cy + 36, 104, 260);
  const kingOmenX = cx + 344;
  const kingOmenY = cy + 8 + Math.floor(Math.sin(t / 18) * 2);
  r(kingOmenX - 31, kingOmenY + 42, 82, 6, "rgba(198,66,60,.2)");
  r(kingOmenX - 16, kingOmenY + 19, 50, 28, "rgba(7,9,12,.72)");
  r(kingOmenX - 9, kingOmenY + 2, 36, 18, "rgba(7,9,12,.8)");
  r(kingOmenX - 13, kingOmenY - 6, 44, 8, "#f3cc67");
  r(kingOmenX - 7, kingOmenY - 17, 7, 12, "#fff1bd");
  r(kingOmenX + 7, kingOmenY - 21, 8, 16, "#f3cc67");
  r(kingOmenX + 22, kingOmenY - 17, 7, 12, "#fff1bd");
  r(kingOmenX - 2, kingOmenY + 10, 6, 4, "#c6423c");
  r(kingOmenX + 18, kingOmenY + 10, 6, 4, "#c6423c");
  r(cx + 318, cy + 252, 66, 60, "#080b12");
  r(cx + 328, cy + 262, 46, 50, "#17100e");
  for (let x = cx + 176; x < cx + 510; x += 84) {
    r(x, cy + 154, 26, 40, "#080b12");
    r(x + 5, cy + 162, 16, 9, "#f08f31");
    r(x + 12, cy + 158, 3, 32, "rgba(255,231,165,.24)");
  }
  for (const x of [cx + 220, cx + 488]) {
    r(x, cy + 90, 8, 162, "#7d5c35");
    for (let y = cy + 90; y < cy + 240; y += 16) r(x - 3, y, 14, 5, "#d59b44");
  }
  for (const x of [cx + 92, cx + 600]) {
    r(x, cy + 118, 30, 90, "#8c2f38");
    r(x + 11, cy + 118, 8, 90, "#d59b44");
    r(x + 7, cy + 198, 16, 18, "#5b2417");
  }
  for (let y = cy + 126; y < cy + 284; y += 28) {
    r(cx + 154, y, 9, 5, "#2b3545");
    r(cx + 510, y + 8, 9, 5, "#2b3545");
    r(cx + 157, y + 1, 3, 3, "rgba(255,231,165,.2)");
    r(cx + 513, y + 9, 3, 3, "rgba(255,231,165,.18)");
  }
  for (let x = cx + 180; x < cx + 508; x += 26) {
    r(x, cy + 312, 16, 7, x % 52 ? "#1e2430" : "#303746");
    r(x + 4, cy + 317, 8, 2, "rgba(255,255,255,.08)");
  }
  for (let i = 0; i < 12; i++) {
    const bx = cx + 205 + i * 27;
    const by = cy + 132 + Math.sin(t / 12 + i) * 3;
    r(bx, by, 3, 74, "#5b3a23");
    r(bx - 6, by + 6, 15, 4, "#7d5c35");
    r(bx - 4, by + 16, 11, 3, "rgba(247,231,189,.18)");
  }
  for (let x = cx + 208; x < cx + 486; x += 42) {
    const flicker = Math.floor(t / 5 + x) % 3;
    r(x, cy + 225, 7, 17, "#5b2417");
    r(x + 2, cy + 218 - flicker, 3, 7 + flicker, "#f08f31");
    r(x + 1, cy + 216 - flicker, 5, 3, "rgba(255,231,165,.7)");
    r(x - 8, cy + 213 - flicker, 21, 15, "rgba(240,143,49,.12)");
  }

  r(0, 596, sceneW, 124, "#120d0a");
  for (let x = 0; x < sceneW; x += 18) r(x, 590, 11, 8, x % 36 ? "#527437" : "#8fb65d");
  for (let x = 10; x < sceneW; x += 27) {
    const h = 12 + (x % 5);
    r(x, 578 - (x % 3), 3, h, "#1a2414");
    if (x % 81 === 10) r(x + 4, 574, 4, 4, "#f7e7bd");
    if (x % 135 === 10) r(x - 3, 576, 4, 4, "#c6423c");
  }
  for (let y = 604; y < 720; y += 12) {
    const fade = (720 - y) / 116;
    r(0, y, sceneW, 3, `rgba(116,209,199,${0.08 * fade})`);
  }
  for (let y = 528; y < 620; y += 10) {
    const drift = Math.sin(t / 24 + y) * 11;
    r(250 + drift, y, 420 - (y - 528) * 2.2, 4, `rgba(215,220,225,${0.08 - (y - 528) * 0.00055})`);
    r(82 - drift * 0.4, y + 5, 210, 3, `rgba(116,209,199,${0.045 - (y - 528) * 0.0003})`);
  }
  for (let x = 260; x < 695; x += 22) {
    const offset = Math.floor(Math.sin(t / 20 + x) * 4);
    r(x + offset, 608 + (x % 44), 18, 4, "rgba(58,48,41,.72)");
    r(x + 3 + offset, 606 + (x % 44), 11, 2, "rgba(247,231,189,.09)");
  }
  for (let x = 32; x < 900; x += 57) {
    const glow = (Math.sin(t / 18 + x) + 1) * 0.5;
    r(x, 552 + (x % 23), 3, 3, glow > 0.42 ? "#ffe7a5" : "rgba(213,155,68,.42)");
    if (glow > 0.72) r(x - 2, 550 + (x % 23), 7, 7, "rgba(255,231,165,.16)");
  }

  const kx = 475, ky = 448 + (idle === 1 ? -2 : idle === 3 ? 1 : 0);
  const cape = Math.round(capePulse * 5);
  r(kx - 38, ky + 35, 36 + cape, 110, "#8c2f38");
  r(kx - 30 + cape, ky + 124, 50, 35, "#5f1f2d");
  r(kx - 36 + cape, ky + 74, 24, 82, "#b2454a");
  r(kx + 1, ky, 43, 40, "#d7dce1");
  r(kx + 8, ky - 14, 28, 15, "#f08f31");
  r(kx + 15, ky + 12, 19, 5, "#101317");
  r(kx + 11, ky + 23, 27, 4, "#69728a");
  r(kx - 4, ky + 45, 58, 84, "#415f78");
  r(kx + 6, ky + 54, 39, 9, "#d59b44");
  r(kx + 17, ky + 40, 13, 94, "#89a9ba");
  r(kx + 8, ky + 48, 8, 78, "#9bb8c6");
  r(kx - 25, ky + 54 + (idle % 2), 18, 70, "#b8bec5");
  r(kx + 55, ky + 52 - (idle % 2), 18, 70, "#b8bec5");
  r(kx - 24, ky + 120, 20, 12, "#9b623f");
  r(kx + 56, ky + 119, 20, 12, "#9b623f");
  r(kx + 6, ky + 128, 19, 78, "#232a31");
  r(kx + 37, ky + 128, 19, 78, "#232a31");
  r(kx + 1, ky + 198, 32, 11, "#111");
  r(kx + 34, ky + 198, 34, 11, "#111");
  r(kx + 79, ky + 18, 8, 164, "#fff1bd");
  r(kx + 76, ky + 104, 25, 8, "#d59b44");
  r(kx + 70, ky + 114, 36, 10, "#5b2417");
  r(kx + 68, ky + 30 + (wave % 5), 45, 3, "rgba(255,241,189,.32)");
  r(kx + 88, ky + 18, 4, 150, "rgba(255,255,255,.18)");
  r(kx - 52, ky + 132, 148, 6, "rgba(198,66,60,.14)");
  r(kx - 41, ky + 139, 122, 3, "rgba(255,241,189,.12)");
  r(kx + 10, ky + 4, 4, 25, "rgba(255,255,255,.32)");
  r(kx + 34, ky + 7, 4, 22, "rgba(0,0,0,.22)");
  r(kx + 3, ky + 64, 48, 3, "#fff1bd");
  r(kx + 23, ky + 42, 5, 92, "rgba(255,255,255,.24)");
  r(kx + 78, ky + 16 + (wave % 3), 11, 3, "rgba(255,241,189,.8)");
  r(kx + 86, ky + 28 + (wave % 4), 6, 2, "rgba(255,255,255,.5)");
  for (let i = 0; i < 7; i++) {
    r(kx - 35 + cape + i * 6, ky + 156 + (i % 2), 4, 8 + (i % 3), i % 2 ? "#5f1f2d" : "#8c2f38");
    r(kx + 8 + i * 7, ky + 205, 4, 2, "rgba(255,231,165,.22)");
  }
  if (idle === 2) {
    r(kx - 44, ky + 68, 12, 34, "rgba(255,231,165,.22)");
    r(kx + 83, ky + 26, 12, 48, "rgba(255,255,255,.18)");
  }
  for (let i = 0; i < 18; i++) {
    const sx = 76 + (i * 47 + Math.floor(t * 0.18)) % 780;
    const sy = 514 + ((i * 19) % 76);
    r(sx, sy, 14 + (i % 4) * 5, 2, i % 2 ? "rgba(255,231,165,.12)" : "rgba(116,209,199,.12)");
  }

  r(sideX, 0, TITLE_W - sideX, TITLE_H, "rgba(7,9,12,.83)");
  r(sideX, 0, 3, TITLE_H, "#5b3a23");
  for (let y = 0; y < TITLE_H; y += 22) r(sideX + 3, y, TITLE_W - sideX - 3, 3, "rgba(255,255,255,.025)");
  for (let x = sideX + 20; x < TITLE_W; x += 38) r(x, 0, 2, TITLE_H, "rgba(213,155,68,.045)");
}

const abilityInfo = {
  sword: ["Village Sword", "Basic attacks"],
  doubleJump: ["Wyvern Spurs", "Double jump"],
  dash: ["Knight Cloak", "Air burst"],
  superDash: ["Bell Mantle", "Charged sonic dash"],
  wall: ["Gecko Greaves", "Wall cling"],
  fire: ["Cinder Brand", "Burn brambles"],
  grapple: ["Moon Hook", "Latch rings"],
  shield: ["Aegis Guard", "Parry, guard, and pogo"],
  time: ["Sundial Hex", "Slow enemies"]
};

const abilityDescriptions = {
  sword: "Attack with J.",
  dash: "Dash with L.",
  superDash: "Hold N to charge a sonic dash; hold Shield while charging for a heavier bash.",
  wall: "Cling to walls and wall-jump.",
  fire: "Cast cinder bolts with K.",
  grapple: "Hold I near golden rings to swing.",
  shield: "Hold S to guard; dash while guarding to shield bash. In midair, hold S and attack to point the shield downward and pogo.",
  doubleJump: "Jump again in midair.",
  time: "Tap Shift to spend a large burst of mana and slow enemies for ten seconds, then wait for the gear to cool."
};

const abilityArtifacts = {
  sword: { article: "The Village Sword", story: "Knight: Step one, stop leaving my sword at home. Step two, introduce it to anything rude.", colors: ["#d7dce1", "#f3cc67", "#415f78"] },
  dash: { article: "The Knight Cloak", story: "Knight: Excellent. A cloak that turns panic into distance. I will pretend this was strategy.", colors: ["#8a1f2d", "#f3cc67", "#ffe1a0"] },
  superDash: { article: "The Bell Mantle", story: "Knight: Hold it, charge it, and launch myself like a church bell with opinions.", colors: ["#d7be7a", "#fff1bd", "#2b3545"] },
  wall: { article: "The Gecko Greaves", story: "Knight: Boots for climbing walls. At last, architecture and I can settle our argument.", colors: ["#6b8c53", "#d7be7a", "#26362d"] },
  fire: { article: "The Cinder Brand", story: "Knight: A sword that throws fire. Finally, a polite answer to thorns, doors, and bad moods.", colors: ["#e16b43", "#fff1bd", "#4f2730"] },
  grapple: { article: "The Moon Hook", story: "Knight: Point hook at shiny ring, fly across gap, try not to narrate the scream.", colors: ["#9fd0d0", "#f7e7bd", "#27384b"] },
  shield: { article: "The Aegis Guard", story: "Knight: If something hits me, put this in front. If spikes exist, put this underneath. Heroism is mostly angles.", colors: ["#84c5d0", "#f3cc67", "#2d4658"] },
  doubleJump: { article: "The Wyvern Spurs", story: "Knight: Jump, then jump again because gravity was being smug.", colors: ["#f1d7a4", "#c6423c", "#413934"] },
  time: { article: "The Sundial Hex", story: "Knight: Slow everything down, do something clever, then act like I planned the clever part.", colors: ["#f0a642", "#a596ff", "#17130e"] }
};

const rooms = [
  { name: "Castle Gate", x: 0, y: 0, theme: "castle", checkpointAltar: { x: 92, y: FLOOR_Y - 35, respawnX: 78, respawnY: 146 } },
  { name: "Bell Tower", x: 1, y: -4, theme: "tower", checkpointAltar: { x: 58, y: FLOOR_Y - 35, respawnX: 62, respawnY: 146, style: "tower" } },
  { name: "Cinder Chapel", x: 4, y: 0, theme: "chapel" },
  { name: "Moonlit Keep", x: 7, y: -1, theme: "keep" },
  { name: "Moss Warrens", x: -1, y: 2, theme: "moss", checkpointAltar: { x: 58, y: FLOOR_Y - 34, respawnX: 62, respawnY: 146, style: "moss" } },
  { name: "Crypt of Oaths", x: 2, y: 4, theme: "crypt" },
  { name: "Sunken Reliquary", x: 2, y: 1, theme: "water", removed: true },
  { name: "Sundial Furnace", x: 7, y: 5, theme: "forge" },
  { name: "Royal Catacomb", x: 1, y: 5, theme: "catacomb" },
  { name: "Wyvern Ossuary", x: 4, y: 7, theme: "bone" },
  { name: "Iron Throne", x: 11, y: 4, theme: "throne", removed: true },
  { name: "Starless Vault", x: 10, y: 5, theme: "void" },
  { name: "Outer Rampart", x: -4, y: 0, theme: "castle" },
  { name: "Gatehouse Roof", x: 0, y: -1, theme: "castle" },
  { name: "Belfry Crown", x: 1, y: -2, theme: "tower" },
  { name: "Chapel Nave", x: 5, y: -2, theme: "chapel" },
  { name: "Lunar Battlement", x: 7, y: -3, theme: "keep" },
  { name: "Overgrown Sluice", x: -2, y: 2, theme: "moss" },
  { name: "Moss Rootworks", x: -3, y: 4, theme: "moss" },
  { name: "Oath Antechamber", x: 2, y: 3, theme: "crypt" },
  { name: "Reliquary Depths", x: 2, y: 3, theme: "water", removed: true },
  { name: "Furnace Belly", x: 6, y: 5, theme: "forge" },
  { name: "Buried Cloister", x: 0, y: 5, theme: "catacomb" },
  { name: "Ossuary Spire", x: 4, y: 6, theme: "bone" },
  { name: "Crown Approach", x: 10, y: 4, theme: "throne", removed: true },
  { name: "Astral Reliquary", x: 10, y: 6, theme: "void" },
  { x: -1, y: 0, theme: "castle" },
  { x: -2, y: 0, theme: "castle" },
  { x: -3, y: 0, theme: "castle" },
  { x: 0, y: 1, theme: "castle" },
  { x: -1, y: 1, theme: "moss" },
  { x: -2, y: 1, theme: "moss" },
  { x: -3, y: 2, theme: "moss" },
  { x: -2, y: 3, theme: "moss" },
  { x: -3, y: 3, theme: "moss" },
  { x: -1, y: 3, theme: "moss" },
  { x: 0, y: 4, theme: "catacomb" },
  { x: 0, y: 6, theme: "catacomb" },
  { x: 1, y: 6, theme: "catacomb" },
  { x: 2, y: 6, theme: "bone" },
  { x: 3, y: 6, theme: "bone" },
  { x: 3, y: 7, theme: "bone", checkpointAltar: { x: 156, y: FLOOR_Y - 35, respawnX: 160, respawnY: 146, style: "bone" } },
  { x: 4, y: 8, theme: "bone" },
  { x: 5, y: 7, theme: "bone" },
  { x: 1, y: -1, theme: "tower" },
  { x: 2, y: -2, theme: "tower" },
  { x: 2, y: -3, theme: "tower" },
  { x: 0, y: -3, theme: "tower" },
  { x: 1, y: -3, theme: "tower" },
  { x: 3, y: -2, theme: "chapel" },
  { x: 4, y: -2, theme: "chapel" },
  { x: 5, y: -1, theme: "chapel" },
  { x: 3, y: -1, theme: "chapel" },
  { x: 5, y: 0, theme: "chapel" },
  { x: 2, y: 0, theme: "chapel" },
  { x: 3, y: 0, theme: "chapel" },
  { x: 1, y: 0, theme: "castle" },
  { x: 6, y: 0, theme: "keep" },
  { x: 7, y: 0, theme: "keep" },
  { x: 8, y: 0, theme: "keep" },
  { x: 8, y: -1, theme: "keep" },
  { x: 8, y: -2, theme: "keep" },
  { x: 1, y: 1, theme: "crypt" },
  { x: 2, y: 1, theme: "crypt" },
  { x: 2, y: 2, theme: "crypt" },
  { x: 3, y: 3, theme: "crypt" },
  { x: 3, y: 4, theme: "crypt" },
  { x: 4, y: 4, theme: "forge" },
  { x: 5, y: 4, theme: "forge" },
  { x: 6, y: 4, theme: "forge" },
  { x: 7, y: 4, theme: "forge" },
  { x: 5, y: 5, theme: "forge" },
  { x: 6, y: 6, theme: "forge" },
  { x: 7, y: 6, theme: "forge" },
  { x: 6, y: 7, theme: "forge" },
  { x: 8, y: 4, theme: "throne", removed: true },
  { x: 9, y: 4, theme: "throne", removed: true },
  { x: 9, y: 5, theme: "void" },
  { x: 9, y: 6, theme: "void" },
  { x: 11, y: 6, theme: "void" },
  { x: 11, y: 7, theme: "void" },
  { x: 9, y: 7, theme: "void" },
  { x: 8, y: 6, theme: "void" }
];

const palette = {
  castle: ["#111820", "#33414a", "#54606a", "#b48850"],
  tower: ["#121923", "#2b3545", "#69728a", "#d7be7a"],
  chapel: ["#171016", "#4f2730", "#7b4939", "#e16b43"],
  keep: ["#10161d", "#27384b", "#5b6f86", "#9fd0d0"],
  moss: ["#101710", "#2c4630", "#6b8c53", "#d7b167"],
  crypt: ["#111215", "#303239", "#666b74", "#90a5ad"],
  water: ["#0b1721", "#123a4c", "#247083", "#74d1c7"],
  forge: ["#17130e", "#563118", "#9b5030", "#f0a642"],
  catacomb: ["#15110f", "#443427", "#7a6040", "#d3ae72"],
  bone: ["#141313", "#413934", "#8f806d", "#f1d7a4"],
  throne: ["#150e12", "#3d2638", "#79573e", "#f3cc67"],
  void: ["#08090f", "#1d1830", "#4e3f7e", "#a596ff"]
};
palette.village = ["#14212a", "#385d4c", "#9a6b43", "#ffd166"];

const areaNames = {
  village: "Hearthmere Village",
  castle: "Castle",
  tower: "Bell Tower",
  chapel: "Cinder Chapel",
  keep: "Moonlit Keep",
  moss: "Moss Warrens",
  crypt: "Crypt of Oaths",
  water: "Sunken Reliquary",
  forge: "Sundial Furnace",
  catacomb: "Royal Catacomb",
  bone: "Wyvern Ossuary",
  throne: "Eightfold Seal",
  void: "Starless Vault"
};

function displayRoomName(room) {
  return room.name || areaNames[room.theme] || "Unknown Area";
}

function displayAreaName(room) {
  return areaNames[room.theme] || room.theme;
}

function isSignificantRoom(room) {
  return !!(room.name || room.rewardAbility || abilityTrials[room.id]);
}

const musicData = {
  menu: { tempo: 104, root: 43, scale: [0, 3, 5, 7, 10, 12, 15, 17], bass: [0, 5, 3, 7, 0, 10, 7, 5], lead: [12, -1, 10, 7, 5, -1, 7, 10, 12, 15, -1, 12, 10, 7, 5, -1], color: "triangle" },
  village: { tempo: 132, root: 50, scale: [0, 2, 4, 7, 9, 12, 14, 16], bass: [0, 5, 4, 5, 0, 7, 5, 4], lead: [7, 9, 12, -1, 14, 12, 9, 7, 4, 7, 9, -1, 12, 14, 12, 9], color: "triangle" },
  castle: { tempo: 128, root: 48, scale: [0, 3, 5, 7, 10, 12, 15, 17], bass: [0, 0, 5, 3, 0, 7, 5, 3], lead: [7, -1, 5, 3, 7, 10, 8, 5, 3, -1, 5, 7, 10, 8, 7, 5], color: "square" },
  tower: { tempo: 142, root: 50, scale: [0, 2, 5, 7, 9, 12, 14, 17], bass: [0, 7, 4, 2, 0, 9, 7, 4], lead: [12, 9, 7, -1, 14, 12, 9, 7, 5, -1, 7, 9, 12, 14, 12, 9], color: "triangle" },
  chapel: { tempo: 96, root: 45, scale: [0, 3, 7, 10, 12, 15, 19, 22], bass: [0, 0, 3, 0, 5, 3, 0, 7], lead: [12, -1, 10, -1, 7, 10, 12, -1, 15, -1, 12, 10, 7, -1, 3, 5], color: "square" },
  keep: { tempo: 132, root: 47, scale: [0, 2, 3, 7, 10, 12, 14, 15], bass: [0, 5, 0, 7, 3, 5, 7, 10], lead: [10, 12, 14, -1, 15, 14, 12, 10, 7, -1, 10, 12, 14, 10, 7, 5], color: "sawtooth" },
  moss: { tempo: 116, root: 43, scale: [0, 2, 5, 7, 10, 12, 14, 17], bass: [0, 5, 3, 5, 0, 7, 5, 3], lead: [7, -1, 10, 7, 5, -1, 7, 5, 3, 5, 7, -1, 10, 12, 10, 7], color: "triangle" },
  crypt: { tempo: 88, root: 40, scale: [0, 1, 5, 7, 10, 12, 13, 17], bass: [0, 0, 1, 0, 5, 1, 0, 7], lead: [12, -1, -1, 10, 7, -1, 5, -1, 13, -1, 12, 10, 7, -1, 5, 1], color: "triangle" },
  water: { tempo: 104, root: 46, scale: [0, 2, 5, 9, 12, 14, 17, 21], bass: [0, 5, 0, 9, 2, 5, 9, 12], lead: [9, 12, -1, 14, 12, 9, -1, 5, 7, 9, 12, -1, 14, 17, 14, 12], color: "sine" },
  forge: { tempo: 156, root: 42, scale: [0, 3, 5, 6, 7, 10, 12, 15], bass: [0, 0, 7, 0, 5, 0, 6, 7], lead: [7, 7, 10, 7, 12, -1, 10, 7, 6, 7, 10, 12, 15, 12, 10, 7], color: "square" },
  catacomb: { tempo: 92, root: 41, scale: [0, 3, 5, 8, 10, 12, 15, 17], bass: [0, 3, 0, 5, 0, 8, 5, 3], lead: [8, -1, 10, -1, 12, 10, 8, 5, 3, -1, 5, 8, 10, -1, 8, 5], color: "triangle" },
  bone: { tempo: 124, root: 44, scale: [0, 2, 3, 7, 8, 12, 14, 15], bass: [0, 3, 7, 3, 0, 8, 7, 3], lead: [12, 8, 7, 3, 7, -1, 8, 12, 15, 14, 12, 8, 7, 8, 12, -1], color: "square" },
  throne: { tempo: 118, root: 39, scale: [0, 3, 7, 10, 12, 15, 19, 22], bass: [0, 7, 3, 10, 0, 12, 10, 7], lead: [19, 15, 12, -1, 22, 19, 15, 12, 10, -1, 12, 15, 19, 22, 19, 15], color: "square" },
  void: { tempo: 100, root: 38, scale: [0, 1, 6, 8, 11, 12, 18, 20], bass: [0, 6, 1, 8, 0, 11, 8, 6], lead: [18, -1, 20, 18, 12, -1, 11, 8, 6, 8, 11, -1, 12, 18, 20, 18], color: "sine" },
  boss: { tempo: 188, root: 36, scale: [0, 1, 3, 6, 7, 10, 12, 15], bass: [0, 0, 6, 0, 3, 0, 7, 6], lead: [12, 15, 10, 7, 15, 12, 10, 18, 7, 6, 7, 10, 15, 18, 12, 10], color: "sawtooth" },
  ironKing: { tempo: 232, root: 34, scale: [0, 1, 3, 5, 6, 7, 10, 12], bass: [0, 0, 6, 0, 3, 7, 0, 10], lead: [12, 15, 12, 10, 18, 15, 12, 10, 19, 18, 15, 12, 22, 19, 18, 15], color: "sawtooth" }
};

const audio = {
  ctx: null,
  master: null,
  musicGain: null,
  sfxGain: null,
  theme: "",
  step: 0,
  next: 0,
  muted: false
};

const enemySpecies = {
  castle: ["halberd", "hound", "crossbow"],
  tower: ["gargoyle", "bellBat", "halberd"],
  chapel: ["penitent", "censer", "scarab"],
  keep: ["moonKnight", "gargoyle", "crossbow"],
  moss: ["mossling", "thornImp", "hound"],
  crypt: ["wraith", "boneGuard", "lanternSkull"],
  water: ["drowned", "eel", "wraith"],
  forge: ["cinderImp", "anvilGuard", "censer"],
  catacomb: ["boneGuard", "hound", "lanternSkull"],
  bone: ["ossuaryBird", "boneGuard", "wraith"],
  throne: ["royalGuard", "moonKnight", "anvilGuard"],
  void: ["starWraith", "voidEye", "royalGuard"]
};

const abilityTrials = {
  12: { ability: "dash", boss: "hound", title: "Outer Rampart gauntlet" },
  1: { ability: "superDash", boss: "gargoyle", title: "Bell Tower climb" },
  15: { ability: "fire", boss: "penitent", title: "Cinder Nave vigil" },
  16: { ability: "grapple", boss: "moonKnight", title: "Moon hook trial" },
  18: { ability: "wall", boss: "thornImp", title: "Rootworks shade" },
  5: { ability: "shield", boss: "boneGuard", title: "Crypt oath duel" },
  9: { ability: "doubleJump", boss: "ossuaryBird", title: "Wyvern bone ascent" },
  7: { ability: "time", boss: "anvilGuard", title: "Sundial furnace test" }
};

const trialRewardSpecs = [
  { bossRoom: 12, ability: "dash", name: "Cloak Reliquary", theme: "castle" },
  { bossRoom: 1, ability: "superDash", name: "Bell-Mantle Reliquary", theme: "tower" },
  { bossRoom: 15, ability: "fire", name: "Cinder Reliquary", theme: "chapel" },
  { bossRoom: 16, ability: "grapple", name: "Moon-Hook Reliquary", theme: "keep" },
  { bossRoom: 18, ability: "wall", name: "Greaves Reliquary", theme: "moss" },
  { bossRoom: 5, ability: "shield", name: "Oath-Shield Reliquary", theme: "crypt" },
  { bossRoom: 9, ability: "doubleJump", name: "Wyvern-Spur Reliquary", theme: "bone" },
  { bossRoom: 7, ability: "time", name: "Sundial Reliquary", theme: "forge" }
];

for (const spec of trialRewardSpecs) {
  const id = rooms.length;
  spec.rewardRoom = id;
  abilityTrials[spec.bossRoom].rewardRoom = id;
  rooms.push({ name: spec.name, x: 20 + id, y: spec.bossRoom, theme: spec.theme, rewardAbility: spec.ability, returnRoom: spec.bossRoom, hidden: true });
}

const requiredFinalDoorAbilities = ["dash", "superDash", "wall", "fire", "grapple", "shield", "doubleJump", "time"];
const FINAL_SEAL_ROOM_ID = rooms.length;
rooms.push({ name: "Eightfold Door", x: 0, y: 2, theme: "throne", finalSealRoom: true });
const FINAL_BOSS_ROOM_ID = rooms.length;
rooms.push({ name: "Vesper Heart", x: 90, y: 90, theme: "throne", finalBossRoom: true, returnRoom: FINAL_SEAL_ROOM_ID, hidden: true });

const VILLAGE_START_ROOM_ID = rooms.length;
rooms.push(
  {
    name: "Hearthmere Village",
    x: -9,
    y: 0,
    theme: "village",
    village: true,
    npcs: [
      { name: "Mara", role: "baker", x: 104, line: "Baker Mara: That castle curse has swallowed braver names than yours.", reply: "Knight: Then it must still be hungry. Pack me something dramatic for the victory walk home." },
      { name: "Tobin", role: "smith", x: 150, line: "Smith Tobin: Steel bends near those walls. The curse cannot be lifted.", reply: "Knight: Good thing I am mostly nerve and bad ideas. The curse can try bending those." },
      { name: "Pip", role: "child", x: 224, line: "Pip: My gran says the castle eats heroes for breakfast.", reply: "Knight: Then it picked the wrong meal. I come with elbows, steel, and terrible table manners." },
      { name: "Sister Vale", role: "healer", x: 315, line: "Sister Vale: I have prayed until the candles drowned. The curse remains.", reply: "Knight: Keep one candle dry for me, Sister. I plan to give it something worth lighting." }
    ],
    knightHouseEntrance: true,
    villageDecor: "square"
  },
  {
    name: "Market Row",
    x: -8,
    y: 0,
    theme: "village",
    village: true,
    npcs: [
      { name: "Nessa", role: "trader", x: 88, line: "Trader Nessa: No coin buys a clean road through that curse.", reply: "Knight: Then I will pay in noise, nerve, and a professionally reckless amount of swordwork." },
      { name: "Brant", role: "guard", x: 178, line: "Old Brant: The knights tried for years. The castle kept the lot.", reply: "Knight: They marched in politely. I am going to kick the door, insult the curse, and make it blink first." },
      { name: "Jun", role: "minstrel", x: 286, line: "Jun: I only write sad songs about that place now.", reply: "Knight: Tune the lute higher. By nightfall you will need a chorus big enough for my name." },
      { name: "Edda", role: "elder", x: 366, line: "Edda: Hope is a candle in rain, bright boy. The castle's curse cannot end.", reply: "Knight: Then call me lightning, Edda. Rain gets nervous when I start showing off." }
    ],
    villageDecor: "market"
  },
  {
    name: "Old Well Green",
    x: -7,
    y: 0,
    theme: "village",
    village: true,
    npcs: [
      { name: "Rowan", role: "farmer", x: 112, line: "Farmer Rowan: The fields still hear the castle moaning at night.", reply: "Knight: By dusk it will be singing my entrance music. Possibly against its will." },
      { name: "Ida", role: "elder", x: 214, line: "Ida: I saw three champions leave. None came back with dawn.", reply: "Knight: Dawn and I have an arrangement. I do something impossible, it makes me look magnificent." },
      { name: "Bell", role: "child", x: 320, line: "Bell: If you lift the curse, can I ring the big castle bell?", reply: "Knight: Twice. First for the castle waking up, second because I will bow and demand applause." }
    ],
    villageDecor: "well"
  },
  {
    name: "Hearthmere Gate",
    x: -6,
    y: 0,
    theme: "village",
    village: true,
    castleGate: true,
    npcs: [
      { name: "Warden Orrin", role: "guard", x: 88, line: "Warden Orrin: Past this gate, the castle road stops pretending to be kind.", reply: "Knight: Good. I was getting tired of kind pretending." },
      { name: "Lio", role: "child", x: 206, line: "Lio: If the castle gets scary, you can still run back here.", reply: "Knight: I will come back when it is quiet enough for you to sleep." },
      { name: "Mara", role: "baker", x: 306, line: "Baker Mara: Take one last warm breath, knight. The stones ahead are all winter.", reply: "Knight: Then I will bring the village a thaw." }
    ],
    villageDecor: "gate"
  }
);
const KNIGHT_HOUSE_ROOM_ID = rooms.length;
rooms.push({
  name: "Knight's House",
  x: -90,
  y: -90,
  theme: "village",
  village: true,
  knightHouse: true,
  startingSword: true,
  returnRoom: VILLAGE_START_ROOM_ID,
  hidden: true
});
const SUNDIAL_ALTAR_ROOM_ID = rooms.length;
rooms.push({
  name: "Hidden Sundial Shrine",
  x: 70,
  y: 70,
  theme: "forge",
  hidden: true,
  sundialAltarRoom: true,
  returnRoom: 7,
  returnPortalX: W - 58,
  returnEntryX: 28,
  returnEntryY: 146,
  checkpointAltar: { x: W / 2 - 13, y: FLOOR_Y - 35, respawnX: W / 2 - 5, respawnY: 146, style: "sundial" }
});
rooms.push({ name: "Moonward Bailey", x: 8, y: -3, theme: "keep", moonHookRoute: true, checkpointAltar: { x: 156, y: FLOOR_Y - 35, respawnX: 160, respawnY: FLOOR_Y - 20, style: "moon" } });
const START_ROOM_ID = VILLAGE_START_ROOM_ID;

const bossNames = {
  hound: "Gate-Hound Brakka",
  gargoyle: "Bell-Horn Gargoyle",
  penitent: "Cinder Penitent",
  moonKnight: "Moon-Vowed Duelist",
  thornImp: "Root-Crowned Imp",
  boneGuard: "Oath-Bone Captain",
  ossuaryBird: "Ossuary Wyvern",
  anvilGuard: "Sundial Anvil Guard",
  ironKing: "Iron King"
};

const bossCries = {
  hound: "Brakka lowers its horns and bellows for blood.",
  gargoyle: "The tower bell screams through stone wings.",
  penitent: "The Penitent raises its brand in a furnace prayer.",
  moonKnight: "The Duelist draws moonlight into a silent salute.",
  thornImp: "The root crown opens and laughs through the walls.",
  boneGuard: "The Captain plants the Aegis and swears the crypt shut.",
  ossuaryBird: "Bone wings rake the ceiling with a hunting shriek.",
  anvilGuard: "The furnace clock strikes against its own heart.",
  ironKing: "The crown grinds open. Every oath you stole answers him."
};

const parkourStyles = ["steps", "switchback", "spikeVault", "shaft", "pillars", "ringRun", "brokenStairs", "needleThread", "terraces", "chimney", "islands", "crawl"];

function parkourSeed(room) {
  return Math.abs(room.id * 97 + room.x * 53 + room.y * 31);
}

function roomParkourStyle(room) {
  if (room.removed || room.theme === "village" || room.rewardAbility || room.finalSealRoom || room.finalBossRoom || room.sundialAltarRoom || abilityTrials[room.id]) return "";
  const themeStyles = {
    tower: ["shaft", "switchback", "ringRun", "chimney", "terraces"],
    keep: ["ringRun", "needleThread", "switchback", "islands", "chimney"],
    moss: ["brokenStairs", "pillars", "shaft", "terraces", "islands"],
    crypt: ["pillars", "needleThread", "steps", "crawl", "brokenStairs"],
    forge: ["spikeVault", "switchback", "needleThread", "islands", "crawl"],
    bone: ["shaft", "brokenStairs", "spikeVault", "pillars", "terraces"],
    void: ["ringRun", "shaft", "needleThread", "islands", "chimney"],
    throne: ["ringRun", "pillars", "switchback", "terraces", "needleThread"],
    chapel: ["steps", "terraces", "crawl", "switchback", "pillars"],
    catacomb: ["crawl", "pillars", "brokenStairs", "needleThread", "steps"],
    castle: ["steps", "switchback", "brokenStairs", "pillars", "islands"],
    water: ["islands", "steps", "pillars", "brokenStairs", "terraces"]
  };
  const pool = themeStyles[room.theme] || parkourStyles;
  return pool[parkourSeed(room) % pool.length];
}

function setTileSpan(tiles, y, x1, x2, tile = "#") {
  for (let x = Math.max(1, x1); x <= Math.min(COLS - 2, x2); x++) tiles[y][x] = tile;
}

function setTileColumn(tiles, x, y1, y2, tile = "#") {
  if (x <= 0 || x >= COLS - 1) return;
  for (let y = Math.max(2, y1); y <= Math.min(FLOOR_ROW - 1, y2); y++) tiles[y][x] = tile;
}

function setTileRect(tiles, x1, y1, x2, y2, tile = "#") {
  for (let y = Math.max(2, y1); y <= Math.min(FLOOR_ROW - 1, y2); y++) {
    for (let x = Math.max(1, x1); x <= Math.min(COLS - 2, x2); x++) tiles[y][x] = tile;
  }
}

function clearParkourInterior(tiles) {
  for (let y = 2; y < FLOOR_ROW; y++) {
    for (let x = 1; x < COLS - 1; x++) {
      tiles[y][x] = ".";
    }
  }
  for (let x = 1; x < COLS - 1; x++) tiles[GROUND_ROW][x] = ".";
}

function addSpikeRun(tiles, x1, x2) {
  const doorStart = Math.floor(COLS / 2) - 2;
  const doorEnd = doorStart + 4;
  for (let x = Math.max(3, x1); x <= Math.min(COLS - 4, x2); x++) {
    if (x >= doorStart - 2 && x <= doorEnd + 1) continue;
    tiles[GROUND_ROW][x] = "^";
  }
}

function isBossArenaRoom(room) {
  return !!room && (!!abilityTrials[room.id] || room.id === FINAL_BOSS_ROOM_ID);
}

function roomAboveIsBossArena(room) {
  return isBossArenaRoom(roomByCoord.get(`${room.x},${room.y - 1}`));
}

function clearRoomExitApproaches(room, tiles) {
  const bossArena = isBossArenaRoom(room);
  const lowerDoorTop = Math.max(3, FLOOR_ROW - 3);
  const doorStart = Math.floor(COLS / 2) - 2;
  const doorEnd = doorStart + 4;
  const clearRect = (x1, y1, x2, y2) => {
    for (let y = Math.max(0, y1); y <= Math.min(FLOOR_ROW, y2); y++) {
      for (let x = Math.max(0, x1); x <= Math.min(COLS - 1, x2); x++) {
        tiles[y][x] = ".";
      }
    }
  };
  if (roomByCoord.has(`${room.x - 1},${room.y}`)) clearRect(0, lowerDoorTop - 2, 4, FLOOR_ROW - 1);
  if (roomByCoord.has(`${room.x + 1},${room.y}`)) clearRect(COLS - 5, lowerDoorTop - 2, COLS - 1, FLOOR_ROW - 1);
  if (!bossArena && roomByCoord.has(`${room.x},${room.y + 1}`)) clearRect(doorStart - 1, FLOOR_ROW - 4, doorEnd, FLOOR_ROW);
  if (!roomAboveIsBossArena(room) && roomByCoord.has(`${room.x},${room.y - 1}`)) clearRect(doorStart - 1, 0, doorEnd, 4);
}

function placePlatforms(tiles, platforms, options = {}) {
  const mirror = !!options.mirror;
  const xOffset = options.xOffset || 0;
  const yOffset = options.yOffset || 0;
  for (const platform of platforms) {
    const y = clamp(Math.round(platform[0] + yOffset), 3, FLOOR_ROW - 1);
    let x1 = platform[1] + xOffset;
    let x2 = platform[2] + xOffset;
    if (mirror) {
      const mirroredX1 = COLS - 1 - x2;
      const mirroredX2 = COLS - 1 - x1;
      x1 = mirroredX1;
      x2 = mirroredX2;
    }
    setTileSpan(tiles, y, Math.round(x1), Math.round(x2), platform[3] || "#");
  }
}

function placeParkourRings(rings, points, options = {}) {
  const mirror = !!options.mirror;
  const xOffset = options.xOffset || 0;
  const yOffset = options.yOffset || 0;
  for (const point of points) {
    const x = mirror ? W - point[0] + xOffset : point[0] + xOffset;
    rings.push({ x: clamp(Math.round(x), 34, W - 34), y: clamp(Math.round(point[1] + yOffset), 30, FLOOR_Y - 36) });
  }
}

function applyVillageLayout(room, tiles, decor) {
  clearParkourInterior(tiles);
  for (let x = 0; x < COLS; x++) {
    tiles[0][x] = ".";
    tiles[1][x] = ".";
    tiles[FLOOR_ROW][x] = "#";
  }
  for (let y = 0; y < FLOOR_ROW; y++) {
    tiles[y][0] = ".";
    tiles[y][COLS - 1] = ".";
  }
  if (room.villageDecor === "gate") {
    decor.push(
      { x: 36, y: FLOOR_Y - 54, t: "house", roof: "#7a3f3a" },
      { x: 164, y: FLOOR_Y - 31, t: "crate" },
      { x: W - 86, y: FLOOR_Y - 91, t: "castleGate" },
      { x: 274, y: FLOOR_Y - 30, t: "lamp" }
    );
  } else if (room.villageDecor === "market") {
    decor.push(
      { x: 34, y: FLOOR_Y - 46, t: "stall", awning: "#c6423c" },
      { x: 258, y: FLOOR_Y - 45, t: "stall", awning: "#2f7d71" },
      { x: 132, y: FLOOR_Y - 24, t: "crate" },
      { x: 348, y: FLOOR_Y - 29, t: "barrel" }
    );
  } else if (room.villageDecor === "well") {
    decor.push(
      { x: 194, y: FLOOR_Y - 38, t: "well" },
      { x: 52, y: FLOOR_Y - 58, t: "house", roof: "#7a3f3a" },
      { x: 332, y: FLOOR_Y - 54, t: "tree" },
      { x: 286, y: FLOOR_Y - 30, t: "barrel" }
    );
  } else {
    decor.push(
      { x: 0, y: FLOOR_Y - 58, t: "house", roof: "#8a1f2d", owner: "knight" },
      { x: 248, y: FLOOR_Y - 52, t: "stall", awning: "#ffd166" },
      { x: 356, y: FLOOR_Y - 64, t: "gate" },
      { x: 168, y: FLOOR_Y - 30, t: "lamp" }
    );
  }
  for (let x = 42; x < W - 20; x += 58) decor.push({ x, y: 46 + (x % 3), t: "bunting" });
}

function applyKnightHouseLayout(tiles, decor) {
  for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) tiles[y][x] = ".";
  for (let x = 0; x < COLS; x++) {
    tiles[0][x] = "#";
    tiles[1][x] = "#";
    tiles[FLOOR_ROW][x] = "#";
  }
  for (let y = 0; y < FLOOR_ROW; y++) {
    tiles[y][0] = "#";
    tiles[y][COLS - 1] = "#";
  }
  decor.push(
    { x: 44, y: FLOOR_Y - 50, t: "houseExit" },
    { x: 92, y: FLOOR_Y - 42, t: "bed" },
    { x: 170, y: FLOOR_Y - 36, t: "table" },
    { x: 276, y: FLOOR_Y - 50, t: "swordRack" },
    { x: 342, y: FLOOR_Y - 58, t: "shelf" }
  );
}

function applySundialAltarRoomLayout(tiles, decor) {
  for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) tiles[y][x] = ".";
  for (let x = 0; x < COLS; x++) {
    tiles[0][x] = "#";
    tiles[1][x] = "#";
    tiles[FLOOR_ROW][x] = "#";
  }
  for (let y = 0; y < FLOOR_ROW; y++) {
    tiles[y][0] = "#";
    tiles[y][COLS - 1] = "#";
  }
  setTileSpan(tiles, 14, 8, 14);
  setTileSpan(tiles, 14, COLS - 15, COLS - 9);
  setTileSpan(tiles, 11, Math.floor(COLS / 2) - 4, Math.floor(COLS / 2) + 4);
  decor.push(
    { x: W / 2 - 34, y: 54, t: "sundialHalo" },
    { x: 76, y: FLOOR_Y - 42, t: "forgeGear" },
    { x: W - 116, y: FLOOR_Y - 46, t: "forgeGear" }
  );
}

function applyRootImpExitRoute(tiles) {
  setTileSpan(tiles, 14, 29, 35);
  setTileSpan(tiles, 11, 31, 35);
  setTileSpan(tiles, 8, 29, 34);
  setTileSpan(tiles, 7, 22, 27);
  setTileSpan(tiles, 5, 15, 20);
}

function isMoonHookRouteRoom(room) {
  if (!room || room.theme !== "keep" || abilityTrials[room.id] || room.rewardAbility) return false;
  return room.moonHookRoute || new Set(["7,0", "8,0", "7,-1", "8,-1", "8,-2", "8,-3"]).has(`${room.x},${room.y}`);
}

function applyMoonHookRoute(room, tiles, rings) {
  if (!isMoonHookRouteRoom(room)) return;
  const key = `${room.x},${room.y}`;
  rings.length = 0;
  clearParkourInterior(tiles);
  const gateX = key === "8,-3" ? 13 : key === "8,-2" ? 17 : key === "8,-1" ? 20 : 23;
  setTileRect(tiles, gateX, 5, gateX + 1, GROUND_ROW, "U");
  placePlatforms(tiles, [
    [15, 2, 8],
    [12, 9, 15],
    [9, 15, 21],
    [6, gateX - 5, gateX - 1],
    [6, gateX + 2, gateX + 7],
    [13, gateX + 9, COLS - 4]
  ]);
  if (key === "8,-2" || key === "8,-3") {
    setTileSpan(tiles, 10, gateX + 8, gateX + 13);
  }
  placeParkourRings(rings, [
    [(gateX + 7) * TILE, 78],
    [(gateX - 3) * TILE, 72]
  ]);
}

function applyParkourLayout(room, tiles, rings) {
  const style = roomParkourStyle(room);
  if (!style) return;
  clearParkourInterior(tiles);
  const mid = Math.floor(COLS / 2);
  const seed = parkourSeed(room);
  const variant = seed % 4;
  const mirror = seed % 2 === 1;
  const xShift = (variant - 1) * 2;
  const yShift = variant === 3 ? -1 : 0;
  switch (style) {
    case "steps":
      placePlatforms(tiles, variant % 2
        ? [[15, 3, 8], [12, 11, 16], [9, 19, 24], [11, 28, 34]]
        : [[14, 4, 9], [12, 13, 18], [10, 22, 27], [13, 30, 34]], { mirror, xOffset: xShift });
      break;
    case "switchback":
      placePlatforms(tiles, [
        [14, 3, 10],
        [11 + (variant % 2), 13, 20],
        [8, 24, 31],
        [5 + (variant === 2 ? 1 : 0), 8, 15],
        ...(variant === 3 ? [[13, 26, 33]] : [])
      ], { mirror, xOffset: xShift });
      break;
    case "spikeVault":
      addSpikeRun(tiles, variant === 2 ? 7 : 4, variant === 1 ? COLS - 8 : COLS - 5);
      placePlatforms(tiles, [
        [14, 5, 9],
        [12, 13, 17],
        [10 + (variant === 3 ? 1 : 0), 22, 26],
        [13, 30, 34],
        ...(variant === 1 ? [[8, mid - 2, mid + 2]] : [])
      ], { mirror, xOffset: xShift });
      break;
    case "shaft":
      placePlatforms(tiles, [
        [15, 4, 8],
        [12, 14, 20],
        [9, 25, 31],
        [7, 8, 13],
        [4, mid - 2, mid + 3],
        ...(variant >= 2 ? [[11, 5, 8]] : [])
      ], { mirror, xOffset: xShift, yOffset: yShift });
      break;
    case "pillars":
      for (const column of (variant % 2 ? [[7, 13], [17, 9], [29, 12]] : [[8, 12], [18, 10], [28, 13]])) {
        setTileColumn(tiles, mirror ? COLS - 1 - column[0] : column[0], column[1], GROUND_ROW);
      }
      placePlatforms(tiles, [
        [11, 5, 11],
        [9, 15, 22],
        [12, 25, 33],
        ...(variant === 3 ? [[6, 18, 23]] : [])
      ], { mirror, xOffset: xShift });
      break;
    case "ringRun":
      placePlatforms(tiles, [
        [14, 3, 8],
        [12 + (variant === 1 ? 1 : 0), 13, 17],
        [12, 25, 30],
        ...(variant >= 2 ? [[8, mid - 2, mid + 2]] : [])
      ], { mirror, xOffset: xShift });
      placeParkourRings(rings, variant % 2
        ? [[116, 78], [210, 52], [306, 72], [360, 104]]
        : [[132, 72], [224, 54], [318, 82]], { mirror, yOffset: variant === 3 ? 8 : 0 });
      break;
    case "brokenStairs":
      placePlatforms(tiles, [
        [15, 3, 6],
        [13, 8, 11],
        [11, 13, 16],
        [9, 19, 22],
        [7, 25, 29],
        [12, 32, 35],
        ...(variant === 2 ? [[5, 14, 17]] : [])
      ], { mirror, xOffset: variant === 1 ? 1 : 0 });
      break;
    case "needleThread":
      addSpikeRun(tiles, 7 + variant, COLS - 8 - (variant % 2));
      placePlatforms(tiles, [
        [15, 4, 8],
        [13, 11, 14],
        [11, 17, 20],
        [9, 23, 26],
        [12, 30, 34],
        ...(variant === 3 ? [[6, mid - 1, mid + 1]] : [])
      ], { mirror, xOffset: xShift });
      if (["keep", "tower", "void"].includes(room.theme)) placeParkourRings(rings, [[188, 70], [266, 68]], { mirror });
      break;
    case "terraces":
      placePlatforms(tiles, [
        [15, 2, 13],
        [13, 16, 25],
        [11, 28, 35],
        [8, 6, 14],
        [6, 21, 30]
      ], { mirror, xOffset: xShift, yOffset: yShift });
      if (variant >= 2) addSpikeRun(tiles, 12, 23);
      break;
    case "chimney":
      setTileColumn(tiles, mirror ? COLS - 9 : 8, 8, GROUND_ROW);
      setTileColumn(tiles, mirror ? COLS - 25 : 24, 5, 13);
      placePlatforms(tiles, [
        [15, 4, 9],
        [12, 12, 17],
        [9, 20, 25],
        [6, 28, 34],
        [4, mid - 2, mid + 2]
      ], { mirror, xOffset: xShift });
      placeParkourRings(rings, [[154, 86], [246, 58]], { mirror, yOffset: variant === 1 ? 10 : 0 });
      break;
    case "islands":
      placePlatforms(tiles, [
        [15, 3, 7],
        [13, 12, 16],
        [10, 20, 24],
        [13, 29, 34],
        [7, 10, 14],
        [6, 26, 31]
      ], { mirror, xOffset: xShift });
      if (variant % 2) addSpikeRun(tiles, 9, COLS - 10);
      if (["keep", "tower", "void"].includes(room.theme)) placeParkourRings(rings, [[146, 76], [226, 55], [304, 78]], { mirror });
      break;
    case "crawl":
      placePlatforms(tiles, [
        [15, 4, 12],
        [13, 18, 28],
        [10, 6, 16],
        [8, 22, 34],
        [5, 12, 23]
      ], { mirror, xOffset: xShift, yOffset: yShift });
      if (variant !== 0) addSpikeRun(tiles, 16, 25);
      break;
  }
}

const world = new Map();
const roomByCoord = new Map(rooms.map((r, i) => ({ ...r, id: i })).filter(r => !r.removed).map(r => [`${r.x},${r.y}`, r]));
const SAVE_KEY = "iron-vesper-save-v2";
const AUDIO_KEY = "iron-vesper-audio-v1";
const SIDEBAR_SCALE_KEY = "iron-vesper-sidebar-scale-v1";
const SIDEBAR_SCALE_MIN = 80;
const SIDEBAR_SCALE_MAX = 140;
const visitedAreas = new Set();
let mapStaticCanvas = null;
let mapStaticDirty = true;
let mapLayout = null;

function invalidateMap() {
  mapStaticDirty = true;
}

const audioLevels = readAudioLevels();

const PLAYER_STAND_H = 20;
const PLAYER_CROUCH_H = 12;
const PLAYER_CROUCH_Y = PLAYER_STAND_H - PLAYER_CROUCH_H;

function collisionBox(a) {
  if (a && (a.crouch || a.crawl) && !a.abilities?.shield && a.h === PLAYER_STAND_H) {
    return { x: a.x, y: a.y + PLAYER_CROUCH_Y, w: a.w, h: PLAYER_CROUCH_H, ox: 0, oy: PLAYER_CROUCH_Y };
  }
  return { x: a.x, y: a.y, w: a.w, h: a.h, ox: 0, oy: 0 };
}

function rects(a, b) {
  const aa = collisionBox(a);
  const bb = collisionBox(b);
  return aa.x < bb.x + bb.w && aa.x + aa.w > bb.x && aa.y < bb.y + bb.h && aa.y + aa.h > bb.y;
}

function clamp(v, a, b) {
  return Math.max(a, Math.min(b, v));
}

function readSidebarScalePercent() {
  try {
    return clamp(Math.round(Number(localStorage.getItem(SIDEBAR_SCALE_KEY)) || 100), SIDEBAR_SCALE_MIN, SIDEBAR_SCALE_MAX);
  } catch {
    return 100;
  }
}

function writeSidebarScalePercent(value) {
  try {
    localStorage.setItem(SIDEBAR_SCALE_KEY, String(value));
  } catch {
    // Sidebar scale still applies for this session if local storage is blocked.
  }
}

function syncSidebarScaleUi() {
  if (ui.sidebarScale) ui.sidebarScale.value = sidebarScalePercent;
  if (ui.sidebarScaleValue) ui.sidebarScaleValue.textContent = `${sidebarScalePercent}%`;
}

function setSidebarScale(value, persist = true, fit = true) {
  sidebarScalePercent = clamp(Math.round(Number(value) || 100), SIDEBAR_SCALE_MIN, SIDEBAR_SCALE_MAX);
  document.documentElement.style.setProperty("--sidebar-scale", (sidebarScalePercent / 100).toFixed(2));
  syncSidebarScaleUi();
  if (persist) writeSidebarScalePercent(sidebarScalePercent);
  if (fit) scheduleGameCanvasFit();
}

setSidebarScale(readSidebarScalePercent(), false, false);

function midiToFreq(note) {
  return 440 * Math.pow(2, (note - 69) / 12);
}

function readAudioLevels() {
  try {
    const saved = JSON.parse(localStorage.getItem(AUDIO_KEY) || "{}");
    return {
      master: clamp(Math.round(saved.master ?? 7), 1, 10),
      music: clamp(Math.round(saved.music ?? 7), 1, 10),
      sfx: clamp(Math.round(saved.sfx ?? 8), 1, 10)
    };
  } catch {
    return { master: 7, music: 7, sfx: 8 };
  }
}

function writeAudioLevels() {
  try {
    localStorage.setItem(AUDIO_KEY, JSON.stringify(audioLevels));
  } catch {
    // Local saves can fail in some embedded browsers; the sliders still work for this session.
  }
}

function gainFromLevel(level, maxGain) {
  return (clamp(level, 1, 10) / 10) * maxGain;
}

function applyAudioLevels() {
  if (audio.master) audio.master.gain.value = gainFromLevel(audioLevels.master, 1.0);
  if (audio.musicGain) audio.musicGain.gain.value = gainFromLevel(audioLevels.music, 0.62);
  if (audio.sfxGain) audio.sfxGain.gain.value = gainFromLevel(audioLevels.sfx, 1.05);
}

function syncAudioSettingsUi() {
  const pairs = [
    ["master", ui.masterVolume, ui.masterVolumeValue],
    ["music", ui.musicVolume, ui.musicVolumeValue],
    ["sfx", ui.sfxVolume, ui.sfxVolumeValue],
    ["master", ui.pauseMasterVolume, ui.pauseMasterVolumeValue],
    ["music", ui.pauseMusicVolume, ui.pauseMusicVolumeValue],
    ["sfx", ui.pauseSfxVolume, ui.pauseSfxVolumeValue]
  ];
  for (const [key, input, label] of pairs) {
    if (!input || !label) continue;
    input.value = audioLevels[key];
    label.textContent = audioLevels[key];
  }
}

function setAudioLevel(key, value) {
  audioLevels[key] = clamp(Number(value) || audioLevels[key], 1, 10);
  applyAudioLevels();
  syncAudioSettingsUi();
  writeAudioLevels();
}

function ensureAudio() {
  if (audio.ctx) {
    audio.ctx.resume?.();
    applyAudioLevels();
    return;
  }
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) return;
  audio.ctx = new AudioCtx();
  audio.master = audio.ctx.createGain();
  audio.musicGain = audio.ctx.createGain();
  audio.sfxGain = audio.ctx.createGain();
  applyAudioLevels();
  audio.musicGain.connect(audio.master);
  audio.sfxGain.connect(audio.master);
  audio.master.connect(audio.ctx.destination);
}

function tone(freq, time, dur, type = "square", gain = 0.08, dest = audio.musicGain, slide = 0) {
  if (!audio.ctx || audio.muted) return;
  const osc = audio.ctx.createOscillator();
  const amp = audio.ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, time);
  if (slide) osc.frequency.exponentialRampToValueAtTime(Math.max(20, freq * slide), time + dur);
  amp.gain.setValueAtTime(0.0001, time);
  amp.gain.exponentialRampToValueAtTime(gain, time + 0.012);
  amp.gain.exponentialRampToValueAtTime(0.0001, time + dur);
  osc.connect(amp);
  amp.connect(dest);
  osc.start(time);
  osc.stop(time + dur + 0.03);
}

function noise(time, dur, gain = 0.08, decay = 0.04) {
  if (!audio.ctx || audio.muted) return;
  const len = Math.max(1, Math.floor(audio.ctx.sampleRate * dur));
  const buffer = audio.ctx.createBuffer(1, len, audio.ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
  const src = audio.ctx.createBufferSource();
  const amp = audio.ctx.createGain();
  src.buffer = buffer;
  amp.gain.setValueAtTime(gain, time);
  amp.gain.exponentialRampToValueAtTime(0.0001, time + Math.max(decay, dur));
  src.connect(amp);
  amp.connect(audio.sfxGain);
  src.start(time);
  src.stop(time + dur);
}

function setMusicTheme(theme) {
  if (audio.theme === theme) return;
  audio.theme = theme;
  audio.step = 0;
  audio.next = audio.ctx ? audio.ctx.currentTime + 0.05 : 0;
}

function scheduleBgmStep(time) {
  const song = musicData[audio.theme] || musicData.castle;
  const bossSong = audio.theme === "boss";
  const finalBossSong = audio.theme === "ironKing";
  const beat = 60 / song.tempo;
  const step = audio.step % 16;
  const bassIndex = song.bass[Math.floor(step / 2) % song.bass.length];
  const leadIndex = song.lead[step];
  const chord = song.scale[(step + 2) % song.scale.length];
  const bassGain = finalBossSong ? 0.15 : bossSong ? 0.12 : 0.075;
  const leadGain = finalBossSong ? 0.115 : bossSong ? 0.088 : 0.055;
  const chordGain = finalBossSong ? 0.062 : bossSong ? 0.046 : 0.025;
  if (step % 2 === 0) tone(midiToFreq(song.root + song.scale[bassIndex % song.scale.length] - 24), time, beat * 0.72, "square", bassGain);
  if (leadIndex >= 0) tone(midiToFreq(song.root + song.scale[leadIndex % song.scale.length]), time, beat * (finalBossSong ? 0.58 : bossSong ? 0.48 : 0.38), song.color, leadGain);
  if (step % 4 === 2 || ((bossSong || finalBossSong) && step % 4 === 0)) tone(midiToFreq(song.root + chord + 12), time, beat * 0.24, bossSong || finalBossSong ? "square" : "triangle", chordGain);
  if ((bossSong || finalBossSong) && step % 2 === 1) tone(midiToFreq(song.root + song.scale[(bassIndex + 3) % song.scale.length] - 12), time, beat * 0.18, "triangle", finalBossSong ? 0.052 : 0.034);
  if (finalBossSong && step % 2 === 0) tone(midiToFreq(song.root + song.scale[(leadIndex + 5) % song.scale.length] + 12), time + beat * 0.18, beat * 0.16, "square", 0.045);
  if (step % 4 === 0) noise(time, finalBossSong ? 0.062 : bossSong ? 0.052 : 0.035, finalBossSong ? 0.048 : bossSong ? 0.034 : 0.018, 0.03);
  if (step % 4 === 2) noise(time, finalBossSong ? 0.044 : bossSong ? 0.036 : 0.02, finalBossSong ? 0.036 : bossSong ? 0.026 : 0.012, 0.02);
  if ((bossSong || finalBossSong) && step % 4 === 3) noise(time, finalBossSong ? 0.034 : 0.022, finalBossSong ? 0.032 : 0.018, 0.015);
  if (finalBossSong && step % 8 === 7) tone(midiToFreq(song.root + 24), time, beat * 0.22, "sawtooth", 0.07, audio.musicGain, 0.5);
  audio.step++;
  audio.next += beat / 2;
}

function updateMusic() {
  if (!audio.ctx || audio.muted) return;
  let theme = "menu";
  if (gameStarted) {
    const room = currentRoom();
    const ironKingActive = room.enemies.some(e => e.bossType === "ironKing" && (e.hp > 0 || e.dying));
    const detailedBossActive = room.enemies.some(e => e.trialBoss && ["hound", "gargoyle", "thornImp", "boneGuard", "ossuaryBird", "penitent", "moonKnight", "anvilGuard"].includes(e.type) && (e.hp > 0 || e.dying));
    theme = ironKingActive ? "ironKing" : detailedBossActive ? "boss" : room.theme;
  }
  setMusicTheme(theme);
  while (audio.next < audio.ctx.currentTime + 0.18) scheduleBgmStep(audio.next);
}

function playSfx(name) {
  ensureAudio();
  if (!audio.ctx || audio.muted) return;
  const t = audio.ctx.currentTime + 0.01;
  const sfx = {
    jump: () => tone(360, t, 0.12, "square", 0.13, audio.sfxGain, 1.55),
    doubleJump: () => { tone(520, t, 0.09, "triangle", 0.12, audio.sfxGain, 1.8); noise(t, 0.08, 0.035); },
    attack: () => { tone(720, t, 0.05, "square", 0.09, audio.sfxGain, 0.58); noise(t, 0.035, 0.045); },
    upSlash: () => { tone(500, t, 0.08, "square", 0.11, audio.sfxGain, 2.15); tone(880, t + 0.04, 0.07, "triangle", 0.08, audio.sfxGain, 1.25); },
    dash: () => { tone(180, t, 0.11, "sawtooth", 0.09, audio.sfxGain, 2.2); noise(t, 0.06, 0.04); },
    superDash: () => { tone(96, t, 0.34, "sawtooth", 0.18, audio.sfxGain, 3.4); tone(192, t + 0.03, 0.42, "square", 0.14, audio.sfxGain, 2.2); tone(384, t + 0.1, 0.24, "triangle", 0.1, audio.sfxGain, 0.72); noise(t, 0.18, 0.12); },
    bash: () => { tone(120, t, 0.14, "square", 0.15, audio.sfxGain, 0.72); noise(t, 0.11, 0.09); },
    shield: () => tone(300, t, 0.09, "triangle", 0.09, audio.sfxGain, 1.35),
    fire: () => { tone(220, t, 0.12, "sawtooth", 0.1, audio.sfxGain, 2.6); noise(t, 0.08, 0.035); },
    grapple: () => { tone(420, t, 0.05, "square", 0.08, audio.sfxGain, 1.8); tone(760, t + 0.045, 0.06, "square", 0.07, audio.sfxGain, 0.8); },
    pickup: () => { [0, 4, 7, 12].forEach((n, i) => tone(midiToFreq(72 + n), t + i * 0.045, 0.09, "square", 0.08, audio.sfxGain)); },
    hurt: () => { tone(170, t, 0.18, "sawtooth", 0.12, audio.sfxGain, 0.45); noise(t, 0.12, 0.075); },
    block: () => { tone(520, t, 0.05, "triangle", 0.12, audio.sfxGain, 1.12); noise(t, 0.035, 0.025); },
    shieldHit: () => { tone(170, t, 0.16, "square", 0.16, audio.sfxGain, 0.52); tone(720, t + 0.018, 0.09, "triangle", 0.14, audio.sfxGain, 1.22); noise(t, 0.12, 0.11); },
    gong: () => { tone(92, t, 0.7, "sine", 0.18, audio.sfxGain, 0.45); tone(184, t + 0.025, 0.55, "triangle", 0.1, audio.sfxGain, 0.62); noise(t, 0.22, 0.045); },
    shriek: () => { tone(1440, t, 0.22, "sawtooth", 0.14, audio.sfxGain, 2.8); tone(970, t + 0.035, 0.18, "square", 0.11, audio.sfxGain, 1.9); tone(1760, t + 0.08, 0.13, "triangle", 0.09, audio.sfxGain, 2.2); noise(t, 0.18, 0.055); },
    secret: () => { tone(90, t, 0.2, "square", 0.14, audio.sfxGain, 0.55); noise(t, 0.22, 0.13); },
    enemy: () => tone(260, t, 0.07, "square", 0.075, audio.sfxGain, 0.7),
    boss: () => { tone(70, t, 0.35, "sawtooth", 0.16, audio.sfxGain, 0.5); noise(t, 0.28, 0.13); },
    bossHound: () => { tone(62, t, 0.38, "sawtooth", 0.22, audio.sfxGain, 0.42); tone(96, t + 0.03, 0.26, "square", 0.17, audio.sfxGain, 0.58); noise(t, 0.34, 0.18); },
    bossGargoyle: () => { tone(84, t, 0.72, "sine", 0.24, audio.sfxGain, 0.5); tone(168, t + 0.04, 0.62, "triangle", 0.17, audio.sfxGain, 0.7); tone(1260, t + 0.12, 0.22, "sawtooth", 0.12, audio.sfxGain, 1.8); noise(t, 0.28, 0.08); },
    bossImp: () => { tone(310, t, 0.11, "square", 0.16, audio.sfxGain, 1.55); tone(620, t + 0.07, 0.12, "square", 0.13, audio.sfxGain, 0.72); tone(190, t + 0.14, 0.16, "triangle", 0.12, audio.sfxGain, 0.6); noise(t, 0.2, 0.1); },
    bossAegis: () => { tone(180, t, 0.18, "square", 0.18, audio.sfxGain, 0.68); tone(520, t + 0.035, 0.22, "triangle", 0.16, audio.sfxGain, 1.35); tone(780, t + 0.11, 0.12, "square", 0.1, audio.sfxGain, 0.86); noise(t, 0.13, 0.09); },
    bossWyvern: () => { tone(1180, t, 0.18, "sawtooth", 0.16, audio.sfxGain, 2.25); tone(760, t + 0.04, 0.2, "square", 0.13, audio.sfxGain, 1.5); tone(220, t + 0.12, 0.22, "triangle", 0.12, audio.sfxGain, 0.55); noise(t, 0.28, 0.12); },
    bossPenitent: () => { tone(138, t, 0.28, "sawtooth", 0.18, audio.sfxGain, 1.8); tone(276, t + 0.06, 0.24, "square", 0.15, audio.sfxGain, 1.25); tone(552, t + 0.16, 0.12, "triangle", 0.1, audio.sfxGain, 0.74); noise(t, 0.22, 0.13); },
    bossMoon: () => { tone(392, t, 0.11, "triangle", 0.15, audio.sfxGain, 1.7); tone(784, t + 0.055, 0.13, "triangle", 0.13, audio.sfxGain, 0.82); tone(196, t + 0.12, 0.18, "sine", 0.12, audio.sfxGain, 0.7); noise(t + 0.04, 0.08, 0.04); },
    bossSundial: () => { tone(120, t, 0.12, "square", 0.16, audio.sfxGain, 1.0); tone(240, t + 0.06, 0.12, "square", 0.14, audio.sfxGain, 1.0); tone(480, t + 0.12, 0.16, "triangle", 0.13, audio.sfxGain, 0.5); tone(960, t + 0.2, 0.12, "square", 0.1, audio.sfxGain, 0.5); noise(t, 0.16, 0.07); },
    menuMove: () => { tone(510, t, 0.035, "square", 0.075, audio.sfxGain, 1.28); tone(690, t + 0.035, 0.035, "triangle", 0.045, audio.sfxGain, 1.08); },
    menuStart: () => { [0, 5, 7, 12, 17].forEach((n, i) => tone(midiToFreq(55 + n), t + i * 0.055, 0.13, i < 2 ? "square" : "triangle", 0.09, audio.sfxGain)); noise(t + 0.18, 0.08, 0.035); },
    menuContinue: () => { [12, 7, 3, 0, -5].forEach((n, i) => tone(midiToFreq(48 + n), t + i * 0.06, 0.14, "sawtooth", 0.085, audio.sfxGain, 0.92)); noise(t + 0.08, 0.18, 0.055); },
    room: () => { tone(330, t, 0.08, "triangle", 0.06, audio.sfxGain, 1.5); tone(660, t + 0.055, 0.12, "triangle", 0.05, audio.sfxGain); }
  };
  sfx[name]?.();
}

function playBossSfx(type) {
  const names = {
    hound: "bossHound",
    gargoyle: "bossGargoyle",
    thornImp: "bossImp",
    boneGuard: "bossAegis",
    ossuaryBird: "bossWyvern",
    penitent: "bossPenitent",
    moonKnight: "bossMoon",
    anvilGuard: "bossSundial",
    ironKing: "boss"
  };
  playSfx(names[type] || "boss");
}

function makeRoom(room) {
  const trial = abilityTrials[room.id];
  const bossArena = isBossArenaRoom(room);
  const bossArenaAbove = roomAboveIsBossArena(room);
  const tiles = Array.from({ length: ROWS }, () => Array(COLS).fill("."));
  const solids = [];
  const hazards = [];
  const water = [];
  const gates = [];
  const rings = [];
  const items = [];
  const enemies = [];
  const decor = [];
  const breakables = [];
  const lowerDoorTop = Math.max(3, FLOOR_ROW - 3);
  for (let x = 0; x < COLS; x++) {
    tiles[0][x] = "#";
    tiles[1][x] = "#";
    tiles[FLOOR_ROW][x] = "#";
    if (room.theme !== "village" && x % 5 === 0 && (room.id !== 0 || x > Math.floor(COLS / 2))) tiles[GROUND_ROW][x] = "^";
  }
  for (let y = 0; y < FLOOR_ROW; y++) {
    tiles[y][0] = "#";
    tiles[y][COLS - 1] = "#";
  }
  if (roomByCoord.has(`${room.x - 1},${room.y}`)) for (let y = lowerDoorTop; y < FLOOR_ROW; y++) tiles[y][0] = ".";
  if (roomByCoord.has(`${room.x + 1},${room.y}`)) for (let y = lowerDoorTop; y < FLOOR_ROW; y++) tiles[y][COLS - 1] = ".";
  const doorStart = Math.floor(COLS / 2) - 2;
  const doorEnd = doorStart + 4;
  if (!bossArena && roomByCoord.has(`${room.x},${room.y + 1}`)) for (let x = doorStart; x < doorEnd; x++) tiles[FLOOR_ROW][x] = ".";
  if (!bossArenaAbove && roomByCoord.has(`${room.x},${room.y - 1}`)) {
    for (let x = doorStart; x < doorEnd; x++) {
      tiles[0][x] = ".";
      tiles[1][x] = ".";
    }
  }
  const seed = room.id * 73 + 19;
  for (let i = 0; i < (trial || room.theme === "village" || room.rewardAbility || room.finalSealRoom || room.finalBossRoom ? 0 : 6); i++) {
    const px = 2 + ((seed + i * 5) % Math.max(10, COLS - 6));
    const py = Math.min(GROUND_ROW - 2, 5 + ((seed + i * 3) % 6));
    const len = 3 + ((seed + i) % 5);
    for (let x = px; x < Math.min(COLS - 2, px + len); x++) tiles[py][x] = "#";
  }
  if (room.knightHouse) applyKnightHouseLayout(tiles, decor);
  else if (room.sundialAltarRoom) applySundialAltarRoomLayout(tiles, decor);
  else if (room.theme === "village") applyVillageLayout(room, tiles, decor);
  applyParkourLayout(room, tiles, rings);
  applyMoonHookRoute(room, tiles, rings);
  if (trial || room.rewardAbility) {
    for (let y = 2; y < FLOOR_ROW; y++) for (let x = 1; x < COLS - 1; x++) tiles[y][x] = ".";
    for (let x = 1; x < COLS - 1; x++) tiles[GROUND_ROW][x] = ".";
    for (let x = 1; x < COLS - 1; x++) tiles[FLOOR_ROW][x] = "#";
    if (room.rewardAbility) {
      for (let x = 9; x < COLS - 9; x++) tiles[Math.max(4, FLOOR_ROW - 4)][x] = "#";
    }
    if (room.id === 18) {
      for (let x = doorStart - 2; x < doorEnd + 2; x++) tiles[4][x] = "#";
      applyRootImpExitRoute(tiles);
    }
    if (roomByCoord.has(`${room.x - 1},${room.y}`)) for (let y = lowerDoorTop; y < FLOOR_ROW; y++) tiles[y][0] = ".";
    if (roomByCoord.has(`${room.x + 1},${room.y}`)) for (let y = lowerDoorTop; y < FLOOR_ROW; y++) tiles[y][COLS - 1] = ".";
    if (!bossArena && roomByCoord.has(`${room.x},${room.y + 1}`)) for (let x = doorStart; x < doorEnd; x++) tiles[FLOOR_ROW][x] = ".";
    if (!bossArenaAbove && roomByCoord.has(`${room.x},${room.y - 1}`)) {
      for (let x = doorStart; x < doorEnd; x++) {
        tiles[0][x] = ".";
        tiles[1][x] = ".";
      }
    }
  }
  if (room.finalSealRoom || room.finalBossRoom) {
    for (let y = 2; y < FLOOR_ROW; y++) for (let x = 1; x < COLS - 1; x++) tiles[y][x] = ".";
    for (let x = 1; x < COLS - 1; x++) {
      tiles[GROUND_ROW][x] = ".";
      tiles[FLOOR_ROW][x] = "#";
    }
    if (room.finalSealRoom) {
      setTileSpan(tiles, 14, 5, 12);
      setTileSpan(tiles, 14, COLS - 13, COLS - 6);
      setTileSpan(tiles, 11, Math.floor(COLS / 2) - 5, Math.floor(COLS / 2) + 5);
    } else {
      setTileSpan(tiles, 14, 3, 11);
      setTileSpan(tiles, 14, COLS - 12, COLS - 4);
      setTileSpan(tiles, 9, Math.floor(COLS / 2) - 4, Math.floor(COLS / 2) + 4);
      rings.push({ x: 104, y: 72 }, { x: W - 104, y: 72 });
    }
    if (roomByCoord.has(`${room.x - 1},${room.y}`)) for (let y = lowerDoorTop; y < FLOOR_ROW; y++) tiles[y][0] = ".";
    if (roomByCoord.has(`${room.x + 1},${room.y}`)) for (let y = lowerDoorTop; y < FLOOR_ROW; y++) tiles[y][COLS - 1] = ".";
    if (!bossArena && roomByCoord.has(`${room.x},${room.y + 1}`)) for (let x = doorStart; x < doorEnd; x++) tiles[FLOOR_ROW][x] = ".";
    if (!bossArenaAbove && roomByCoord.has(`${room.x},${room.y - 1}`)) {
      for (let x = doorStart; x < doorEnd; x++) {
        tiles[0][x] = ".";
        tiles[1][x] = ".";
      }
    }
  }
  if (room.theme === "water" && !trial && !room.rewardAbility) for (let x = 4; x < COLS - 4; x++) tiles[GROUND_ROW][x] = "~";
  if (["crypt", "void"].includes(room.theme) && !trial && !room.rewardAbility) for (let x = 5; x < COLS - 5; x += 4) tiles[Math.max(6, FLOOR_ROW - 5)][x] = "G";
  if ([2, 8, 20, 24].includes(room.id)) {
    const sx = Math.min(20, COLS - 3);
    for (let y = Math.max(4, FLOOR_ROW - 5); y < FLOOR_ROW; y++) tiles[y][sx] = "S";
  }
  if (["keep", "tower"].includes(room.theme) && !isMoonHookRouteRoom(room) && !bossArena) rings.push({ x: 185, y: 65 }, { x: 270, y: 96 });
  if (room.id === FINAL_BOSS_ROOM_ID) rings.push({ x: 122, y: 78 }, { x: W / 2, y: 54 }, { x: W - 122, y: 78 });

  if (room.rewardAbility && !["dash", "superDash", "wall", "shield", "fire", "doubleJump", "grapple", "time"].includes(room.rewardAbility)) {
    items.push({ type: "ability", ability: room.rewardAbility, x: W / 2 - 8, y: FLOOR_Y - 78, w: 28, h: 34, taken: false, title: "reliquary chamber" });
  }
  if (room.startingSword) {
    items.push({ type: "ability", ability: "sword", x: 286, y: FLOOR_Y - 49, w: 24, h: 42, taken: false, title: "your house", startingSword: true });
  }
  if (room.id === 12) {
    items.push({ type: "ability", ability: "dash", x: 1, y: FLOOR_Y - 42, w: 64, h: 42, taken: false, title: "fallen knight", trial: true, corpse: true });
  }
  if (room.id === 18) {
    items.push({ type: "ability", ability: "wall", x: W - 28, y: Math.max(70, FLOOR_Y - 108), w: 28, h: 58, taken: false, title: "root-clung greaves", trial: true, wallGreaves: true });
  }
  if (room.id === 1) {
    items.push({ type: "ability", ability: "superDash", x: W / 2 - 14, y: FLOOR_Y - 82, w: 32, h: 36, taken: false, title: "bell mantle", trial: true, bellMantle: true });
  }
  if (room.id === 5) {
    items.push({ type: "ability", ability: "shield", x: W / 2 - 13, y: FLOOR_Y - 80, w: 30, h: 34, taken: false, title: "oath shield", trial: true, aegisDrop: true });
  }
  if (room.id === 15) {
    items.push({ type: "ability", ability: "fire", x: W / 2 - 18, y: FLOOR_Y - 75, w: 38, h: 46, taken: false, title: "cinder altar", trial: true, cinderTorch: true });
  }
  if (room.id === 9) {
    items.push({ type: "ability", ability: "doubleJump", x: W / 2 - 34, y: FLOOR_Y - 44, w: 72, h: 44, taken: false, title: "fallen wyvern", trial: true, wyvernCorpse: true, pulls: 0, pullsNeeded: 5 });
  }
  if (room.id === 16) {
    items.push({ type: "ability", ability: "grapple", x: W / 2 - 12, y: FLOOR_Y - 76, w: 28, h: 34, taken: false, title: "moon hook altar", trial: true, moonHookDrop: true });
  }
  if (room.id === 7) {
    items.push({ type: "ability", ability: "time", x: W / 2 - 17, y: FLOOR_Y - 76, w: 36, h: 36, taken: false, title: "broken sundial", trial: true, sundialDrop: true });
  }
  if (room.id === FINAL_BOSS_ROOM_ID) enemies.push({
    boss: true,
    bossType: "ironKing",
    type: "ironKing",
    name: bossNames.ironKing,
    x: W - 132,
    y: FLOOR_Y - 58,
    baseY: FLOOR_Y - 58,
    arena: { left: 150, right: W - 76, top: 34, bottom: 148 },
    w: 58,
    h: 58,
    hp: 260,
    max: 260,
    vx: -0.5,
    vy: 0,
    dir: -1,
    phase: 0,
    move: "royalStalk",
    moveTimer: 70,
    hurt: 0
  });
  if (trial) {
    const flying = ["gargoyle", "ossuaryBird"].includes(trial.boss);
    const gateHound = trial.boss === "hound";
    const rootImp = trial.boss === "thornImp";
    const wyvern = trial.boss === "ossuaryBird";
    const bellGargoyle = trial.boss === "gargoyle";
    const aegisGuard = trial.boss === "boneGuard";
    const cinderPenitent = trial.boss === "penitent";
    const moonDuelist = trial.boss === "moonKnight";
    const sundialGuard = trial.boss === "anvilGuard";
    enemies.push({
      trialBoss: true,
      x: W * 0.46,
      y: flying ? (bellGargoyle ? 56 : 66) : FLOOR_Y - (gateHound ? 34 : rootImp ? 32 : aegisGuard ? 36 : cinderPenitent ? 38 : moonDuelist ? 36 : sundialGuard ? 42 : 27),
      baseY: flying ? (bellGargoyle ? 56 : 66) : FLOOR_Y - (gateHound ? 34 : rootImp ? 32 : aegisGuard ? 36 : cinderPenitent ? 38 : moonDuelist ? 36 : sundialGuard ? 42 : 27),
      arena: { left: gateHound ? 34 : 48, right: gateHound ? W - 78 : wyvern ? W - 84 : cinderPenitent || moonDuelist || sundialGuard ? W - 96 : W - 118, top: wyvern ? 58 : bellGargoyle ? 48 : 72, bottom: wyvern ? 145 : bellGargoyle ? 136 : 148 },
      w: gateHound ? 50 : rootImp ? 34 : wyvern ? 48 : bellGargoyle ? 42 : aegisGuard ? 36 : cinderPenitent ? 40 : moonDuelist ? 34 : sundialGuard ? 42 : flying ? 28 : 25,
      h: gateHound ? 34 : rootImp ? 32 : wyvern ? 30 : bellGargoyle ? 32 : aegisGuard ? 36 : cinderPenitent ? 38 : moonDuelist ? 36 : sundialGuard ? 42 : flying ? 22 : 27,
      hp: gateHound ? 44 : rootImp ? 85 : wyvern ? 78 : bellGargoyle ? 68 : aegisGuard ? 76 : cinderPenitent ? 96 : moonDuelist ? 92 : sundialGuard ? 88 : 54,
      max: gateHound ? 44 : rootImp ? 85 : wyvern ? 78 : bellGargoyle ? 68 : aegisGuard ? 76 : cinderPenitent ? 96 : moonDuelist ? 92 : sundialGuard ? 88 : 54,
      shieldArmor: aegisGuard ? 18 : 0,
      shieldMax: aegisGuard ? 18 : 0,
      vx: gateHound ? -0.75 : rootImp ? -0.45 : wyvern ? -0.8 : bellGargoyle ? -0.7 : aegisGuard ? -0.5 : cinderPenitent ? -0.52 : moonDuelist ? -0.75 : sundialGuard ? -0.42 : -0.55,
      vy: 0,
      phase: 0,
      move: gateHound || rootImp || wyvern || bellGargoyle || aegisGuard || cinderPenitent || moonDuelist || sundialGuard ? "stalk" : "",
      moveTimer: gateHound ? 44 : rootImp ? 38 : wyvern ? 40 : bellGargoyle ? 46 : aegisGuard ? 42 : cinderPenitent ? 40 : moonDuelist ? 36 : sundialGuard ? 44 : 0,
      type: trial.boss,
      name: bossNames[trial.boss],
      hurt: 0,
      flying
    });
  }
  if (room.id === 5) {
    decor.push(
      { x: 116, y: 46, t: "ghost", drift: 0 },
      { x: 218, y: 34, t: "ghost", drift: 1.7 },
      { x: 326, y: 52, t: "ghost", drift: 3.2 }
    );
  }
  for (let i = 0; room.theme !== "village" && i < COLS; i++) decor.push({ x: i * TILE, y: 18 + ((seed + i * 17) % 105), t: (seed + i) % 5 });
  const npcs = (room.npcs || []).map((npc, i) => ({
    ...npc,
    x: npc.x ?? (80 + i * 64),
    y: FLOOR_Y - (npc.h || 25),
    w: npc.w || 12,
    h: npc.h || 25,
    dir: npc.dir || (i % 2 ? -1 : 1),
    talkCount: 0
  }));
  const built = { ...room, tiles, solids, hazards, water, gates, rings, items, enemies, npcs, decor, breakables, visited: false };
  if (room.checkpointAltar) {
    built.checkpointAltar = {
      x: room.checkpointAltar.x,
      y: room.checkpointAltar.y,
      w: room.checkpointAltar.w || 26,
      h: room.checkpointAltar.h || 35,
      respawnX: room.checkpointAltar.respawnX ?? room.checkpointAltar.x,
      respawnY: room.checkpointAltar.respawnY ?? room.checkpointAltar.y,
      style: room.checkpointAltar.style || room.theme
    };
  }
  if (room.finalSealRoom) built.finalDoor = { x: W / 2 - 26, y: FLOOR_Y - 86, w: 52, h: 74, targetRoom: FINAL_BOSS_ROOM_ID };
  if (room.finalSealRoom) built.villageReturnPortal = { x: W - 66, y: FLOOR_Y - 72, w: 34, h: 42, targetRoom: VILLAGE_START_ROOM_ID, entryX: 42, entryY: 146 };
  if (room.id === FINAL_BOSS_ROOM_ID) built.ironKingExitPortal = { x: 24, y: FLOOR_Y - 72, w: 34, h: 42, targetRoom: FINAL_SEAL_ROOM_ID, entryX: W / 2 - 5, entryY: FLOOR_Y - 38 };
  if (room.castleGate) built.castleGatePortal = { x: W - 78, y: FLOOR_Y - 84, w: 50, h: 74, targetRoom: 0 };
  if (room.knightHouseEntrance) built.knightHouseDoor = { x: 24, y: FLOOR_Y - 42, w: 22, h: 42, targetRoom: KNIGHT_HOUSE_ROOM_ID };
  if (room.knightHouse) built.houseExitDoor = { x: 43, y: FLOOR_Y - 50, w: 28, h: 50, targetRoom: VILLAGE_START_ROOM_ID };
  sanitizeBossArenaBottomExit(built);
  sanitizeBossArenaSideExits(built);
  sanitizeIronThroneArena(built);
  clearRoomExitApproaches(built, built.tiles);
  sanitizeBossArenaBottomEntry(built);
  if (trial && !["dash", "superDash", "wall", "shield", "fire", "doubleJump", "grapple", "time"].includes(trial.ability)) built.rewardPortal = { x: W - 66, y: FLOOR_Y - 72, w: 34, h: 42, rewardRoom: trial.rewardRoom };
  if (room.returnRoom != null && !room.knightHouse && !bossArena) built.returnPortal = {
    x: room.returnPortalX ?? 24,
    y: room.returnPortalY ?? FLOOR_Y - 72,
    w: room.returnPortalW ?? 34,
    h: room.returnPortalH ?? 42,
    returnRoom: room.returnRoom,
    entryX: room.returnEntryX,
    entryY: room.returnEntryY
  };
  rebuildCollision(built);
  return built;
}

function sanitizeBossArenaBottomExit(room) {
  if (!isBossArenaRoom(room)) return;
  for (let x = 1; x < COLS - 1; x++) room.tiles[FLOOR_ROW][x] = "#";
}

function sanitizeBossArenaSideExits(room) {
  if (!isBossArenaRoom(room)) return;
  const lowerDoorTop = Math.max(3, FLOOR_ROW - 3);
  if (roomByCoord.has(`${room.x - 1},${room.y}`)) {
    for (let y = lowerDoorTop; y < FLOOR_ROW; y++) room.tiles[y][0] = ".";
  }
  if (roomByCoord.has(`${room.x + 1},${room.y}`)) {
    for (let y = lowerDoorTop; y < FLOOR_ROW; y++) room.tiles[y][COLS - 1] = ".";
  }
  if (roomByCoord.has(`${room.x},${room.y - 1}`)) {
    const doorStart = Math.floor(COLS / 2) - 2;
    const doorEnd = doorStart + 4;
    for (let x = doorStart; x < doorEnd; x++) {
      room.tiles[0][x] = ".";
      room.tiles[1][x] = ".";
    }
  }
}

function sanitizeBossArenaBottomEntry(room) {
  if (!roomAboveIsBossArena(room)) return;
  const doorStart = Math.floor(COLS / 2) - 2;
  const doorEnd = doorStart + 4;
  for (let x = doorStart; x < doorEnd; x++) {
    room.tiles[0][x] = "#";
    room.tiles[1][x] = "#";
  }
}

function sanitizeIronThroneArena(room) {
  if (room.id !== FINAL_BOSS_ROOM_ID) return;
  room.rings.length = 0;
  room.rings.push({ x: 122, y: 78 }, { x: W / 2, y: 54 }, { x: W - 122, y: 78 });
  for (let y = 2; y < FLOOR_ROW; y++) {
    for (let x = 1; x < COLS - 1; x++) {
      room.tiles[y][x] = ".";
    }
  }
  for (let x = 1; x < COLS - 1; x++) {
    room.tiles[FLOOR_ROW][x] = "#";
  }
  room.hazards.length = 0;
  room.breakables.length = 0;
}

function rebuildCollision(room) {
  room.solids.length = 0;
  room.hazards.length = 0;
  room.water.length = 0;
  room.breakables.length = 0;
  for (let y = 0; y < room.tiles.length; y++) {
    for (let x = 0; x < room.tiles[y].length; x++) {
      const t = room.tiles[y][x];
      if (t === "#" || t === "S" || t === "C" || t === "U") room.solids.push({ x: x * TILE, y: y * TILE, w: TILE, h: TILE, breakable: t === "S" || t === "C", cracked: t === "C", unclimbable: t === "U", tx: x, ty: y });
      if (t === "S" || t === "C") room.breakables.push({ x: x * TILE, y: y * TILE, w: TILE, h: TILE, tx: x, ty: y, cracked: t === "C", group: t === "C" ? "sundialSecret" : "" });
      if (t === "^") room.hazards.push({
        x: x * TILE + Math.round(TILE * 0.25),
        y: y * TILE + Math.round(TILE * 0.68),
        w: Math.max(4, Math.round(TILE * 0.5)),
        h: Math.max(3, Math.round(TILE * 0.32))
      });
      if (t === "~") room.water.push({ x: x * TILE, y: y * TILE, w: TILE, h: TILE });
    }
  }
}

function resetWorld() {
  world.clear();
  visitedAreas.clear();
  rooms.forEach((room, id) => {
    if (!room.removed) world.set(id, makeRoom({ ...room, id }));
  });
  invalidateMap();
}

resetWorld();

const player = {
  x: 42, y: 146, w: 9, h: 20, vx: 0, vy: 0, dir: 1, hp: 10, maxHp: 10, mp: 10, maxMp: 10, healRank: 0,
  room: START_ROOM_ID, grounded: false, coyote: 0, jumps: 0, airDashUsed: false, jumpCutReady: false, jumpHold: 0, dash: 0, bash: 0, hurt: 0, attack: 0, attackType: "slash", attackBoost: false, basicAttackCooldown: 0, shield: 0, shieldPenalty: 0, parryTimer: 0, parryCharge: 0, parryFlash: 0, counter: null, heal: 0, healLock: 0, wingFlare: 0, timeSlow: 0, timeActive: 0, timeCooldown: 0, timeFrozen: 0, timeBreak: 0, slowIntent: 0, superCharge: 0, superDash: 0, superShield: false, lookUp: false, crouch: false, crawl: false, grapple: null,
  cape: createCapeState(),
  abilities: { sword: false, doubleJump: false, dash: false, superDash: false, wall: false, fire: false, grapple: false, shield: false, time: false },
  finalBossDefeated: false
};

const projectiles = [];
const particles = [];
let cameraX = 0;
let cameraY = 0;
let mapOpen = false;
let toastTime = 0;
let areaCard = null;
let inventoryOpen = false;
let paused = false;
let shake = 0;
let hitStop = 0;
let frame = 0;
let gameStarted = false;
let bossCeremony = null;
let bossIntro = null;
let titleSelection = 0;
let fullscreenView = false;
let roomStart = { room: START_ROOM_ID, x: 42, y: 146 };
let respawnPoint = { room: START_ROOM_ID, x: 42, y: 146 };
let dialogue = null;

function say(text) {
  if (dialogue) return;
  ui.toast.textContent = text;
  ui.toast.classList.add("show");
  toastTime = 240;
}

function startDialogue(lines) {
  const cleanLines = lines.filter(Boolean);
  if (!cleanLines.length) return false;
  dialogue = { lines: cleanLines, line: 0, typed: 0 };
  ui.toast.classList.add("show", "dialogue");
  ui.toast.textContent = "";
  toastTime = 0;
  player.vx = 0;
  player.vy = 0;
  player.dash = 0;
  player.bash = 0;
  player.superCharge = 0;
  player.superDash = 0;
  player.superShield = false;
  player.grapple = null;
  playSfx("menuSelect");
  return true;
}

function endDialogue() {
  dialogue = null;
  ui.toast.classList.remove("show", "dialogue", "ready");
  ui.toast.textContent = "";
  toastTime = 0;
}

function updateDialogue() {
  if (!dialogue) return false;
  const line = dialogue.lines[dialogue.line] || "";
  const complete = dialogue.typed >= line.length;
  if (tap(" ")) {
    if (!complete) {
      dialogue.typed = line.length;
      playSfx("menuMove");
    } else if (dialogue.line < dialogue.lines.length - 1) {
      dialogue.line++;
      dialogue.typed = 0;
      playSfx("menuMove");
    } else {
      playSfx("menuSelect");
      endDialogue();
      return false;
    }
  } else if (!complete) {
    dialogue.typed = Math.min(line.length, dialogue.typed + 1.25);
  }
  const current = dialogue.lines[dialogue.line] || "";
  const visible = current.slice(0, Math.floor(dialogue.typed));
  const lineDone = dialogue.typed >= current.length;
  ui.toast.textContent = lineDone ? `${visible}  SPACE` : visible;
  ui.toast.classList.toggle("ready", lineDone);
  player.vx = 0;
  player.vy = 0;
  player.attack = 0;
  player.bash = 0;
  player.dash = 0;
  player.grapple = null;
  return true;
}

function setRoomStart(x = player.x, y = player.y) {
  roomStart = { room: player.room, x, y };
}

function setRespawnPoint(room = player.room, x = player.x, y = player.y) {
  if (!world.has(room)) return false;
  respawnPoint = { room, x, y };
  if (player.room === room) setRoomStart(x, y);
  return true;
}

function resetToRoomStart(message = "The spikes throw you back.") {
  if (roomStart.room !== player.room) setRoomStart();
  Object.assign(player, {
    x: roomStart.x,
    y: roomStart.y,
    vx: 0,
    vy: 0,
    grounded: false,
    coyote: 0,
    jumps: 0,
    airDashUsed: false,
    jumpCutReady: false,
    jumpHold: 0,
    dash: 0,
    bash: 0,
    superCharge: 0,
    superDash: 0,
    superShield: false,
    crouch: false,
    crawl: false,
    grapple: null,
    counter: null
  });
  stopForcedMovement();
  shake = Math.max(shake, 6);
  say(message);
}

function showAreaCard(room, firstVisit) {
  if (!firstVisit && !isSignificantRoom(room)) {
    areaCard = null;
    return;
  }
  areaCard = {
    title: displayRoomName(room),
    subtitle: firstVisit ? `${displayAreaName(room).toUpperCase()} AREA DISCOVERED` : displayAreaName(room).toUpperCase(),
    theme: room.theme,
    first: firstVisit,
    time: firstVisit ? 120 : 120,
    max: firstVisit ? 120 : 120
  };
}

function showBossIntroCard(boss, room) {
  const time = 180;
  areaCard = {
    title: boss.name || bossNames[boss.type] || "Castle Guardian",
    subtitle: bossCries[boss.type] || "The guardian answers your arrival.",
    theme: room.theme,
    first: false,
    boss: true,
    time,
    max: time
  };
}

function showStoryCard(title, subtitle, theme) {
  areaCard = { title, subtitle, theme, first: true, story: true, time: 230, max: 230 };
}

function setInventory(open) {
  inventoryOpen = open;
  ui.inventoryModal.classList.toggle("hidden", !open);
  updateInventory();
}

function setPaused(open) {
  if (open && !gameStarted) return;
  paused = open;
  ui.pauseModal.classList.toggle("hidden", !open);
  if (!open) ui.pauseSettingsPanel.classList.add("hidden");
  pressed.clear();
  keys.clear();
}

function setFullscreenView(open) {
  fullscreenView = !!open;
  document.body.classList.toggle("game-fullscreen", fullscreenView);
  ui.fullscreenActions?.classList.toggle("hidden", !fullscreenView);
  if (ui.fullscreenBtn) ui.fullscreenBtn.textContent = fullscreenView ? "Exit Fullscreen" : "Fullscreen";
  if (fullscreenView) {
    document.documentElement.requestFullscreen?.().catch(() => {});
  } else if (document.fullscreenElement) {
    document.exitFullscreen?.().catch(() => {});
  }
  scheduleGameCanvasFit();
}

function toggleFullscreenView() {
  setFullscreenView(!fullscreenView);
}

function setTitleActive(active) {
  document.body.classList.toggle("title-active", active);
  scheduleGameCanvasFit();
}

function returnToTitle() {
  saveGame();
  if (dialogue) endDialogue();
  setPaused(false);
  setInventory(false);
  gameStarted = false;
  bossCeremony = null;
  bossIntro = null;
  ui.titleScreen.classList.remove("hidden");
  setTitleActive(true);
  ui.continueBtn.disabled = !readSave();
  updateTitleSelection(0, false);
  ensureAudio();
  setMusicTheme("menu");
  say("Returned to the title screen.");
}

function titleButtons() {
  return [ui.newGameBtn, ui.continueBtn, ui.settingsBtn].filter(button => button && !button.disabled);
}

function updateTitleSelection(index, sound = true) {
  const buttons = titleButtons();
  if (!buttons.length) return;
  titleSelection = (index + buttons.length) % buttons.length;
  for (const button of [ui.newGameBtn, ui.continueBtn, ui.settingsBtn]) button?.classList.remove("selected");
  buttons[titleSelection].classList.add("selected");
  buttons[titleSelection].focus({ preventScroll: true });
  if (sound) playSfx("menuMove");
}

function selectTitleButton(button, sound = true) {
  const buttons = titleButtons();
  const index = buttons.indexOf(button);
  if (index >= 0 && index !== titleSelection) updateTitleSelection(index, sound);
}

function currentRoom() {
  return world.get(player.room);
}

function basePlayerState() {
  return {
    x: 42, y: 146, w: 9, h: 20, vx: 0, vy: 0, dir: 1, hp: 10, maxHp: 10, mp: 10, maxMp: 10, healRank: 0,
    room: START_ROOM_ID, grounded: false, coyote: 0, jumps: 0, airDashUsed: false, jumpCutReady: false, jumpHold: 0, dash: 0, bash: 0, hurt: 0, attack: 0, attackType: "slash", attackBoost: false, basicAttackCooldown: 0, shield: 0, shieldPenalty: 0, parryTimer: 0, parryCharge: 0, parryFlash: 0, counter: null, heal: 0, healLock: 0, wingFlare: 0, timeSlow: 0, timeActive: 0, timeCooldown: 0, timeFrozen: 0, timeBreak: 0, slowIntent: 0, superCharge: 0, superDash: 0, superShield: false, lookUp: false, crouch: false, crawl: false, grapple: null,
    cape: createCapeState(),
    abilities: { sword: false, doubleJump: false, dash: false, superDash: false, wall: false, fire: false, grapple: false, shield: false, time: false },
    finalBossDefeated: false
  };
}

function bossUpgradeLevel() {
  return Math.max(0, player.healRank || 0);
}

function healingStats() {
  const rank = bossUpgradeLevel();
  return {
    cost: Math.max(0.045, 0.08 - rank * 0.004),
    rate: 0.035 + rank * 0.006
  };
}

function grantBossUpgrade(e) {
  if (!e || e.upgradeGranted) return false;
  e.upgradeGranted = true;
  player.maxHp += 1;
  player.maxMp += 1;
  player.healRank = bossUpgradeLevel() + 1;
  player.hp = Math.min(player.maxHp, player.hp + 1);
  player.mp = Math.min(player.maxMp, player.mp + 1);
  addParticles(player.x + player.w / 2, player.y + 8, "#84c5d0", 34);
  return true;
}

function resetPlayer() {
  if (dialogue) endDialogue();
  Object.assign(player, basePlayerState());
  respawnPoint = { room: START_ROOM_ID, x: 42, y: 146 };
  setRoomStart(player.x, player.y);
}

function createCapeState() {
  return { segments: [], lastAnchorX: 0, lastAnchorY: 0, snap: true };
}

function ensureCapeState() {
  if (!player.cape || !Array.isArray(player.cape.segments)) player.cape = createCapeState();
  if (player.cape.segments.length !== 4) player.cape.snap = true;
  return player.cape;
}

function capeAnchorPoint() {
  return {
    x: player.x + (player.dir > 0 ? 5 : 8),
    y: player.y - 1 + (player.crouch ? 3 : 0) + ((player.wingFlare || 0) > 0 ? -1.5 : 0)
  };
}

function resetCapePhysics(anchor = capeAnchorPoint()) {
  const cape = ensureCapeState();
  const trail = player.dir > 0 ? -1 : 1;
  cape.segments = Array.from({ length: 4 }, (_, i) => ({
    x: anchor.x + trail * (2 + i * 0.9),
    y: anchor.y + 1 + i * 3.8,
    vx: 0,
    vy: 0
  }));
  cape.lastAnchorX = anchor.x;
  cape.lastAnchorY = anchor.y;
  cape.snap = false;
  return cape;
}

function updateCapePhysics() {
  const anchor = capeAnchorPoint();
  const cape = ensureCapeState();
  const movedFar = Math.abs(anchor.x - (cape.lastAnchorX || anchor.x)) > 34 || Math.abs(anchor.y - (cape.lastAnchorY || anchor.y)) > 28;
  if (cape.snap || movedFar) return resetCapePhysics(anchor);
  const idleCape = player.grounded && Math.abs(player.vx) <= 0.35 && player.dash <= 0 && player.bash <= 0 && player.superDash <= 0;
  const trail = player.dir > 0 ? -1 : 1;
  const dashPull = (player.dash > 0 || player.bash > 0 || player.superDash > 0) ? -player.dir * 1.1 : 0;
  const velocityPull = clamp(-player.vx * 0.16, -1.2, 1.2);
  const airPull = player.grounded ? 0 : clamp(player.vy * 0.12, -0.7, 1.1);
  const wingLift = (player.wingFlare || 0) > 0 ? Math.min(2.5, player.wingFlare / 7) : 0;
  for (let i = 0; i < cape.segments.length; i++) {
    const seg = cape.segments[i];
    const prev = i === 0 ? anchor : cape.segments[i - 1];
    const depth = i / (cape.segments.length - 1);
    const poseStep = Math.floor(frame / 8 + i) % 2 ? 0.5 : 0;
    const targetX = idleCape
      ? anchor.x + trail * (1.25 + depth * 0.25)
      : prev.x + trail * (0.8 + depth * 0.35) + velocityPull * (0.12 + depth * 0.18) + dashPull * (0.08 + depth * 0.12);
    const targetY = idleCape
      ? anchor.y + 2.4 + i * 4.45 + poseStep * 0.15
      : prev.y + 2.05 + depth * 0.45 + airPull - wingLift * (0.12 + depth * 0.25) + poseStep;
    const stiffness = (idleCape ? 0.58 : 0.48) - depth * 0.08;
    seg.vx += (targetX - seg.x) * stiffness;
    seg.vy += (targetY - seg.y) * stiffness + 0.03;
    seg.vx *= 0.48;
    seg.vy *= 0.52;
    seg.x += seg.vx;
    seg.y += seg.vy;
    const dx = seg.x - prev.x;
    const dy = seg.y - prev.y;
    const maxDist = idleCape ? 6.1 + depth * 0.35 : 5.0 + depth * 0.6;
    const dist = Math.hypot(dx, dy) || 1;
    if (dist > maxDist) {
      const pull = (dist - maxDist) / dist;
      seg.x -= dx * pull;
      seg.y -= dy * pull;
      seg.vx *= 0.4;
      seg.vy *= 0.4;
    }
  }
  cape.lastAnchorX = anchor.x;
  cape.lastAnchorY = anchor.y;
  return cape;
}

function readSave() {
  try {
    return localStorage.getItem(SAVE_KEY);
  } catch {
    return null;
  }
}

function writeSave(value) {
  try {
    localStorage.setItem(SAVE_KEY, value);
  } catch {
    return false;
  }
  return true;
}

function clearSave() {
  try {
    localStorage.removeItem(SAVE_KEY);
  } catch {
    return false;
  }
  return true;
}

function saveGame() {
  if (!gameStarted) return;
  const roomStates = [...world.entries()].map(([id, room]) => ({
    id,
    visited: room.visited,
    tiles: room.tiles.map(row => row.join("")),
    items: room.items.map(item => item.taken),
    enemies: room.enemies.map(enemy => enemy.hp)
  }));
  const saved = writeSave(JSON.stringify({
    player: {
      x: player.x, y: player.y, room: player.room, dir: player.dir,
      hp: player.hp, maxHp: player.maxHp, mp: player.mp, maxMp: player.maxMp, healRank: player.healRank || 0,
      abilities: player.abilities, finalBossDefeated: player.finalBossDefeated
    },
    respawnPoint,
    visitedAreas: [...visitedAreas],
    roomStates
  }));
  ui.continueBtn.disabled = !saved;
}

function loadGame() {
  const raw = readSave();
  if (!raw) return false;
  try {
    const save = JSON.parse(raw);
    resetWorld();
    resetPlayer();
    Object.assign(player, save.player, { vx: 0, vy: 0, grounded: false, coyote: 0, jumps: 0, airDashUsed: false, jumpCutReady: false, jumpHold: 0, dash: 0, bash: 0, hurt: 0, attack: 0, attackType: "slash", attackBoost: false, basicAttackCooldown: 0, shield: 0, shieldPenalty: 0, parryTimer: 0, parryCharge: 0, parryFlash: 0, counter: null, heal: 0, healLock: 0, wingFlare: 0, timeSlow: 0, timeActive: 0, timeCooldown: 0, timeFrozen: 0, timeBreak: 0, slowIntent: 0, superCharge: 0, superDash: 0, superShield: false, lookUp: false, crouch: false, crawl: false, grapple: null, cape: createCapeState() });
    const savedAbilities = save.player.abilities || {};
    player.abilities = { ...basePlayerState().abilities, ...savedAbilities };
    if (!Object.prototype.hasOwnProperty.call(savedAbilities, "sword")) player.abilities.sword = true;
    delete player.abilities.crown;
    delete player.abilities.swim;
    delete player.abilities.lantern;
    if (!world.has(player.room)) {
      player.room = START_ROOM_ID;
      player.x = 42;
      player.y = 146;
    }
    player.finalBossDefeated = !!(save.player.finalBossDefeated || save.player.abilities?.crown);
    player.healRank = Math.max(0, save.player.healRank || Math.max(0, player.maxHp - 10, player.maxMp - 10));
    const savedRespawn = save.respawnPoint || {};
    respawnPoint = world.has(savedRespawn.room) && Number.isFinite(savedRespawn.x) && Number.isFinite(savedRespawn.y)
      ? { room: savedRespawn.room, x: savedRespawn.x, y: savedRespawn.y }
      : { room: START_ROOM_ID, x: 42, y: 146 };
    if (respawnPoint.room === player.room) setRoomStart(respawnPoint.x, respawnPoint.y);
    else setRoomStart(player.x, player.y);
    visitedAreas.clear();
    for (const theme of save.visitedAreas || []) visitedAreas.add(theme);
    for (const state of save.roomStates || []) {
      const room = world.get(state.id);
      if (!room) continue;
      room.visited = !!state.visited;
      if (room.visited && !save.visitedAreas) visitedAreas.add(room.theme);
      if (!room.knightHouse && !isMoonHookRouteRoom(room) && state.tiles?.every(row => row.length === COLS)) room.tiles = state.tiles.map(row => row.split(""));
      sanitizeBossArenaBottomExit(room);
      sanitizeBossArenaSideExits(room);
      sanitizeIronThroneArena(room);
      sanitizeBossArenaBottomEntry(room);
      rebuildCollision(room);
      room.items.forEach((item, i) => item.taken = !!state.items?.[i]);
      room.enemies.forEach((enemy, i) => enemy.hp = Number.isFinite(state.enemies?.[i]) ? state.enemies[i] : enemy.hp);
    }
    invalidateMap();
    return true;
  } catch {
    clearSave();
    return false;
  }
}

function beginGame(fromSave) {
  ensureAudio();
  if (dialogue) endDialogue();
  if (!fromSave) {
    resetWorld();
    resetPlayer();
    clearSave();
  }
  projectiles.length = 0;
  particles.length = 0;
  gameStarted = true;
  setPaused(false);
  setInventory(false);
  ui.titleScreen.classList.add("hidden");
  setTitleActive(false);
  const room = currentRoom();
  const firstAreaVisit = !visitedAreas.has(room.theme);
  room.visited = true;
  visitedAreas.add(room.theme);
  invalidateMap();
  setRoomStart(player.x, player.y);
  setMusicTheme(room.theme);
  playSfx("room");
  showAreaCard(room, firstAreaVisit && !fromSave);
  if (!startBossIntro(room, firstAreaVisit && !fromSave)) {
    say(fromSave ? `Returned to ${displayRoomName(currentRoom())}.` : "The village bets against you. Good. Show them the curse picked the wrong knight.");
  }
  saveGame();
  updateUi();
}

function addParticles(x, y, color, n = 10) {
  for (let i = 0; i < n; i++) particles.push({ x, y, vx: (Math.random() - 0.5) * 2.5, vy: -Math.random() * 2, life: 20 + Math.random() * 22, color });
}

function triggerParryEffect(charge = 1) {
  player.parryCharge = Math.max(player.parryCharge || 0, charge);
  player.parryTimer = 0;
  player.parryFlash = 72;
  hitStop = Math.max(hitStop, 60);
  shake = Math.max(shake, 9);
  playSfx("shieldHit");
  addParticles(player.x + player.w / 2, player.y + 8, "#fff1bd", 54);
  addParticles(player.x + player.w / 2 + player.dir * 7, player.y + 8, "#bfe9ff", 34);
}

function clearRoomEffects() {
  particles.length = 0;
  projectiles.length = 0;
  bossIntro = null;
  player.attack = 0;
  player.bash = 0;
  player.grapple = null;
  player.counter = null;
  player.parryFlash = 0;
  player.timeSlow = 0;
  player.timeActive = 0;
  player.timeFrozen = 0;
  player.timeBreak = 0;
}

function drawTinyText(text, x, y, color = "#f7e7bd") {
  ctx.fillStyle = color;
  ctx.fillText(text, Math.round(x + cameraX), Math.round(y + cameraY));
}

function moveActor(a, room) {
  a.x += a.vx;
  for (const s of room.solids) if (rects(a, s)) {
    const box = collisionBox(a);
    if (a.vx > 0) a.x = s.x - box.w - box.ox;
    if (a.vx < 0) a.x = s.x + s.w - box.ox;
    if (a === player && player.superDash > 0) {
      cancelSuperDash(s.x + s.w / 2);
      addParticles(player.x + player.w / 2, player.y + 8, "#fff1bd", 34);
    }
    a.vx = 0;
  }
  a.y += a.vy;
  a.grounded = false;
  for (const s of room.solids) if (rects(a, s)) {
    const box = collisionBox(a);
    if (a.vy > 0) { a.y = s.y - box.h - box.oy; a.grounded = true; a.jumps = 0; a.airDashUsed = false; a.jumpCutReady = false; a.jumpHold = 0; }
    if (a.vy < 0) a.y = s.y + s.h - box.oy;
    a.vy = 0;
  }
}

function has(a) {
  return player.abilities[a];
}

function timeHeld() {
  return has("time") && (player.timeActive || 0) > 0;
}

function cancelPlayerTime(reason = "") {
  if ((player.timeActive || 0) <= 0) return false;
  player.timeActive = 0;
  player.timeCooldown = TIME_COOLDOWN_MAX;
  addParticles(player.x + player.w / 2, player.y + 8, "#a596ff", 34);
  playSfx("shield");
  if (reason) say(reason);
  return true;
}

function tap(...names) {
  return names.some(k => pressed.has(k));
}

function held(...names) {
  return names.some(k => keys.has(k));
}

function stopForcedMovement() {
  player.dash = 0;
  player.bash = 0;
  player.superCharge = 0;
  player.superDash = 0;
  player.superShield = false;
  player.grapple = null;
  player.grounded = false;
  player.coyote = 0;
}

function cancelHeldInputState() {
  keys.clear();
  pressed.clear();
  player.heal = 0;
  player.healLock = 0;
  player.superCharge = 0;
  player.superDash = 0;
  player.superShield = false;
  player.dash = 0;
  player.bash = 0;
}

function pauseForFocusLoss() {
  cancelHeldInputState();
  if (gameStarted && !paused) setPaused(true);
}

function cancelSuperDash(fromX = player.x - player.dir) {
  if (!(player.superCharge > 0 || player.superDash > 0)) return false;
  const away = player.x + player.w / 2 < fromX ? -1 : 1;
  player.superCharge = 0;
  player.superDash = 0;
  player.superShield = false;
  player.dash = 0;
  player.bash = 0;
  player.vx = away * 3.2;
  player.vy = Math.min(player.vy, -2.2);
  shake = Math.max(shake, 5);
  playSfx("block");
  addParticles(player.x + player.w / 2, player.y + 8, "#d7be7a", 26);
  return true;
}

function releaseSuperDash(shielded) {
  player.superCharge = 0;
  player.superDash = shielded ? 2 : 1;
  player.superShield = !!shielded;
  player.dash = 0;
  player.bash = shielded ? BASH_MAX : 0;
  player.vx = player.dir * (shielded ? SUPER_DASH_SPEED * 0.9 : SUPER_DASH_SPEED);
  player.vy *= 0.18;
  player.grapple = null;
  player.attack = 0;
  playSfx("superDash");
  shake = Math.max(shake, shielded ? 8 : 6);
  addParticles(player.x + player.dir * 16, player.y + 8, shielded ? "#bfe9ff" : "#d7be7a", shielded ? 46 : 34);
  say(shielded ? "The Aegis bell-bash roars." : "The Bell Mantle breaks into thunder.");
}

function drainShield(amount = 3) {
  if (!has("shield")) return 0;
  const drain = Math.max(1, amount);
  player.shieldPenalty = clamp((player.shieldPenalty || 0) + drain, 0, SHIELD_MAX);
  player.shield = Math.max(0, SHIELD_MAX - Math.ceil(player.shieldPenalty || 0));
  if (player.shield <= 0) {
    player.parryTimer = 0;
    shake = Math.max(shake, 5);
    addParticles(player.x + player.w / 2, player.y + 8, "#84c5d0", 18);
  }
  return player.shield;
}

function bounceFromExit(dx, dy) {
  if (dx > 0) {
    player.x = W - player.w - 22;
    player.vx = -1.2;
  } else if (dx < 0) {
    player.x = 22;
    player.vx = 1.2;
  }
  if (dy > 0) {
    player.y = H - player.h - 34;
    player.vy = -1.4;
  } else if (dy < 0) {
    player.y = 28;
    player.vy = 1.6;
  }
  if (dx !== 0) player.y = clamp(player.y, 18, H - player.h - 18);
  if (dy !== 0) player.x = clamp(player.x, 18, W - player.w - 18);
  stopForcedMovement();
  shake = Math.max(shake, 3);
}

function lockedGuardian(room = currentRoom()) {
  if (room.id === FINAL_BOSS_ROOM_ID && !player.finalBossDefeated) return room.enemies.find(enemy => enemy.bossType === "ironKing" && enemy.hp > 0);
  if (room.id === 12 && !has("dash")) return room.enemies.find(enemy => enemy.trialBoss && enemy.type === "hound" && enemy.hp > 0);
  if (room.id === 1 && !has("superDash")) return room.enemies.find(enemy => enemy.trialBoss && enemy.type === "gargoyle" && enemy.hp > 0);
  if (room.id === 18 && !has("wall")) return room.enemies.find(enemy => enemy.trialBoss && enemy.type === "thornImp" && enemy.hp > 0);
  if (room.id === 5 && !has("shield")) return room.enemies.find(enemy => enemy.trialBoss && enemy.type === "boneGuard" && enemy.hp > 0);
  if (room.id === 9 && !has("doubleJump")) return room.enemies.find(enemy => enemy.trialBoss && enemy.type === "ossuaryBird" && enemy.hp > 0);
  if (room.id === 15 && !has("fire")) return room.enemies.find(enemy => enemy.trialBoss && enemy.type === "penitent" && enemy.hp > 0);
  if (room.id === 16 && !has("grapple")) return room.enemies.find(enemy => enemy.trialBoss && enemy.type === "moonKnight" && enemy.hp > 0);
  if (room.id === 7 && !has("time")) return room.enemies.find(enemy => enemy.trialBoss && enemy.type === "anvilGuard" && enemy.hp > 0);
  return null;
}

function brakkaFightActive(room = currentRoom()) {
  return !!(room.id === 12 && lockedGuardian(room));
}

function rootImpFightActive(room = currentRoom()) {
  return !!(room.id === 18 && lockedGuardian(room));
}

function placeBossForIntro(boss) {
  if (!boss) return;
  if (boss.type === "ironKing") {
    boss.x = W - 122;
    boss.y = FLOOR_Y - boss.h;
    boss.vx = 0;
    boss.vy = 0;
    boss.dir = -1;
    boss.baseY = boss.y;
    boss.move = "royalStalk";
    boss.moveTimer = 42;
    boss.radialWave = 0;
  } else if (boss.flying) {
    boss.y = boss.arena ? boss.arena.top + 8 : 66;
  } else {
    boss.y = FLOOR_Y - boss.h;
  }
  boss.vy = 0;
  boss.baseY = boss.y;
}

function startBossIntro(room, firstAreaVisit = false) {
  const boss = lockedGuardian(room);
  if (!boss) return false;
  placeBossForIntro(boss);
  if (boss.type === "ironKing") areaCard = null;
  else showBossIntroCard(boss, room);
  boss.introSeen = true;
  const lockTime = boss.type === "ironKing" ? 156 : 108;
  bossIntro = { room: room.id, type: boss.type, time: lockTime, max: lockTime, ceremony: boss.type === "ironKing" ? "throneRise" : "" };
  stopForcedMovement();
  player.vx = 0;
  player.vy = 0;
  playBossSfx(boss.type);
  shake = Math.max(shake, 7);
  addParticles(boss.x + boss.w / 2, boss.y + boss.h / 2, boss.type === "thornImp" ? "#d7b167" : boss.type === "boneGuard" ? "#84c5d0" : boss.type === "ossuaryBird" ? "#f1d7a4" : boss.type === "gargoyle" ? "#d7be7a" : boss.type === "moonKnight" ? "#9fd0d0" : boss.type === "anvilGuard" ? "#a596ff" : boss.type === "ironKing" ? "#f3cc67" : "#f0a642", 30);
  say(bossCries[boss.type] || `${boss.name || "The guardian"} answers.`);
  return true;
}

function enterRoom(dx, dy) {
  const old = currentRoom();
  if (old.id === 7 && dx < 0) {
    enterLinkedRoom(SUNDIAL_ALTAR_ROOM_ID, W - 84, 146);
    return;
  }
  const locked = lockedGuardian(old);
  if (locked) {
    bounceFromExit(dx, dy);
    playSfx("block");
    say(locked.type === "thornImp" ? "The root crown knots the exits shut." : locked.type === "ossuaryBird" ? "Bone wings seal the ossuary vault." : locked.type === "gargoyle" ? "Bell-stone wings bar the tower doors." : locked.type === "boneGuard" ? "The Aegis oath seals the crypt." : locked.type === "penitent" ? "Cinder bars flare across the chapel doors." : locked.type === "moonKnight" ? "Moon-iron hooks seal the battlement." : locked.type === "anvilGuard" ? "Sundial teeth lock the furnace exits." : "Brakka's iron ward seals the room.");
    return;
  }
  const target = roomByCoord.get(`${old.x + dx},${old.y + dy}`);
  if (!target) {
    bounceFromExit(dx, dy);
    return;
  }
  if (dy < 0 && isBossArenaRoom(target)) {
    bounceFromExit(dx, dy);
    playSfx("block");
    say("The guardian's floor will not open from below.");
    return;
  }
  const room = world.get(target.id);
  const firstAreaVisit = !visitedAreas.has(room.theme);
  player.room = target.id;
  room.visited = true;
  visitedAreas.add(room.theme);
  invalidateMap();
  if (dx > 0) player.x = 18;
  if (dx < 0) player.x = W - player.w - 22;
  if (dy > 0) player.y = 18;
  if (dy < 0) player.y = 174;
  setRoomStart(player.x, player.y);
  clearRoomEffects();
  setMusicTheme(room.theme);
  playSfx("room");
  showAreaCard(room, firstAreaVisit);
  if (!startBossIntro(room, firstAreaVisit)) say(displayRoomName(room));
  saveGame();
}

function enterLinkedRoom(id, entryX, entryY) {
  const room = world.get(id);
  if (!room) return;
  const firstAreaVisit = !visitedAreas.has(room.theme);
  player.room = id;
  room.visited = true;
  visitedAreas.add(room.theme);
  invalidateMap();
  player.x = entryX;
  player.y = entryY;
  player.vx = 0;
  player.vy = 0;
  setRoomStart(player.x, player.y);
  stopForcedMovement();
  clearRoomEffects();
  setMusicTheme(room.theme);
  playSfx("room");
  showAreaCard(room, firstAreaVisit);
  if (!startBossIntro(room, firstAreaVisit)) say(displayRoomName(room));
  saveGame();
}

function guardianDefeated(room) {
  return !room.enemies.some(enemy => enemy.trialBoss && (enemy.hp > 0 || enemy.dying));
}

function updatePortals(room) {
  if (room.rewardPortal && guardianDefeated(room) && rects(player, room.rewardPortal)) {
    enterLinkedRoom(room.rewardPortal.rewardRoom, 68, 146);
    return true;
  }
  if (player.finalBossDefeated && room.ironKingExitPortal && rects(player, room.ironKingExitPortal)) {
    enterLinkedRoom(room.ironKingExitPortal.targetRoom, room.ironKingExitPortal.entryX, room.ironKingExitPortal.entryY);
    return true;
  }
  if (player.finalBossDefeated && room.villageReturnPortal && rects(player, room.villageReturnPortal)) {
    enterLinkedRoom(room.villageReturnPortal.targetRoom, room.villageReturnPortal.entryX, room.villageReturnPortal.entryY);
    return true;
  }
  if (room.returnPortal && rects(player, room.returnPortal)) {
    enterLinkedRoom(room.returnPortal.returnRoom, room.returnPortal.entryX ?? W - 98, room.returnPortal.entryY ?? 146);
    return true;
  }
  return false;
}

function updateHouseDoors(room) {
  const door = room.knightHouseDoor || room.houseExitDoor;
  if (!door || !rects(player, door)) return false;
  const entering = !!room.knightHouseDoor;
  if (!tap("f")) {
    if (frame % 45 === 0) say(entering ? "Press F to enter the Knight's house." : "Press F to step back outside.");
    return false;
  }
  if (entering) {
    enterLinkedRoom(door.targetRoom, 56, 146);
  } else {
    enterLinkedRoom(door.targetRoom, 32, 146);
  }
  return true;
}

function finalDoorOwnedCount() {
  return requiredFinalDoorAbilities.filter(ability => has(ability)).length;
}

function finalDoorUnlocked() {
  return finalDoorOwnedCount() >= requiredFinalDoorAbilities.length;
}

function updateFinalDoor(room) {
  const door = room.finalDoor;
  if (!door || !rects(player, door)) return false;
  if (!tap("f")) {
    if (frame % 45 === 0) say("Press F to read the sealed door.");
    return false;
  }
  if (!finalDoorUnlocked()) {
    const owned = finalDoorOwnedCount();
    playSfx("block");
    say(`Eight stolen oaths must answer as one. ${owned}/${requiredFinalDoorAbilities.length} have learned your name.`);
    return false;
  }
  playSfx("secret");
  shake = Math.max(shake, 6);
  addParticles(door.x + door.w / 2, door.y + door.h / 2, "#f3cc67", 58);
  say("The eighth oath speaks backward. The door remembers how to open.");
  enterLinkedRoom(door.targetRoom, W / 2 - player.w / 2, FLOOR_Y - 38);
  return true;
}

function updateCastleGatePortal(room) {
  const gate = room.castleGatePortal;
  if (!gate || !rects(player, gate)) return false;
  if (!tap("f")) {
    if (frame % 45 === 0) say("Press F to pass through the castle gate.");
    return false;
  }
  if (!has("sword")) {
    startDialogue(["Knight: I should get my sword first."]);
    return true;
  }
  playSfx("room");
  shake = Math.max(shake, 4);
  say("Hearthmere falls quiet behind you. The castle gate waits ahead.");
  enterLinkedRoom(gate.targetRoom, 42, 146);
  return true;
}

function altarInteractBox(altar) {
  return { x: altar.x - 18, y: altar.y - 12, w: altar.w + 36, h: altar.h + 18 };
}

function checkpointAltarActive(room, altar = room.checkpointAltar) {
  return !!altar && respawnPoint.room === room.id && respawnPoint.x === altar.respawnX && respawnPoint.y === altar.respawnY;
}

function updateCheckpointAltar(room) {
  const altar = room.checkpointAltar;
  if (!altar || !rects(player, altarInteractBox(altar))) return false;
  if (!tap("f")) {
    if (frame % 45 === 0) say("Press F to bind your respawn to the checkpoint altar.");
    return false;
  }
  if (checkpointAltarActive(room, altar)) {
    playSfx("menuMove");
    say("This checkpoint altar already holds your oath.");
    return true;
  }
  setRespawnPoint(room.id, altar.respawnX, altar.respawnY);
  playSfx("secret");
  shake = Math.max(shake, 5);
  const moss = altar.style === "moss" || room.theme === "moss";
  const tower = altar.style === "tower" || room.theme === "tower";
  const bone = altar.style === "bone" || room.theme === "bone";
  const sundial = altar.style === "sundial";
  const moon = altar.style === "moon";
  addParticles(altar.x + altar.w / 2, altar.y + 12, moss ? "#d7b167" : tower ? "#fff1bd" : bone ? "#f1d7a4" : sundial ? "#f0a642" : moon ? "#9fd0d0" : "#fff1bd", 36);
  addParticles(altar.x + altar.w / 2, altar.y + altar.h - 6, moss ? "#6ea35f" : tower ? "#d7be7a" : bone ? "#8f806d" : sundial ? "#a596ff" : moon ? "#f7e7bd" : "#d7be7a", 24);
  say(moss ? "Root altar awakened. You will rise here after death." : tower ? "Bell altar rung. You will rise here after death." : bone ? "Ossuary altar kindled. You will rise here after death." : sundial ? "Sundial altar aligned. You will rise here after death." : moon ? "Moon altar sworn. You will rise here after death." : "Checkpoint altar lit. You will rise here after death.");
  saveGame();
  return true;
}

function nearestNpc(room) {
  let best = null;
  for (const npc of room.npcs || []) {
    const dx = (npc.x + npc.w / 2) - (player.x + player.w / 2);
    const dy = (npc.y + npc.h / 2) - (player.y + player.h / 2);
    const d = Math.hypot(dx, dy);
    if (d < 42 && (!best || d < best.d)) best = { npc, d };
  }
  return best?.npc || null;
}

function updateNpcs(room) {
  const npc = player.grounded ? nearestNpc(room) : null;
  for (const villager of room.npcs || []) {
    villager.dir = (player.x + player.w / 2) < (villager.x + villager.w / 2) ? -1 : 1;
    villager.near = villager === npc;
  }
  if (!npc) return false;
  if (!tap("f")) {
    if (frame % 55 === 0) say(`Press F to talk to ${npc.name}.`);
    return false;
  }
  npc.talkCount = (npc.talkCount || 0) + 1;
  addParticles(npc.x + npc.w / 2, npc.y + 7, "#ffd166", 12);
  startDialogue([npc.line, npc.reply]);
  return true;
}

function resetBrakkaFight(room = currentRoom()) {
  if (room.id !== 12 || has("dash")) return false;
  let reset = false;
  for (const e of room.enemies) {
    if (!e.trialBoss || e.type !== "hound") continue;
    if (e.hp <= 0) continue;
    e.hp = e.max;
    e.x = W * 0.46;
    e.y = FLOOR_Y - e.h;
    e.vx = -0.75;
    e.vy = 0;
    e.phase = 0;
    e.move = "stalk";
    e.moveTimer = 44;
    e.chargeDir = 0;
    e.howlCooldown = 0;
    e.pogoHeat = 0;
    e.antiAirCooldown = 0;
    e.hurt = 0;
    e.bashHit = 0;
    reset = true;
  }
  if (reset) {
    for (let i = projectiles.length - 1; i >= 0; i--) if (projectiles[i].hostile) projectiles.splice(i, 1);
  }
  return reset;
}

function resetRootImpFight(room = currentRoom()) {
  if (room.id !== 18 || has("wall")) return false;
  let reset = false;
  for (const e of room.enemies) {
    if (!e.trialBoss || e.type !== "thornImp") continue;
    if (e.hp <= 0) continue;
    e.hp = e.max;
    e.x = W * 0.46;
    e.y = FLOOR_Y - e.h;
    e.vx = -0.45;
    e.vy = 0;
    e.phase = 0;
    e.move = "stalk";
    e.moveTimer = 38;
    e.upperHeat = 0;
    e.slamCooldown = 0;
    e.volleyCooldown = 0;
    e.snareCooldown = 0;
    e.hurt = 0;
    e.bashHit = 0;
    reset = true;
  }
  if (reset) {
    for (let i = projectiles.length - 1; i >= 0; i--) if (projectiles[i].hostile) projectiles.splice(i, 1);
  }
  return reset;
}

function resetWyvernFight(room = currentRoom()) {
  if (room.id !== 9 || has("doubleJump")) return false;
  let reset = false;
  for (const e of room.enemies) {
    if (!e.trialBoss || e.type !== "ossuaryBird") continue;
    if (e.hp <= 0) continue;
    e.hp = e.max;
    e.x = W * 0.46;
    e.y = 96;
    e.vx = -0.8;
    e.vy = 0;
    e.phase = 0;
    e.move = "stalk";
    e.moveTimer = 40;
    e.stormCooldown = 90;
    e.hurt = 0;
    e.bashHit = 0;
    reset = true;
  }
  if (reset) {
    for (let i = projectiles.length - 1; i >= 0; i--) if (projectiles[i].hostile) projectiles.splice(i, 1);
  }
  return reset;
}

function resetGargoyleFight(room = currentRoom()) {
  if (room.id !== 1 || has("superDash")) return false;
  let reset = false;
  for (const e of room.enemies) {
    if (!e.trialBoss || e.type !== "gargoyle") continue;
    if (e.hp <= 0) continue;
    e.hp = e.max;
    e.x = W * 0.46;
    e.y = 96;
    e.vx = -0.7;
    e.vy = 0;
    e.phase = 0;
    e.move = "stalk";
    e.moveTimer = 46;
    e.bellCooldown = 70;
    e.aegisCooldown = 110;
    e.hurt = 0;
    e.bashHit = 0;
    reset = true;
  }
  if (reset) {
    for (let i = projectiles.length - 1; i >= 0; i--) if (projectiles[i].hostile) projectiles.splice(i, 1);
  }
  return reset;
}

function resetAegisGuardFight(room = currentRoom()) {
  if (room.id !== 5 || has("shield")) return false;
  let reset = false;
  for (const e of room.enemies) {
    if (!e.trialBoss || e.type !== "boneGuard") continue;
    if (e.hp <= 0) continue;
    e.hp = e.max;
    e.shieldArmor = e.shieldMax || 18;
    e.x = W * 0.46;
    e.y = 78;
    e.vx = -0.5;
    e.vy = 0;
    e.phase = 0;
    e.move = "stalk";
    e.moveTimer = 42;
    e.guardBroken = false;
    e.pogoHeat = 0;
    e.antiAirCooldown = 0;
    e.hurt = 0;
    e.bashHit = 0;
    reset = true;
  }
  if (reset) {
    for (let i = projectiles.length - 1; i >= 0; i--) if (projectiles[i].hostile) projectiles.splice(i, 1);
  }
  return reset;
}

function resetCinderPenitentFight(room = currentRoom()) {
  if (room.id !== 15 || has("fire")) return false;
  let reset = false;
  for (const e of room.enemies) {
    if (!e.trialBoss || e.type !== "penitent") continue;
    if (e.hp <= 0) continue;
    e.hp = e.max;
    e.x = W * 0.46;
    e.y = 78;
    e.vx = -0.52;
    e.vy = 0;
    e.phase = 0;
    e.move = "stalk";
    e.moveTimer = 40;
    e.fireCooldown = 70;
    e.pogoHeat = 0;
    e.pogoWardCooldown = 0;
    e.hurt = 0;
    e.bashHit = 0;
    reset = true;
  }
  if (reset) {
    for (let i = projectiles.length - 1; i >= 0; i--) if (projectiles[i].hostile) projectiles.splice(i, 1);
  }
  return reset;
}

function resetMoonDuelistFight(room = currentRoom()) {
  if (room.id !== 16 || has("grapple")) return false;
  let reset = false;
  for (const e of room.enemies) {
    if (!e.trialBoss || e.type !== "moonKnight") continue;
    if (e.hp <= 0) continue;
    e.hp = e.max;
    e.x = W * 0.46;
    e.y = 78;
    e.vx = -0.75;
    e.vy = 0;
    e.phase = 0;
    e.move = "stalk";
    e.moveTimer = 36;
    e.hookCooldown = 80;
    e.hurt = 0;
    e.bashHit = 0;
    reset = true;
  }
  if (reset) {
    for (let i = projectiles.length - 1; i >= 0; i--) if (projectiles[i].hostile) projectiles.splice(i, 1);
  }
  return reset;
}

function resetSundialGuardFight(room = currentRoom()) {
  if (room.id !== 7 || has("time")) return false;
  let reset = false;
  for (const e of room.enemies) {
    if (!e.trialBoss || e.type !== "anvilGuard") continue;
    if (e.hp <= 0) continue;
    e.hp = e.max;
    e.x = W * 0.46;
    e.y = 78;
    e.vx = -0.42;
    e.vy = 0;
    e.phase = 0;
    e.move = "stalk";
    e.moveTimer = 44;
    e.clockCooldown = 70;
    e.rewound = false;
    e.rewindHealed = false;
    e.snareHit = false;
    e.freezeFired = false;
    e.hurt = 0;
    e.bashHit = 0;
    reset = true;
  }
  if (reset) {
    player.timeSlow = 0;
    player.timeActive = 0;
    player.timeCooldown = 0;
    player.timeFrozen = 0;
    player.timeBreak = 0;
    for (let i = projectiles.length - 1; i >= 0; i--) if (projectiles[i].hostile) projectiles.splice(i, 1);
  }
  return reset;
}

function resetIronKingFight(room = currentRoom()) {
  if (room.id !== FINAL_BOSS_ROOM_ID || player.finalBossDefeated) return false;
  let reset = false;
  for (const e of room.enemies) {
    if (e.bossType !== "ironKing") continue;
    e.hp = e.max;
    e.x = W - 122;
    e.y = FLOOR_Y - e.h;
    e.baseY = e.y;
    e.vx = 0;
    e.vy = 0;
    e.dir = -1;
    e.move = "royalStalk";
    e.moveTimer = 70;
    e.hurt = 0;
    e.phase = 0;
    e.rewound = false;
    e.snareHit = false;
    e.freezeFired = false;
    e.airDashCooldown = 0;
    e.airDashDir = 0;
    reset = true;
  }
  if (reset) {
    player.timeSlow = 0;
    player.timeActive = 0;
    player.timeCooldown = 0;
    player.timeFrozen = 0;
    player.timeBreak = 0;
    for (let i = projectiles.length - 1; i >= 0; i--) if (projectiles[i].hostile) projectiles.splice(i, 1);
  }
  return reset;
}

function resetLockedGuardianFight(room = currentRoom()) {
  if (resetIronKingFight(room)) return "The Iron King reclaims the throne.";
  if (resetBrakkaFight(room)) return "Brakka returns to full strength.";
  if (resetGargoyleFight(room)) return "The Bell-Horn Gargoyle returns to its perch.";
  if (resetRootImpFight(room)) return "The Root-Crowned Imp blooms again.";
  if (resetAegisGuardFight(room)) return "The Oath-Bone Captain raises the Aegis again.";
  if (resetWyvernFight(room)) return "The Ossuary Wyvern reknits its bones.";
  if (resetCinderPenitentFight(room)) return "The Cinder Penitent rekindles the nave.";
  if (resetMoonDuelistFight(room)) return "The Moon-Vowed Duelist resets his stance.";
  if (resetSundialGuardFight(room)) return "The Sundial Guard rewinds the duel.";
  return "";
}

function beginGuardianDeath(e) {
  if (!e.trialBoss || !["hound", "gargoyle", "thornImp", "boneGuard", "ossuaryBird", "penitent", "moonKnight", "anvilGuard"].includes(e.type) || e.dying) return false;
  e.dying = true;
  e.deathTimer = e.type === "hound" ? 132 : e.type === "ossuaryBird" ? 126 : e.type === "gargoyle" ? 122 : e.type === "boneGuard" ? 124 : e.type === "penitent" ? 128 : e.type === "moonKnight" ? 120 : e.type === "anvilGuard" ? 126 : 118;
  e.deathMax = e.deathTimer;
  e.hp = 1;
  e.vx = 0;
  e.vy = 0;
  e.move = "death";
  e.hurt = 0;
  e.bashHit = 0;
  grantBossUpgrade(e);
  bossCeremony = { room: player.room, type: e.type, holdAttack: player.attack, holdAttackType: player.attackType, holdAttackBoost: player.attackBoost, holdCounter: player.counter };
  player.vx = 0;
  player.vy = 0;
  player.dash = 0;
  player.bash = 0;
  player.grapple = null;
  player.timeSlow = 0;
  player.timeActive = 0;
  player.timeCooldown = 0;
  player.timeFrozen = 0;
  player.timeBreak = 0;
  for (let i = projectiles.length - 1; i >= 0; i--) if (projectiles[i].hostile) projectiles.splice(i, 1);
  shake = Math.max(shake, 8);
  playBossSfx(e.type);
  say(e.type === "hound" ? "Brakka's chain-oath breaks. Your vessel deepens." : e.type === "ossuaryBird" ? "The ossuary wings come apart. Your vessel deepens." : e.type === "gargoyle" ? "The bell-horn cracks in two. Your vessel deepens." : e.type === "boneGuard" ? "The Aegis oath slips from dead hands. Your vessel deepens." : e.type === "penitent" ? "The ash-prayer gutters out. Your vessel deepens." : e.type === "moonKnight" ? "The moon oath unthreads. Your vessel deepens." : e.type === "anvilGuard" ? "The furnace hour cracks open. Your vessel deepens." : "The root crown withers. Your vessel deepens.");
  return true;
}

function updateGuardianDeath(e) {
  e.deathTimer = Math.max(0, (e.deathTimer || 0) - 1);
  const age = (e.deathMax || 1) - e.deathTimer;
  e.vx = 0;
  e.vy = 0;
  if (age % 10 === 0) {
    const color = e.type === "thornImp" ? "#6ea35f" : e.type === "ossuaryBird" ? "#f1d7a4" : e.type === "gargoyle" ? "#d7be7a" : e.type === "boneGuard" ? "#84c5d0" : e.type === "penitent" ? "#ff7a3d" : e.type === "moonKnight" ? "#9fd0d0" : e.type === "anvilGuard" ? "#a596ff" : "#f0a642";
    addParticles(e.x + e.w / 2, e.y + e.h / 2, color, 14);
    shake = Math.max(shake, age < 55 ? 5 : 3);
  }
  if (age === 46 || age === 86) playSfx("enemy");
  if (e.deathTimer <= 0) {
    e.hp = 0;
    e.dying = false;
    bossCeremony = null;
    player.counter = null;
    player.attack = 0;
    player.attackBoost = false;
    if (e.type === "ossuaryBird") activateWyvernCorpse(e);
    addParticles(e.x + e.w / 2, e.y + e.h / 2, e.type === "thornImp" ? "#d7b167" : e.type === "ossuaryBird" ? "#f1d7a4" : e.type === "gargoyle" ? "#d7be7a" : e.type === "boneGuard" ? "#84c5d0" : e.type === "penitent" ? "#ff7a3d" : e.type === "moonKnight" ? "#9fd0d0" : e.type === "anvilGuard" ? "#a596ff" : "#f3cc67", 48);
    say(e.type === "penitent" ? "The dim altar torch catches with a living ember." : e.type === "ossuaryBird" ? "The wyvern body crashes down. Its wings can be torn free." : e.type === "moonKnight" ? "The Moon Hook drops from the broken oath." : e.type === "anvilGuard" ? "The shattered sundial gear spins free." : `${e.name || "The guardian"} falls. The reliquary door opens.`);
    saveGame();
  }
}

function activateWyvernCorpse(e) {
  const room = currentRoom();
  const corpse = room.items.find(it => it.wyvernCorpse && !it.taken);
  if (!corpse) return;
  corpse.x = clamp(e.x + e.w / 2 - corpse.w / 2, 12, W - corpse.w - 12);
  corpse.y = clamp(e.y + e.h / 2 - 10, 18, FLOOR_Y - 40);
  corpse.vy = 0;
  corpse.falling = true;
  corpse.pulls = 0;
}

function playerInput(room) {
  const wasLowProfile = player.crouch || player.crawl;
  player.lookUp = false;
  player.crouch = false;
  player.crawl = false;
  player.timeSlow = Math.max(0, (player.timeSlow || 0) - 1);
  player.timeActive = Math.max(0, (player.timeActive || 0) - 1);
  player.timeCooldown = Math.max(0, (player.timeCooldown || 0) - 1);
  player.timeFrozen = Math.max(0, (player.timeFrozen || 0) - 1);
  if (tap("shift") && has("time") && player.timeFrozen <= 0) {
    if ((player.timeCooldown || 0) > 0) {
      say("The sundial gear is still cooling.");
    } else if (player.mp >= TIME_COST) {
      player.mp = Math.max(0, player.mp - TIME_COST);
      player.timeActive = TIME_ACTIVE_MAX;
      player.timeCooldown = TIME_ACTIVE_MAX + TIME_COOLDOWN_MAX;
      playSfx("bossSundial");
      addParticles(player.x + player.w / 2, player.y + 8, "#a596ff", 42);
      say("Time bends around the Sundial Hex.");
    } else {
      say("Not enough mana to turn the Sundial Hex.");
    }
  }
  if (player.timeFrozen > 0) {
    const frozenDashPressed = tap("l");
    const frozenAttackPressed = tap("j");
    player.vx = 0;
    player.vy = 0;
    player.dash = 0;
    player.bash = 0;
    player.grapple = null;
    player.attack = 0;
    if ((frozenDashPressed && has("dash")) || frozenAttackPressed) {
      player.timeBreak = (player.timeBreak || 0) + 1;
      playSfx(frozenAttackPressed ? "attack" : "dash");
      addParticles(player.x + player.w / 2, player.y + 8, "#a596ff", 12 + player.timeBreak * 4);
      shake = Math.max(shake, 2);
      if (player.timeBreak >= 4) {
        player.timeFrozen = 0;
        player.timeSlow = 0;
        player.timeBreak = 0;
        player.dash = DASH_MAX;
        player.vx = player.dir * DASH_SPEED;
        say("The frozen second breaks.");
      } else if (player.timeBreak === 1) {
        say("Dash or strike again. Crack the second.");
      }
    }
    return;
  }
  const focusing = held("h") && player.grounded && (player.healLock || 0) <= 0;
  if (focusing) {
    player.vx = 0;
    player.vy = 0;
    player.dash = 0;
    player.bash = 0;
    player.grapple = null;
    player.attack = 0;
    const { cost: healCost, rate: healRate } = healingStats();
    if (player.mp >= healCost && player.hp < player.maxHp) {
      player.heal = 8;
      player.mp = Math.max(0, player.mp - healCost);
      player.hp = Math.min(player.maxHp, player.hp + healRate);
    } else {
      player.heal = 3;
    }
    if (player.mp >= healCost && player.hp < player.maxHp && frame % 18 === 0) {
      playSfx("pickup");
      addParticles(player.x + player.w / 2, player.y + 8, bossUpgradeLevel() ? "#fff1bd" : "#84c5d0", 12);
    }
    return;
  }
  if (player.superDash > 0) {
    if (tap("n", "l")) {
      player.superDash = 0;
      player.superShield = false;
      player.vx *= 0.25;
      playSfx("block");
      addParticles(player.x + player.w / 2, player.y + 8, "#d7be7a", 20);
      return;
    }
    player.vx = player.dir * (player.superShield ? SUPER_DASH_SPEED * 0.9 : SUPER_DASH_SPEED);
    player.vy *= 0.15;
    player.dash = 0;
    player.bash = player.superShield ? BASH_MAX : 0;
    if (frame % 5 === 0) addParticles(player.x - player.dir * 8, player.y + 8, player.superShield ? "#bfe9ff" : "#d7be7a", 6);
    return;
  }
  const preChargeWallSide = has("wall") && !player.grounded
    ? room.solids.some(s => wallClingSolid(s) && rects({ ...player, x: player.x - 2 }, s)) ? -1 : room.solids.some(s => wallClingSolid(s) && rects({ ...player, x: player.x + 2 }, s)) ? 1 : 0
    : 0;
  const preChargeWallCling = !!preChargeWallSide && player.vy >= -0.1;
  const preChargeGrounded = player.grounded || room.solids.some(s => rects({ ...player, y: player.y + 4 }, s));
  if (preChargeWallCling) {
    player.dir = -preChargeWallSide;
    player.vy = Math.min(player.vy, 0.85);
  }
  if (has("superDash") && (held("n") || player.superCharge > 0)) {
    const shieldCharge = has("shield") && (held("s") || player.superShield);
    const chargeMax = shieldCharge ? SUPER_SHIELD_CHARGE_MAX : SUPER_CHARGE_MAX;
    const canChargeSuper = preChargeGrounded || preChargeWallCling;
    if (held("n") && canChargeSuper) {
      player.superShield = shieldCharge;
      player.superCharge = Math.min(chargeMax, (player.superCharge || 0) + 1);
      player.vx = 0;
      player.vy = 0;
      player.dash = 0;
      player.bash = 0;
      player.grapple = null;
      player.attack = 0;
      if (shieldCharge) player.shield = SHIELD_MAX;
      if (frame % 18 === 0) playSfx(player.superCharge >= chargeMax ? "shield" : "menuMove");
      if (frame % 6 === 0) addParticles(player.x + player.w / 2, player.y + 8, player.superCharge >= chargeMax ? "#fff1bd" : "#d7be7a", player.superCharge >= chargeMax ? 12 : 5);
      return;
    } else if (held("n")) {
      player.superCharge = 0;
      player.superShield = false;
    }
    if (player.superCharge >= chargeMax) {
      releaseSuperDash(player.superShield);
      return;
    }
    player.superCharge = 0;
    player.superShield = false;
  }
  const lookUpHeld = held("w");
  const rawMove = (held("arrowright", "d") ? 1 : 0) - (held("arrowleft", "a") ? 1 : 0);
  const lowProfileAvailable = !has("shield") && player.grounded;
  const wantsLowProfile = lowProfileAvailable && held("s");
  const standingBlocked = lowProfileAvailable && wasLowProfile && room.solids.some(s => rects({ ...player, crouch: false, crawl: false }, s));
  player.lookUp = lookUpHeld && player.grounded;
  player.crouch = wantsLowProfile || standingBlocked;
  player.crawl = player.crouch && Math.abs(rawMove) > 0;
  const jumpPressed = tap("arrowup", " ");
  const jumpHeld = held("arrowup", " ");
  const attackPressed = tap("j");
  const dashPressed = tap("l");
  const timeDrag = player.timeSlow > 0 ? 0.42 : 1;
  const responsiveness = player.timeSlow > 0 ? 0.12 : 1;
  player.slowIntent = player.timeSlow > 0 ? (player.slowIntent || 0) + (rawMove - (player.slowIntent || 0)) * responsiveness : rawMove;
  const moveIntent = player.timeSlow > 0 ? player.slowIntent : rawMove;
  const accel = (player.grounded ? 0.62 : 0.42) * timeDrag * (player.timeSlow > 0 ? Math.abs(moveIntent) : 1);
  if (moveIntent < -0.08) { player.vx -= accel; if (moveIntent < -0.35) player.dir = -1; }
  if (moveIntent > 0.08) { player.vx += accel; if (moveIntent > 0.35) player.dir = 1; }
  if (player.dash > 0) {
    player.vx *= 0.985;
    player.vx = clamp(player.vx, -DASH_SPEED, DASH_SPEED);
  } else {
    player.vx *= player.grounded ? 0.78 : 0.9;
    const airSpeed = !player.grounded && has("doubleJump") ? 2.45 : 2.1;
    player.vx = clamp(player.vx, -airSpeed * timeDrag, airSpeed * timeDrag);
  }
  if (player.crawl) player.vx *= 0.34;
  else if (player.crouch) player.vx *= 0.45;
  const inWater = room.water.some(w => rects(player, w));
  if (inWater && !has("swim")) {
    player.vx *= 0.65;
    player.vy += 0.2;
  } else if (inWater) {
    player.vy *= 0.72;
    if (held("arrowup", " ")) player.vy -= 0.3;
  }
  const wallSide = has("wall") && !player.grounded
    ? room.solids.some(s => wallClingSolid(s) && rects({ ...player, x: player.x - 2 }, s)) ? -1 : room.solids.some(s => wallClingSolid(s) && rects({ ...player, x: player.x + 2 }, s)) ? 1 : 0
    : 0;
  const wallTouch = !!wallSide;
  if (has("wall") && wallTouch && !player.grounded && player.vy > 0) {
    player.dir = -wallSide;
    player.vy = Math.min(player.vy, 0.85);
    player.airDashUsed = false;
  }
  if (jumpPressed) {
    if (player.grounded || player.coyote > 0 || inWater) {
      player.vy = inWater ? -3.4 : -5.65;
      player.jumps = 1;
      player.grounded = false;
      player.jumpCutReady = true;
      player.jumpHold = inWater ? 0 : 20;
      player.coyote = 0;
      playSfx("jump");
    } else if (has("wall") && wallTouch) {
      player.vy = -5.6;
      player.vx = -wallSide * 3;
      player.dir = -wallSide;
      player.jumps = 1;
      player.grounded = false;
      player.jumpCutReady = true;
      player.jumpHold = 16;
      playSfx("jump");
    } else if (has("doubleJump") && player.jumps < 2) {
      player.vy = -6.0;
      if (held("arrowleft", "a")) player.vx = Math.min(player.vx, -2.75);
      if (held("arrowright", "d")) player.vx = Math.max(player.vx, 2.75);
      player.jumps++;
      player.airDashUsed = false;
      player.jumpCutReady = true;
      player.jumpHold = 22;
      player.wingFlare = 18;
      playSfx("doubleJump");
      addParticles(player.x + 6, player.y + 16, "#d7f0ff", 14);
    }
  }
  if (jumpHeld && player.jumpHold > 0 && player.vy < 0) {
    player.vy -= player.jumps >= 2 ? 0.21 : 0.19;
    player.jumpHold--;
  }
  if (!jumpHeld && player.jumpCutReady && player.vy < -0.7) {
    player.vy = Math.max(player.vy * 0.28, -1.55);
    player.jumpCutReady = false;
    player.jumpHold = 0;
  }
  if (player.vy >= 0 || player.grounded) {
    player.jumpCutReady = false;
    player.jumpHold = 0;
  }
  const canAirDash = player.grounded || !player.airDashUsed;
  if (dashPressed && has("dash") && player.dash <= 0 && canAirDash) {
    player.dash = DASH_MAX;
    if (!player.grounded) player.airDashUsed = true;
    player.vx = player.dir * DASH_SPEED;
    if (has("shield") && held("s")) {
      player.bash = BASH_MAX;
      player.shield = SHIELD_MAX;
      player.vx = player.dir * BASH_SPEED;
      player.vy *= 0.35;
      playSfx("bash");
      addParticles(player.x + player.dir * 13, player.y + 8, "#bfe9ff", 26);
    } else {
      playSfx("dash");
    }
    addParticles(player.x + 6, player.y + 8, "#f3cc67", 20);
  }
  if (attackPressed && has("sword") && (player.basicAttackCooldown || 0) <= 0) {
    if ((player.parryCharge || 0) > 0 && startParryCounter(room)) return;
    player.attack = ATTACK_MAX;
    player.basicAttackCooldown = BASIC_ATTACK_COOLDOWN;
    player.attackType = !player.grounded && held("s") ? "down" : jumpPressed || held("arrowup", "w") ? "up" : "slash";
    player.attackBoost = player.parryCharge > 0;
    if (player.attackBoost) {
      player.parryCharge = 0;
      playSfx("bash");
      addParticles(player.x + player.w / 2, player.y + 7, "#fff1bd", 28);
    }
    if (player.attackType === "up") {
      player.vy = Math.min(player.vy, -2.4);
      playSfx("upSlash");
      addParticles(player.x + 6, player.y - 4, "#fff1bd", 14);
    } else if (player.attackType === "down") {
      player.vy = Math.max(player.vy, 2.4);
      if (has("shield")) player.shield = SHIELD_MAX;
      playSfx(has("shield") ? "bash" : "attack");
      addParticles(player.x + player.w / 2, player.y + player.h + 2, has("shield") ? "#bfe9ff" : "#fff1bd", 16);
    } else {
      playSfx("attack");
    }
  }
  if (tap("k") && canStartFireCounter() && startParryCounter(room, "fire")) return;
  if (tap("k") && has("fire") && player.mp >= 1.6) {
    player.mp -= 1.6;
    const boosted = player.parryCharge > 0;
    if (boosted) player.parryCharge = 0;
    playSfx(boosted ? "boss" : "fire");
    projectiles.push({ x: player.x + player.dir * 10, y: player.y + (boosted ? 4 : 7), vx: player.dir * (boosted ? 4.8 : 4.2), w: boosted ? 16 : 8, h: boosted ? 10 : 5, life: boosted ? 86 : 70, fire: true, damage: boosted ? 7 : 3, boosted });
    if (boosted) addParticles(player.x + player.dir * 14, player.y + 7, "#fff1bd", 30);
  }
  if (held("s") && has("shield")) {
    const shieldCapacity = Math.max(0, SHIELD_MAX - Math.ceil(player.shieldPenalty || 0));
    if (shieldCapacity <= 0) {
      player.shield = 0;
    } else if (player.shield <= 0) {
      playSfx("shield");
      player.parryTimer = 8;
      player.shield = shieldCapacity;
    } else {
      player.shield = shieldCapacity;
    }
  }
  if (tap("i") && has("grapple")) {
    let best = null;
    for (const r of room.rings) {
      const d = Math.hypot(r.x - player.x, r.y - player.y);
      if (d < 105 && (!best || d < best.d)) best = { ...r, d };
    }
    player.grapple = best;
    if (best) playSfx("grapple");
  }
  if (!held("i")) player.grapple = null;
  if (player.grapple) {
    const dx = player.grapple.x - (player.x + player.w / 2);
    const dy = player.grapple.y - (player.y + player.h / 2);
    player.vx += dx * 0.012;
    player.vy += dy * 0.012 - 0.08;
  }
  if (player.dash > 0) {
    player.dash--;
    player.vy *= 0.72;
  } else {
    player.vy += GRAV * (inWater ? 0.35 : 1);
  }
  player.mp = Math.min(player.maxMp, player.mp + (0.012 + bossUpgradeLevel() * 0.0015));
}

function damagePlayer(n, fromX, deathMessage = "", options = {}) {
  if (player.counter) return false;
  if (player.hurt > 0 && !options.bypassHurt) return false;
  if (player.superCharge > 0 || player.superDash > 0) cancelSuperDash(fromX);
  if (!options.bypassShield && player.shield > 0 && Math.sign(fromX - player.x) === player.dir) {
    const parried = (player.parryTimer || 0) > 0;
    if (!parried) playSfx("block");
    addParticles(player.x + player.w / 2, player.y + 8, parried ? "#fff1bd" : "#bfe9ff", parried ? 34 : 18);
    player.mp = Math.min(player.maxMp, player.mp + (parried ? 2 : 1.2));
    if (parried) {
      triggerParryEffect(1);
      say("Aegis parry. Next strike is empowered.");
    } else {
      drainShield(2 + n * 2);
    }
    return false;
  }
  player.hp -= n;
  player.heal = 0;
  player.healLock = 45;
  player.hurt = 55;
  player.vx = fromX < player.x ? 2.6 : -2.6;
  player.vy = -2.2;
  shake = 7;
  playSfx("hurt");
  addParticles(player.x + 5, player.y + 8, "#c6423c", 16);
  if (player.hp <= 0) {
    const frozenMessage = (player.timeFrozen || 0) > 0 ? "A still second is a brittle thing. Dash against it until it cracks." : "";
    const resetMessage = resetLockedGuardianFight(currentRoom());
    restart(deathMessage || frozenMessage || resetMessage || "The village drags you back upright. Try that again, louder.");
  }
  return true;
}

function attackBox() {
  if (!has("sword")) return null;
  if (player.attack <= 0) return null;
  const t = ATTACK_MAX - player.attack;
  const boost = !!player.attackBoost;
  if (player.attackType === "up") {
    const cx = player.x + player.w / 2;
    const reach = (t < 5 ? 24 : t < 12 ? 34 : 26) + (boost ? 12 : 0);
    return arcHitbox({ x: cx - (boost ? 25 : 19), y: player.y - reach, w: boost ? 50 : 38, h: reach + 7 }, { type: "up", age: t, boost });
  }
  if (player.attackType === "down") return pogoBox();
  const dir = player.dir;
  const reach = (t < 5 ? 24 : t < 12 ? 35 : 28) + (boost ? 14 : 0);
  return arcHitbox({
    x: dir > 0 ? player.x + 6 : player.x + player.w - 6 - reach,
    y: player.y - (boost ? 13 : 9),
    w: reach,
    h: boost ? 38 : 30
  }, { type: "slash", dir, age: t, boost });
}

function pogoBox() {
  if (player.attack <= 0 || player.attackType !== "down") return null;
  const t = ATTACK_MAX - player.attack;
  const active = t >= 3 && t < 15;
  if (!active) return null;
  if (!has("shield")) {
    const cx = player.x + player.w / 2;
    return arcHitbox({ x: cx - 18, y: player.y + player.h - 1, w: 36, h: 26 }, { type: "down", age: t }, true);
  }
  const boost = !!player.attackBoost;
  const width = boost ? 28 : 18;
  const height = boost ? 24 : 17;
  return { x: player.x + player.w / 2 - width / 2, y: player.y + player.h - 1, w: width, h: height, pogo: true, boost };
}

function arcHitbox(box, arc, pogo = false) {
  return { ...box, arc, pogo };
}

function nearestCounterTarget(room) {
  let best = null;
  for (const e of room.enemies) {
    if (e.hp <= 0 || e.dying) continue;
    const bossWeight = e.boss || e.trialBoss ? -160 : 0;
    const d = Math.hypot((e.x + e.w / 2) - (player.x + player.w / 2), (e.y + e.h / 2) - (player.y + player.h / 2)) + bossWeight;
    if (!best || d < best.d) best = { e, d };
  }
  return best?.e || null;
}

function canStartFireCounter() {
  return has("fire") && (player.parryCharge || 0) > 0 && player.mp >= player.maxMp - 0.01;
}

function startParryCounter(room, style = "slash") {
  const target = nearestCounterTarget(room);
  if (!target) return false;
  const fireCounter = style === "fire" && canStartFireCounter();
  player.counter = {
    room: player.room,
    target,
    originX: player.x,
    originY: player.y,
    timer: 30,
    max: 30,
    hit: false,
    style: fireCounter ? "fire" : "slash"
  };
  if (fireCounter) player.mp = 0;
  player.parryCharge = 0;
  player.attack = 0;
  player.attackBoost = false;
  player.grapple = null;
  player.dash = 0;
  player.bash = 0;
  playSfx(fireCounter ? "bossPenitent" : "dash");
  addParticles(player.x + player.w / 2, player.y + 8, fireCounter ? "#ff7a3d" : "#fff1bd", fireCounter ? 54 : 30);
  return true;
}

function updateParryCounter(room) {
  const c = player.counter;
  if (!c) return;
  const target = c.target;
  if (player.room !== c.room || !target || target.hp <= 0 || target.dying) {
    player.x = c.originX;
    player.y = c.originY;
    player.counter = null;
    return;
  }
  const age = c.max - c.timer;
  const side = c.originX < target.x ? -1 : 1;
  const strikeX = clamp(target.x + target.w / 2 + side * 19 - player.w / 2, 12, W - player.w - 12);
  const strikeY = clamp(target.y + target.h / 2 - player.h / 2, 14, H - player.h - 18);
  const ease = t => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  if (age < 9) {
    const t = ease(age / 9);
    player.x = c.originX + (strikeX - c.originX) * t;
    player.y = c.originY + (strikeY - c.originY) * t;
  } else if (age < 18) {
    player.x = strikeX;
    player.y = strikeY;
    player.dir = target.x + target.w / 2 < player.x + player.w / 2 ? -1 : 1;
    if (!c.hit && age >= 12) {
      c.hit = true;
      const fireCounter = c.style === "fire";
      const hitHealth = damageEnemy(target, fireCounter ? 32 : 14, player.x + player.w / 2, fireCounter ? 24 : 12);
      target.hurt = fireCounter ? 34 : 24;
      target.vx = player.dir * (fireCounter ? 5.0 : 3.2);
      target.vy = Math.min(target.vy || 0, fireCounter ? -3.0 : -1.8);
      if (!fireCounter) player.mp = Math.min(player.maxMp, player.mp + 2.5);
      if (fireCounter) playSfx("bossPenitent");
      else if (target.trialBoss) playBossSfx(target.type);
      else playSfx("boss");
      shake = Math.max(shake, fireCounter ? 12 : 8);
      addParticles(target.x + target.w / 2, target.y + target.h / 2, fireCounter ? "#ff7a3d" : hitHealth ? "#fff1bd" : "#84c5d0", fireCounter ? 92 : 46);
      if (fireCounter) {
        addParticles(target.x + target.w / 2 - player.dir * 12, target.y + target.h / 2, "#fff1bd", 42);
      }
      if (target.hp <= 0 && beginGuardianDeath(target)) {
        c.timer = Math.max(c.timer, 18);
      }
    }
  } else {
    const t = ease((age - 18) / 12);
    player.x = strikeX + (c.originX - strikeX) * t;
    player.y = strikeY + (c.originY - strikeY) * t;
  }
  player.vx = 0;
  player.vy = 0;
  player.hurt = 0;
  player.attack = 10;
  player.attackType = "slash";
  player.attackBoost = true;
  if (c.style === "fire" && frame % 2 === 0) addParticles(player.x + player.w / 2, player.y + 8, "#ff7a3d", 5);
  c.timer--;
  if (c.timer <= 0) {
    player.x = c.originX;
    player.y = c.originY;
    player.attack = 0;
    player.attackBoost = false;
    player.counter = null;
  }
}

function hitboxParts(hitbox) {
  return hitbox ? [hitbox] : [];
}

function hitboxIntersects(hitbox, target) {
  return hitboxParts(hitbox).some(part => rects(part, target));
}

function damageEnemy(e, amount, sourceX, guardBreak = 1) {
  if (e.trialBoss && e.type === "boneGuard" && (e.shieldArmor || 0) > 0) {
    e.shieldArmor = Math.max(0, e.shieldArmor - guardBreak);
    e.hurt = 10;
    e.vx = sourceX < e.x ? 1.2 : -1.2;
    playSfx(e.shieldArmor > 0 ? "block" : "bash");
    addParticles(e.x + e.w / 2, e.y + 18, e.shieldArmor > 0 ? "#84c5d0" : "#f3cc67", e.shieldArmor > 0 ? 14 : 30);
    if (e.shieldArmor <= 0) {
      e.move = "stagger";
      e.moveTimer = 300;
      e.guardBroken = true;
      shake = Math.max(shake, 6);
      say("The Aegis guard breaks. Strike the Captain!");
    }
    return false;
  }
  e.hp -= amount;
  if (e.trialBoss && e.type === "anvilGuard" && !e.rewound && e.hp <= e.max * 0.08) {
    e.hp = Math.max(1, e.hp);
  }
  return true;
}

function wallClingSolid(solid) {
  return solid && !solid.unclimbable;
}

function pogoBounce(x, color = "#fff1bd") {
  player.vy = -6.2;
  player.jumps = has("doubleJump") ? Math.min(player.jumps, 1) : 0;
  player.coyote = 0;
  player.attack = Math.max(player.attack, 8);
  shake = Math.max(shake, 3);
  playSfx(has("shield") ? "bash" : "upSlash");
  addParticles(player.x + player.w / 2, player.y + player.h + 1, color, 22);
  addParticles(x, player.y + player.h + 6, color, 10);
}

function bashBox() {
  if (player.superDash > 0) {
    const reach = player.superShield ? 36 : 28;
    return { x: player.x + (player.dir > 0 ? 7 : -reach + 2), y: player.y - 1, w: reach, h: 21, super: true, superShield: !!player.superShield };
  }
  if (player.bash <= 0) return null;
  const age = BASH_MAX - player.bash;
  const reach = age < 4 ? 16 : 22;
  return { x: player.x + (player.dir > 0 ? 8 : -reach + 2), y: player.y + 1, w: reach, h: 16 };
}

function breakSecretWalls(room, hitbox, power = 1) {
  let opened = false;
  let quietOpened = false;
  let crackedHit = false;
  if (!room.crackedWallHits) room.crackedWallHits = {};
  for (const wall of room.breakables) wall.hitCooldown = Math.max(0, (wall.hitCooldown || 0) - 1);
  const strikes = hitboxParts(hitbox).map(part => ({ x: part.x - 5, y: part.y - 5, w: part.w + 10, h: part.h + 10 }));
  for (const wall of [...room.breakables]) {
    if (!strikes.some(strike => rects(strike, wall))) continue;
    if (wall.cracked) {
      if (wall.hitCooldown > 0) continue;
      const group = wall.group || `${wall.tx},${wall.ty}`;
      room.crackedWallHits[group] = (room.crackedWallHits[group] || 0) + 1;
      crackedHit = true;
      addParticles(wall.x + 8, wall.y + 8, palette[room.theme][3], 6);
      for (const cracked of room.breakables.filter(other => other.cracked && (other.group || `${other.tx},${other.ty}`) === group)) {
        cracked.hitCooldown = 20;
      }
      if (room.crackedWallHits[group] < 3) continue;
      for (let y = 0; y < room.tiles.length; y++) {
        for (let x = 0; x < room.tiles[y].length; x++) {
          if (room.tiles[y][x] !== "C") continue;
          room.tiles[y][x] = ".";
          opened = true;
          quietOpened = true;
          addParticles(x * TILE + 8, y * TILE + 8, palette[room.theme][3], 12);
        }
      }
      delete room.crackedWallHits[group];
      break;
    }
    for (let y = wall.ty - 1; y <= wall.ty + power; y++) {
      if (room.tiles[y]?.[wall.tx] === "S") {
        room.tiles[y][wall.tx] = ".";
        opened = true;
        addParticles(wall.x + 8, y * TILE + 8, palette[room.theme][3], 18);
      }
    }
  }
  if (opened) {
    rebuildCollision(room);
    shake = Math.max(shake, power >= 3 ? 8 : 5);
    playSfx("secret");
    if (!quietOpened) say("A false wall crumbles open.");
    saveGame();
  } else if (crackedHit) {
    shake = Math.max(shake, 2);
    playSfx("block");
  }
  return opened;
}

function spawnShockwave(x, y, dir, phaseLevel) {
  projectiles.push({
    x,
    y,
    vx: dir * (2.4 + phaseLevel * 0.55),
    vy: 0,
    w: 14 + phaseLevel * 3,
    h: 8,
    life: 86,
    hostile: true,
    kind: "shock",
    color: phaseLevel === 2 ? "#c6423c" : "#f0a642"
  });
}

function spawnRootSpike(x, phaseLevel) {
  const activeLife = 34 + phaseLevel * 8;
  const warning = 90;
  const h = 54 + phaseLevel * 4;
  const life = activeLife + warning;
  projectiles.push({
    x: clamp(x - 5, 18, W - 28),
    y: FLOOR_Y - h,
    vx: 0,
    vy: 0,
    w: 10 + phaseLevel * 2,
    h,
    life,
    maxLife: life,
    warning,
    warningMax: warning,
    hostile: true,
    kind: "rootSpike",
    color: phaseLevel === 2 ? "#c6423c" : "#6ea35f"
  });
}

function spawnThornShot(x, y, vx, vy, phaseLevel) {
  projectiles.push({
    x,
    y,
    vx,
    vy,
    w: 11 + phaseLevel * 2,
    h: 7,
    life: 92,
    hostile: true,
    kind: "thornShot",
    color: phaseLevel === 2 ? "#c6423c" : "#6ea35f"
  });
}

function spawnImpThornSpray(e, phaseLevel) {
  const sx = e.x + e.w / 2;
  const sy = e.y + 10;
  const speed = 2.4 + phaseLevel * 0.35;
  spawnThornShot(sx, sy, e.dir * speed, -0.35, phaseLevel);
  spawnThornShot(sx, sy + 6, e.dir * (speed + 0.2), 0.12, phaseLevel);
  if (phaseLevel >= 1) spawnThornShot(sx, sy + 2, e.dir * (speed - 0.2), -0.82, phaseLevel);
  addParticles(sx, sy, "#d7b167", 10);
}

function spawnBoneShard(x, y, vx, vy, phaseLevel) {
  projectiles.push({
    x,
    y,
    vx,
    vy,
    w: 12 + phaseLevel * 2,
    h: 6,
    life: 98,
    hostile: true,
    kind: "boneShard",
    color: phaseLevel === 2 ? "#c6423c" : "#f1d7a4"
  });
}

function spawnBellTone(x, y, vx, vy, phaseLevel) {
  projectiles.push({
    x,
    y,
    vx,
    vy,
    w: 14 + phaseLevel * 3,
    h: 14 + phaseLevel * 2,
    life: 86,
    hostile: true,
    kind: "bellTone",
    color: phaseLevel === 2 ? "#f0a642" : "#d7be7a"
  });
}

function spawnCinderBall(x, y, vx, vy, phaseLevel, big = false, colorOverride = "", kindOverride = "cinderBall") {
  projectiles.push({
    x,
    y,
    vx,
    vy,
    w: big ? 17 + phaseLevel * 2 : 12 + phaseLevel * 2,
    h: big ? 14 + phaseLevel * 2 : 10 + phaseLevel,
    life: big ? 118 : 94,
    hostile: true,
    kind: kindOverride,
    color: colorOverride || (phaseLevel === 2 ? "#c6423c" : "#ff7a3d")
  });
}

function spawnIronRootSpike(x, phaseLevel) {
  spawnRootSpike(x, phaseLevel);
  const p = projectiles[projectiles.length - 1];
  p.ironKing = true;
  p.color = phaseLevel >= 2 ? "#c6423c" : "#f3cc67";
}

function spawnIronFireball(x, y, vx, vy, phaseLevel) {
  spawnCinderBall(x, y, vx, vy, phaseLevel, true, phaseLevel >= 2 ? "#c6423c" : "#f3cc67", "ironFire");
  const p = projectiles[projectiles.length - 1];
  p.timeGate = true;
  p.bypassHurt = true;
  p.life = 92;
}

function spawnIronBolt(x, y, vx, vy, phaseLevel) {
  projectiles.push({
    x,
    y,
    vx,
    vy,
    w: 14 + phaseLevel * 2,
    h: 10 + phaseLevel,
    life: 110,
    hostile: true,
    kind: "ironBolt",
    color: phaseLevel === 2 ? "#c6423c" : "#f3cc67"
  });
}

function updateGateHound(e, room, slow, phaseLevel) {
  e.moveTimer = Math.max(0, (e.moveTimer || 0) - slow);
  e.antiAirCooldown = Math.max(0, (e.antiAirCooldown || 0) - slow);
  e.howlCooldown = Math.max(0, (e.howlCooldown || 0) - slow);
  e.pogoHeat = Math.max(0, (e.pogoHeat || 0) - 0.02 * slow);
  if (e.move === "charge" && e.chargeDir) e.dir = e.chargeDir;
  else e.dir = player.x < e.x ? -1 : 1;
  const grounded = room.solids.some(s => rects({ ...e, y: e.y + 1 }, s));
  if (!e.move || e.moveTimer <= 0) {
    e.chargeDir = 0;
    const close = Math.abs(player.x - e.x) < 124;
    const playerAbove = player.y + player.h < e.y + 14 && Math.abs((player.x + player.w / 2) - (e.x + e.w / 2)) < 62;
    if (grounded && e.antiAirCooldown <= 0 && (e.pogoHeat >= 2.2 || (playerAbove && player.vy > 0.35 && player.attackType === "down"))) {
      e.move = "antiAirLeap";
      e.moveTimer = 46;
      e.antiAirCooldown = phaseLevel === 2 ? 78 : 96;
      e.pogoHeat = 0;
      e.vx = Math.sign((player.x + player.w / 2) - (e.x + e.w / 2)) * (1.25 + phaseLevel * 0.35);
      e.vy = -7.2 - phaseLevel * 0.45;
      addParticles(e.x + e.w / 2, e.y + e.h, "#f0a642", 24);
      say("Brakka snaps upward.");
    } else if (phaseLevel >= 1 && e.howlCooldown <= 0 && frame % 3 === 0 && close) {
      e.move = "howl";
      e.moveTimer = phaseLevel === 2 ? 14 : 18;
      e.howlCooldown = phaseLevel === 2 ? 88 : 112;
      e.vx = 0;
    } else if (phaseLevel === 2 && grounded && Math.abs(player.x - e.x) < 168 && frame % 2 === 0) {
      e.move = "leap";
      e.moveTimer = 36;
      e.vx = e.dir * 3.1;
      e.vy = -6.3;
      addParticles(e.x + e.w / 2, e.y + e.h, "#c6423c", 18);
    } else if (close || phaseLevel === 2) {
      e.move = "chargeWindup";
      e.moveTimer = 18 - phaseLevel * 3;
      e.vx = 0;
    } else {
      e.move = "stalk";
      e.moveTimer = 34;
    }
  }
  if (e.move === "stalk") {
    e.vx += e.dir * (0.064 + phaseLevel * 0.018) * slow;
    if (grounded && Math.abs(player.x - e.x) < 148 && frame % (phaseLevel >= 1 ? 66 : 88) === 0) {
      e.move = "leap";
      e.moveTimer = 38;
      e.vx = e.dir * (2.65 + phaseLevel * 0.58);
      e.vy = -5.7 - phaseLevel * 0.55;
      addParticles(e.x + e.w / 2, e.y + e.h, "#8a1f2d", 14);
    }
  } else if (e.move === "chargeWindup") {
    e.vx *= 0.72;
    if (frame % 5 === 0) addParticles(e.x + (e.dir > 0 ? e.w : 0), e.y + e.h - 6, "#f0a642", 2);
    if (e.moveTimer <= 1) {
      e.move = "charge";
      e.moveTimer = 42 + phaseLevel * 12;
      e.chargeDir = e.dir || (player.x < e.x ? -1 : 1);
      e.vx = e.chargeDir * (4.25 + phaseLevel * 0.92);
      shake = Math.max(shake, 3);
    }
  } else if (e.move === "charge") {
    e.dir = e.chargeDir || e.dir || 1;
    e.vx = e.dir * (4.25 + phaseLevel * 0.92);
    if (frame % 4 === 0) addParticles(e.x + e.w / 2, e.y + e.h - 3, "#5f1f2d", 3);
  } else if (e.move === "leap") {
    e.vx += e.dir * 0.028 * slow;
    if (grounded && e.vy === 0 && e.moveTimer < 28) {
      e.move = "stalk";
      e.moveTimer = 26;
      addParticles(e.x + e.w / 2, e.y + e.h, "#f0a642", phaseLevel === 2 ? 34 : 22);
      shake = Math.max(shake, 5);
    }
  } else if (e.move === "antiAirLeap") {
    e.vx += e.dir * 0.018 * slow;
    if (frame % 4 === 0) addParticles(e.x + e.w / 2, e.y + e.h, "#c6423c", 4);
    if (grounded && e.vy === 0 && e.moveTimer < 34) {
      e.move = "stalk";
      e.moveTimer = 28;
      addParticles(e.x + e.w / 2, e.y + e.h, "#f0a642", 32);
      shake = Math.max(shake, 7);
    }
  } else if (e.move === "howl") {
    e.vx *= 0.68;
    if (Math.round(e.moveTimer) === 10 || Math.round(e.moveTimer) === 5) {
      addParticles(e.x + e.w / 2, e.y + 8, "#f3cc67", 20);
      shake = Math.max(shake, 4);
    }
  }
  const maxSpeed = e.move === "charge" ? 5.6 + phaseLevel * 0.95 : e.move === "antiAirLeap" ? 3.8 + phaseLevel * 0.4 : 2.55 + phaseLevel * 0.48;
  e.vx = clamp(e.vx, -maxSpeed, maxSpeed);
  e.vy = (e.vy || 0) + GRAV * slow;
  e.x += e.vx * slow;
  for (const s of room.solids) if (rects(e, s)) {
    if (e.vx > 0) e.x = s.x - e.w;
    if (e.vx < 0) e.x = s.x + s.w;
    if (e.move === "charge") {
      e.move = "stunned";
      e.moveTimer = 34;
      e.chargeDir = 0;
      addParticles(e.x + e.w / 2, e.y + e.h - 4, "#f0a642", 28);
      shake = Math.max(shake, 6);
    }
    e.vx *= -0.22;
  }
  if (e.arena) {
    if (e.x < e.arena.left || e.x > e.arena.right) {
      e.x = clamp(e.x, e.arena.left, e.arena.right);
      if (e.move === "charge") {
        e.move = "stunned";
        e.moveTimer = 34;
        e.chargeDir = 0;
        addParticles(e.x + e.w / 2, e.y + e.h - 4, "#f0a642", 28);
        shake = Math.max(shake, 6);
      }
      e.vx *= -0.35;
    }
  }
  e.y += e.vy * slow;
  for (const s of room.solids) if (rects(e, s)) {
    if (e.vy > 0) e.y = s.y - e.h;
    if (e.vy < 0) e.y = s.y + s.h;
    e.vy = 0;
  }
}

function resolveBrakkaContact(e, phaseLevel) {
  const playerMid = player.x + player.w / 2;
  const brakkaMid = e.x + e.w / 2;
  const dir = playerMid < brakkaMid ? -1 : 1;
  const overlap = Math.max(0, Math.min(player.x + player.w, e.x + e.w) - Math.max(player.x, e.x));
  player.x = clamp(player.x + dir * Math.max(6, overlap * 0.65 + 4), 8, W - player.w - 8);
  player.vx = dir * 4.1;
  player.vy = Math.min(player.vy, -2.8);
  e.x = clamp(e.x - dir * Math.max(4, overlap * 0.35), e.arena?.left ?? 8, e.arena?.right ?? W - e.w - 8);
  e.vx = -dir * (2.2 + phaseLevel * 0.45);
  e.vy = Math.min(e.vy || 0, -0.9);
  e.move = "stunned";
  e.moveTimer = 12;
  e.hurt = Math.max(e.hurt || 0, 6);
  shake = Math.max(shake, 5);
  addParticles((player.x + e.x + e.w / 2) / 2, Math.min(player.y, e.y) + 14, "#f0a642", 18);
}

function updateRootImp(e, room, slow, phaseLevel) {
  e.moveTimer = Math.max(0, (e.moveTimer || 0) - slow);
  e.slamCooldown = Math.max(0, (e.slamCooldown || 0) - slow);
  e.volleyCooldown = Math.max(0, (e.volleyCooldown || 0) - slow);
  e.snareCooldown = Math.max(0, (e.snareCooldown || 0) - slow);
  e.upperHeat = Math.max(0, (e.upperHeat || 0) - 0.018 * slow);
  e.dir = player.x < e.x ? -1 : 1;
  const grounded = room.solids.some(s => rects({ ...e, y: e.y + 1 }, s));
  if (!e.move || e.moveTimer <= 0) {
    const dx = Math.abs(player.x - e.x);
    if ((e.upperHeat || 0) >= 2.2 && e.slamCooldown <= 0) {
      e.move = "rootSlam";
      e.moveTimer = 40;
      e.slamCooldown = phaseLevel === 2 ? 74 : 92;
      e.upperHeat = 0;
      e.vx = Math.sign((player.x + player.w / 2) - (e.x + e.w / 2)) * (0.7 + phaseLevel * 0.25);
      e.vy = grounded ? -4.6 : 2.8 + phaseLevel * 0.45;
    } else if (phaseLevel >= 1 && e.snareCooldown <= 0 && frame % 3 === 0 && dx < 180) {
      e.move = "rootSnare";
      e.moveTimer = phaseLevel === 2 ? 34 : 42;
      e.snareCooldown = phaseLevel === 2 ? 98 : 124;
      e.snareSprayBeat = 0;
      e.vx = 0;
    } else if (grounded && dx < 116) {
      e.move = "pounce";
      e.moveTimer = 42;
      e.vx = e.dir * (2.6 + phaseLevel * 0.45);
      e.vy = -5.3 - phaseLevel * 0.35;
    } else if (phaseLevel === 2 && grounded && frame % 2 === 0) {
      e.move = "burrow";
      e.moveTimer = 28;
      e.vx = 0;
      addParticles(e.x + e.w / 2, e.y + e.h, "#6ea35f", 18);
    } else if (e.volleyCooldown <= 0) {
      e.move = "thornVolley";
      e.moveTimer = phaseLevel === 2 ? 24 : 28;
      e.volleyCooldown = phaseLevel === 2 ? 84 : 108;
      e.vx = 0;
    } else {
      e.move = "stalk";
      e.moveTimer = 28;
    }
  }
  if (e.move === "stalk") {
    e.vx += e.dir * (0.05 + phaseLevel * 0.012) * slow;
    if (grounded && Math.abs(player.x - e.x) < 132 && frame % (phaseLevel ? 70 : 92) === 0) {
      e.move = "pounce";
      e.moveTimer = 40;
      e.vx = e.dir * (2.7 + phaseLevel * 0.5);
      e.vy = -5.4 - phaseLevel * 0.4;
    }
  } else if (e.move === "thornVolley") {
    e.vx *= 0.72;
    const volleyBeat = Math.round(e.moveTimer);
    if (volleyBeat === 18 || volleyBeat === 10 || (phaseLevel === 2 && volleyBeat === 5)) {
      spawnImpThornSpray(e, phaseLevel);
    }
  } else if (e.move === "rootSnare") {
    e.vx *= 0.6;
    const snareBeat = Math.round(e.moveTimer);
    if (phaseLevel === 2 && (snareBeat === 18 || snareBeat === 8) && e.snareSprayBeat !== snareBeat) {
      e.snareSprayBeat = snareBeat;
      spawnImpThornSpray(e, phaseLevel);
    }
    if (snareBeat === 24 || snareBeat === 13 || (phaseLevel === 2 && snareBeat === 6)) {
      spawnRootSpike(player.x + player.w / 2, phaseLevel);
      spawnRootSpike(player.x + player.w / 2 - 34, phaseLevel);
      spawnRootSpike(player.x + player.w / 2 + 34, phaseLevel);
      if (phaseLevel === 2) {
        spawnRootSpike(e.x + e.w / 2 - 52, phaseLevel);
        spawnRootSpike(e.x + e.w / 2 + 52, phaseLevel);
      }
      shake = Math.max(shake, 4);
    }
  } else if (e.move === "pounce") {
    e.vx += e.dir * 0.025 * slow;
    if (grounded && e.vy === 0 && e.moveTimer < 25) {
      e.move = "stalk";
      e.moveTimer = 24;
      spawnRootSpike(e.x + e.w / 2, phaseLevel);
      if (phaseLevel >= 1) {
        spawnRootSpike(e.x + e.w / 2 - 24, phaseLevel);
        spawnRootSpike(e.x + e.w / 2 + 24, phaseLevel);
      }
    }
  } else if (e.move === "rootSlam") {
    const playerCenter = player.x + player.w / 2;
    const selfCenter = e.x + e.w / 2;
    e.vx += Math.sign(playerCenter - selfCenter) * 0.035 * slow;
    if (e.moveTimer > 24 && e.vy < 2.4) e.vy += 0.32 * slow;
    if (frame % 4 === 0) addParticles(e.x + e.w / 2, e.y + e.h, "#d7b167", 4);
    if (grounded && e.vy === 0 && e.moveTimer < 30) {
      e.move = "stalk";
      e.moveTimer = 24;
      const cx = e.x + e.w / 2;
      spawnRootSpike(cx, phaseLevel);
      spawnRootSpike(cx - 28, phaseLevel);
      spawnRootSpike(cx + 28, phaseLevel);
      if (phaseLevel >= 1) {
        spawnRootSpike(cx - 56, phaseLevel);
        spawnRootSpike(cx + 56, phaseLevel);
      }
      const slam = { x: e.x - 18, y: e.y + e.h - 14, w: e.w + 36, h: 28 };
      if (rects(player, slam)) {
        damagePlayer(phaseLevel === 2 ? 2 : 1, e.x + e.w / 2);
        player.vx = player.x < e.x ? -2.7 : 2.7;
        player.vy = -3.4;
      }
      shake = Math.max(shake, 6);
      addParticles(cx, e.y + e.h, "#6ea35f", 34);
    }
  } else if (e.move === "burrow") {
    e.vx = 0;
    e.vy = 0;
    if (e.moveTimer === 13) {
      e.x = clamp(player.x + (player.dir > 0 ? -72 : 72), e.arena?.left ?? 32, e.arena?.right ?? W - e.w - 32);
      e.y = FLOOR_Y - e.h;
      spawnRootSpike(e.x + e.w / 2, phaseLevel);
      addParticles(e.x + e.w / 2, e.y + e.h, "#6ea35f", 24);
    } else if (e.moveTimer <= 1) {
      e.y = FLOOR_Y - e.h;
      e.move = "stalk";
      e.moveTimer = 22;
    }
  }
  const maxSpeed = e.move === "pounce" || e.move === "rootSlam" ? 3.4 + phaseLevel * 0.55 : 1.8 + phaseLevel * 0.25;
  e.vx = clamp(e.vx, -maxSpeed, maxSpeed);
  if (e.move !== "burrow") e.vy = (e.vy || 0) + GRAV * slow;
  e.x += e.vx * slow;
  for (const s of room.solids) if (rects(e, s)) {
    if (e.vx > 0) e.x = s.x - e.w;
    if (e.vx < 0) e.x = s.x + s.w;
    e.vx *= -0.35;
  }
  if (e.arena) e.x = clamp(e.x, e.arena.left, e.arena.right);
  e.y += e.vy * slow;
  for (const s of room.solids) if (rects(e, s)) {
    if (e.vy > 0) e.y = s.y - e.h;
    if (e.vy < 0) e.y = s.y + s.h;
    e.vy = 0;
  }
}

function updateOssuaryWyvern(e, room, slow, phaseLevel) {
  const previousMove = e.move;
  e.moveTimer = Math.max(0, (e.moveTimer || 0) - slow);
  e.stormCooldown = Math.max(0, (e.stormCooldown || 0) - slow);
  e.dir = player.x < e.x ? -1 : 1;
  if (!e.move || e.moveTimer <= 0) {
    const dx = Math.abs(player.x - e.x);
    if (previousMove === "boneStorm") {
      e.move = "dive";
      e.moveTimer = 42 + phaseLevel * 7;
      e.vx = e.dir * (3.25 + phaseLevel * 0.5);
      e.vy = 1.65 + phaseLevel * 0.28;
    } else if (phaseLevel >= 1 && e.stormCooldown <= 0 && dx > 56 && frame % 3 === 0) {
      e.move = "boneStorm";
      e.moveTimer = phaseLevel === 2 ? 42 : 36;
      e.stormCooldown = phaseLevel === 2 ? 132 : 166;
      e.vx = 0;
      e.vy = 0.15;
    } else if (dx < 150 || phaseLevel === 2) {
      e.move = "dive";
      e.moveTimer = 48 + phaseLevel * 8;
      e.vx = e.dir * (3.0 + phaseLevel * 0.45);
      e.vy = 1.25 + phaseLevel * 0.25;
    } else {
      e.move = "stalk";
      e.moveTimer = 42;
    }
  }
  if (e.move === "stalk") {
    e.vx += e.dir * (0.025 + phaseLevel * 0.008) * slow;
    e.vy += Math.sin(frame / 14 + e.x * 0.03) * 0.025;
    if (frame % (phaseLevel ? 58 : 82) === 0) {
      spawnBoneShard(e.x + e.w / 2, e.y + e.h / 2, e.dir * (2.1 + phaseLevel * 0.25), 0.12, phaseLevel);
    }
  } else if (e.move === "dive") {
    const targetY = player.y + 4;
    e.vx += e.dir * 0.045 * slow;
    e.vy += Math.sign(targetY - e.y) * 0.04 * slow;
    if (frame % 9 === 0) addParticles(e.x + e.w / 2, e.y + e.h, "#f1d7a4", 4);
    if (e.moveTimer === 20 || (phaseLevel === 2 && e.moveTimer === 32)) {
      spawnBoneShard(e.x + e.w / 2, e.y + e.h - 2, e.dir * 2.7, 0.45, phaseLevel);
      spawnBoneShard(e.x + e.w / 2, e.y + e.h - 2, e.dir * 2.1, 0.9, phaseLevel);
    }
  } else if (e.move === "boneStorm") {
    e.vx *= 0.72;
    const stormHoverY = phaseLevel === 2 ? 76 : 82;
    e.vy += Math.sign(stormHoverY - e.y) * 0.055 * slow + Math.sin(frame / 7) * 0.018;
    if (e.moveTimer === 30 || e.moveTimer === 18 || (phaseLevel === 2 && e.moveTimer === 8)) {
      const sx = e.x + e.w / 2;
      const sy = e.y + 15;
      spawnBoneShard(sx, sy, -2.35 - phaseLevel * 0.2, -0.1, phaseLevel);
      spawnBoneShard(sx, sy + 4, 2.35 + phaseLevel * 0.2, -0.1, phaseLevel);
      spawnBoneShard(sx, sy + 8, e.dir * (2.8 + phaseLevel * 0.25), 0.55, phaseLevel);
      if (phaseLevel >= 1) spawnBoneShard(sx, sy + 2, -e.dir * 2.1, 0.85, phaseLevel);
      shake = Math.max(shake, 3);
    }
  }
  const maxSpeed = e.move === "dive" ? 4.2 + phaseLevel * 0.65 : 2.2 + phaseLevel * 0.35;
  e.vx = clamp(e.vx, -maxSpeed, maxSpeed);
  e.vy = clamp(e.vy, -2.2, e.move === "dive" ? 2.9 + phaseLevel * 0.35 : 1.65);
  e.x += e.vx * slow;
  e.y += e.vy * slow;
  if (e.arena) {
    e.arena.top = Math.max(e.arena.top || 0, 58);
    if (e.x < e.arena.left || e.x > e.arena.right) {
      e.vx *= -0.62;
      e.moveTimer = Math.min(e.moveTimer, 18);
    }
    if (e.y < e.arena.top || e.y > e.arena.bottom) {
      e.vy *= -0.58;
      if (e.move === "dive" && e.y > e.arena.bottom - 5) {
        spawnBoneShard(e.x + e.w / 2, e.y + e.h - 3, -1.8, -0.25, phaseLevel);
        spawnBoneShard(e.x + e.w / 2, e.y + e.h - 3, 1.8, -0.25, phaseLevel);
        shake = Math.max(shake, 5);
        e.move = "stalk";
        e.moveTimer = 26;
      }
    }
    e.x = clamp(e.x, e.arena.left, e.arena.right);
    e.y = clamp(e.y, e.arena.top, e.arena.bottom);
  }
}

function updateBellGargoyle(e, room, slow, phaseLevel) {
  const previousMove = e.move;
  e.moveTimer = Math.max(0, (e.moveTimer || 0) - slow);
  e.bellCooldown = Math.max(0, (e.bellCooldown || 0) - slow);
  e.aegisCooldown = Math.max(0, (e.aegisCooldown ?? 120) - slow);
  e.dir = player.x < e.x ? -1 : 1;
  if (!e.move || e.moveTimer <= 0) {
    const dx = Math.abs(player.x - e.x);
    if (previousMove === "sonicPeal" || previousMove === "aegisPeal") {
      e.move = "swoop";
      e.moveTimer = 44 + phaseLevel * 8;
      e.vx = e.dir * (3.1 + phaseLevel * 0.45);
      e.vy = 1.25 + phaseLevel * 0.25;
    } else if (e.aegisCooldown <= 0) {
      e.move = "aegisPeal";
      e.moveTimer = phaseLevel === 2 ? 112 : 58;
      e.aegisCooldown = phaseLevel === 2 ? 135 : 165;
      e.pealHits = {};
      e.vx = 0;
      e.vy = -0.2;
      say(has("shield") ? "Raise the Aegis Guard against the bell peal!" : "The bell peal demands the Aegis Guard.");
    } else if (phaseLevel >= 1 && e.bellCooldown <= 0 && dx < 210) {
      e.move = "sonicPeal";
      e.moveTimer = phaseLevel === 2 ? 42 : 50;
      e.bellCooldown = phaseLevel === 2 ? 118 : 150;
      e.vx = 0;
      e.vy = -0.15;
    } else if (dx < 142 || phaseLevel === 2) {
      e.move = "swoop";
      e.moveTimer = 48;
      e.vx = e.dir * (2.75 + phaseLevel * 0.42);
      e.vy = 1.05 + phaseLevel * 0.22;
    } else {
      e.move = "perch";
      e.moveTimer = 44;
    }
  }
  if (e.move === "perch") {
    e.vx += e.dir * (0.022 + phaseLevel * 0.008) * slow;
    e.vy += Math.sin(frame / 16 + e.x * 0.04) * 0.026;
    if (frame % (phaseLevel ? 72 : 96) === 0) spawnBellTone(e.x + e.w / 2, e.y + 16, e.dir * (2.1 + phaseLevel * 0.22), 0.15, phaseLevel);
  } else if (e.move === "swoop") {
    const targetY = player.y + 2;
    e.vx += e.dir * 0.05 * slow;
    e.vy += Math.sign(targetY - e.y) * 0.045 * slow;
    if (frame % 7 === 0) addParticles(e.x + e.w / 2, e.y + e.h, "#69728a", 3);
    if (e.moveTimer === 24 || (phaseLevel === 2 && e.moveTimer === 12)) {
      spawnBellTone(e.x + e.w / 2, e.y + e.h - 4, e.dir * 2.7, 0.5, phaseLevel);
    }
  } else if (e.move === "sonicPeal") {
    const hoverY = phaseLevel === 2 ? 70 : 78;
    e.vx *= 0.64;
    e.vy += Math.sign(hoverY - e.y) * 0.05 * slow + Math.sin(frame / 6) * 0.015;
    if (e.moveTimer === 36 || e.moveTimer === 24 || e.moveTimer === 12 || (phaseLevel === 2 && e.moveTimer === 6)) {
      const sx = e.x + e.w / 2;
      const sy = e.y + 16;
      spawnBellTone(sx, sy, -2.35 - phaseLevel * 0.25, -0.05, phaseLevel);
      spawnBellTone(sx, sy + 5, 2.35 + phaseLevel * 0.25, -0.05, phaseLevel);
      spawnBellTone(sx, sy + 9, e.dir * (2.6 + phaseLevel * 0.35), 0.62, phaseLevel);
      shake = Math.max(shake, 3);
    }
  } else if (e.move === "aegisPeal") {
    const hoverY = 66;
    e.vx *= 0.5;
    e.vy += Math.sign(hoverY - e.y) * 0.055 * slow;
    if (e.moveTimer === 76 || e.moveTimer === 58 || e.moveTimer === 42 || e.moveTimer === 30 || e.moveTimer === 18) {
      addParticles(e.x + e.w / 2, e.y + 14, "#d7be7a", 20);
      shake = Math.max(shake, 3);
    }
    const pealPulse = e.moveTimer <= (phaseLevel === 2 ? 62 : 12) && !e.pealHits?.first;
    const secondPealPulse = phaseLevel === 2 && e.moveTimer <= 10 && !e.pealHits?.second;
    if (pealPulse || secondPealPulse) {
      if (!e.pealHits) e.pealHits = {};
      if (pealPulse) e.pealHits.first = true;
      if (secondPealPulse) e.pealHits.second = true;
      e.radialWave = 52;
      e.radialMax = 52;
      e.radialHits = {};
      playSfx("gong");
      playSfx("shriek");
      shake = Math.max(shake, 9);
    }
    if (e.radialWave > 0) {
      const max = e.radialMax || 52;
      const r = 24 + (max - e.radialWave) * ((Math.max(W, H) + 92) / max);
      const px = player.x + player.w / 2;
      const py = player.y + player.h / 2;
      const sx = e.x + e.w / 2;
      const sy = e.y + 14;
      const inWave = Math.hypot(px - sx, py - sy) <= r;
      if (inWave && !e.radialHits?.player) {
        if (!e.radialHits) e.radialHits = {};
        e.radialHits.player = true;
        const guarded = has("shield") && player.shield > 0;
        if (guarded) {
          const parried = (player.parryTimer || 0) > 0;
          if (!parried) playSfx("block");
          if (!parried) drainShield(5);
          player.mp = Math.min(player.maxMp, player.mp + (parried ? 3 : 2));
          player.vx = player.x < e.x ? -2.4 : 2.4;
          player.vy = -1.5;
          addParticles(player.x + player.w / 2, player.y + 8, parried ? "#fff1bd" : "#bfe9ff", parried ? 46 : 36);
          if (parried) {
            triggerParryEffect(2);
            say("Aegis parry. Counterstrike primed.");
          } else {
            say("The Aegis Guard drinks the bell peal.");
          }
        } else {
          addParticles(player.x + player.w / 2, player.y + 8, "#d7be7a", 42);
          if (phaseLevel < 2) say(has("shield") ? "Hold S to raise the Aegis Guard." : "Find the Aegis Guard before challenging the Bell-Horn.");
          damagePlayer(99, e.x + e.w / 2, phaseLevel >= 2 ? "The bell peal shatters you." : "Your eardrums were shattered.... if only you had a way to shield yourself");
        }
      }
      e.radialWave = Math.max(0, e.radialWave - 1);
    }
  }
  const maxSpeed = e.move === "swoop" ? 4.25 + phaseLevel * 0.55 : 2.0 + phaseLevel * 0.3;
  e.vx = clamp(e.vx, -maxSpeed, maxSpeed);
  e.vy = clamp(e.vy, -1.9, e.move === "swoop" ? 2.7 + phaseLevel * 0.3 : 1.45);
  e.x += e.vx * slow;
  e.y += e.vy * slow;
  if (e.arena) {
    if (e.x < e.arena.left || e.x > e.arena.right) {
      e.vx *= -0.65;
      e.moveTimer = Math.min(e.moveTimer, 18);
    }
    if (e.y < e.arena.top || e.y > e.arena.bottom) {
      e.vy *= -0.6;
      if (e.move === "swoop" && e.y > e.arena.bottom - 5) {
        spawnBellTone(e.x + e.w / 2, e.y + e.h - 2, -1.7, -0.12, phaseLevel);
        spawnBellTone(e.x + e.w / 2, e.y + e.h - 2, 1.7, -0.12, phaseLevel);
        e.move = "perch";
        e.moveTimer = 26;
        shake = Math.max(shake, 4);
      }
    }
    e.x = clamp(e.x, e.arena.left, e.arena.right);
    e.y = clamp(e.y, e.arena.top, e.arena.bottom);
  }
}

function updateCinderPenitent(e, room, slow, phaseLevel) {
  e.moveTimer = Math.max(0, (e.moveTimer || 0) - slow);
  e.fireCooldown = Math.max(0, (e.fireCooldown ?? 70) - slow);
  e.pogoWardCooldown = Math.max(0, (e.pogoWardCooldown || 0) - slow);
  e.pogoHeat = Math.max(0, (e.pogoHeat || 0) - 0.018 * slow);
  e.dir = player.x < e.x ? -1 : 1;
  const grounded = room.solids.some(s => rects({ ...e, y: e.y + 1 }, s));
  if (!e.move || e.moveTimer <= 0) {
    const dx = Math.abs(player.x - e.x);
    const playerAbove = player.y + player.h < e.y + 13 && Math.abs((player.x + player.w / 2) - (e.x + e.w / 2)) < 46;
    if (e.pogoWardCooldown <= 0 && (e.pogoHeat >= 2.3 || (playerAbove && player.vy > 0.4 && player.attackType === "down"))) {
      e.move = "cinderHalo";
      e.moveTimer = phaseLevel === 2 ? 40 : 34;
      e.pogoWardCooldown = phaseLevel === 2 ? 74 : 92;
      e.pogoHeat = 0;
      e.vx = 0;
      say("The Penitent kindles a crown of cinders.");
    } else if (e.fireCooldown <= 0 && dx < 230) {
      e.move = phaseLevel >= 1 ? "emberMass" : "cinderCast";
      e.moveTimer = phaseLevel === 2 ? 56 : 48;
      e.fireCooldown = phaseLevel === 2 ? 88 : phaseLevel === 1 ? 112 : 138;
      e.vx = 0;
    } else if (grounded && dx < 112) {
      e.move = "ashLeap";
      e.moveTimer = 38;
      e.vx = e.dir * (2.25 + phaseLevel * 0.42);
      e.vy = -5.1 - phaseLevel * 0.35;
    } else {
      e.move = "stalk";
      e.moveTimer = 36;
    }
  }
  if (e.move === "stalk") {
    e.vx += e.dir * (0.046 + phaseLevel * 0.014) * slow;
    if (frame % (phaseLevel ? 76 : 104) === 0) {
      spawnCinderBall(e.x + e.w / 2, e.y + 15, e.dir * (2.25 + phaseLevel * 0.18), -0.18, phaseLevel);
    }
  } else if (e.move === "cinderCast") {
    e.vx *= 0.58;
    if (frame % 5 === 0) addParticles(e.x + e.w / 2, e.y + 12, "#ff7a3d", 3);
    if (e.moveTimer === 30 || e.moveTimer === 16) {
      spawnCinderBall(e.x + e.w / 2, e.y + 14, e.dir * (2.55 + phaseLevel * 0.25), -0.12, phaseLevel);
      addParticles(e.x + e.w / 2, e.y + 11, "#fff1bd", 8);
    }
  } else if (e.move === "emberMass") {
    e.vx *= 0.52;
    if (frame % 4 === 0) addParticles(e.x + e.w / 2 + Math.sin(frame / 5) * 12, e.y + 7, "#f0a642", 4);
    if (e.moveTimer === 42 || e.moveTimer === 28 || e.moveTimer === 14 || (phaseLevel === 2 && e.moveTimer === 7)) {
      const sx = e.x + e.w / 2;
      const sy = e.y + 13;
      const speed = 2.35 + phaseLevel * 0.28;
      spawnCinderBall(sx, sy, e.dir * speed, -0.72, phaseLevel, phaseLevel === 2);
      spawnCinderBall(sx, sy + 6, e.dir * (speed + 0.28), 0.06, phaseLevel);
      if (phaseLevel >= 1) spawnCinderBall(sx, sy + 2, -e.dir * (speed - 0.12), -0.34, phaseLevel);
      shake = Math.max(shake, 3);
    }
  } else if (e.move === "cinderHalo") {
    e.vx *= 0.45;
    if (frame % 3 === 0) addParticles(e.x + e.w / 2 + Math.sin(frame / 4) * 22, e.y - 2, "#ff7a3d", 3);
    if (e.moveTimer === 24 || e.moveTimer === 14 || (phaseLevel === 2 && e.moveTimer === 7)) {
      const halo = { x: e.x - 16, y: e.y - 34, w: e.w + 32, h: 40 };
      addParticles(e.x + e.w / 2, e.y - 12, "#fff1bd", 28);
      spawnCinderBall(e.x + e.w / 2, e.y - 7, -1.85 - phaseLevel * 0.18, -1.05, phaseLevel);
      spawnCinderBall(e.x + e.w / 2, e.y - 7, 1.85 + phaseLevel * 0.18, -1.05, phaseLevel);
      if (rects(player, halo)) {
        damagePlayer(phaseLevel === 2 ? 2 : 1, e.x + e.w / 2);
        player.vx = player.x < e.x ? -2.8 : 2.8;
        player.vy = -3.4;
      }
      shake = Math.max(shake, 5);
    }
  } else if (e.move === "ashLeap") {
    e.vx += e.dir * 0.024 * slow;
    if (frame % 6 === 0) addParticles(e.x + e.w / 2, e.y + e.h, "#5b2417", 3);
    if (grounded && e.vy === 0 && e.moveTimer < 25) {
      e.move = "stalk";
      e.moveTimer = 24;
      spawnCinderBall(e.x + e.w / 2, e.y + e.h - 8, -1.95, -0.34, phaseLevel);
      spawnCinderBall(e.x + e.w / 2, e.y + e.h - 8, 1.95, -0.34, phaseLevel);
      if (phaseLevel === 2) spawnCinderBall(e.x + e.w / 2, e.y + e.h - 14, e.dir * 2.45, -0.74, phaseLevel);
      shake = Math.max(shake, 4);
    }
  }
  const maxSpeed = e.move === "ashLeap" ? 3.25 + phaseLevel * 0.45 : 1.9 + phaseLevel * 0.28;
  e.vx = clamp(e.vx, -maxSpeed, maxSpeed);
  e.vy = (e.vy || 0) + GRAV * slow;
  e.x += e.vx * slow;
  for (const s of room.solids) if (rects(e, s)) {
    if (e.vx > 0) e.x = s.x - e.w;
    if (e.vx < 0) e.x = s.x + s.w;
    e.vx *= -0.35;
  }
  if (e.arena) {
    if (e.x < e.arena.left || e.x > e.arena.right) e.vx *= -0.35;
    e.x = clamp(e.x, e.arena.left, e.arena.right);
  }
  e.y += e.vy * slow;
  for (const s of room.solids) if (rects(e, s)) {
    if (e.vy > 0) e.y = s.y - e.h;
    if (e.vy < 0) e.y = s.y + s.h;
    e.vy = 0;
  }
}

function updateAegisCaptain(e, room, slow, phaseLevel) {
  e.moveTimer = Math.max(0, (e.moveTimer || 0) - slow);
  e.antiAirCooldown = Math.max(0, (e.antiAirCooldown || 0) - slow);
  e.pogoHeat = Math.max(0, (e.pogoHeat || 0) - 0.02 * slow);
  e.dir = player.x < e.x ? -1 : 1;
  const grounded = room.solids.some(s => rects({ ...e, y: e.y + 1 }, s));
  if (e.move === "stagger") {
    e.vx *= 0.82;
    if (frame % 14 === 0) addParticles(e.x + e.w / 2, e.y + 18, "#f3cc67", 6);
    if (e.moveTimer <= 0) {
      e.guardBroken = false;
      e.shieldArmor = e.shieldMax || 18;
      e.move = "aegisBrace";
      e.moveTimer = 36;
      e.vx = 0;
      addParticles(e.x + e.w / 2, e.y + 18, "#84c5d0", 28);
      playSfx("shield");
    }
  }
  const guarded = (e.shieldArmor || 0) > 0;
  if (e.move !== "stagger" && (!e.move || e.moveTimer <= 0)) {
    const dx = Math.abs(player.x - e.x);
    const playerAbove = player.y + player.h < e.y + 15 && Math.abs((player.x + player.w / 2) - (e.x + e.w / 2)) < 48;
    if (e.antiAirCooldown <= 0 && (e.pogoHeat >= 2.2 || (playerAbove && player.vy > 0.35 && player.attackType === "down"))) {
      e.move = "aegisUppercut";
      e.moveTimer = phaseLevel === 2 ? 34 : 30;
      e.antiAirCooldown = phaseLevel === 2 ? 70 : 88;
      e.pogoHeat = 0;
      e.vx = e.dir * (1.15 + phaseLevel * 0.3);
      e.vy = -6.2 - phaseLevel * 0.55;
    } else if (guarded && dx < 54) {
      e.move = "aegisBrace";
      e.moveTimer = 24;
      e.vx = e.dir * 0.7;
    } else if (guarded && dx < 165) {
      e.move = phaseLevel >= 1 ? "swordCombo" : "shieldRush";
      e.moveTimer = phaseLevel >= 1 ? 38 : 30;
      e.vx = e.dir * (phaseLevel >= 1 ? 2.35 : 3.05);
      e.rushHit = false;
    } else if (dx < 154) {
      e.move = "swordCombo";
      e.moveTimer = phaseLevel >= 1 ? 40 : 32;
      e.vx = e.dir * (phaseLevel >= 1 ? 2.35 : 1.75);
    } else {
      e.move = "stalk";
      e.moveTimer = 26;
    }
  }
  if (e.move === "stagger") {
    // Stunned after its guard breaks; physics below still keeps it grounded.
  } else if (e.move === "stalk") {
    e.vx += e.dir * (0.075 + phaseLevel * 0.018) * slow;
  } else if (e.move === "aegisBrace") {
    e.vx += e.dir * 0.035 * slow;
    e.vx *= 0.76;
    if (e.moveTimer === 16 || e.moveTimer === 8) {
      const shove = { x: e.dir > 0 ? e.x + e.w - 2 : e.x - 22, y: e.y + 7, w: 24, h: 25 };
      addParticles(e.x + e.w / 2, e.y + 17, "#84c5d0", 16);
      if (rects(player, shove)) {
        damagePlayer(1, e.x + e.w / 2);
        player.vx = e.dir * 2.7;
        player.vy = -1.5;
      }
      shake = Math.max(shake, 3);
    }
  } else if (e.move === "shieldRush") {
    e.vx = e.dir * (3.55 + phaseLevel * 0.55);
    if (frame % 6 === 0) addParticles(e.x + (e.dir > 0 ? 5 : e.w - 5), e.y + e.h - 5, "#84c5d0", 3);
    const rush = { x: e.dir > 0 ? e.x + e.w - 3 : e.x - 18, y: e.y + 7, w: 21, h: 25 };
    if (!e.rushHit && rects(player, rush)) {
      e.rushHit = true;
      damagePlayer(1, e.x + e.w / 2);
      player.vx = e.dir * 3.2;
      player.vy = -1.4;
      shake = Math.max(shake, 4);
    }
  } else if (e.move === "aegisUppercut") {
    e.vx += e.dir * 0.018 * slow;
    if (frame % 3 === 0) addParticles(e.x + e.w / 2 + Math.sin(frame / 4) * 18, e.y + 5, "#84c5d0", 3);
    if (e.moveTimer === 18 || e.moveTimer === 10 || (phaseLevel === 2 && e.moveTimer === 25)) {
      const slash = { x: e.x - 16, y: e.y - 42, w: e.w + 32, h: 54 };
      addParticles(e.x + e.w / 2, e.y - 10, "#bfe9ff", 24);
      if (rects(player, slash)) {
        damagePlayer(phaseLevel === 2 ? 2 : 1, e.x + e.w / 2);
        player.vx = player.x < e.x ? -2.6 : 2.6;
        player.vy = -3.2;
      }
      shake = Math.max(shake, 4);
    }
  } else if (e.move === "swordCombo") {
    e.vx += e.dir * (0.062 + phaseLevel * 0.016) * slow;
    const slashFrames = phaseLevel === 2 ? [31, 21, 11] : phaseLevel === 1 ? [27, 15] : [16];
    if (slashFrames.includes(Math.round(e.moveTimer))) {
      const high = phaseLevel >= 1 && Math.round(e.moveTimer) === slashFrames[0];
      const slash = {
        x: e.dir > 0 ? e.x + e.w - 4 : e.x - 31,
        y: e.y + (high ? -2 : 7),
        w: 35,
        h: high ? 28 : 24
      };
      addParticles(e.x + (e.dir > 0 ? e.w : 0), e.y + (high ? 7 : 17), "#fff1bd", 18);
      if (rects(player, slash)) {
        damagePlayer(phaseLevel === 2 ? 2 : 1, e.x + e.w / 2);
        player.vx = e.dir * 2.5;
        player.vy = high ? -2.6 : -1.4;
      }
      shake = Math.max(shake, 3);
    }
  }
  e.vx = clamp(e.vx, -3.7 - phaseLevel * 0.45, 3.7 + phaseLevel * 0.45);
  e.vy = (e.vy || 0) + GRAV * slow;
  e.x += e.vx * slow;
  for (const s of room.solids) if (rects(e, s)) {
    if (e.vx > 0) e.x = s.x - e.w;
    if (e.vx < 0) e.x = s.x + s.w;
    e.vx *= -0.35;
    if (e.move === "shieldRush") e.moveTimer = 0;
  }
  if (e.arena) e.x = clamp(e.x, e.arena.left, e.arena.right);
  e.y += e.vy * slow;
  for (const s of room.solids) if (rects(e, s)) {
    if (e.vy > 0) e.y = s.y - e.h;
    if (e.vy < 0) e.y = s.y + s.h;
    e.vy = 0;
  }
  if (e.move !== "stagger" && grounded && phaseLevel === 2 && frame % 120 === 0 && (e.shieldArmor || 0) <= 0) {
    e.shieldArmor = Math.min(e.shieldMax || 18, 8);
  }
}

function updateMoonDuelist(e, room, slow, phaseLevel) {
  e.moveTimer = Math.max(0, (e.moveTimer || 0) - slow);
  e.hookCooldown = Math.max(0, (e.hookCooldown ?? 80) - slow);
  e.dir = player.x < e.x ? -1 : 1;
  const grounded = room.solids.some(s => rects({ ...e, y: e.y + 1 }, s));
  if (!e.move || e.moveTimer <= 0) {
    const dx = Math.abs(player.x - e.x);
    if (e.hookCooldown <= 0 && dx > 64 && dx < 235) {
      e.move = "moonHook";
      e.moveTimer = phaseLevel === 2 ? 44 : 50;
      e.hookCooldown = phaseLevel === 2 ? 86 : 112;
      e.hookFired = false;
      e.vx = 0;
    } else if (dx < 86) {
      e.move = phaseLevel >= 1 ? "tripleSlash" : "quickSlash";
      e.moveTimer = phaseLevel >= 1 ? 42 : 30;
      e.vx = e.dir * (1.5 + phaseLevel * 0.25);
    } else if (grounded && dx < 150 && phaseLevel === 2 && frame % 2 === 0) {
      e.move = "crescentStep";
      e.moveTimer = 32;
      e.vx = e.dir * 3.2;
      e.vy = -3.2;
    } else {
      e.move = "stalk";
      e.moveTimer = 28;
    }
  }
  if (e.move === "stalk") {
    e.vx += e.dir * (0.075 + phaseLevel * 0.016) * slow;
  } else if (e.move === "quickSlash" || e.move === "tripleSlash") {
    e.vx += e.dir * (0.08 + phaseLevel * 0.02) * slow;
    const slashFrames = e.move === "tripleSlash" ? [30, 20, 10] : [16];
    if (slashFrames.includes(Math.round(e.moveTimer))) {
      const hit = { x: e.dir > 0 ? e.x + e.w - 2 : e.x - 24, y: e.y + 2, w: 26, h: 24 };
      addParticles(e.x + (e.dir > 0 ? e.w : 0), e.y + 12, "#9fd0d0", 14);
      spawnBellTone(e.x + e.w / 2, e.y + 15, e.dir * (2.2 + phaseLevel * 0.2), 0.05, phaseLevel);
      if (rects(player, hit)) damagePlayer(1 + (phaseLevel === 2 ? 1 : 0), e.x + e.w / 2);
    }
  } else if (e.move === "moonHook") {
    e.vx *= 0.52;
    const age = (phaseLevel === 2 ? 44 : 50) - e.moveTimer;
    e.hookLine = age > 10 && age < 30 ? { x: player.x + player.w / 2, y: player.y + player.h / 2 } : null;
    if (!e.hookFired && e.moveTimer <= 28) {
      e.hookFired = true;
      playSfx("grapple");
      addParticles(e.x + e.w / 2, e.y + 10, "#9fd0d0", 18);
      const guarded = has("shield") && player.shield > 0 && Math.sign((e.x + e.w / 2) - player.x) === player.dir;
      if (guarded) {
        damagePlayer(1, e.x + e.w / 2);
        player.vx = player.x < e.x ? -1.9 : 1.9;
      } else {
        player.vx = player.x < e.x ? 4.0 : -4.0;
        player.vy = -1.1;
        damagePlayer(1, e.x + e.w / 2);
        say("Moon-iron drags you in.");
      }
    }
  } else if (e.move === "crescentStep") {
    e.hookLine = null;
    e.vx += e.dir * 0.04 * slow;
    if (frame % 5 === 0) addParticles(e.x + e.w / 2, e.y + e.h, "#9fd0d0", 3);
  } else {
    e.hookLine = null;
  }
  e.vx = clamp(e.vx, -4.0 - phaseLevel * 0.3, 4.0 + phaseLevel * 0.3);
  e.vy = (e.vy || 0) + GRAV * slow;
  e.x += e.vx * slow;
  for (const s of room.solids) if (rects(e, s)) {
    if (e.vx > 0) e.x = s.x - e.w;
    if (e.vx < 0) e.x = s.x + s.w;
    e.vx *= -0.32;
  }
  if (e.arena) e.x = clamp(e.x, e.arena.left, e.arena.right);
  e.y += e.vy * slow;
  for (const s of room.solids) if (rects(e, s)) {
    if (e.vy > 0) e.y = s.y - e.h;
    if (e.vy < 0) e.y = s.y + s.h;
    e.vy = 0;
  }
}

function sundialPulseParryOrHit(e, freeze, pulse, radius) {
  const px = player.x + player.w / 2;
  const py = player.y + player.h / 2;
  const sx = e.x + e.w / 2;
  const sy = e.y + 19;
  if (pulse < 8 || Math.hypot(px - sx, py - sy) > radius) return false;
  const guarded = has("shield") && player.shield > 0;
  const parried = guarded && (player.parryTimer || 0) > 0;
  if (parried) {
    triggerParryEffect(freeze ? 2 : 1);
    e.vx = player.x < e.x ? 1.6 : -1.6;
    e.move = "stagger";
    e.moveTimer = freeze ? 34 : 24;
    e.clockCooldown = freeze ? 95 : 70;
    e.snareHit = false;
    e.freezeFired = false;
    addParticles(e.x + e.w / 2, e.y + 16, "#fff1bd", freeze ? 34 : 24);
    say(freeze ? "The stopped second shatters on the Aegis." : "The snare pulse breaks on your guard.");
    return true;
  }
  playSfx(freeze ? "boss" : "shield");
  shake = Math.max(shake, freeze ? 5 : 3);
  addParticles(player.x + player.w / 2, player.y + 8, "#a596ff", freeze ? 36 : 20);
  if (freeze) {
    player.timeFrozen = Math.max(player.timeFrozen || 0, 130);
    player.timeSlow = 0;
    player.timeActive = 0;
    say("Dash against the stopped second.");
  } else {
    player.timeSlow = Math.max(player.timeSlow || 0, 110);
    say("Sundial dust clots your steps.");
  }
  player.timeBreak = 0;
  return true;
}

function updateSundialGuard(e, room, slow, phaseLevel) {
  e.moveTimer = Math.max(0, (e.moveTimer || 0) - slow);
  e.clockCooldown = Math.max(0, (e.clockCooldown ?? 70) - slow);
  e.dir = player.x < e.x ? -1 : 1;
  if (!e.rewound && e.hp <= e.max * 0.08 && e.move !== "timeRewind") {
    e.rewound = true;
    e.rewindHealed = false;
    e.move = "timeRewind";
    e.moveTimer = 150;
    e.clockCooldown = 130;
    e.snareHit = false;
    e.freezeFired = false;
    e.vx = 0;
    e.vy = 0;
    player.timeSlow = 0;
    player.timeActive = 0;
    player.timeFrozen = 0;
    player.timeBreak = 0;
    playBossSfx(e.type);
    shake = Math.max(shake, 8);
    addParticles(e.x + e.w / 2, e.y + 18, "#a596ff", 42);
    say("The Sundial Guard begins rewinding its ruined hour.");
  }
  if (e.move === "timeRewind") {
    e.vx = 0;
    e.vy = 0;
    const age = 150 - (e.moveTimer || 0);
    if (frame % 5 === 0) addParticles(e.x + e.w / 2, e.y + 16, age < 78 ? "#a596ff" : "#fff1bd", age < 78 ? 8 : 13);
    const rewindBeat = Math.round(age);
    if (rewindBeat === 54 || rewindBeat === 92) {
      playSfx("shield");
      shake = Math.max(shake, 5);
    }
    if (!e.rewindHealed && e.moveTimer <= 42) {
      e.rewindHealed = true;
      e.hp = e.max;
      e.clockCooldown = 46;
      playSfx("pickup");
      shake = Math.max(shake, 9);
      addParticles(e.x + e.w / 2, e.y + 17, "#fff1bd", 70);
      say("The dial snaps backward. The guard stands whole.");
    }
    if (e.moveTimer <= 0) {
      e.move = "stalk";
      e.moveTimer = 24;
      e.rewindHealed = false;
    }
    return;
  }
  const clockPhase = e.rewound ? 2 : phaseLevel;
  const grounded = room.solids.some(s => rects({ ...e, y: e.y + 1 }, s));
  if (!e.move || e.moveTimer <= 0) {
    const dx = Math.abs(player.x - e.x);
    if (clockPhase === 2 && e.clockCooldown <= 0 && dx < 230) {
      e.move = "hourFreeze";
      e.moveTimer = 58;
      e.clockCooldown = 150;
      e.vx = 0;
      say("The furnace second stops.");
    } else if (e.clockCooldown <= 0 && dx < 210) {
      e.move = "timeSnare";
      e.moveTimer = 48;
      e.clockCooldown = clockPhase >= 1 ? 94 : 118;
      e.vx = 0;
    } else if (dx < 74) {
      e.move = "hammerSwing";
      e.moveTimer = clockPhase >= 1 ? 42 : 34;
      e.vx = e.dir * 0.9;
    } else if (grounded && clockPhase >= 1 && dx < 140 && frame % 2 === 0) {
      e.move = "gearLunge";
      e.moveTimer = 30;
      e.vx = e.dir * (2.9 + clockPhase * 0.35);
    } else {
      e.move = "stalk";
      e.moveTimer = 34;
    }
  }
  if (e.move === "stalk") {
    e.vx += e.dir * (0.04 + clockPhase * 0.012) * slow;
  } else if (e.move === "hammerSwing") {
    e.vx += e.dir * 0.045 * slow;
    const swingFrames = clockPhase === 2 ? [26, 14] : [18];
    if (swingFrames.includes(Math.round(e.moveTimer))) {
      const hit = { x: e.dir > 0 ? e.x + e.w - 3 : e.x - 28, y: e.y + 8, w: 31, h: 28 };
      addParticles(e.x + (e.dir > 0 ? e.w : 0), e.y + 18, "#f0a642", 18);
      spawnBellTone(e.x + e.w / 2, e.y + 18, e.dir * 2.0, 0.12, clockPhase);
      if (rects(player, hit)) damagePlayer(1 + (clockPhase === 2 ? 1 : 0), e.x + e.w / 2);
    }
  } else if (e.move === "timeSnare") {
    e.vx *= 0.5;
    const age = 48 - e.moveTimer;
    const radius = 24 + age * 1.45;
    if (!e.snareHit && sundialPulseParryOrHit(e, false, age, radius)) {
      e.snareHit = true;
    }
    if (e.moveTimer <= 2) e.snareHit = false;
  } else if (e.move === "hourFreeze") {
    e.vx *= 0.45;
    const age = 58 - e.moveTimer;
    const radius = 24 + age * 2.1;
    if (!e.freezeFired && age >= 10 && sundialPulseParryOrHit(e, true, age, radius)) {
      e.freezeFired = true;
    }
    if (e.moveTimer <= 2) e.freezeFired = false;
  } else if (e.move === "gearLunge") {
    e.vx += e.dir * 0.055 * slow;
    if (frame % 4 === 0) addParticles(e.x + e.w / 2, e.y + e.h, "#a596ff", 4);
  }
  e.vx = clamp(e.vx, -3.4 - clockPhase * 0.4, 3.4 + clockPhase * 0.4);
  e.vy = (e.vy || 0) + GRAV * slow;
  e.x += e.vx * slow;
  for (const s of room.solids) if (rects(e, s)) {
    if (e.vx > 0) e.x = s.x - e.w;
    if (e.vx < 0) e.x = s.x + s.w;
    e.vx *= -0.25;
  }
  if (e.arena) e.x = clamp(e.x, e.arena.left, e.arena.right);
  e.y += e.vy * slow;
  for (const s of room.solids) if (rects(e, s)) {
    if (e.vy > 0) e.y = s.y - e.h;
    if (e.vy < 0) e.y = s.y + s.h;
    e.vy = 0;
  }
}

function ironKingPulseParryOrHit(e, freeze, pulse, radius) {
  const px = player.x + player.w / 2;
  const py = player.y + player.h / 2;
  const sx = e.x + e.w / 2;
  const sy = e.y + 24;
  if (pulse < 8 || Math.hypot(px - sx, py - sy) > radius) return false;
  const guarded = has("shield") && player.shield > 0;
  const parried = guarded && (player.parryTimer || 0) > 0;
  if (parried) {
    triggerParryEffect(freeze ? 2 : 1);
    if (timeHeld()) {
      player.timeActive = Math.min(TIME_ACTIVE_MAX + 180, (player.timeActive || 0) + 150);
      addParticles(player.x + player.w / 2, player.y + 8, "#a596ff", 30);
      say("The parry folds the King's ring into your stolen second.");
    }
    e.move = "royalStagger";
    e.moveTimer = freeze ? 34 : 24;
    e.vx = player.x < e.x ? 1.8 : -1.8;
    addParticles(e.x + e.w / 2, e.y + 24, freeze ? "#c6423c" : "#f3cc67", freeze ? 46 : 34);
    playBossSfx("ironKing");
    return true;
  }
  playSfx(freeze ? "boss" : "shield");
  shake = Math.max(shake, freeze ? 7 : 4);
  addParticles(player.x + player.w / 2, player.y + 8, freeze ? "#4e3f7e" : "#f3cc67", freeze ? 42 : 28);
  if (freeze) {
    player.timeFrozen = Math.max(player.timeFrozen || 0, 118);
    player.timeSlow = 0;
    cancelPlayerTime("The King's ring shatters your stolen second.");
    player.timeBreak = 0;
    say("The king steals the second. Dash or strike it apart.");
  } else {
    cancelPlayerTime("The King's ring breaks the Sundial Hex.");
    damagePlayer(2, e.x + e.w / 2);
  }
  return true;
}

function updateIronKing(e, room, slow, phaseLevel) {
  e.moveTimer = Math.max(0, (e.moveTimer || 0) - slow);
  e.airDashCooldown = Math.max(0, (e.airDashCooldown || 0) - slow);
  e.dir = player.x < e.x ? -1 : 1;
  const grounded = room.solids.some(s => rects({ ...e, y: e.y + 1 }, s));
  const dx = Math.abs((player.x + player.w / 2) - (e.x + e.w / 2));
  const finalPhase = e.hp <= e.max * 0.22 ? 3 : phaseLevel;
  if (e.move === "royalHook") {
    e.move = "royalStalk";
    e.moveTimer = 0;
    e.hookLine = null;
    e.hookFired = false;
  }
  if (!e.rewound && e.hp <= e.max * 0.18 && e.move !== "crownRewind") {
    e.rewound = true;
    e.move = "crownRewind";
    e.moveTimer = 132;
    e.vx = 0;
    e.vy = 0;
    player.timeSlow = 0;
    player.timeActive = 0;
    player.timeFrozen = 0;
    playBossSfx("ironKing");
    say("The Iron King turns the crown backward.");
  }
  if (e.move === "crownRewind") {
    e.vx = 0;
    e.vy = 0;
    const age = 132 - (e.moveTimer || 0);
    if (frame % 4 === 0) addParticles(e.x + e.w / 2, e.y + 24, age < 78 ? "#4e3f7e" : "#f3cc67", age < 78 ? 10 : 16);
    if (Math.round(age) === 64 || Math.round(age) === 96) {
      shake = Math.max(shake, 8);
      playSfx("shield");
    }
    if (!e.rewindHealed && e.moveTimer <= 36) {
      e.rewindHealed = true;
      e.hp = Math.max(e.hp, Math.floor(e.max * 0.58));
      addParticles(e.x + e.w / 2, e.y + 25, "#f3cc67", 90);
      shake = Math.max(shake, 10);
      say("The crown repairs half his ruined reign.");
    }
    if (e.moveTimer <= 0) {
      e.move = "royalStalk";
      e.moveTimer = 20;
    }
    return;
  }
  if (e.move === "royalStagger") {
    e.vx *= 0.76;
    if (e.moveTimer <= 0) e.move = "royalStalk";
  } else if (!e.move || e.moveTimer <= 0) {
    if (finalPhase >= 2 && dx > 98 && frame % 5 === 0) {
      e.move = "ironFireVolley";
      e.moveTimer = finalPhase >= 3 ? 68 : 58;
      e.volleyBeat = 0;
      e.vx = 0;
      say("The crown spits a storm too fast for mortal seconds.");
    } else if (player.y + player.h < e.y + 10 && dx < 76) {
      e.move = "crownUpper";
      e.moveTimer = 36;
      e.vx = e.dir * 1.35;
      e.vy = grounded ? -5.9 : e.vy;
    } else if (finalPhase >= 1 && frame % 4 === 0) {
      e.move = "crownPulse";
      e.moveTimer = finalPhase >= 3 ? 62 : 54;
      e.snareHit = false;
      e.freezeFired = false;
      e.vx = 0;
    } else if (finalPhase >= 1 && dx > 82 && dx < 220 && grounded && frame % 2 === 0) {
      e.move = "throneDash";
      e.moveTimer = 38;
      e.vx = e.dir * (4.0 + finalPhase * 0.35);
    } else if (dx < 92) {
      e.move = finalPhase >= 2 ? "kingCombo" : "kingSlash";
      e.moveTimer = finalPhase >= 2 ? 52 : 34;
      e.vx = e.dir * (1.8 + finalPhase * 0.25);
    } else {
      e.move = "royalStalk";
      e.moveTimer = 30;
    }
  }
  if (e.move === "royalStalk") {
    e.vx += e.dir * (0.07 + finalPhase * 0.018) * slow;
    if (finalPhase >= 2 && frame % 82 === 0) {
      spawnIronBolt(e.x + e.w / 2, e.y + 18, e.dir * 2.9, -0.15, phaseLevel);
      if (finalPhase >= 3) spawnIronBolt(e.x + e.w / 2, e.y + 34, e.dir * 2.6, 0.35, phaseLevel);
    }
  } else if (e.move === "kingSlash" || e.move === "kingCombo") {
    e.vx += e.dir * (0.085 + finalPhase * 0.018) * slow;
    const frames = e.move === "kingCombo" ? [40, 28, 16] : [18];
    if (frames.includes(Math.round(e.moveTimer))) {
      const high = Math.round(e.moveTimer) === frames[0] && finalPhase >= 2;
      const hit = { x: e.dir > 0 ? e.x + e.w - 4 : e.x - 36, y: e.y + (high ? -10 : 13), w: 42, h: high ? 38 : 28 };
      addParticles(e.x + (e.dir > 0 ? e.w : 0), e.y + (high ? 8 : 25), high ? "#c6423c" : "#f3cc67", 28);
      spawnIronBolt(e.x + e.w / 2, e.y + 24, e.dir * (2.4 + finalPhase * 0.25), high ? -0.65 : 0.05, phaseLevel);
      if (rects(player, hit)) {
        damagePlayer(finalPhase >= 3 ? 3 : 2, e.x + e.w / 2);
        player.vx = e.dir * 3.0;
        player.vy = high ? -3.2 : -1.8;
      }
    }
  } else if (e.move === "crownUpper") {
    e.vx += e.dir * 0.025 * slow;
    if (Math.round(e.moveTimer) === 20 || Math.round(e.moveTimer) === 12) {
      const hit = { x: e.x - 22, y: e.y - 48, w: e.w + 44, h: 62 };
      addParticles(e.x + e.w / 2, e.y - 12, "#cfd8dc", 36);
      if (rects(player, hit)) {
        damagePlayer(finalPhase >= 2 ? 2 : 1, e.x + e.w / 2);
        player.vy = -4.0;
      }
    }
  } else if (e.move === "throneDash") {
    e.vx = e.dir * (4.7 + finalPhase * 0.45);
    if (frame % 3 === 0) addParticles(e.x + (e.dir > 0 ? 4 : e.w - 4), e.y + e.h - 5, "#f3cc67", 4);
    if (Math.round(e.moveTimer) === 18) {
      spawnIronRootSpike(player.x + player.w / 2, phaseLevel);
      if (finalPhase >= 2) {
        spawnIronRootSpike(player.x + player.w / 2 - 44, phaseLevel);
        spawnIronRootSpike(player.x + player.w / 2 + 44, phaseLevel);
      }
    }
  } else if (e.move === "airEscapeDash") {
    const dashDir = e.airDashDir || (player.x < e.x ? 1 : -1);
    e.dir = -dashDir;
    e.vx = dashDir * (5.4 + finalPhase * 0.28);
    e.vy *= 0.42;
    if (frame % 2 === 0) addParticles(e.x + (dashDir > 0 ? 2 : e.w - 2), e.y + 18, finalPhase >= 3 ? "#fff1bd" : "#c6423c", 8);
    if (Math.round(e.moveTimer) === 14) {
      spawnIronBolt(e.x + e.w / 2, e.y + 20, -dashDir * (2.3 + finalPhase * 0.2), -0.25, phaseLevel);
      playSfx("dash");
    }
  } else if (e.move === "crownPulse") {
    e.vx *= 0.5;
    const age = (finalPhase >= 3 ? 62 : 54) - e.moveTimer;
    const radius = 18 + age * (finalPhase >= 3 ? 3.1 : 2.45);
    e.radialWave = radius;
    if (!e.snareHit && ironKingPulseParryOrHit(e, false, age, radius)) e.snareHit = true;
    if (finalPhase >= 3 && !e.freezeFired && age >= 28 && ironKingPulseParryOrHit(e, true, age - 20, radius - 26)) e.freezeFired = true;
    if (Math.round(e.moveTimer) === 24 || Math.round(e.moveTimer) === 8) {
      spawnCinderBall(e.x + e.w / 2, e.y + 18, -2.2, -0.45, phaseLevel, true, "#f3cc67");
      spawnCinderBall(e.x + e.w / 2, e.y + 18, 2.2, -0.45, phaseLevel, true, "#f3cc67");
    }
  } else if (e.move === "ironFireVolley") {
    e.vx *= 0.48;
    if (frame % 2 === 0) addParticles(e.x + e.w / 2, e.y + 18, "#f3cc67", 7);
    const beat = Math.round(e.moveTimer);
    if (beat % 5 === 0 && e.volleyBeat !== beat) {
      e.volleyBeat = beat;
      const sx = e.x + e.w / 2;
      const sy = e.y + 13 + ((beat / 5) % 4) * 7;
      const speed = 6.8 + finalPhase * 0.65;
      const spread = ((beat / 5) % 3 - 1) * 0.34;
      spawnIronFireball(sx, sy, e.dir * speed, spread, phaseLevel);
      if (finalPhase >= 3) spawnIronFireball(sx, sy + 10, e.dir * (speed - 0.7), spread - 0.18, phaseLevel);
      playSfx("attack");
    }
  }
  e.vx = clamp(e.vx, -5.3 - finalPhase * 0.25, 5.3 + finalPhase * 0.25);
  e.vy = (e.vy || 0) + GRAV * slow;
  e.x += e.vx * slow;
  for (const s of room.solids) if (rects(e, s)) {
    if (e.vx > 0) e.x = s.x - e.w;
    if (e.vx < 0) e.x = s.x + s.w;
    e.vx *= -0.25;
    if (e.move === "throneDash" || e.move === "airEscapeDash") e.moveTimer = Math.min(e.moveTimer, 10);
  }
  if (e.arena) e.x = clamp(e.x, e.arena.left, e.arena.right);
  e.y += e.vy * slow;
  for (const s of room.solids) if (rects(e, s)) {
    if (e.vy > 0) e.y = s.y - e.h;
    if (e.vy < 0) e.y = s.y + s.h;
    e.vy = 0;
  }
  e.radialWave = e.move === "crownPulse" ? e.radialWave : 0;
}

function updateEnemies(room) {
  const slow = timeHeld() ? 0.38 : 1;
  const sword = bossCeremony || player.counter ? null : attackBox();
  const bash = bossCeremony ? null : bashBox();
  for (const e of room.enemies) {
    if (e.dying) {
      updateGuardianDeath(e);
      continue;
    }
    if (bossCeremony) continue;
    if (e.hp <= 0) continue;
    e.hurt = Math.max(0, e.hurt - 1);
    e.bashHit = Math.max(0, (e.bashHit || 0) - 1);
    e.phase = (e.phase || 0) + (e.boss || e.trialBoss ? 0.035 : 0.018) * slow;
    const phaseLevel = (e.boss || e.trialBoss) ? (e.hp <= e.max * 0.35 ? 2 : e.hp <= e.max * 0.68 ? 1 : 0) : 0;
    if (e.bossType === "ironKing") {
      updateIronKing(e, room, slow, phaseLevel);
    } else if (e.trialBoss && e.type === "hound") {
      updateGateHound(e, room, slow, phaseLevel);
    } else if (e.trialBoss && e.type === "gargoyle") {
      updateBellGargoyle(e, room, slow, phaseLevel);
    } else if (e.trialBoss && e.type === "boneGuard") {
      updateAegisCaptain(e, room, slow, phaseLevel);
    } else if (e.trialBoss && e.type === "thornImp") {
      updateRootImp(e, room, slow, phaseLevel);
    } else if (e.trialBoss && e.type === "ossuaryBird") {
      updateOssuaryWyvern(e, room, slow, phaseLevel);
    } else if (e.trialBoss && e.type === "penitent") {
      updateCinderPenitent(e, room, slow, phaseLevel);
    } else if (e.trialBoss && e.type === "moonKnight") {
      updateMoonDuelist(e, room, slow, phaseLevel);
    } else if (e.trialBoss && e.type === "anvilGuard") {
      updateSundialGuard(e, room, slow, phaseLevel);
    } else {
      const speed = e.boss ? 0.92 + phaseLevel * 0.28 : e.trialBoss ? 0.72 + phaseLevel * 0.24 : 0.5;
      if (Math.abs(player.x - e.x) < (e.trialBoss ? W : 150)) e.vx += Math.sign(player.x - e.x) * (e.flying ? 0.012 + phaseLevel * 0.006 : 0.018 + phaseLevel * 0.008) * slow;
      e.vx = clamp(e.vx, -speed, speed);
      if (e.flying) {
        const dive = e.trialBoss && phaseLevel > 0 && frame % (phaseLevel === 2 ? 92 : 126) < 34;
        e.vy = Math.sin(frame / (22 - phaseLevel * 4) + e.x * 0.04) * (0.45 + phaseLevel * 0.12);
        if (["bellBat", "ossuaryBird", "voidEye"].includes(e.type)) e.vy += Math.sign(player.y - e.y) * (dive ? 0.08 : 0.024 + phaseLevel * 0.014);
        if (e.type === "gargoyle" && Math.abs(player.x - e.x) < 70) e.vy += 0.3;
      } else {
        e.vy = (e.vy || 0) + GRAV * slow;
        if ((e.boss || e.trialBoss || ["hound", "thornImp", "cinderImp"].includes(e.type)) && Math.abs(player.x - e.x) < 116 && e.vy === 0 && frame % Math.max(34, 70 - phaseLevel * 18) === 0) e.vy = -4.2 - phaseLevel * 0.6;
      }
      e.x += e.vx * slow;
      if (e.flying && e.arena) {
        if (e.x < e.arena.left || e.x > e.arena.right) e.vx *= -0.75;
        e.x = clamp(e.x, e.arena.left, e.arena.right);
      } else {
        for (const s of room.solids) if (rects(e, s)) {
          if (e.vx > 0) e.x = s.x - e.w;
          if (e.vx < 0) e.x = s.x + s.w;
          e.vx *= -1;
        }
        if (e.trialBoss && e.arena) {
          if (e.x < e.arena.left || e.x > e.arena.right) e.vx *= -0.75;
          e.x = clamp(e.x, e.arena.left, e.arena.right);
        }
      }
      e.y += e.vy * slow;
      if (e.flying) {
        const top = e.arena?.top ?? 24;
        const bottom = e.arena?.bottom ?? 178;
        if (e.y < top || e.y > bottom) e.vy *= -0.65;
        e.y = clamp(e.y, top, bottom);
      } else {
        for (const s of room.solids) if (rects(e, s)) {
          if (e.vy > 0) e.y = s.y - e.h;
          if (e.vy < 0) e.y = s.y + s.h;
          e.vy = 0;
        }
      }
    }
    if (["wraith", "starWraith"].includes(e.type)) e.x += Math.sin(frame / 18 + e.x) * 0.2;
    if (sword && hitboxIntersects(sword, e) && e.hurt <= 0) {
      const pogo = player.attackType === "down";
      const boosted = !!sword.boost || !!sword.arc?.boost;
      const amount = boosted ? (pogo ? 7 : player.attackType === "up" ? 7 : 6) : pogo ? has("shield") ? 3 : 2 : player.attackType === "up" ? 2 : has("shield") ? 2 : 1;
      const damagedHealth = damageEnemy(e, amount, player.x + player.w / 2, boosted ? 6 : pogo ? 3 : player.attackType === "up" ? 2 : 1);
      player.mp = Math.min(player.maxMp, player.mp + (boosted ? 0.65 : pogo ? 0.4 : 0.32));
      e.hurt = 12;
      e.vx = player.attackType === "up" || pogo ? e.vx : player.dir * 2.2;
      if (player.attackType === "up") {
        e.vy = -3.2;
        if (e.bossType === "ironKing" && phaseLevel >= 2 && (e.airDashCooldown || 0) <= 0) {
          const escapeDir = (player.x + player.w / 2) < (e.x + e.w / 2) ? 1 : -1;
          e.move = "airEscapeDash";
          e.moveTimer = 24;
          e.airDashDir = escapeDir;
          e.airDashCooldown = 92;
          e.vx = escapeDir * 5.8;
          e.vy = -0.75;
          e.hurt = Math.min(e.hurt, 6);
          shake = Math.max(shake, 4);
          playSfx("dash");
          addParticles(e.x + e.w / 2, e.y + 12, "#c6423c", 32);
        }
        if (e.trialBoss && e.type === "thornImp") {
          const playerUnder = player.y + player.h > e.y + e.h * 0.55 && Math.abs((player.x + player.w / 2) - (e.x + e.w / 2)) < 44;
          e.upperHeat = (e.upperHeat || 0) + (playerUnder ? 1.15 : 0.65);
          if ((e.upperHeat || 0) >= 2.2 && (e.slamCooldown || 0) <= 0) {
            e.move = "rootSlam";
            e.moveTimer = 40;
            e.slamCooldown = phaseLevel === 2 ? 74 : 92;
            e.vx = Math.sign((player.x + player.w / 2) - (e.x + e.w / 2)) * (0.7 + phaseLevel * 0.25);
            e.vy = 2.8 + phaseLevel * 0.45;
            e.upperHeat = 0;
          }
        }
      }
      if (pogo) {
        if (e.trialBoss && e.type === "hound") {
          e.pogoHeat = (e.pogoHeat || 0) + 1;
          if ((e.pogoHeat || 0) >= 2.2 && (e.antiAirCooldown || 0) <= 0) {
            e.move = "antiAirLeap";
            e.moveTimer = 46;
            e.antiAirCooldown = phaseLevel === 2 ? 78 : 96;
            e.vx = Math.sign((player.x + player.w / 2) - (e.x + e.w / 2)) * (1.25 + phaseLevel * 0.35);
            e.vy = -7.2 - phaseLevel * 0.45;
          }
        } else if (e.trialBoss && e.type === "penitent") {
          e.pogoHeat = (e.pogoHeat || 0) + 1;
          if ((e.pogoHeat || 0) >= 2.3 && (e.pogoWardCooldown || 0) <= 0) {
            e.move = "cinderHalo";
            e.moveTimer = phaseLevel === 2 ? 40 : 34;
            e.pogoWardCooldown = phaseLevel === 2 ? 74 : 92;
            e.vx = 0;
          }
        } else if (e.trialBoss && e.type === "boneGuard") {
          e.pogoHeat = (e.pogoHeat || 0) + 1;
          if ((e.pogoHeat || 0) >= 2.2 && (e.antiAirCooldown || 0) <= 0) {
            e.move = "aegisUppercut";
            e.moveTimer = phaseLevel === 2 ? 34 : 30;
            e.antiAirCooldown = phaseLevel === 2 ? 70 : 88;
            e.dir = player.x < e.x ? -1 : 1;
            e.vx = e.dir * (1.15 + phaseLevel * 0.3);
            e.vy = -6.2 - phaseLevel * 0.55;
          }
        }
        e.vy = Math.min(e.vy || 0, -1.4);
        pogoBounce(e.x + e.w / 2, has("shield") ? "#bfe9ff" : "#fff1bd");
      }
      if (damagedHealth) playSfx("enemy");
      addParticles(e.x + e.w / 2, pogo ? e.y + e.h : e.y + 6, boosted ? "#fff1bd" : pogo || player.attackType === "up" ? "#fff1bd" : "#f3cc67", boosted ? 24 : 13);
    }
    if (bash && rects(bash, e) && !e.bashHit) {
      const superHit = !!bash.super;
      const shieldBoom = superHit && bash.superShield;
      damageEnemy(e, shieldBoom ? 16 : superHit ? 5 : 3, player.x + player.w / 2, shieldBoom ? 12 : superHit ? 6 : 5);
      e.hurt = shieldBoom ? 28 : 18;
      e.bashHit = shieldBoom ? 28 : superHit ? 12 : 18;
      e.vx = player.dir * (shieldBoom ? 7.2 : superHit ? 5.2 : 4.3);
      e.vy = shieldBoom ? -2.6 : -1.2;
      shake = Math.max(shake, shieldBoom ? 9 : superHit ? 5 : 4);
      playSfx(shieldBoom ? "superDash" : "bash");
      addParticles(e.x + e.w / 2, e.y + 8, shieldBoom ? "#fff1bd" : "#bfe9ff", shieldBoom ? 46 : 22);
      if (shieldBoom) {
        player.superDash = 0;
        player.superShield = false;
        player.vx = -player.dir * 4.0;
        player.vy = -2.0;
        player.bash = 0;
      }
    }
    for (const p of projectiles) if (p.fire && rects(p, e)) {
      damageEnemy(e, p.damage || 3, p.x, p.boosted ? 5 : 2);
      if (!(e.trialBoss && e.hp <= 0)) p.life = 0;
      e.hurt = 16;
      playSfx("enemy");
      addParticles(e.x + e.w / 2, e.y + 7, p.boosted ? "#fff1bd" : "#ff7a3d", p.boosted ? 34 : 16);
    }
    if (e.hp <= 0) {
      if (beginGuardianDeath(e)) continue;
      addParticles(e.x + e.w / 2, e.y + e.h / 2, e.boss ? "#f3cc67" : "#9fd0d0", e.boss ? 42 : 20);
      playSfx(e.boss ? "boss" : "enemy");
      player.mp = Math.min(player.maxMp, player.mp + 2);
      if (e.boss && !player.finalBossDefeated) {
        grantBossUpgrade(e);
        player.finalBossDefeated = true;
        player.hp = player.maxHp;
        player.mp = player.maxMp;
        say("The Iron King falls. Iron Vesper is free of its midnight oath.");
        showStoryCard("Castle Liberated", "THE IRON KING IS DEFEATED", "throne");
        saveGame();
      } else if (e.trialBoss) {
        say(`${e.name || "The guardian"} falls. The reliquary door opens.`);
        saveGame();
      }
    } else if (rects(player, e)) {
      if (player.bash > 0 || player.superDash > 0) {
        e.vx = player.dir * 4.0;
        e.vy = Math.min(e.vy || 0, -0.8);
        addParticles(e.x + e.w / 2, e.y + 8, "#bfe9ff", 8);
        continue;
      }
      const contactDamage = e.boss || (e.trialBoss && ["hound", "gargoyle", "thornImp", "boneGuard", "ossuaryBird", "penitent", "moonKnight", "anvilGuard"].includes(e.type) && phaseLevel >= 1) ? 2 : 1;
      const contactRoom = player.room;
      damagePlayer(contactDamage, e.x);
      if (player.room === contactRoom && player.hp > 0 && e.trialBoss && e.type === "hound") resolveBrakkaContact(e, phaseLevel);
    }
  }
}

function updateItems(room) {
  for (const it of room.items) {
    if (it.wyvernCorpse && it.falling) {
      it.vy = (it.vy || 0) + 0.38;
      it.y += it.vy;
      if (it.y >= FLOOR_Y - 40) {
        it.y = FLOOR_Y - 40;
        it.vy = 0;
        it.falling = false;
        shake = Math.max(shake, 6);
        playSfx("secret");
        addParticles(it.x + it.w / 2, it.y + 30, "#f1d7a4", 34);
      }
    }
    if (it.taken || it.falling || !rects(player, it)) continue;
    if (it.trial && room.enemies.some(enemy => enemy.trialBoss && enemy.hp > 0)) {
      if (tap("f")) say(`Defeat the guardian of the ${it.title}.`);
      continue;
    }
    if (!tap("f")) {
      if (frame % 45 === 0) say("Press F to interact.");
      continue;
    }
    if (it.wyvernCorpse && it.ability === "doubleJump") {
      it.pulls = (it.pulls || 0) + 1;
      shake = Math.max(shake, 3 + it.pulls);
      playSfx(it.pulls >= (it.pullsNeeded || 5) ? "pickup" : "enemy");
      addParticles(it.x + 36, it.y + 12, it.pulls >= (it.pullsNeeded || 5) ? "#fff1bd" : "#f1d7a4", 18 + it.pulls * 3);
      if (it.pulls < (it.pullsNeeded || 5)) {
        say(it.pulls < 3 ? "The dead wyvern's wings resist. Keep pulling." : "Bone tendons crack. Tear them free.");
        continue;
      }
    }
    it.taken = true;
    if (it.type === "ability") {
      if (has(it.ability)) continue;
      player.abilities[it.ability] = true;
      const info = abilityInfo[it.ability];
      const artifact = abilityArtifacts[it.ability];
      playSfx("pickup");
      say(it.startingSword ? "The Village Sword is back in your hands." : it.cinderTorch ? `${artifact.article} claimed. The torch gutters out.` : it.wyvernCorpse ? `${artifact.article} torn free. ${artifact.story}` : `${artifact.article} claimed. ${artifact.story}`);
      showStoryCard(info[0], artifact.story, currentRoom().theme);
      addParticles(it.x + 8, it.y + 8, artifact.colors[0], 42);
    } else {
      player.hp = Math.min(player.maxHp, player.hp + 2);
      playSfx("pickup");
      say("A hidden draught restores your wounds.");
      addParticles(it.x + 5, it.y + 5, "#e8dcb0", 24);
    }
    saveGame();
  }
}

function restart(msg = "Back to Hearthmere.") {
  bossCeremony = null;
  bossIntro = null;
  if (dialogue) endDialogue();
  const respawn = world.has(respawnPoint.room) ? respawnPoint : { room: START_ROOM_ID, x: 42, y: 146 };
  Object.assign(player, { x: respawn.x, y: respawn.y, vx: 0, vy: 0, hp: player.maxHp, mp: player.maxMp, room: respawn.room, grounded: false, coyote: 0, jumps: 0, airDashUsed: false, jumpCutReady: false, jumpHold: 0, hurt: 0, attack: 0, attackType: "slash", attackBoost: false, basicAttackCooldown: 0, shield: 0, shieldPenalty: 0, parryTimer: 0, parryCharge: 0, parryFlash: 0, counter: null, heal: 0, healLock: 0, wingFlare: 0, timeSlow: 0, timeActive: 0, timeCooldown: 0, timeFrozen: 0, timeBreak: 0, slowIntent: 0, superCharge: 0, superDash: 0, superShield: false, lookUp: false, crouch: false, crawl: false, dash: 0, bash: 0, grapple: null, cape: createCapeState() });
  setRoomStart(player.x, player.y);
  clearRoomEffects();
  const room = currentRoom();
  if (room) {
    room.visited = true;
    visitedAreas.add(room.theme);
    setMusicTheme(room.theme);
  }
  say(msg);
  saveGame();
}

function update() {
  if (hitStop > 0) {
    if ((player.parryCharge || 0) > 0 && tap("j")) {
      if (startParryCounter(currentRoom())) hitStop = 0;
    }
    if ((player.parryCharge || 0) > 0 && tap("k") && canStartFireCounter()) {
      if (startParryCounter(currentRoom(), "fire")) hitStop = 0;
    }
    hitStop--;
    if (hitStop <= 0 && !player.counter) {
      player.parryCharge = 0;
      player.attackBoost = false;
    }
    updateMusic();
    updateUi();
    pressed.clear();
    return;
  }
  frame++;
  if (!gameStarted) {
    updateMusic();
    pressed.clear();
    return;
  }
  if (paused) {
    updateMusic();
    pressed.clear();
    updateUi();
    return;
  }
  if (dialogue) {
    updateDialogue();
    updateCapePhysics();
    updateMusic();
    updateUi();
    pressed.clear();
    return;
  }
  let room = currentRoom();
  room.visited = true;
  if (tap("m")) mapOpen = !mapOpen;
  if (tap("v")) setInventory(!inventoryOpen);
  if (inventoryOpen) {
    pressed.clear();
    updateUi();
    return;
  }
  if (tap("o")) {
    audio.muted = !audio.muted;
    if (!audio.muted) {
      ensureAudio();
      audio.theme = "";
      setMusicTheme(room.theme);
    }
    say(audio.muted ? "Audio muted." : "Audio restored.");
  }
  if (bossCeremony) {
    player.vx = 0;
    player.vy = 0;
    player.attack = bossCeremony.holdAttack || player.attack;
    player.attackType = bossCeremony.holdAttackType || player.attackType;
    player.attackBoost = bossCeremony.holdAttackBoost ?? player.attackBoost;
    player.counter = bossCeremony.holdCounter || player.counter;
    player.dash = 0;
    player.bash = 0;
    player.grapple = null;
    updateEnemies(room);
    toastTime--;
    if (toastTime <= 0) ui.toast.classList.remove("show");
    if (areaCard) {
      areaCard.time--;
      if (areaCard.time <= 0) areaCard = null;
    }
    shake = Math.max(0, shake - 1);
    cameraX = shake ? (Math.random() - 0.5) * shake : 0;
    cameraY = shake ? (Math.random() - 0.5) * shake : 0;
    updateCapePhysics();
    updateMusic();
    updateUi();
    pressed.clear();
    return;
  } else if (bossIntro && bossIntro.room === player.room && bossIntro.time > 0) {
    player.vx = 0;
    player.vy = 0;
    player.attack = 0;
    player.attackBoost = false;
    player.dash = 0;
    player.bash = 0;
    player.heal = 0;
    player.superCharge = 0;
    player.superDash = 0;
    player.superShield = false;
    player.grapple = null;
    bossIntro.time--;
    for (const p of particles) { p.x += p.vx; p.y += p.vy; p.vy += 0.08; p.life--; }
    for (let i = particles.length - 1; i >= 0; i--) if (particles[i].life <= 0) particles.splice(i, 1);
    toastTime--;
    if (toastTime <= 0) ui.toast.classList.remove("show");
    if (areaCard) {
      areaCard.time--;
      if (areaCard.time <= 0) areaCard = null;
    }
    shake = Math.max(0, shake - 1);
    cameraX = shake ? (Math.random() - 0.5) * shake : 0;
    cameraY = shake ? (Math.random() - 0.5) * shake : 0;
    updateCapePhysics();
    updateMusic();
    updateUi();
    pressed.clear();
    return;
  } else if (player.counter) {
    bossIntro = null;
    updateParryCounter(room);
  } else {
    bossIntro = null;
    playerInput(room);
    moveActor(player, room);
  }
  player.hurt = Math.max(0, player.hurt - 1);
  player.attack = Math.max(0, player.attack - 1);
  player.basicAttackCooldown = Math.max(0, (player.basicAttackCooldown || 0) - 1);
  if (player.attack <= 0) player.attackBoost = false;
  player.bash = Math.max(0, player.bash - 1);
  if (!(held("s") && has("shield") && player.shield > 0)) player.shield = Math.max(0, player.shield - 1);
  player.shieldPenalty = Math.max(0, (player.shieldPenalty || 0) - 0.025);
  player.parryTimer = Math.max(0, (player.parryTimer || 0) - 1);
  player.parryFlash = Math.max(0, (player.parryFlash || 0) - 1);
  player.heal = Math.max(0, player.heal - 1);
  player.healLock = Math.max(0, (player.healLock || 0) - 1);
  player.wingFlare = Math.max(0, (player.wingFlare || 0) - 1);
  if (!bossCeremony) {
    if (player.x < -4) enterRoom(-1, 0);
    else if (player.x > W - 8) enterRoom(1, 0);
    else if (player.y < -8) enterRoom(0, -1);
    else if (player.y > H + 12) enterRoom(0, 1);
  }
  player.coyote = player.grounded ? 8 : Math.max(0, player.coyote - 1);
  room = currentRoom();
  const sword = player.counter ? null : attackBox();
  if (sword) breakSecretWalls(room, sword, has("shield") ? 2 : 1);
  const bash = bashBox();
  if (bash) breakSecretWalls(room, bash, 3);
  for (const p of projectiles) if (p.fire && breakSecretWalls(room, p, 2)) p.life = 0;
  for (const p of projectiles) if (p.hostile && (p.warning || 0) <= 0) {
    let hitbox = p;
    if (p.kind === "rootSpike") {
      const activeAge = Math.max(0, (p.maxLife || 40) - p.life - (p.warningMax || 0));
      const grow = Math.min(1, activeAge / 7);
      const h = Math.max(8, p.h * grow);
      hitbox = { x: p.x, y: p.y + p.h - h, w: p.w, h };
    }
    if (!rects(player, hitbox)) continue;
    p.life = 0;
    damagePlayer(1, p.x, "", { bypassHurt: !!p.bypassHurt });
  }
  const pogo = pogoBox();
  for (const h of room.hazards) if (rects(player, h)) {
    if (pogo && hitboxIntersects(pogo, h) && player.vy >= -1) {
      pogoBounce(h.x + h.w / 2, has("shield") ? "#bfe9ff" : "#fff1bd");
    } else {
      const spikeRoom = player.room;
      const damaged = damagePlayer(1, h.x, "", { bypassShield: true });
      if (damaged && player.hp > 0 && player.room === spikeRoom) resetToRoomStart("The spikes force you back to the room start.");
    }
  }
  for (const w of room.water) if (rects(player, w) && !has("swim") && frame % 50 === 0) damagePlayer(1, w.x);
  if (updateHouseDoors(room)) {
    pressed.clear();
    updateUi();
    return;
  }
  if (updateNpcs(room)) {
    pressed.clear();
    updateUi();
    return;
  }
  if (updateCheckpointAltar(room)) {
    pressed.clear();
    updateUi();
    return;
  }
  updateEnemies(room);
  if (updateFinalDoor(room)) {
    pressed.clear();
    updateUi();
    return;
  }
  if (updateCastleGatePortal(room)) {
    pressed.clear();
    updateUi();
    return;
  }
  if (updatePortals(room)) {
    pressed.clear();
    updateUi();
    return;
  }
  room = currentRoom();
  updateItems(room);
  for (const p of projectiles) {
    const projectileSlow = p.timeGate && timeHeld() ? 0.26 : 1;
    p.x += p.vx * projectileSlow;
    p.y += (p.vy || 0) * projectileSlow;
    p.warning = Math.max(0, (p.warning || 0) - 1);
    p.life--;
    addParticles(p.x, p.y, p.hostile ? p.color || "#f0a642" : "#ff7a3d", p.hostile ? 0.45 : 1);
    if (p.hostile && (p.x < 14 || p.x > W - 20)) p.life = 0;
  }
  for (let i = projectiles.length - 1; i >= 0; i--) if (projectiles[i].life <= 0) projectiles.splice(i, 1);
  for (const p of particles) { p.x += p.vx; p.y += p.vy; p.vy += 0.08; p.life--; }
  for (let i = particles.length - 1; i >= 0; i--) if (particles[i].life <= 0) particles.splice(i, 1);
  toastTime--;
  if (toastTime <= 0) ui.toast.classList.remove("show");
  if (areaCard) {
    areaCard.time--;
    if (areaCard.time <= 0) areaCard = null;
  }
  shake = Math.max(0, shake - 1);
  cameraX = shake ? (Math.random() - 0.5) * shake : 0;
  cameraY = shake ? (Math.random() - 0.5) * shake : 0;
  updateCapePhysics();
  updateMusic();
  updateUi();
  pressed.clear();
}

function pixelRect(x, y, w, h, color) {
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(x + cameraX), Math.round(y + cameraY), w, h);
}

function finePixelRect(x, y, w, h, color) {
  const unit = 1 / GAME_RENDER_SCALE;
  const snap = v => Math.round(v * GAME_RENDER_SCALE) / GAME_RENDER_SCALE;
  ctx.fillStyle = color;
  ctx.fillRect(
    snap(x + cameraX),
    snap(y + cameraY),
    Math.max(unit, snap(w)),
    Math.max(unit, snap(h))
  );
}

function drawCapeCloth(anchorX, anchorY, step, wingLift) {
  const cape = ensureCapeState();
  if (!cape.segments.length) resetCapePhysics({ x: anchorX, y: anchorY });
  const points = [{ x: anchorX, y: anchorY }, ...cape.segments];
  const dir = player.dir > 0 ? -1 : 1;
  const blocks = [
    { w: 5, h: 7, c: "#8c2f38", hi: "#b2454a" },
    { w: 7, h: 7, c: "#8c2f38", hi: "#b2454a" },
    { w: 7, h: 5, c: "#5f1f2d", hi: "#8c2f38" },
    { w: 5, h: 3, c: "#441821", hi: "#5f1f2d" }
  ];
  for (let i = 0; i < blocks.length; i++) {
    const p = points[i + 1] || points[points.length - 1];
    const b = blocks[i];
    const px = Math.round(p.x - (dir < 0 ? b.w - 1 : 1));
    const py = Math.round(p.y - 2 + (i > 1 ? step : 0) - wingLift * 0.08);
    pixelRect(px, py, b.w, b.h, b.c);
    pixelRect(px + (dir < 0 ? b.w - 2 : 1), py + 1, 2, Math.max(2, b.h - 2), b.hi);
    if (i > 0) pixelRect(px + (dir < 0 ? -1 : b.w - 1), py + b.h - 1, 2, 2, "#2b0f17");
  }
  const tail = points[points.length - 1];
  pixelRect(Math.round(tail.x - (dir < 0 ? 4 : 1)), Math.round(tail.y + 2), 4, 2, "#d59b44");
  return points;
}

function drawSwordArc(box) {
  const arc = box.arc || {};
  ctx.save();
  ctx.lineCap = "square";
  ctx.lineJoin = "round";
  ctx.strokeStyle = "rgba(255,255,255,.28)";
  ctx.lineWidth = 8;
  ctx.beginPath();
  if (arc.type === "up") {
    const cx = player.x + player.w / 2 + cameraX;
    const cy = player.y + 2 + cameraY;
    const r = arc.age < 5 ? 23 : arc.age < 12 ? 31 : 25;
    ctx.arc(cx, cy, r, Math.PI * 1.05, Math.PI * 1.95);
  } else if (arc.type === "down") {
    const cx = player.x + player.w / 2 + cameraX;
    const cy = player.y + player.h - 3 + cameraY;
    ctx.arc(cx, cy, 21, Math.PI * 0.06, Math.PI * 0.94);
  } else {
    const dir = arc.dir || player.dir;
    const cx = player.x + (dir > 0 ? 6 : player.w - 6) + cameraX;
    const cy = player.y + 12 + cameraY;
    const r = arc.age < 5 ? 23 : arc.age < 12 ? 31 : 25;
    if (dir > 0) ctx.arc(cx, cy, r, -1.15, 0.55);
    else ctx.arc(cx, cy, r, Math.PI + 1.15, Math.PI - 0.55, true);
  }
  ctx.stroke();
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 4;
  ctx.stroke();
  ctx.strokeStyle = "rgba(255,255,255,.82)";
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();
  if (arc.boost) {
    ctx.save();
    ctx.strokeStyle = "rgba(255,241,189,.55)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    if (arc.type === "up") ctx.arc(Math.round(player.x + player.w / 2 + cameraX), Math.round(player.y + cameraY), 28, Math.PI * 1.05, Math.PI * 1.95);
    else ctx.arc(Math.round((box.x + box.w / 2) + cameraX), Math.round((box.y + box.h / 2) + cameraY), 24, arc.dir > 0 ? -0.9 : Math.PI + 0.9, arc.dir > 0 ? 0.9 : Math.PI - 0.9, arc.dir < 0);
    ctx.stroke();
    ctx.restore();
  }
}

function drawTile(x, y, theme, t) {
  const p = palette[theme];
  const px = x * TILE, py = y * TILE;
  const u = TILE / 16;
  const n = v => Math.max(1, Math.round(v * u));
  const s = v => Math.round(v * u);
  const r = (ox, oy, w, h, color) => pixelRect(px + s(ox), py + s(oy), n(w), n(h), color);
  if (t === "#") {
    pixelRect(px, py, TILE, TILE, p[1]);
    r(0, 0, 16, 3, p[2]);
    r(1, 10, 14, 2, "#111");
    if ((x + y) % 3 === 0) r(10, 4, 4, 3, p[3]);
    if ((x * 11 + y * 7) % 9 === 0) r(2, 2, 3, 2, "rgba(255,255,255,.12)");
    if ((x * 5 + y * 13) % 11 === 0) r(11, 12, 3, 1, "rgba(0,0,0,.35)");
  }
  if (t === "S") {
    pixelRect(px, py, TILE, TILE, p[1]);
    r(0, 0, 16, 2, p[2]);
    r(3, 4, 10, 1, "rgba(255,255,255,.18)");
    r(5, 9, 7, 1, "rgba(0,0,0,.45)");
    if ((frame + x + y) % 44 < 2) r(7, 6, 2, 2, p[3]);
  }
  if (t === "U") {
    pixelRect(px, py, TILE, TILE, "#151b27");
    r(0, 0, 16, 3, "#5b6f86");
    r(2, 3, 2, 11, "#27384b");
    r(7, 2, 2, 12, "#10161d");
    r(12, 4, 2, 10, "#27384b");
    if ((x + y + frame) % 50 < 2) r(4, 5, 8, 1, "rgba(159,208,208,.45)");
  }
  if (t === "C") {
    pixelRect(px, py, TILE, TILE, p[1]);
    r(0, 0, 16, 3, p[2]);
    r(1, 10, 14, 2, "#111");
    r(4, 4, 1, 5, "rgba(255,241,189,.26)");
    r(5, 8, 4, 1, "rgba(255,241,189,.22)");
    r(10, 3, 1, 4, "rgba(0,0,0,.46)");
    r(8, 7, 3, 1, "rgba(0,0,0,.42)");
    if ((x + y) % 2 === 0) r(12, 11, 2, 1, "rgba(240,166,66,.18)");
  }
  if (t === "^") {
    r(2, 8, 12, 8, "#2b1a19");
    r(5, 4, 3, 12, "#bfc9bd");
    r(10, 2, 3, 14, "#d7d2be");
  }
  if (t === "~") {
    r(0, 4, 16, 12, "#143e54");
    pixelRect(px + s((frame + x) % 8), py + s(6), n(7), n(1), "#68c7cf");
  }
  if (t === "G") {
    r(6, 4, 5, 12, "rgba(145,210,220,.55)");
    r(3, 11, 10, 2, "rgba(145,210,220,.38)");
    pixelRect(px + s(7), py + s(2 + Math.sin(frame / 12 + x) * 2), n(3), n(3), "rgba(215,247,255,.5)");
  }
}

function drawBackground(room) {
  const p = palette[room.theme];
  ctx.fillStyle = p[0];
  ctx.fillRect(0, 0, W, H);
  ctx.save();
  ctx.translate(
    Math.round(W * (1 - BACKGROUND_RENDER_SCALE) * 0.5),
    Math.round(H * (1 - BACKGROUND_RENDER_SCALE) * 0.42)
  );
  ctx.scale(BACKGROUND_RENDER_SCALE, BACKGROUND_RENDER_SCALE);
  ctx.fillStyle = "rgba(0,0,0,.18)";
  for (let x = -20; x < W; x += 64) {
    const h = 36 + ((x + room.id * 19) % 45);
    ctx.fillRect(x, H - 68 - h * 0.2, 44, h);
  }
  ctx.fillStyle = "rgba(255,255,255,.025)";
  for (let y = 0; y < H; y += 18) ctx.fillRect(0, y, W, 1);
  if (room.knightHouse) {
    ctx.fillStyle = "#1a2525";
    ctx.fillRect(0, 0, W, H);
    for (let x = 0; x < W; x += 24) pixelRect(x, 22, 18, 72, x % 48 ? "#25372f" : "#2d4539");
    pixelRect(0, 92, W, 6, "#5d4630");
    pixelRect(0, FLOOR_Y - 5, W, 25, "#3b2c22");
    for (let x = 0; x < W; x += 28) {
      pixelRect(x, FLOOR_Y + 5, 20, 2, "rgba(255,209,102,.12)");
      pixelRect(x + 8, FLOOR_Y + 16, 14, 2, "rgba(0,0,0,.22)");
    }
    pixelRect(192, 46, 52, 34, "#14212a");
    pixelRect(198, 52, 40, 22, "rgba(255,209,102,.18)");
    pixelRect(215, 45, 3, 36, "#60482d");
    pixelRect(190, 61, 56, 3, "#60482d");
    pixelRect(52, 52, 44, 22, "rgba(255,209,102,.08)");
    pixelRect(58, 58, 32, 12, "rgba(255,241,189,.1)");
  } else if (room.theme === "village") {
    const sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, "#213b4d");
    sky.addColorStop(0.55, "#274f52");
    sky.addColorStop(1, "#17282c");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, H);
    pixelRect(44, 24, 24, 24, "rgba(255,209,102,.78)");
    pixelRect(49, 29, 14, 14, "rgba(255,241,189,.35)");
    for (let x = -10; x < W; x += 52) {
      const h = 24 + ((x + room.id * 7) % 18);
      pixelRect(x, 108 - h * 0.25, 56, h, "rgba(18,48,38,.66)");
      pixelRect(x + 12, 99 - h * 0.25, 38, 8, "rgba(24,72,52,.45)");
    }
    pixelRect(W - 58, 37, 44, 72, "rgba(11,14,18,.36)");
    pixelRect(W - 50, 28, 29, 12, "rgba(11,14,18,.38)");
    for (let x = 10; x < W; x += 72) {
      pixelRect(x, 128, 46, 24, "rgba(88,58,39,.62)");
      pixelRect(x - 3, 118, 52, 12, (x + room.id) % 2 ? "#7a3f3a" : "#b17a3f");
      pixelRect(x + 11, 134, 6, 9, "rgba(255,209,102,.34)");
      pixelRect(x + 29, 136, 5, 8, "rgba(255,209,102,.28)");
    }
    for (let x = 18; x < W; x += 31) pixelRect(x, 160 + Math.sin(frame / 25 + x) * 2, 18, 2, "rgba(255,209,102,.2)");
  }
  if (["castle", "tower", "keep", "throne"].includes(room.theme)) {
    for (let x = 20; x < W; x += 58) {
      pixelRect(x, 26, 17, 62, "rgba(0,0,0,.32)");
      pixelRect(x + 4, 35 + ((x + frame) % 9), 9, 18, "rgba(226,184,93,.18)");
      pixelRect(x - 5, 88, 27, 3, p[2]);
      pixelRect(x + 2, 25, 4, 4, "rgba(255,231,165,.08)");
      pixelRect(x + 11, 24, 3, 5, "rgba(255,231,165,.07)");
      pixelRect(x + 3, 62, 3, 13, "rgba(0,0,0,.22)");
      pixelRect(x + 11, 61, 3, 14, "rgba(0,0,0,.22)");
    }
    for (let x = -20; x < W; x += 72) {
      pixelRect(x, 118, 44, 46, "rgba(0,0,0,.22)");
      pixelRect(x + 6, 108, 32, 10, p[1]);
      pixelRect(x + 9, 122, 5, 8, "rgba(213,155,68,.18)");
      pixelRect(x + 25, 125, 5, 8, "rgba(213,155,68,.14)");
      pixelRect(x + 5, 150, 34, 2, "rgba(255,255,255,.04)");
    }
    for (let x = 8; x < W; x += 34) {
      pixelRect(x, 102 + ((x + room.id) % 9), 14, 2, "rgba(213,155,68,.22)");
      pixelRect(x + 5, 104 + ((x + room.id) % 9), 3, 10, "rgba(140,47,56,.32)");
    }
  }
  if (room.theme === "chapel") {
    for (let x = 44; x < W; x += 82) {
      pixelRect(x, 28, 20, 54, "rgba(255,96,65,.13)");
      pixelRect(x + 4, 32, 4, 46, "#7b4939");
      pixelRect(x + 12, 32, 4, 46, "#d59b44");
    }
    for (let i = 0; i < 8; i++) pixelRect(22 + i * 45, 154 + Math.sin(frame / 20 + i) * 2, 3, 11, "#e16b43");
  }
  if (room.theme === "moss") {
    for (let x = 7; x < W; x += 29) {
      const sway = Math.sin(frame / 70 + x) * 1.5;
      pixelRect(x + sway, 0, 2, 58 + (x % 43), "rgba(29,57,34,.62)");
      pixelRect(x - 3 + sway, 48 + (x % 28), 9, 3, "rgba(110,163,95,.34)");
      if (x % 3 === 1) pixelRect(x + 4 + sway, 76 + (x % 21), 7, 2, "rgba(158,209,126,.22)");
    }
    for (let x = 0; x < W; x += 37) pixelRect(x, 172 + Math.sin(frame / 30 + x) * 3, 25, 3, "rgba(110,163,95,.28)");
  }
  if (["crypt", "catacomb", "bone"].includes(room.theme)) {
    for (let x = 26; x < W; x += 54) {
      pixelRect(x, 58, 26, 70, "rgba(0,0,0,.32)");
      pixelRect(x + 6, 72, 14, 10, "#2a2521");
      pixelRect(x + 10, 88, 6, 27, "#8f806d");
    }
    for (let x = 12; x < W; x += 38) pixelRect(x, 154, 14, 5, "#d3ae72");
  }
  if (room.theme === "water") {
    for (let y = 34; y < H; y += 28) {
      ctx.fillStyle = "rgba(116,209,199,.08)";
      ctx.fillRect(Math.sin(frame / 40 + y) * 8, y, W, 2);
    }
    for (let x = 18; x < W; x += 47) pixelRect(x, 118 + Math.sin(frame / 22 + x) * 5, 4, 17, "#247083");
  }
  if (room.theme === "forge") {
    for (let x = 28; x < W; x += 64) {
      pixelRect(x, 42, 16, 82, "#2b1710");
      pixelRect(x + 2, 119, 12, 11, "#f0a642");
      pixelRect(x + 5, 34, 6, 8, "#9b5030");
    }
    ctx.fillStyle = "rgba(240,166,66,.08)";
    ctx.fillRect(0, 138 + Math.sin(frame / 15) * 3, W, 16);
  }
  if (room.theme === "void") {
    for (let i = 0; i < 44; i++) {
      const x = (i * 67 + frame * (i % 3 + 1) * 0.04) % W;
      const y = 17 + ((i * 41) % 160);
      pixelRect(x, y, 1 + (i % 2), 1 + (i % 2), i % 4 ? "#a596ff" : "#f7e7bd");
    }
    pixelRect(262, 44 + Math.sin(frame / 40) * 4, 54, 9, "rgba(165,150,255,.2)");
  }
  for (const d of room.decor) {
    if (d.t === "house") {
      pixelRect(d.x, d.y + 18, 48, 40, "#5d4630");
      pixelRect(d.x - 4, d.y + 9, 56, 13, d.roof || "#7a3f3a");
      pixelRect(d.x + 7, d.y + 28, 9, 12, "rgba(255,209,102,.36)");
      pixelRect(d.x + 29, d.y + 25, 10, 15, "#2f211c");
      if (d.owner === "knight") {
        pixelRect(d.x + 15, d.y + 23, 11, 9, "#415f78");
        pixelRect(d.x + 18, d.y + 21, 5, 2, "#d7dce1");
        pixelRect(d.x + 20, d.y + 18, 1, 12, "#f3cc67");
        pixelRect(d.x + 18, d.y + 25, 5, 1, "#fff1bd");
      }
      continue;
    }
    if (d.t === "houseExit") {
      pixelRect(d.x, d.y + 7, 30, 43, "#2f211c");
      pixelRect(d.x + 4, d.y + 12, 22, 38, "#4b3526");
      pixelRect(d.x + 21, d.y + 29, 3, 3, "#ffd166");
      pixelRect(d.x - 2, d.y + 4, 34, 6, "#7a3f3a");
      continue;
    }
    if (d.t === "bed") {
      pixelRect(d.x - 4, d.y + 23, 72, 8, "rgba(0,0,0,.3)");
      pixelRect(d.x, d.y + 8, 62, 21, "#6d5336");
      pixelRect(d.x + 4, d.y + 5, 19, 11, "#f1d7a4");
      pixelRect(d.x + 23, d.y + 9, 36, 15, "#8a1f2d");
      pixelRect(d.x + 8, d.y + 29, 5, 7, "#2f211c");
      pixelRect(d.x + 51, d.y + 29, 5, 7, "#2f211c");
      continue;
    }
    if (d.t === "table") {
      pixelRect(d.x - 5, d.y + 21, 58, 5, "rgba(0,0,0,.28)");
      pixelRect(d.x, d.y + 9, 48, 8, "#60482d");
      pixelRect(d.x + 5, d.y + 17, 5, 16, "#3b2c22");
      pixelRect(d.x + 37, d.y + 17, 5, 16, "#3b2c22");
      pixelRect(d.x + 17, d.y + 4, 9, 5, "#ffd166");
      pixelRect(d.x + 28, d.y + 3, 8, 6, "#84c5d0");
      continue;
    }
    if (d.t === "swordRack") {
      pixelRect(d.x - 4, d.y + 36, 50, 4, "rgba(0,0,0,.3)");
      pixelRect(d.x + 6, d.y + 10, 36, 5, "#60482d");
      pixelRect(d.x + 8, d.y + 28, 32, 5, "#60482d");
      pixelRect(d.x + 10, d.y + 13, 4, 24, "#3b2c22");
      pixelRect(d.x + 34, d.y + 13, 4, 24, "#3b2c22");
      continue;
    }
    if (d.t === "shelf") {
      pixelRect(d.x, d.y + 4, 54, 5, "#60482d");
      pixelRect(d.x, d.y + 24, 54, 5, "#60482d");
      pixelRect(d.x + 5, d.y + 9, 8, 15, "#d3ae72");
      pixelRect(d.x + 17, d.y + 11, 10, 13, "#415f78");
      pixelRect(d.x + 32, d.y + 13, 7, 11, "#8a1f2d");
      pixelRect(d.x + 45, d.y + 10, 5, 14, "#ffd166");
      continue;
    }
    if (d.t === "stall") {
      pixelRect(d.x, d.y + 20, 55, 26, "#60482d");
      pixelRect(d.x - 3, d.y + 12, 61, 12, d.awning || "#c6423c");
      for (let sx = 1; sx < 56; sx += 12) pixelRect(d.x + sx, d.y + 12, 6, 12, "#f7e7bd");
      pixelRect(d.x + 10, d.y + 30, 12, 5, "#ffd166");
      pixelRect(d.x + 30, d.y + 29, 10, 6, "#6ea35f");
      continue;
    }
    if (d.t === "gate") {
      pixelRect(d.x, d.y + 13, 46, 51, "#3b3430");
      pixelRect(d.x + 5, d.y + 4, 36, 12, "#6d5336");
      pixelRect(d.x + 18, d.y + 25, 11, 39, "#111820");
      pixelRect(d.x + 20, d.y + 21, 7, 5, "#ffd166");
      continue;
    }
    if (d.t === "castleGate") {
      pixelRect(d.x - 10, d.y + 76, 86, 5, "rgba(0,0,0,.38)");
      pixelRect(d.x, d.y + 12, 66, 69, "#33414a");
      pixelRect(d.x + 5, d.y + 18, 56, 63, "#111820");
      pixelRect(d.x + 11, d.y + 24, 20, 57, "#3b3430");
      pixelRect(d.x + 35, d.y + 24, 20, 57, "#3b3430");
      pixelRect(d.x + 4, d.y + 7, 58, 11, "#54606a");
      pixelRect(d.x - 5, d.y, 26, 82, "#54606a");
      pixelRect(d.x + 45, d.y, 26, 82, "#54606a");
      for (let y = d.y + 2; y < d.y + 77; y += 14) {
        pixelRect(d.x - 2, y, 20, 3, "#b48850");
        pixelRect(d.x + 48, y, 20, 3, "#b48850");
      }
      pixelRect(d.x + 26, d.y + 38, 14, 7, "#ffd166");
      pixelRect(d.x + 30, d.y + 40, 6, 3, "#fff1bd");
      continue;
    }
    if (d.t === "well") {
      pixelRect(d.x, d.y + 14, 35, 24, "#54606a");
      pixelRect(d.x + 4, d.y + 18, 27, 12, "#1b2830");
      pixelRect(d.x + 4, d.y + 5, 27, 9, "#7a3f3a");
      pixelRect(d.x + 8, d.y - 8, 3, 20, "#60482d");
      pixelRect(d.x + 25, d.y - 8, 3, 20, "#60482d");
      continue;
    }
    if (d.t === "tree") {
      pixelRect(d.x + 15, d.y + 28, 8, 36, "#60482d");
      pixelRect(d.x, d.y + 2, 38, 29, "#2f7d52");
      pixelRect(d.x + 9, d.y - 8, 30, 24, "#6ea35f");
      continue;
    }
    if (d.t === "lamp") {
      pixelRect(d.x + 5, d.y, 4, 31, "#443427");
      pixelRect(d.x + 1, d.y + 2, 12, 10, "#ffd166");
      pixelRect(d.x + 3, d.y + 4, 8, 6, "rgba(255,241,189,.42)");
      continue;
    }
    if (d.t === "crate") {
      pixelRect(d.x, d.y, 18, 18, "#8a5d32");
      pixelRect(d.x + 2, d.y + 2, 14, 2, "#d3ae72");
      pixelRect(d.x + 8, d.y, 2, 18, "#5d3927");
      continue;
    }
    if (d.t === "barrel") {
      pixelRect(d.x, d.y + 3, 15, 21, "#7a6040");
      pixelRect(d.x + 2, d.y, 11, 4, "#d3ae72");
      pixelRect(d.x + 1, d.y + 9, 13, 2, "#443427");
      continue;
    }
    if (d.t === "bunting") {
      pixelRect(d.x, d.y, 36, 1, "rgba(247,231,189,.45)");
      pixelRect(d.x + 4, d.y + 1, 6, 7, "#c6423c");
      pixelRect(d.x + 15, d.y + 1, 6, 7, "#ffd166");
      pixelRect(d.x + 26, d.y + 1, 6, 7, "#2f7d71");
      continue;
    }
    if (d.t === "ghost") {
      const gx = d.x + Math.sin(frame / 42 + d.drift) * 5;
      const gy = d.y + Math.sin(frame / 55 + d.drift) * 4;
      pixelRect(gx + 5, gy, 10, 9, "rgba(154,202,216,.34)");
      pixelRect(gx + 2, gy + 7, 16, 11, "rgba(154,202,216,.28)");
      pixelRect(gx, gy + 15, 5, 8, "rgba(154,202,216,.2)");
      pixelRect(gx + 8, gy + 15, 4, 10, "rgba(154,202,216,.18)");
      pixelRect(gx + 15, gy + 15, 4, 7, "rgba(154,202,216,.2)");
      pixelRect(gx + 7, gy + 5, 2, 2, "rgba(247,231,189,.7)");
      pixelRect(gx + 13, gy + 5, 2, 2, "rgba(247,231,189,.7)");
      if (frame % 60 < 30) pixelRect(gx + 4, gy - 3, 13, 1, "rgba(132,197,208,.28)");
      continue;
    }
    const x = d.x + Math.sin(frame / 80 + d.t) * 2;
    pixelRect(x, d.y, 2, 18 + d.t * 3, "rgba(0,0,0,.28)");
    if (d.t === 2) pixelRect(x - 2, d.y - 2, 6, 3, p[3]);
  }
  ctx.fillStyle = "rgba(255, 207, 113, .05)";
  for (let x = 24; x < W; x += 78) ctx.fillRect(x, 0, 14, H);
  drawAmbient(room, p);
  for (let i = 0; i < 28; i++) {
    const x = (i * 37 + room.id * 19) % W;
    const y = 24 + ((i * 23 + room.id * 11) % 148);
    const drift = Math.sin(frame / 30 + i) * 1.5;
    const tint = room.theme === "forge" || room.theme === "chapel"
      ? "rgba(255,187,91,.24)"
      : room.theme === "moss"
        ? "rgba(158,209,126,.2)"
        : room.theme === "void"
          ? "rgba(165,150,255,.26)"
          : "rgba(247,231,189,.16)";
    finePixelRect(x + drift, y, 2.5, 0.5, tint);
    if (i % 5 === 0) finePixelRect(x + drift + 1, y - 1.5, 0.5, 3, tint);
  }
  for (let x = 6; x < W; x += 31) {
    const y = H - 28 + ((x + room.id * 7) % 11);
    finePixelRect(x, y, 10.5, 0.5, "rgba(255,255,255,.07)");
    finePixelRect(x + 2.5, y + 2.5, 5, 0.5, "rgba(0,0,0,.22)");
  }
  ctx.restore();
}

function drawAmbient(room, p) {
  const warm = ["chapel", "forge", "throne"].includes(room.theme);
  const wet = room.theme === "water";
  const cold = ["crypt", "catacomb", "bone", "void"].includes(room.theme);
  for (let i = 0; i < 34; i++) {
    const x = (i * 53 + frame * (wet ? -0.35 : warm ? 0.12 : 0.05)) % W;
    const y = (i * 29 + frame * (wet ? 0.5 : warm ? -0.18 : 0.08)) % H;
    const c = warm ? "rgba(240,166,66,.35)" : wet ? "rgba(116,209,199,.28)" : cold ? "rgba(165,150,255,.2)" : "rgba(247,231,189,.16)";
    pixelRect(x, y, wet ? 1 : 2, wet ? 7 : 2, c);
  }
  if (room.theme !== "void") {
    for (let x = 18; x < W; x += 96) {
      ctx.fillStyle = `rgba(255,231,165,${warm ? .075 : .035})`;
      ctx.beginPath();
      ctx.moveTo(x + Math.sin(frame / 60 + x) * 4, 0);
      ctx.lineTo(x + 32, H);
      ctx.lineTo(x + 58, H);
      ctx.lineTo(x + 12, 0);
      ctx.fill();
    }
  }
  for (let x = 0; x < W; x += TILE) {
    if ((x / TILE + room.id) % 5 === 0) {
      pixelRect(x + 4, H - 18, 7, 2, p[3]);
      pixelRect(x + 6, H - 21, 3, 3, "rgba(255,255,255,.18)");
    }
  }
}

function drawPlayer() {
  const x = player.x, y = player.y;
  const flash = player.hurt && frame % 4 < 2;
  const crawling = player.crawl && player.grounded;
  const run = Math.abs(player.vx) > 0.35 && player.grounded && !crawling;
  const walkFrame = run ? Math.floor(frame / 5) % 4 : crawling ? Math.floor(frame / 10) % 4 : 0;
  const step = run ? (walkFrame === 1 || walkFrame === 3 ? 1 : 0) : crawling ? (walkFrame === 1 || walkFrame === 3 ? 1 : 0) : 0;
  const walkBob = run ? (walkFrame === 0 || walkFrame === 2 ? 0 : 1) : 0;
  const hipShift = run ? (walkFrame === 1 ? player.dir : walkFrame === 3 ? -player.dir : 0) : crawling ? (walkFrame === 1 ? player.dir * 0.35 : walkFrame === 3 ? -player.dir * 0.35 : 0) : 0;
  const shoulderShift = run ? -hipShift : 0;
  const idle = !run && !crawling && player.grounded ? Math.floor(frame / 28) % 2 : 0;
  const airborne = !player.grounded;
  const attacking = player.attack > 0;
  const attackAge = attacking ? ATTACK_MAX - player.attack : 0;
  const upSlash = player.attackType === "up";
  const downSlash = player.attackType === "down";
  const windup = attacking && attackAge < 5;
  const slash = attacking && attackAge >= 5 && attackAge < 12;
  const recover = attacking && attackAge >= 12;
  const followThrough = recover && attackAge < 16;
  const shieldAge = SHIELD_MAX - player.shield;
  const blocking = player.shield > 0;
  const bashing = player.bash > 0;
  const healing = player.heal > 0;
  const bashAge = bashing ? BASH_MAX - player.bash : 0;
  const chargingBell = (player.superCharge || 0) > 0;
  const bellDashing = (player.superDash || 0) > 0;
  const dashPose = player.dash > 0 && !bashing && !bellDashing;
  const dashAge = dashPose ? DASH_MAX - player.dash : 0;
  const dashLean = dashPose ? player.dir * (dashAge < 5 ? 4 : dashAge < 14 ? 3.5 : 2.5) : 0;
  const lean = bashing ? player.dir * 5 : bellDashing ? player.dir * 6 : dashPose ? dashLean : slash && !upSlash && !downSlash ? player.dir * 2 : run ? player.dir * 0.5 : 0;
  const cape = player.dir > 0 ? -5 : 10;
  const lookingUp = player.lookUp && !attacking;
  const crouching = player.crouch && !attacking;
  const helm = flash ? "#fff" : "#d7dce1";
  const armor = flash ? "#fff" : "#415f78";
  const armSilver = flash ? "#fff" : "#b8bec5";
  const armShadow = flash ? "#fff" : "#7f8f9c";
  const skin = flash ? "#fff1bd" : "#9b623f";
  const trim = player.finalBossDefeated ? "#f3cc67" : "#d59b44";
  const crouchDrop = crouching ? (crawling ? 5 : 4) : 0;
  const headY = y - 9 + idle + walkBob + (airborne && player.vy < 0 ? -1 : 0) + (lookingUp ? -3 : 0) + (crouching ? 5 : 0);
  const bodyY = y + idle + walkBob + crouchDrop;
  const waistY = bodyY + 11;
  const armSwing = run ? (walkFrame === 0 ? 1 : walkFrame === 1 ? -1 : walkFrame === 2 ? -1 : 1) : 0;
  const wingLift = (player.wingFlare || 0) > 0 ? Math.ceil(player.wingFlare / 3) : 0;
  if (player.dash > 0 || bashing || bellDashing) {
    for (let i = 1; i <= 3; i++) {
      pixelRect(x - player.dir * i * (bashing || bellDashing ? 8 : 6), y + 2, 9, 11, `rgba(137,169,186,${0.18 - i * 0.035})`);
      pixelRect(x - player.dir * i * 6 + 2, y - 4, 6, 5, bellDashing ? `rgba(215,190,122,${0.28 - i * 0.045})` : `rgba(247,231,189,${0.14 - i * 0.025})`);
    }
    if (dashPose) {
      pixelRect(x - player.dir * 9, y + 12, 8, 2, "rgba(255,241,189,.34)");
      pixelRect(x - player.dir * 15, y + 18, 7, 1, "rgba(137,169,186,.3)");
      pixelRect(x + player.dir * 9, y + 4, 3, 10, "rgba(255,241,189,.18)");
    }
  }
  if (chargingBell) {
    const max = player.superShield ? SUPER_SHIELD_CHARGE_MAX : SUPER_CHARGE_MAX;
    const fill = Math.round(24 * clamp(player.superCharge / max, 0, 1));
    pixelRect(x - 7, y - 20, 26, 5, "rgba(7,9,12,.78)");
    pixelRect(x - 6, y - 19, 24, 3, "#5b4a35");
    pixelRect(x - 6, y - 19, fill, 3, player.superCharge >= max ? "#fff1bd" : "#d7be7a");
    if (frame % 10 < 5) pixelRect(x + player.dir * 11, y + 3, 3, 11, "rgba(215,190,122,.38)");
  }
  if ((player.parryCharge || 0) > 0) {
    pixelRect(x - 4, y - 10, 20, 2, "rgba(255,241,189,.7)");
    pixelRect(x - 2, y + 18, 16, 2, "rgba(132,197,208,.55)");
    if (frame % 18 < 9) pixelRect(x + 5, y - 14, 4, 4, "#fff1bd");
  }
  if ((player.parryFlash || 0) > 0) {
    const t = 1 - player.parryFlash / 72;
    const cx = x + 5 + cameraX;
    const cy = y + 8 + cameraY;
    const dir = player.dir || 1;
    ctx.save();
    ctx.lineCap = "square";
    ctx.lineJoin = "miter";
    ctx.strokeStyle = `rgba(255,241,189,${0.84 * (1 - t)})`;
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(cx + dir * 7, cy, 18 + t * 18, -1.45, 1.45);
    ctx.stroke();
    ctx.strokeStyle = `rgba(132,197,208,${0.78 * (1 - t)})`;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(cx + dir * 5, cy, 11 + t * 10, -1.25, 1.25);
    ctx.stroke();
    ctx.restore();
    for (let i = 0; i < 6; i++) {
      const sx = x + dir * (10 + i * 5);
      const sy = y + 8 + ((i % 2) ? -8 : 8) - t * 5;
      pixelRect(sx, sy, 7, 2, i % 2 ? "rgba(255,241,189,.72)" : "rgba(132,197,208,.68)");
      pixelRect(x + dir * (8 + i * 4), y - 9 + i * 5, 2, 5, "rgba(255,255,255,.5)");
    }
    pixelRect(x + dir * 8, y - 5, 4, 27, "rgba(255,241,189,.42)");
    pixelRect(x + dir * 11, y + 2, 7, 13, "rgba(132,197,208,.34)");
  }
  if (player.grapple) {
    ctx.strokeStyle = "#b4d6dc";
    ctx.beginPath();
    ctx.moveTo(x + 5 + cameraX, y + 7 + cameraY);
    ctx.lineTo(player.grapple.x + cameraX, player.grapple.y + cameraY);
    ctx.stroke();
  }
  if (healing) {
    const pulse = Math.sin(frame / 8) * 2;
    pixelRect(x - 5, y + 14 + pulse, 21, 2, "rgba(132,197,208,.55)");
    pixelRect(x - 3, y + 5, 2, 8, "rgba(255,241,189,.45)");
    pixelRect(x + 12, y + 4, 2, 9, "rgba(132,197,208,.42)");
    pixelRect(x + 2, y - 9 + pulse, 7, 2, "#84c5d0");
    pixelRect(x + 4, y - 12 + pulse, 3, 8, "rgba(255,241,189,.58)");
  }
  if ((player.wingFlare || 0) > 0) {
    const age = 18 - player.wingFlare;
    const flap = Math.sin(age * 1.35);
    const span = 12 + Math.abs(flap) * 5;
    const lift = 4 - flap * 5;
    const tuck = flap < 0 ? 4 : 0;
    pixelRect(x + 2 - span + tuck, y + 2 + lift, span, 4, "rgba(241,215,164,.78)");
    pixelRect(x - span + tuck - 2, y + 6 + lift, span - 2, 3, "rgba(143,128,109,.82)");
    pixelRect(x + 7, y + 2 + lift, span, 4, "rgba(241,215,164,.78)");
    pixelRect(x + 11, y + 6 + lift, span - 2, 3, "rgba(143,128,109,.82)");
    pixelRect(x - span + tuck + 1, y + 9 + lift, 6, 2, "#d7d2be");
    pixelRect(x + 7 + span, y + 9 + lift, 6, 2, "#d7d2be");
    if (age % 6 < 3) {
      pixelRect(x - span + tuck + 4, y + 12 + lift, 9, 2, "rgba(255,255,255,.28)");
      pixelRect(x + span + 2, y + 12 + lift, 9, 2, "rgba(255,255,255,.28)");
    }
  }
  const capeAnchorX = x + 2 + cape * 0.72 - lean * 0.18;
  const capeAnchorY = bodyY - 4 - wingLift * 0.35;
  const capePoints = drawCapeCloth(capeAnchorX, capeAnchorY, step, wingLift);
  const upperLean = lean + shoulderShift * 0.45;
  const lowerLean = lean + hipShift * 0.45;
  if (windup && upSlash) {
    pixelRect(x + 2, y - 12, 6, 3, trim);
    pixelRect(x + 1, y - 9, 9, 8, helm);
  } else if (windup) {
    pixelRect(x - player.dir * 5, y - 9, 5, 3, trim);
    pixelRect(x - player.dir * 5, y - 7, 9, 8, helm);
  } else {
    pixelRect(x + 2 + upperLean, y - 10 + idle + walkBob, 7, 3, trim);
    pixelRect(x + 1 + upperLean, headY, 9, 8, helm);
  }
  pixelRect(x + 4 + upperLean, headY - 2, 2, 2, trim);
  pixelRect(x + (player.dir > 0 ? 7 : 1) + upperLean, headY + 2, 2, 2, "#101317");
  pixelRect(x + 6 + upperLean, headY + 6, 3, 1, "#8fa3ad");
  pixelRect(x + 1 + upperLean, headY + 7, 8, 1, "#6f7f8a");
  if (lookingUp) {
    pixelRect(x + 3 + upperLean, headY - 2, 5, 1, "#ffffff");
    pixelRect(x + (player.dir > 0 ? 7 : 2) + upperLean, headY, 2, 2, "#101317");
  }
  pixelRect(x + 1 + lowerLean, bodyY, 9, 15, armor);
  pixelRect(x + 2 + lowerLean, bodyY + 3, 7, 2, trim);
  pixelRect(x + 4 + lowerLean, bodyY, 3, 15, "#89a9ba");
  pixelRect(x + 2 + lowerLean, bodyY + 1, 2, 4, "#9bb8c6");
  pixelRect(x + 8 + lowerLean, bodyY + 1, 1, 13, "#263b50");
  pixelRect(x + 3 + lowerLean, bodyY + 9, 6, 1, "rgba(16,19,23,.82)");
  pixelRect(x + 1 + lowerLean, waistY, 9, 2, "#2f3d4b");
  pixelRect(x + 4 + lowerLean, waistY + 1, 3, 1, "#f3cc67");
  const drawHipSword = () => {
    if (!has("sword") || attacking) return;
    const side = -player.dir;
    const gait = run ? (walkFrame === 1 ? 1 : walkFrame === 3 ? -1 : 0) : crawling ? (walkFrame === 1 || walkFrame === 3 ? 0.5 : 0) : 0;
    const hipX = x + 5 + lowerLean + side * 6 - (dashPose ? player.dir * 2 : 0);
    const hipY = waistY + 1 + gait + (airborne ? -1 : 0);
    const sheath = "#1f2a35";
    pixelRect(hipX - (side < 0 ? 3 : 0), hipY, 5, 2, trim);
    pixelRect(hipX + side * 2, hipY - 2, 3, 3, "#f3cc67");
    for (let i = 0; i < 4; i++) {
      const sx = hipX + side * (2 + i * 2);
      const sy = hipY + 2 + i;
      pixelRect(sx, sy, 3, 2, sheath);
      pixelRect(sx + (side > 0 ? 2 : 0), sy, 1, 2, "#cfd8dc");
    }
    pixelRect(hipX + side * 10, hipY + 6, 3, 2, "#0c0f12");
  };
  drawHipSword();
  pixelRect(x - 2 + upperLean, bodyY + 1, 4, 3, armSilver);
  pixelRect(x + 9 + upperLean, bodyY + 1, 4, 3, armSilver);
  pixelRect(x - 2 + upperLean, bodyY + 3, 3, 2, armShadow);
  pixelRect(x + 10 + upperLean, bodyY + 3, 3, 2, armShadow);
  const leftArmX = x - 2 + upperLean;
  const rightArmX = x + 10 + upperLean;
  const frontArmX = player.dir > 0 ? rightArmX : leftArmX;
  const backArmX = player.dir > 0 ? leftArmX : rightArmX;
  const frontDir = player.dir;
  const jumpPose = airborne && !attacking && !blocking && !bashing && !dashPose && !bellDashing && !chargingBell && !healing;
  const drawRelaxedArm = (ax, swing, bright) => {
    const shade = bright ? armSilver : armShadow;
    const low = bright ? armShadow : armSilver;
    const ay = bodyY + 4 + swing;
    const walkBend = run ? (bright ? armSwing : -armSwing) : 0;
    pixelRect(ax, ay, 3, 5, shade);
    pixelRect(ax + walkBend, ay + 5, 3, 4, low);
    pixelRect(ax + walkBend + (run ? frontDir : 0), ay + 8, 3, 2, skin);
  };
  const drawJumpArm = (ax, side, bright) => {
    const shade = bright ? armSilver : armShadow;
    const low = bright ? armShadow : armSilver;
    const lift = player.vy < 0 ? 1 : 0;
    const shoulderY = bodyY + 1 - lift;
    pixelRect(ax + side, shoulderY - 5, 3, 6, shade);
    pixelRect(ax + side * 2, shoulderY - 8, 3, 4, low);
    pixelRect(ax + side * 2, shoulderY - 10, 3, 2, skin);
  };
  const drawDashArm = (ax, bright, yOffset = 0) => {
    const shade = bright ? armSilver : armShadow;
    const low = bright ? armShadow : armSilver;
    const back = -player.dir;
    const ay = bodyY + 3 + yOffset;
    pixelRect(ax + back, ay, 3, 5, shade);
    pixelRect(ax + back * 4, ay + 3, 5, 3, low);
    pixelRect(ax + back * 8, ay + 4, 4, 2, skin);
  };
  if (jumpPose) drawJumpArm(backArmX, -frontDir, false);
  else if (dashPose) drawDashArm(backArmX, false, 1);
  else drawRelaxedArm(backArmX, -armSwing, false);
  if (windup && upSlash) {
    pixelRect(frontArmX, y - 7, 3, 10, armSilver);
    pixelRect(frontArmX, y - 11, 3, 5, skin);
    pixelRect(x + 4, y - 14, 4, 15, armShadow);
    pixelRect(x + 3, y - 26, 3, 18, "#fff1bd");
  } else if (windup) {
    pixelRect(frontArmX, bodyY + 3, 3, 8, armSilver);
    pixelRect(frontArmX + frontDir * 2, bodyY + 8, 4, 2, skin);
    pixelRect(x - player.dir * 7, y + 1, 4, 7, armSilver);
    pixelRect(x - player.dir * 11, y - 4, 12, 2, "#fff1bd");
  } else if (dashPose) {
    drawDashArm(frontArmX, true);
  } else if (slash && upSlash) {
    pixelRect(frontArmX, y - 8, 3, 11, armSilver);
    pixelRect(frontArmX, y - 11, 3, 3, skin);
    pixelRect(x + 5 + lean, y - 12, 4, 16, armSilver);
  } else if (slash) {
    pixelRect(frontArmX, bodyY + 3, 3, 7, armSilver);
    pixelRect(frontArmX + frontDir * 2, bodyY + 7, 5, 2, skin);
    pixelRect(x + (player.dir > 0 ? 10 : -4) + lean, y + 2, 5, 9, armSilver);
    pixelRect(x + (player.dir > 0 ? 14 : -7) + lean, y + 4, 4, 3, armShadow);
  } else if (recover) {
    if (followThrough) {
      pixelRect(frontArmX + frontDir * 2, bodyY + 5, 3, 8, armSilver);
      pixelRect(frontArmX + frontDir * 4, bodyY + 11, 4, 2, skin);
      pixelRect(x + (player.dir > 0 ? 13 : -6) + lean, y + 9, 8, 3, armSilver);
      pixelRect(x + (player.dir > 0 ? 19 : -11) + lean, y + 11, 7, 2, "#fff1bd");
    } else {
      pixelRect(frontArmX, bodyY + 5, 3, 7, armSilver);
      pixelRect(frontArmX + frontDir, bodyY + 11, 4, 2, skin);
      pixelRect(x + (player.dir > 0 ? 8 : -1), y + 7, 6, 4, armSilver);
    }
  } else {
    if (jumpPose) {
      drawJumpArm(frontArmX, frontDir, true);
      pixelRect(frontArmX + frontDir, bodyY - 3 + (player.vy < 0 ? -1 : 0), 2, 4, "#7f8f9c");
    } else {
      drawRelaxedArm(frontArmX, armSwing, true);
      pixelRect(frontArmX + frontDir, bodyY + 6 + armSwing, 2, 3, "#7f8f9c");
    }
  }
  if (airborne) {
    pixelRect(x + 1 + lean, y + 14, 3, 11, "#232a31");
    pixelRect(x + 7 + lean, y + 13, 3, 11, "#232a31");
    pixelRect(x + 3 + lean, y + 15, 1, 9, "#55606a");
    pixelRect(x + 9 + lean, y + 14, 1, 9, "#55606a");
    pixelRect(x + 1 + lean, y + 21, 3, 3, "#2f3d4b");
    pixelRect(x + 7 + lean, y + 20, 3, 3, "#2f3d4b");
    pixelRect(x - 1 + lean, y + 23, 6, 2, "#111");
    pixelRect(x + 6 + lean, y + 22, 6, 2, "#111");
  } else {
    const legPose = [
      { l: -1, r: 2, lk: 0, rk: 1, lf: -2, rf: 1, ly: 0, ry: 0 },
      { l: 1, r: 0, lk: 1, rk: 0, lf: 0, rf: 0, ly: 1, ry: 0 },
      { l: 2, r: -1, lk: 1, rk: 0, lf: 1, rf: -2, ly: 0, ry: 0 },
      { l: 0, r: 1, lk: 0, rk: 1, lf: 0, rf: 0, ly: 0, ry: 1 }
    ][walkFrame];
    const lx = x + 1 + lowerLean + legPose.l;
    const rx = x + 7 + lowerLean + legPose.r;
    pixelRect(lx, y + 13 + legPose.ly, 3, 9, "#232a31");
    pixelRect(rx, y + 13 + legPose.ry, 3, 9, "#232a31");
    pixelRect(lx + 2, y + 16 + legPose.ly, 1, 6 + legPose.lk, "#55606a");
    pixelRect(rx + 2, y + 16 + legPose.ry, 1, 6 + legPose.rk, "#55606a");
    pixelRect(lx, y + 20 + legPose.ly, 3, 3, "#2f3d4b");
    pixelRect(rx, y + 20 + legPose.ry, 3, 3, "#2f3d4b");
    pixelRect(lx - 2 + legPose.lf, y + 23, 7, 2, "#111");
    pixelRect(rx - 1 + legPose.rf, y + 23, 7, 2, "#111");
    if (run && (walkFrame === 0 || walkFrame === 2)) pixelRect((walkFrame === 0 ? lx - 3 : rx - 2), y + 25, 7, 1, "rgba(247,231,189,.28)");
    if (run && (walkFrame === 1 || walkFrame === 3)) pixelRect((walkFrame === 1 ? lx - 1 : rx - 1), y + 24, 5, 1, "rgba(137,169,186,.28)");
  }
  if ((blocking || bashing) && !(downSlash && attacking && has("shield"))) {
    const sx = x + (player.dir > 0 ? 10 : -9) + (shieldAge < 3 ? player.dir * 2 : 0);
    const bx = bashing ? sx + player.dir * (2 + bashAge * 0.25) : sx;
    pixelRect(bx, y + 0, bashing ? 10 : 8, 15, "#84c5d0");
    pixelRect(bx + 1, y + 2, bashing ? 8 : 6, 11, "#2d4658");
    pixelRect(bx + 3, y + 4, 2, 6, "#f7e7bd");
    if (bashing) {
      pixelRect(bx + (player.dir > 0 ? 9 : -4), y + 2, 4, 11, "rgba(166,240,223,.55)");
      pixelRect(bx + (player.dir > 0 ? 13 : -8), y + 5, 5, 5, "rgba(255,255,255,.28)");
    }
    if (shieldAge < 4 || frame % 10 < 4 || bashing) pixelRect(bx - 1, y - 1, 12, 17, "rgba(166,240,223,.22)");
  }
  if (blocking && has("shield")) {
    const meterX = x - 6;
    const meterY = y - 17;
    const fill = Math.round(24 * clamp(player.shield / SHIELD_MAX, 0, 1));
    pixelRect(meterX - 1, meterY - 1, 26, 5, "rgba(7,9,12,.78)");
    pixelRect(meterX, meterY, 24, 3, "#2d4658");
    pixelRect(meterX, meterY, fill, 3, player.parryTimer > 0 ? "#fff1bd" : "#84c5d0");
    if ((player.parryCharge || 0) > 0) pixelRect(meterX + 25, meterY, 3, 3, "#f3cc67");
  }
  const polish = Math.floor(frame / 6) % 4;
  pixelRect(x + 3 + upperLean, headY - 5, 2, 3, trim);
  pixelRect(x + 6 + upperLean, headY - 6 - (lookingUp ? 1 : 0), 2, 4, "#f7e7bd");
  pixelRect(x + (player.dir > 0 ? 10 : -2) + upperLean, headY + 3, 2, 4, "#6f7f8a");
  pixelRect(x + 1 + lowerLean, bodyY + 6, 1, 5, "#d7dce1");
  pixelRect(x + 9 + lowerLean, bodyY + 6, 1, 5, "#263b50");
  pixelRect(x + 5 + lowerLean, bodyY + 13, 2, 3, "#101317");
  if (run && polish % 2 === 0) pixelRect(x + 5 + lowerLean, bodyY + 2, 3, 1, "#d7dce1");
  const capeTail = capePoints[capePoints.length - 1] || { x: x + cape, y: bodyY + 20 };
  const capeMid = capePoints[Math.floor(capePoints.length * 0.55)] || capeTail;
  pixelRect(capeMid.x - 2, capeMid.y + 2 + step * 0.5, 3, 2, "#d59b44");
  pixelRect(capeTail.x + 1, capeTail.y + 1 + step * 0.5, 3, 2, "#d59b44");
  const breath = Math.sin(frame / 18) * 0.5;
  const visorBlink = frame % 90 > 72 ? 0.5 : 0;
  finePixelRect(x + 2 + upperLean, headY + 0.5, 6, 0.5, "rgba(255,255,255,.34)");
  finePixelRect(x + (player.dir > 0 ? 6.5 : 2.5) + upperLean, headY + 2.5 + visorBlink, 2.5, 0.5, "#050608");
  finePixelRect(x + 2.5 + lowerLean, bodyY + 2.5 + breath, 5, 0.5, "rgba(255,255,255,.2)");
  finePixelRect(x + 7.5 + lowerLean, bodyY + 4.5, 0.5, 7, "rgba(5,6,8,.45)");
  finePixelRect(x + 5 + lowerLean, waistY + 0.5, 2, 1, "#fff1bd");
  for (let i = 0; i < 4; i++) {
    const flap = Math.sin(frame / 6 + i) * 0.5;
    const p = capePoints[Math.min(capePoints.length - 1, i + 1)] || capeTail;
    if (i < 2) finePixelRect(p.x - 1 + i * 0.2, p.y + flap, 1, 2.5, "rgba(255,123,95,.3)");
  }
  if (run || airborne || player.dash > 0) {
    const trailCount = dashPose ? 6 : 5;
    for (let i = 0; i < trailCount; i++) {
      const len = dashPose ? 3 : 2;
      finePixelRect(x - player.dir * (5 + i * (dashPose ? 3 : 2.5)), y + 25 + (i % 2) * 0.5, len, 0.5, `rgba(247,231,189,${(dashPose ? 0.34 : 0.24) - i * 0.035})`);
    }
  }
  if (chargingBell || bellDashing) {
    for (let i = 0; i < 4; i++) {
      finePixelRect(x - player.dir * (11 + i * 4), y + 1 + ((frame + i) % 5), 3.5, 0.5, `rgba(255,241,189,${0.46 - i * 0.07})`);
      finePixelRect(x - player.dir * (15 + i * 4), y + 11 - ((frame + i) % 3), 2.5, 0.5, `rgba(215,190,122,${0.36 - i * 0.055})`);
    }
  }
  if (run) {
    pixelRect(x + 2 + lean - player.dir * 4, y + 24, 5, 1, "rgba(247,231,189,.42)");
    pixelRect(x + 8 + lean - player.dir * 6, y + 23, 6, 1, "rgba(137,169,186,.35)");
  }
  if (attacking && slash) {
    const sparkX = x + (player.dir > 0 ? 17 : -10);
    pixelRect(sparkX, y + 3 + (attackAge % 3), 4, 2, "rgba(255,241,189,.72)");
    pixelRect(sparkX + player.dir * 5, y + 8 - (attackAge % 4), 6, 2, "rgba(215,155,68,.55)");
    if (!upSlash && !downSlash) {
      const sweep = attackAge - 5;
      pixelRect(x + player.dir * (13 + sweep), y + 5 + Math.floor(sweep / 2), 8, 2, "rgba(255,255,255,.55)");
      pixelRect(x + player.dir * (18 + sweep), y + 8 + Math.floor(sweep / 3), 7, 2, "rgba(255,241,189,.58)");
      finePixelRect(x + player.dir * (22 + sweep), y + 3.5 + sweep * 0.6, 4, 0.5, "rgba(255,255,255,.72)");
    } else if (upSlash) {
      finePixelRect(x + 2, y - 16 + attackAge * 0.5, 8, 0.5, "rgba(255,255,255,.62)");
      finePixelRect(x + 9, y - 18 + attackAge * 0.35, 5, 0.5, "rgba(255,241,189,.5)");
    } else if (downSlash) {
      finePixelRect(x + 1, y + 23 - attackAge * 0.2, 9, 0.5, "rgba(255,255,255,.55)");
      finePixelRect(x + 8, y + 25 - attackAge * 0.25, 6, 0.5, "rgba(255,241,189,.45)");
    }
    for (let i = 0; i < 5; i++) {
      finePixelRect(sparkX + player.dir * (3 + i * 4), y + 4.5 + Math.sin(frame / 3 + i) * 5, 3, 0.5, `rgba(255,241,189,${0.62 - i * 0.08})`);
    }
  }
  if (chargingBell || bellDashing) {
    pixelRect(x - player.dir * 9, y - 4 + (frame % 6), 4, 2, "rgba(215,190,122,.62)");
    pixelRect(x - player.dir * 14, y + 6 + (frame % 4), 5, 2, "rgba(255,241,189,.38)");
  }
  const box = attackBox();
  if (box) {
    if (downSlash && has("shield")) {
      const shieldBob = slash ? 2 : windup ? -1 : 0;
      pixelRect(box.x + 2, box.y + shieldBob, box.w - 4, 12, "#84c5d0");
      pixelRect(box.x + 4, box.y + 2 + shieldBob, box.w - 8, 8, "#2d4658");
      pixelRect(box.x + box.w / 2 - 1, box.y + 1 + shieldBob, 2, 12, "#f7e7bd");
      pixelRect(box.x - 2, box.y + 9 + shieldBob, box.w + 4, 3, "rgba(166,240,223,.4)");
      if (slash) pixelRect(box.x - 4, box.y + 13, box.w + 8, 3, "rgba(255,255,255,.28)");
    } else if (box.arc) {
      drawSwordArc(box);
    } else {
      pixelRect(box.x + (player.dir > 0 ? 4 : box.w - 11), box.y + 9, 11, 2, "#f2d98b");
      pixelRect(box.x + (player.dir > 0 ? 13 : box.w - 14), box.y + 7, 3, 5, "#fff1bd");
    }
  }
}

function drawGuardianDeath(e) {
  const age = (e.deathMax || 1) - (e.deathTimer || 0);
  const t = age / (e.deathMax || 1);
  const x = e.x, y = e.y;
  const shudder = Math.sin(frame * 1.7) * (1 - t) * 3;
  const sink = t * 10;
  const flash = frame % 8 < 4;
  const color = e.type === "thornImp" ? "#6ea35f" : e.type === "ossuaryBird" ? "#f1d7a4" : e.type === "gargoyle" ? "#d7be7a" : e.type === "moonKnight" ? "#9fd0d0" : e.type === "anvilGuard" ? "#a596ff" : "#f0a642";
  const dark = e.type === "thornImp" ? "#1d3922" : e.type === "ossuaryBird" ? "#413934" : e.type === "gargoyle" ? "#2b3545" : e.type === "moonKnight" ? "#27384b" : e.type === "anvilGuard" ? "#17130e" : "#5b2417";
  const ember = e.type === "thornImp" ? "#d7b167" : e.type === "ossuaryBird" ? "#8f806d" : e.type === "gargoyle" ? "#69728a" : e.type === "moonKnight" ? "#f7e7bd" : e.type === "anvilGuard" ? "#f0a642" : "#c6423c";
  pixelRect(x - 12, y + e.h + 2, e.w + 24, 4, `rgba(0,0,0,${0.34 + t * 0.28})`);
  for (let i = 0; i < 4; i++) {
    const px = x + 4 + i * Math.max(8, e.w / 5) + Math.sin(frame / 5 + i) * 3;
    const py = y + 4 + i * 5 - t * 26;
    pixelRect(px, py, 4 + i, 4 + i, i % 2 ? ember : color);
    if (age > 45) pixelRect(px - 3, py + 7, 10, 2, "rgba(255,241,189,.32)");
  }
  if (e.type === "hound") {
    pixelRect(x + 4 + shudder, y + 11 + sink, 30, 13, flash ? "#fff1bd" : dark);
    pixelRect(x + 12 - shudder, y + 5 + sink, 24, 9, flash ? "#fff" : "#8a1f2d");
    pixelRect(x + 31 + shudder, y + 9 + sink, 13, 10, flash ? "#fff1bd" : dark);
    pixelRect(x + 8, y + 20 + sink, 30, 3, color);
    pixelRect(x + 3, y + 27 + sink, 38, 3, "rgba(198,66,60,.45)");
  } else if (e.type === "ossuaryBird") {
    pixelRect(x + 8 + shudder, y + 7 + sink, 28, 12, flash ? "#fff" : "#f1d7a4");
    pixelRect(x + 16 - shudder, y + 1 + sink, 16, 9, flash ? "#fff1bd" : "#d7d2be");
    pixelRect(x - 5, y + 11 + sink, 18, 5, dark);
    pixelRect(x + 34, y + 11 + sink, 20, 5, dark);
    pixelRect(x + 20, y + 19 + sink, 11, 6, ember);
    pixelRect(x + 14, y + 26 + sink, 4, 10, color);
    pixelRect(x + 32, y + 25 + sink, 4, 10, color);
    pixelRect(x + 4, y + 32 + sink, e.w - 2, 3, "rgba(241,215,164,.42)");
  } else if (e.type === "moonKnight") {
    pixelRect(x + 7 + shudder, y + 5 + sink, 22, 12, flash ? "#fff" : "#9fd0d0");
    pixelRect(x + 9 - shudder, y + 15 + sink, 24, 18, flash ? "#fff1bd" : dark);
    pixelRect(x + 4, y + 12 + sink, 31, 2, "#f7e7bd");
    pixelRect(x + 25 + shudder, y - 2 + sink, 6, 30, "#f7e7bd");
    pixelRect(x + 29 + shudder, y - 8 + sink, 3, 13, "#9fd0d0");
    pixelRect(x + 12, y + 31 + sink, 18, 4, "rgba(159,208,208,.45)");
  } else if (e.type === "anvilGuard") {
    pixelRect(x + 6 + shudder, y + 7 + sink, 30, 23, flash ? "#fff" : dark);
    pixelRect(x + 12 - shudder, y - 2 + sink, 18, 13, flash ? "#fff1bd" : "#6d6255");
    pixelRect(x + 8, y + 14 + sink, 27, 4, color);
    pixelRect(x + 26 + shudder, y + 5 + sink, 20, 5, ember);
    pixelRect(x + 39 + shudder, y - 1 + sink, 6, 18, "#f0a642");
    pixelRect(x + 15, y + 30 + sink, 18, 5, "rgba(165,150,255,.48)");
    pixelRect(x + 4, y - 9 + sink, e.w + 10, 2, "rgba(240,166,66,.58)");
  } else if (e.type === "gargoyle") {
    pixelRect(x + 8 + shudder, y + 10 + sink, 25, 15, flash ? "#fff" : "#69728a");
    pixelRect(x + 12 - shudder, y + 2 + sink, 17, 11, flash ? "#fff1bd" : "#8b92a2");
    pixelRect(x + 5, y - 4 + sink, 5, 12, color);
    pixelRect(x + 30, y - 4 + sink, 5, 12, color);
    pixelRect(x - 8, y + 13 + sink, 18, 5, dark);
    pixelRect(x + 32, y + 13 + sink, 20, 5, dark);
    pixelRect(x + 17, y + 20 + sink, 8, 8, ember);
    pixelRect(x + 10, y + 30 + sink, e.w - 4, 3, "rgba(215,190,122,.44)");
  } else {
    if (e.type === "boneGuard") {
      pixelRect(x + 5 + shudder, y + 9 + sink, 22, 19, flash ? "#fff" : "#303239");
      pixelRect(x + 9 - shudder, y + 1 + sink, 15, 10, flash ? "#fff1bd" : "#d7d2be");
      pixelRect(x + 25, y + 11 + sink, 15, 18, flash ? "#fff" : "#84c5d0");
      pixelRect(x + 29, y + 15 + sink, 7, 10, "#2d4658");
      pixelRect(x + 30, y + 13 + sink, 3, 14, "#f3cc67");
      pixelRect(x + 8, y + 30 + sink, e.w - 8, 3, "rgba(132,197,208,.45)");
    } else {
    pixelRect(x + 4 + shudder, y + 13 + sink, 26, 16, flash ? "#fff1bd" : "#24491f");
    pixelRect(x + 8 - shudder, y + 6 + sink, 18, 10, flash ? "#fff" : "#4f7b32");
    pixelRect(x + 11, y - 2 + sink, 5, 13, ember);
    pixelRect(x + 18, y - 5 + sink, 5, 16, ember);
    pixelRect(x - 5, y + 24 + sink, e.w + 12, 5, "rgba(28,57,34,.7)");
    pixelRect(x + 2, y + 31 + sink, e.w + 6, 3, "rgba(110,163,95,.45)");
    }
  }
  if (t > 0.62) {
    const fade = Math.min(1, (t - 0.62) / 0.38);
    pixelRect(x - 14, y - 10, e.w + 28, e.h + 24, `rgba(255,241,189,${0.16 * fade})`);
    drawTinyText(e.type === "thornImp" ? "ROOTS RELEASED" : e.type === "ossuaryBird" ? "BONES UNBOUND" : e.type === "gargoyle" ? "BELLS SILENCED" : e.type === "boneGuard" ? "AEGIS DROPPED" : e.type === "penitent" ? "EMBER CLAIMED" : e.type === "moonKnight" ? "HOOK RELEASED" : e.type === "anvilGuard" ? "TIME UNBOUND" : "OATH BROKEN", x - 10, y - 18, "#ffe7a5");
  }
}

function drawIronKingThroneIntro(e, t) {
  const x = e.x;
  const y = e.y;
  const rise = clamp((t - 0.34) / 0.34, 0, 1);
  const ready = clamp((t - 0.72) / 0.28, 0, 1);
  const quake = t > 0.35 && t < 0.74 ? (frame % 4 < 2 ? 1 : -1) : 0;
  const bodyDrop = Math.round((1 - rise) * 17 - ready * 2);
  const headDrop = Math.round((1 - rise) * 20 - ready * 2);
  const lean = Math.round((1 - rise) * 4);
  const throneX = x + 1 + quake;
  const throneY = y - 31;
  ctx.save();
  ctx.strokeStyle = `rgba(243,204,103,${0.26 + ready * 0.2})`;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(Math.round(x + e.w / 2 + cameraX), Math.round(y + 21 + cameraY), 36 + t * 42, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  pixelRect(throneX + 11, throneY + 0, 50, 78, "#120b0f");
  pixelRect(throneX + 15, throneY + 6, 42, 68, "#3d2638");
  pixelRect(throneX + 18, throneY + 12, 36, 56, "#24171a");
  pixelRect(throneX + 7, throneY + 61, 62, 20, "#3d2638");
  pixelRect(throneX + 0, throneY + 68, 76, 13, "#150e12");
  pixelRect(throneX + 12, throneY + 4, 4, 70, "#79573e");
  pixelRect(throneX + 56, throneY + 4, 4, 70, "#79573e");
  pixelRect(throneX + 18, throneY - 5, 10, 12, "#f3cc67");
  pixelRect(throneX + 33, throneY - 10, 11, 17, "#f3cc67");
  pixelRect(throneX + 50, throneY - 5, 10, 12, "#f3cc67");
  pixelRect(throneX + 10, throneY + 28, 5, 29, "#f3cc67");
  pixelRect(throneX + 58, throneY + 28, 5, 29, "#f3cc67");
  pixelRect(throneX + 16, throneY + 77, 11, 16, "#120b0f");
  pixelRect(throneX + 51, throneY + 77, 11, 16, "#120b0f");
  if (t > 0.46 && frame % 8 < 4) {
    pixelRect(throneX - 4, throneY + 63, 10, 2, "rgba(243,204,103,.45)");
    pixelRect(throneX + 64, throneY + 45, 9, 2, "rgba(198,66,60,.42)");
  }

  const armor = t > 0.68 && frame % 8 < 4 ? "#303d47" : "#202935";
  const gold = "#f3cc67";
  const crown = ready > 0.4 && frame % 10 < 5 ? "#fff1bd" : gold;
  const kx = x + 13 + quake - lean;
  const bodyY = y + bodyDrop;
  const headY = y - 14 + headDrop;
  pixelRect(kx - 5, bodyY + 8, 16, 36, "#24171a");
  pixelRect(kx + 30, bodyY + 8, 16, 36, "#24171a");
  pixelRect(kx + 0, bodyY + 1, 32, 38, armor);
  pixelRect(kx + 5, bodyY + 5, 8, 4, "#101317");
  pixelRect(kx + 21, bodyY + 5, 8, 4, "#101317");
  pixelRect(kx + 7, bodyY + 16, 20, 4, gold);
  pixelRect(kx + 10, bodyY + 24, 14, 2, "#fff1bd");
  if (rise < 0.68) {
    pixelRect(kx - 10, bodyY + 18, 17, 6, "#cfd8dc");
    pixelRect(kx + 27, bodyY + 18, 17, 6, "#cfd8dc");
    pixelRect(kx + 4, bodyY + 35, 11, 8, "#161b20");
    pixelRect(kx + 19, bodyY + 35, 11, 8, "#161b20");
  } else {
    pixelRect(kx - 8, bodyY + 10, 8, 27, "#cfd8dc");
    pixelRect(kx + 32, bodyY + 10, 8, 27, "#cfd8dc");
    pixelRect(kx + 5, bodyY + 38, 9, 20, "#161b20");
    pixelRect(kx + 20, bodyY + 38, 9, 20, "#161b20");
    pixelRect(kx + 2, bodyY + 55, 14, 4, "#0c0f12");
    pixelRect(kx + 18, bodyY + 55, 14, 4, "#0c0f12");
  }
  pixelRect(kx + 3, headY + 0, 30, 16, armor);
  pixelRect(kx + 0, headY - 7, 36, 7, gold);
  pixelRect(kx + 4, headY - 14, 5, 9, "#fff1bd");
  pixelRect(kx + 17, headY - 18, 6, 12, crown);
  pixelRect(kx + 30, headY - 14, 5, 9, "#fff1bd");
  pixelRect(kx + 14, bodyY + 0, 6, 44, gold);
  if (t > 0.74) {
    const flare = Math.min(1, (t - 0.74) / 0.18);
    pixelRect(x - 10, y + 50, 84, 3, `rgba(243,204,103,${0.28 * flare})`);
    pixelRect(x + 7, y - 39, 56, 2, `rgba(255,241,189,${0.48 * flare})`);
    drawTinyText("IRON KING", x + 5, y - 48, "#ffe7a5");
  }
}

function drawBossRoar(e) {
  if (!(e.trialBoss || e.bossType === "ironKing") || !bossIntro || bossIntro.room !== player.room || bossIntro.type !== e.type || bossIntro.time <= 0) return false;
  const t = 1 - bossIntro.time / bossIntro.max;
  if (e.type === "ironKing" && bossIntro.ceremony === "throneRise") {
    drawIronKingThroneIntro(e, t);
    return true;
  }
  const x = e.x;
  const y = e.y;
  const pulse = Math.sin(frame / 3) * 2;
  const flash = frame % 10 < 5;
  const color = e.type === "thornImp" ? "#d7b167" : e.type === "boneGuard" ? "#84c5d0" : e.type === "ossuaryBird" ? "#f1d7a4" : e.type === "gargoyle" ? "#d7be7a" : e.type === "moonKnight" ? "#9fd0d0" : e.type === "anvilGuard" ? "#a596ff" : "#f0a642";
  const dark = e.type === "thornImp" ? "#1d3922" : e.type === "boneGuard" ? "#303239" : e.type === "ossuaryBird" ? "#413934" : e.type === "gargoyle" ? "#2b3545" : e.type === "moonKnight" ? "#27384b" : e.type === "anvilGuard" ? "#17130e" : "#5a342f";
  const cx = x + e.w / 2;
  const cy = y + e.h / 2;
  ctx.save();
  ctx.strokeStyle = `rgba(255,241,189,${0.48 - t * 0.2})`;
  ctx.lineWidth = 2;
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.arc(Math.round(cx + cameraX), Math.round(cy + cameraY), 18 + i * 18 + t * 24, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
  if (e.type === "hound") {
    pixelRect(x + 2, y + 8 + pulse, 34, 16, dark);
    pixelRect(x + 12, y + 1 + pulse, 25, 11, flash ? "#8a1f2d" : "#875045");
    pixelRect(x + 32, y + 7 + pulse, 15, 12, dark);
    pixelRect(x + 39, y + 3 + pulse, 9, 4, color);
    pixelRect(x + 8, y - 2 + pulse, 8, 8, color);
    pixelRect(x + 25, y - 4 + pulse, 8, 9, color);
    pixelRect(x + 15, y + 9 + pulse, 5, 3, "#101317");
    pixelRect(x + 30, y + 10 + pulse, 5, 3, "#101317");
    pixelRect(x + 38, y + 16 + pulse, 8, 3, "#fff1bd");
    pixelRect(x + 5, y + 24, 38, 7, "#2b1714");
    pixelRect(x + 8, y + 31, 8, 9, "#14100e");
    pixelRect(x + 29, y + 31, 8, 9, "#14100e");
  } else if (e.type === "thornImp") {
    pixelRect(x + 6, y + 8 - pulse, 22, 17, flash ? "#4f7b32" : "#24491f");
    pixelRect(x + 10, y + 1 - pulse, 17, 10, "#6ea35f");
    pixelRect(x + 11, y - 8 - pulse, 5, 14, color);
    pixelRect(x + 22, y - 10 - pulse, 5, 16, color);
    pixelRect(x - 9, y + 21, e.w + 18, 7, "rgba(28,57,34,.7)");
    pixelRect(x - 15, y + 27, e.w + 30, 3, "rgba(110,163,95,.5)");
    pixelRect(x + 13, y + 10 - pulse, 3, 3, "#101317");
    pixelRect(x + 22, y + 10 - pulse, 3, 3, "#101317");
  } else if (e.type === "gargoyle") {
    pixelRect(x + 8, y + 9 - pulse, 26, 16, flash ? "#8b92a2" : "#69728a");
    pixelRect(x + 13, y + 1 - pulse, 18, 11, "#8b92a2");
    pixelRect(x - 18, y + 10 - pulse, 31, 7, dark);
    pixelRect(x + 30, y + 10 - pulse, 34, 7, dark);
    pixelRect(x + 8, y - 7 - pulse, 6, 13, color);
    pixelRect(x + 29, y - 8 - pulse, 6, 14, color);
    pixelRect(x + 36, y + 7 - pulse, 10, 4, "#fff1bd");
    pixelRect(x + 16, y + 18 - pulse, 12, 8, "#d7be7a");
  } else if (e.type === "boneGuard") {
    pixelRect(x + 7, y + 7 - pulse, 21, 22, "#303239");
    pixelRect(x + 10, y - 1 - pulse, 16, 11, "#d7d2be");
    pixelRect(x + 28, y + 7 - pulse, 17, 23, "#84c5d0");
    pixelRect(x + 32, y + 11 - pulse, 8, 14, "#2d4658");
    pixelRect(x + 33, y + 8 - pulse, 3, 19, "#f3cc67");
    pixelRect(x - 8, y + 15 - pulse, 20, 4, "#fff1bd");
  } else if (e.type === "ossuaryBird") {
    pixelRect(x + 10, y + 8 - pulse, 28, 12, "#f1d7a4");
    pixelRect(x + 17, y + 0 - pulse, 16, 9, "#d7d2be");
    pixelRect(x - 16, y + 10 - pulse, 30, 5, dark);
    pixelRect(x + 33, y + 10 - pulse, 34, 5, dark);
    pixelRect(x + 38, y + 5 - pulse, 9, 4, "#fff1bd");
    pixelRect(x + 20, y + 20, 7, 12, color);
    pixelRect(x + 34, y + 20, 7, 12, color);
  } else if (e.type === "penitent") {
    pixelRect(x + 8, y + 6 - pulse, 24, 24, "#5b2417");
    pixelRect(x + 12, y - 2 - pulse, 17, 11, "#d7d2be");
    pixelRect(x + 28, y + 4 - pulse, 20, 5, "#ff7a3d");
    pixelRect(x + 43, y - 2 - pulse, 6, 18, "#fff1bd");
    pixelRect(x + 5, y + 29, 31, 5, "rgba(255,122,61,.45)");
    pixelRect(x + 15, y + 9 - pulse, 4, 3, "#101317");
  } else if (e.type === "moonKnight") {
    pixelRect(x + 7, y + 5 - pulse, 22, 13, "#9fd0d0");
    pixelRect(x + 9, y + 16 - pulse, 25, 18, dark);
    pixelRect(x + 28, y - 8 - pulse, 5, 36, "#f7e7bd");
    pixelRect(x + 32, y - 12 - pulse, 3, 14, "#9fd0d0");
    pixelRect(x - 5, y + 13 - pulse, 28, 2, "#f7e7bd");
    pixelRect(x + 11, y + 32, 21, 4, "rgba(159,208,208,.42)");
  } else if (e.type === "anvilGuard") {
    pixelRect(x + 7, y + 7 - pulse, 30, 24, dark);
    pixelRect(x + 12, y - 3 - pulse, 20, 14, "#6d6255");
    pixelRect(x + 10, y + 14 - pulse, 25, 5, color);
    pixelRect(x + 30, y + 4 - pulse, 23, 5, "#f0a642");
    pixelRect(x + 48, y - 2 - pulse, 7, 20, "#fff1bd");
    pixelRect(x + 12, y + 31, 25, 4, "rgba(165,150,255,.46)");
  } else if (e.type === "ironKing") {
    pixelRect(x + 9, y + 4 - pulse, 40, 42, flash ? "#303d47" : "#202935");
    pixelRect(x + 15, y - 10 - pulse, 30, 14, "#cfd8dc");
    pixelRect(x + 11, y - 18 - pulse, 38, 8, color);
    pixelRect(x + 19, y - 27 - pulse, 6, 12, "#fff1bd");
    pixelRect(x + 29, y - 31 - pulse, 7, 16, "#f3cc67");
    pixelRect(x + 41, y - 27 - pulse, 6, 12, "#fff1bd");
    pixelRect(x - 2, y + 12 - pulse, 18, 30, "#3d1624");
    pixelRect(x + 44, y + 12 - pulse, 18, 30, "#3d1624");
    pixelRect(x + 23, y + 11 - pulse, 5, 4, "#101317");
    pixelRect(x + 37, y + 11 - pulse, 5, 4, "#101317");
    pixelRect(x + 22, y + 26 - pulse, 20, 4, "#f3cc67");
  }
  drawTinyText("...", x + e.w / 2 - 5, y - 12 - pulse, color);
  return true;
}

function drawEnemy(e) {
  if (e.dying) {
    drawGuardianDeath(e);
    return;
  }
  if (e.hp <= 0) return;
  if (drawBossRoar(e)) return;
  const x = e.x, y = e.y;
  const f = Math.floor(frame / 8) % 2;
  const ghost = ["wraith", "starWraith"].includes(e.type);
  const hit = e.hurt ? "#fff" : null;
  if (e.boss) {
    if (e.bossType === "ironKing") {
      const phaseLevel = e.hp <= e.max * 0.22 ? 3 : e.hp <= e.max * 0.35 ? 2 : e.hp <= e.max * 0.68 ? 1 : 0;
      const crown = phaseLevel >= 3 ? "#fff1bd" : phaseLevel === 2 ? "#c6423c" : phaseLevel === 1 ? "#f0a642" : "#f3cc67";
      const cape = phaseLevel >= 2 ? "#3d1624" : "#24171a";
      const armor = hit || (phaseLevel >= 3 ? "#202935" : "#303d47");
      const gold = hit || crown;
      const slashPose = ["kingSlash", "kingCombo", "crownUpper"].includes(e.move);
      const pulsePose = e.move === "crownPulse" || e.move === "crownRewind";
      const dashPose = e.move === "throneDash" || e.move === "airEscapeDash";
      const lean = e.move === "airEscapeDash" ? -(e.airDashDir || e.dir) * 6 : dashPose ? e.dir * 5 : slashPose ? e.dir * 3 : 0;
      if (e.radialWave > 0) {
        ctx.strokeStyle = phaseLevel >= 3 ? "rgba(255,241,189,.55)" : "rgba(243,204,103,.45)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(e.x + e.w / 2, e.y + 24, e.radialWave, 0, Math.PI * 2);
        ctx.stroke();
        ctx.lineWidth = 1;
      }
      if (phaseLevel) {
        pixelRect(x - 12, y + 10 + f, 8, 8, crown);
        pixelRect(x + e.w + 5, y + 24 - f, 8, 8, crown);
        pixelRect(x - 10, y - 8, e.w + 20, 2, "rgba(243,204,103,.45)");
      }
      if (e.move === "airEscapeDash") {
        const trailDir = e.airDashDir || e.dir;
        for (let i = 1; i <= 3; i++) pixelRect(x - trailDir * i * 11 + 12, y + 6 + i * 3, e.w - 18, 3, `rgba(198,66,60,${0.22 - i * 0.045})`);
      }
      pixelRect(x + 7 - lean, y + 8, 14, 44, cape);
      pixelRect(x + 36 - lean, y + 8, 14, 44, cape);
      pixelRect(x + 16 + lean, y - 14 + (pulsePose ? -2 : 0), 26, 16, armor);
      pixelRect(x + 13 + lean, y - 21 + (pulsePose ? -3 : 0), 32, 7, gold);
      pixelRect(x + 17 + lean, y - 28, 5, 9, "#fff1bd");
      pixelRect(x + 28 + lean, y - 31, 6, 12, crown);
      pixelRect(x + 39 + lean, y - 28, 5, 9, "#fff1bd");
      pixelRect(x + 13 + lean, y + 0, 32, 38, armor);
      pixelRect(x + 18 + lean, y + 4, 8, 4, "#101317");
      pixelRect(x + 34 + lean, y + 4, 8, 4, "#101317");
      pixelRect(x + 19 + lean, y + 16, 22, 4, gold);
      pixelRect(x + 22 + lean, y + 23, 16, 2, "#fff1bd");
      pixelRect(x + 9 + lean, y + 11, 8, 27, "#cfd8dc");
      pixelRect(x + 43 + lean, y + 11, 8, 27, "#cfd8dc");
      pixelRect(x + 6 + lean, y + 18, 8, 6, gold);
      pixelRect(x + 46 + lean, y + 18, 8, 6, gold);
      pixelRect(x + 18 + lean, y + 38, 9, 20, "#161b20");
      pixelRect(x + 33 + lean, y + 38, 9, 20, "#161b20");
      pixelRect(x + 15 + lean, y + 55, 14, 4, "#0c0f12");
      pixelRect(x + 31 + lean, y + 55, 14, 4, "#0c0f12");
      pixelRect(x + 27 + lean, y + 1, 6, 44, gold);
      if (slashPose) {
        const sx = e.dir > 0 ? x + 48 : x - 30;
        pixelRect(sx, y + (e.move === "crownUpper" ? -14 : 14), 34, 4, "#fff1bd");
        pixelRect(sx + (e.dir > 0 ? 20 : -8), y + (e.move === "crownUpper" ? -28 : 8), 18, 3, "rgba(255,241,189,.65)");
      }
      if (e.hookLine) {
        ctx.strokeStyle = "#f3cc67";
        ctx.beginPath();
        ctx.moveTo(x + e.w / 2, y + 16);
        ctx.lineTo(e.hookLine.x, e.hookLine.y);
        ctx.stroke();
        pixelRect(e.hookLine.x - 3, e.hookLine.y - 3, 6, 6, "#cfd8dc");
      }
      pixelRect(x - 8, y - 36, Math.round((e.hp / e.max) * (e.w + 16)), 4, "#c6423c");
      pixelRect(x - 9, y - 37, e.w + 18, 1, crown);
      return;
    }
    const phaseLevel = e.hp <= e.max * 0.35 ? 2 : e.hp <= e.max * 0.68 ? 1 : 0;
    const crown = phaseLevel === 2 ? "#c6423c" : phaseLevel === 1 ? "#f0a642" : "#f3cc67";
    const pulse = Math.sin(frame / 10) * 2;
    if (phaseLevel) {
      pixelRect(x - 8, y + 6 + f, 5, 5, crown);
      pixelRect(x + 38, y + 18 - f, 5, 5, crown);
      if (phaseLevel === 2) pixelRect(x - 10, y - 2, 54, 1, "rgba(198,66,60,.55)");
    }
    pixelRect(x + 5, y - 8 + pulse, 25, 7, hit || crown);
    pixelRect(x + 10, y - 14 + pulse, 5, 8, "#f7e7bd");
    pixelRect(x + 20, y - 14 - pulse, 5, 8, "#f7e7bd");
    pixelRect(x + 5, y, 25, 29, hit || (phaseLevel === 2 ? "#3d1624" : "#672232"));
    pixelRect(x + 1, y + 9, 7, 19, "#cfd8dc");
    pixelRect(x + 29, y + 9, 7, 19, "#cfd8dc");
    pixelRect(x + 12, y + 5, 4, 3, "#101317");
    pixelRect(x + 22, y + 5, 4, 3, "#101317");
    pixelRect(x + 9, y + 14, 20, 3, crown);
    pixelRect(x + 11, y + 18, 16, 1, "#f7e7bd");
    pixelRect(x + 8, y + 3, 3, 21, "#3b1824");
    pixelRect(x + 27, y + 3, 3, 21, "#3b1824");
    pixelRect(x + 16, y + 9, 6, 2, "#111");
    pixelRect(x + 10, y + 29, 5, 12, "#24171a");
    pixelRect(x + 22, y + 29, 5, 12, "#24171a");
    pixelRect(x - 7, y + 17 + f, 12 + phaseLevel * 4, 3, "#fff1bd");
    if (phaseLevel >= 1) pixelRect(x + 33, y + 10 - f, 5, 16, "#cfd8dc");
    pixelRect(x, y - 12, Math.round((e.hp / e.max) * e.w), 3, "#c6423c");
    return;
  }
  if (e.trialBoss) {
    const phaseLevel = e.hp <= e.max * 0.35 ? 2 : e.hp <= e.max * 0.68 ? 1 : 0;
    const aura = phaseLevel === 2 ? "#c6423c" : phaseLevel === 1 ? "#f0a642" : "#f3cc67";
    pixelRect(x - 5, y - 13, Math.round((e.hp / e.max) * (e.w + 10)), 3, "#c6423c");
    pixelRect(x - 6, y - 14, e.w + 12, 1, aura);
    if (phaseLevel) {
      pixelRect(x - 8, y + 4 + f, 4, 4, aura);
      pixelRect(x + e.w + 4, y + 12 - f, 4, 4, aura);
    }
    if (frame % 18 < 9) {
      pixelRect(x - 4, y + e.h + 1, e.w + 8, 2, "rgba(255,241,189,.18)");
      pixelRect(x + 3 + ((frame / 6) % 3), y - 8, 4, 2, `rgba(255,241,189,${phaseLevel ? ".5" : ".28"})`);
      pixelRect(x + e.w - 8 - ((frame / 5) % 4), y - 5, 3, 2, `rgba(240,166,66,${phaseLevel ? ".46" : ".24"})`);
    }
    if (phaseLevel >= 1) {
      pixelRect(x - 6, y + 2, 2, 18, "rgba(255,241,189,.2)");
      pixelRect(x + e.w + 4, y + 6, 2, 18, "rgba(255,241,189,.2)");
    }
    if (e.type === "hound") {
      const dir = e.dir || (e.vx >= 0 ? 1 : -1);
      const run = Math.abs(e.vx) > 1.3;
      const leg = run ? Math.floor(frame / 3) % 4 : Math.floor(frame / 10) % 2;
      const charge = e.move === "charge" || e.move === "chargeWindup";
      const howl = e.move === "howl";
      const leap = e.move === "leap" || e.move === "antiAirLeap";
      const antiAir = e.move === "antiAirLeap";
      const body = hit || (phaseLevel === 2 ? "#421824" : phaseLevel === 1 ? "#623024" : "#5a342f");
      const mane = phaseLevel === 2 ? "#c6423c" : "#8a1f2d";
      const chain = phaseLevel ? "#f0a642" : "#b48850";
      if (charge) {
        pixelRect(x - dir * 10, y + 10, 12, 5, "rgba(198,66,60,.38)");
        pixelRect(x - dir * 18, y + 14, 16, 3, "rgba(240,166,66,.35)");
      }
      if (antiAir) {
        pixelRect(x + 5, y + e.h + 2, 34, 3, "rgba(240,166,66,.38)");
        pixelRect(x + 13, y - 9, 6, 9, "#f0a642");
        pixelRect(x + 25, y - 8, 6, 8, "#c6423c");
      }
      pixelRect(x + 5, y + 11 + (leap ? -3 : 0), 28, 13, body);
      pixelRect(x + 10, y + 6 + (howl ? -3 : 0), 21, 10, mane);
      pixelRect(x + (dir > 0 ? 29 : -1), y + 8 + (howl ? -4 : 0), 15, 12, body);
      pixelRect(x + (dir > 0 ? 39 : -5), y + 11 + (howl ? -5 : 0), 6, 5, "#2a1315");
      pixelRect(x + (dir > 0 ? 34 : 4), y + 11 + (howl ? -5 : 0), 2, 2, "#fff1bd");
      pixelRect(x + (dir > 0 ? 41 : -7), y + 16 + (howl ? -4 : 0), 5, 2, "#fff1bd");
      pixelRect(x + 8, y + 16, 22, 3, chain);
      pixelRect(x + 12, y + 18, 4, 3, "#fff1bd");
      pixelRect(x + 1, y + 12, 8, 7, mane);
      pixelRect(x - 2, y + 15, 8, 3, "#2a1315");
      const l1 = leg === 1 ? 2 : leg === 3 ? -1 : 0;
      const l2 = leg === 1 ? -1 : leg === 3 ? 2 : 0;
      pixelRect(x + 8 + l1, y + 23, 5, 8, "#1a1110");
      pixelRect(x + 17 + l2, y + 23, 5, 8, "#1a1110");
      pixelRect(x + 27 - l1, y + 23, 5, 8, "#1a1110");
      pixelRect(x + 34 - l2, y + 22, 5, 8, "#1a1110");
      pixelRect(x + 7 + l1, y + 29, 8, 3, "#0b0707");
      pixelRect(x + 25 - l1, y + 29, 8, 3, "#0b0707");
      if (howl) {
        pixelRect(x + (dir > 0 ? 44 : -13), y + 4, 8, 2, "rgba(255,241,189,.65)");
        pixelRect(x + (dir > 0 ? 51 : -20), y + 1, 10, 2, "rgba(240,166,66,.45)");
        pixelRect(x + (dir > 0 ? 47 : -17), y + 9, 12, 2, "rgba(198,66,60,.36)");
      }
      if (phaseLevel === 2) pixelRect(x + 4, y + 5, 33, 1, "rgba(198,66,60,.7)");
      return;
    }
    if (e.type === "thornImp") {
      const cast = e.move === "rootSnare" || e.move === "thornVolley";
      const burrow = e.move === "burrow";
      const slam = e.move === "rootSlam";
      const pounce = e.move === "pounce" ? -3 : slam ? 4 : 0;
      const body = hit || (phaseLevel === 2 ? "#24491f" : phaseLevel === 1 ? "#356b2d" : "#4f7b32");
      const bark = phaseLevel === 2 ? "#5b2417" : "#3a2d1e";
      const crown = phaseLevel === 2 ? "#c6423c" : "#d7b167";
      if (burrow && e.moveTimer > 13) {
        pixelRect(x + 3, y + 24, 28, 8, "#1d3922");
        pixelRect(x + 8, y + 18, 18, 6, "rgba(110,163,95,.55)");
        pixelRect(x + 1, y + 27, 34, 3, "#101710");
        return;
      }
      if (slam) {
        const age = 40 - (e.moveTimer || 0);
        pixelRect(x - 12, y + e.h + 1, e.w + 24, 4, "rgba(110,163,95,.38)");
        pixelRect(x + 3, y + 27 + (age % 3), 30, 5, "rgba(215,177,103,.55)");
        pixelRect(x - 5, y + 18, 10, 4, "#d7b167");
        pixelRect(x + 29, y + 18, 10, 4, "#d7b167");
      }
      pixelRect(x + 3, y + 12 + pounce, 25, 17, body);
      pixelRect(x + 7, y + 6 + pounce, 18, 12, body);
      pixelRect(x + 11, y + 1 + pounce, 4, 9, crown);
      pixelRect(x + 17, y - 2 + pounce, 4, 12, crown);
      pixelRect(x + 5, y + 5 + pounce, 5, 9, bark);
      pixelRect(x + 24, y + 6 + pounce, 5, 10, bark);
      pixelRect(x + 8, y + 9 + pounce, 4, 3, "#101317");
      pixelRect(x + 20, y + 9 + pounce, 4, 3, "#101317");
      pixelRect(x + 12, y + 15 + pounce, 9, 2, "#d7b167");
      pixelRect(x + 4, y + 20 + pounce, 6, 3, "#1d3922");
      pixelRect(x + 22, y + 20 + pounce, 8, 3, "#1d3922");
      pixelRect(x + 6 + f, y + 28, 6, 6, bark);
      pixelRect(x + 21 - f, y + 28, 6, 6, bark);
      pixelRect(x + 2, y + 14 + pounce, 5, 14, "#2c4630");
      pixelRect(x + 27, y + 13 + pounce, 5, 15, "#2c4630");
      pixelRect(x - 3, y + 18 + (cast ? -3 : 0), 8, 3, crown);
      pixelRect(x + 29, y + 18 + (cast ? -3 : 0), 9, 3, crown);
      if (cast) {
        pixelRect(x - 10, y + 11, 12, 2, "rgba(215,177,103,.65)");
        pixelRect(x + 32, y + 9, 13, 2, "rgba(215,177,103,.65)");
        pixelRect(x + 9, y - 7, 14, 2, "rgba(110,163,95,.7)");
      }
      if (slam) {
        pixelRect(x - 10, y + 24, 50, 3, "rgba(110,163,95,.72)");
        pixelRect(x - 18, y + 31, 14, 4, "#d7b167");
        pixelRect(x + 37, y + 31, 14, 4, "#d7b167");
      }
      if (phaseLevel >= 1) {
        pixelRect(x + 2, y + 3, 29, 1, "rgba(215,177,103,.65)");
        pixelRect(x + 15, y - 6, 5, 4, aura);
      }
      if (phaseLevel === 2) pixelRect(x - 2, y + 7, 38, 1, "rgba(198,66,60,.62)");
      return;
    }
    if (e.type === "ossuaryBird") {
      const flap = Math.floor(frame / (phaseLevel === 2 ? 3 : 5)) % 4;
      const dive = e.move === "dive";
      const storm = e.move === "boneStorm";
      const body = hit || (phaseLevel === 2 ? "#d7d2be" : "#f1d7a4");
      const bone = phaseLevel === 2 ? "#fff1bd" : "#d7d2be";
      const rib = phaseLevel === 2 ? "#c6423c" : "#8f806d";
      const wingLift = dive ? 6 : storm ? -5 : flap === 1 ? -3 : flap === 3 ? 3 : 0;
      if (dive) {
        pixelRect(x - e.dir * 13, y + 17, 16, 4, "rgba(198,66,60,.35)");
        pixelRect(x - e.dir * 24, y + 20, 18, 3, "rgba(241,215,164,.32)");
      }
      pixelRect(x + 13, y + 9, 22, 12, body);
      pixelRect(x + 18, y + 3, 15, 9, bone);
      pixelRect(x + (e.dir > 0 ? 31 : 5), y + 5, 11, 8, body);
      pixelRect(x + (e.dir > 0 ? 39 : 1), y + 8, 8, 3, aura);
      pixelRect(x + (e.dir > 0 ? 34 : 11), y + 8, 2, 2, "#101317");
      pixelRect(x - 7, y + 12 + wingLift, 25, 6, rib);
      pixelRect(x - 12, y + 17 + wingLift, 20, 4, bone);
      pixelRect(x + 32, y + 12 - wingLift, 28, 6, rib);
      pixelRect(x + 43, y + 17 - wingLift, 18, 4, bone);
      pixelRect(x + 17, y + 17, 18, 3, "#413934");
      pixelRect(x + 21, y + 21, 13, 6, rib);
      pixelRect(x + 15, y + 25, 5, 9, bone);
      pixelRect(x + 31, y + 25, 5, 9, bone);
      pixelRect(x + 8, y + 6, 5, 6, aura);
      pixelRect(x + 36, y + 3, 4, 7, aura);
      if (storm) {
        pixelRect(x - 11, y + 2, 20, 2, "rgba(241,215,164,.65)");
        pixelRect(x + 36, y + 2, 22, 2, "rgba(241,215,164,.65)");
        pixelRect(x + 14, y - 5, 20, 2, "rgba(198,66,60,.45)");
      }
      if (phaseLevel >= 1) pixelRect(x + 8, y + 1, 35, 1, "rgba(198,66,60,.55)");
      return;
    }
    if (e.type === "penitent") {
      const cast = e.move === "cinderCast" || e.move === "emberMass" || e.move === "cinderHalo";
      const leap = e.move === "ashLeap";
      const body = hit || (phaseLevel === 2 ? "#5b2417" : phaseLevel === 1 ? "#6e2d22" : "#4f2730");
      const robe = phaseLevel === 2 ? "#c6423c" : "#8a1f2d";
      const ember = phaseLevel === 2 ? "#fff1bd" : "#ff7a3d";
      const yLift = leap ? -3 : 0;
      if (cast) {
        pixelRect(x - 13, y + 12, 11, 3, "rgba(255,122,61,.52)");
        pixelRect(x + e.w + 2, y + 10, 13, 3, "rgba(240,166,66,.48)");
        pixelRect(x + 9, y - 9, 24, 2, "rgba(255,241,189,.58)");
        if (e.move === "cinderHalo") {
          const pulse = Math.max(0, 40 - (e.moveTimer || 0));
          pixelRect(x - 15, y - 12 - (pulse % 6), e.w + 30, 3, "rgba(255,122,61,.62)");
          pixelRect(x - 9, y - 21 - (pulse % 5), e.w + 18, 2, "rgba(255,241,189,.55)");
          pixelRect(x + 5, y - 31 - (pulse % 4), 10, 8, "#ff7a3d");
          pixelRect(x + 24, y - 29 - (pulse % 4), 10, 8, "#ff7a3d");
        }
      }
      pixelRect(x + 8, y + 8 + yLift, 24, 22, body);
      pixelRect(x + 4, y + 18 + yLift, 32, 17, robe);
      pixelRect(x + 12, y + 2 + yLift, 16, 12, body);
      pixelRect(x + 10, y, 20, 4, "#24171a");
      pixelRect(x + 13, y - 4, 4, 8, ember);
      pixelRect(x + 23, y - 5, 4, 9, ember);
      pixelRect(x + 15, y + 6 + yLift, 3, 3, "#101317");
      pixelRect(x + 23, y + 6 + yLift, 3, 3, "#101317");
      pixelRect(x + 17, y + 13 + yLift, 9, 2, ember);
      pixelRect(x + 6, y + 19 + yLift, 7, 4, "#f0a642");
      pixelRect(x + 28, y + 18 + yLift, 8, 4, "#f0a642");
      pixelRect(x + 2, y + 22 + (cast ? -3 : 0), 9, 4, ember);
      pixelRect(x + 31, y + 21 + (cast ? -4 : 0), 10, 4, ember);
      pixelRect(x + 10 + f, y + 34, 7, 8, "#24171a");
      pixelRect(x + 24 - f, y + 34, 7, 8, "#24171a");
      pixelRect(x + 4, y + 37, 32, 3, "rgba(91,36,23,.58)");
      if (phaseLevel >= 1) {
        pixelRect(x + 6, y + 4, 30, 1, "rgba(255,122,61,.68)");
        pixelRect(x + 18, y - 10, 6, 4, aura);
      }
      if (phaseLevel === 2) {
        pixelRect(x - 2, y + 15, 44, 1, "rgba(198,66,60,.7)");
        pixelRect(x + 12, y + 18, 18, 2, "#fff1bd");
      }
      return;
    }
    if (e.type === "moonKnight") {
      const dir = e.dir || (e.vx >= 0 ? 1 : -1);
      const moving = Math.abs(e.vx || 0) > 0.55;
      const step = moving ? Math.floor(frame / 4) % 4 : Math.floor(frame / 12) % 2;
      const hook = e.move === "moonHook";
      const slashing = e.move === "quickSlash" || e.move === "tripleSlash";
      const dash = e.move === "crescentStep";
      const body = hit || (phaseLevel === 2 ? "#27384b" : phaseLevel === 1 ? "#344960" : "#3f4650");
      const plate = phaseLevel === 2 ? "#b8d8e4" : "#7fa0bd";
      const moon = phaseLevel === 2 ? "#fff1bd" : "#9fd0d0";
      const cloak = phaseLevel === 2 ? "#1b2030" : "#252b3a";
      const lift = dash ? -4 : 0;
      if (e.hookLine) {
        const hx = x + e.w / 2;
        const hy = y + 10;
        ctx.strokeStyle = "rgba(159,208,208,.78)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(Math.round(hx + cameraX), Math.round(hy + cameraY));
        ctx.lineTo(Math.round(e.hookLine.x + cameraX), Math.round(e.hookLine.y + cameraY));
        ctx.stroke();
        pixelRect(e.hookLine.x - 3, e.hookLine.y - 3, 6, 2, "#fff1bd");
        pixelRect(e.hookLine.x - 1, e.hookLine.y - 5, 2, 7, "#9fd0d0");
      }
      if (hook) {
        pixelRect(x - 18, y + 7, 15, 2, "rgba(159,208,208,.52)");
        pixelRect(x + e.w + 3, y + 7, 15, 2, "rgba(159,208,208,.52)");
        pixelRect(x + 12, y - 13, 10, 2, "rgba(255,241,189,.58)");
      }
      if (slashing) {
        const sx = dir > 0 ? x + e.w - 2 : x - 23;
        pixelRect(sx, y + 7 + lift, 25, 3, "#fff1bd");
        pixelRect(sx + (dir > 0 ? 15 : -4), y + 3 + lift, 13, 2, "rgba(159,208,208,.7)");
        pixelRect(sx + (dir > 0 ? 20 : -8), y + 12 + lift, 11, 2, "rgba(255,241,189,.55)");
      }
      if (dash) {
        pixelRect(x - dir * 22, y + 21, 26, 3, "rgba(159,208,208,.4)");
        pixelRect(x - dir * 14, y + 27, 18, 2, "rgba(255,241,189,.28)");
      }
      pixelRect(x + 7, y + 2 + lift, 20, 10, plate);
      pixelRect(x + 4, y + 10 + lift, 26, 22, body);
      pixelRect(x + 7, y + 14 + lift, 20, 4, moon);
      pixelRect(x + 11, y - 3 + lift, 12, 8, plate);
      pixelRect(x + 8, y - 5 + lift, 18, 3, moon);
      pixelRect(x + 13, y + 1 + lift, 2, 2, "#101317");
      pixelRect(x + 21, y + 1 + lift, 2, 2, "#101317");
      pixelRect(x + 15, y + 6 + lift, 7, 2, "#fff1bd");
      pixelRect(x + (dir > 0 ? 2 : 27), y + 12 + lift, 8, 20, cloak);
      pixelRect(x + (dir > 0 ? -1 : 29), y + 17 + (hook ? -5 : f) + lift, 10, 4, moon);
      pixelRect(x + (dir > 0 ? 27 : -10), y + 13 + (slashing ? -3 : f) + lift, 16, 3, "#fff1bd");
      pixelRect(x + (dir > 0 ? 38 : -13), y + 8 + (slashing ? -7 : f) + lift, 3, slashing ? 18 : 10, "#d7d2be");
      pixelRect(x + 8 + (step === 1 ? 2 : step === 3 ? -1 : 0), y + 32 + lift, 7, 9, "#20252a");
      pixelRect(x + 21 + (step === 1 ? -1 : step === 3 ? 2 : 0), y + 32 + lift, 7, 9, "#20252a");
      pixelRect(x + 5, y + 40 + lift, 12, 3, "#111722");
      pixelRect(x + 19, y + 40 + lift, 12, 3, "#111722");
      pixelRect(x + 3, y + 8 + lift, 3, 24, "rgba(159,208,208,.28)");
      pixelRect(x + 28, y + 8 + lift, 3, 24, "rgba(255,241,189,.18)");
      if (phaseLevel >= 1) {
        pixelRect(x + 5, y - 9 + lift, 26, 2, "rgba(159,208,208,.68)");
        pixelRect(x + 16, y - 15 + lift, 5, 6, moon);
      }
      if (phaseLevel === 2) {
        pixelRect(x - 4, y + 8 + lift, e.w + 8, 1, "rgba(255,241,189,.72)");
        pixelRect(x + 10, y + 20 + lift, 15, 2, "#fff1bd");
      }
      return;
    }
    if (e.type === "anvilGuard") {
      const dir = e.dir || (e.vx >= 0 ? 1 : -1);
      const step = Math.abs(e.vx || 0) > 0.45 ? Math.floor(frame / 5) % 4 : Math.floor(frame / 12) % 2;
      const snare = e.move === "timeSnare";
      const freeze = e.move === "hourFreeze";
      const rewinding = e.move === "timeRewind";
      const swing = e.move === "hammerSwing";
      const lunge = e.move === "gearLunge";
      const clockPhase = e.rewound ? 2 : phaseLevel;
      const iron = hit || (clockPhase === 2 ? "#3b3030" : "#4f473f");
      const brass = clockPhase === 2 ? "#fff1bd" : "#f0a642";
      const violet = clockPhase === 2 ? "#c7b8ff" : "#a596ff";
      if (snare || freeze) {
        const pulse = (snare ? 48 : 58) - (e.moveTimer || 0);
        for (let i = 0; i < (freeze ? 3 : 2); i++) {
          const r = 24 + pulse * (freeze ? 2.1 : 1.45) - i * 18;
          if (r <= 4) continue;
          ctx.strokeStyle = i === 0 ? "rgba(165,150,255,.55)" : "rgba(240,166,66,.28)";
          ctx.lineWidth = i === 0 ? 3 : 2;
          ctx.beginPath();
          ctx.arc(Math.round(x + e.w / 2 + cameraX), Math.round(y + 19 + cameraY), r, 0, Math.PI * 2);
          ctx.stroke();
        }
        pixelRect(x + 5, y - 13, 32, 3, "rgba(165,150,255,.66)");
        pixelRect(x + 13, y - 19, 16, 5, brass);
      }
      if (rewinding) {
        const age = 150 - (e.moveTimer || 0);
        const cx = Math.round(x + e.w / 2 + cameraX);
        const cy = Math.round(y + 17 + cameraY);
        for (let i = 0; i < 4; i++) {
          const r = 18 + ((age * (1.1 + i * 0.16)) % 64) - i * 7;
          if (r <= 6) continue;
          ctx.strokeStyle = i % 2 === 0 ? "rgba(255,241,189,.58)" : "rgba(165,150,255,.45)";
          ctx.lineWidth = i === 0 ? 3 : 2;
          ctx.beginPath();
          ctx.arc(cx, cy, r, Math.PI * 1.85, Math.PI * 0.18, true);
          ctx.stroke();
          pixelRect(x + e.w / 2 - r, y + 16, 5, 2, "rgba(255,241,189,.5)");
          pixelRect(x + e.w / 2 + r - 5, y + 16, 5, 2, "rgba(165,150,255,.42)");
        }
        pixelRect(x + 8, y - 20, 28, 4, "#fff1bd");
        pixelRect(x + 13, y - 16, 18, 5, "#a596ff");
        pixelRect(x + 18, y - 11, 8, 9, "#fff1bd");
        pixelRect(x + 20, y - 8, 4, 3, "#3b3030");
      }
      if (lunge) {
        pixelRect(x - dir * 22, y + 25, 25, 3, "rgba(165,150,255,.38)");
        pixelRect(x - dir * 14, y + 31, 18, 2, "rgba(240,166,66,.32)");
      }
      pixelRect(x + 7, y + 8, 29, 24, iron);
      pixelRect(x + 11, y, 20, 13, "#6d6255");
      pixelRect(x + 9, y + 4, 24, 4, brass);
      pixelRect(x + 15, y + 4, 3, 3, "#101317");
      pixelRect(x + 24, y + 4, 3, 3, "#101317");
      pixelRect(x + 18, y + 11, 8, 2, violet);
      pixelRect(x + 10, y + 15, 23, 4, violet);
      pixelRect(x + 5, y + 18, 5, 14, "#2b2424");
      pixelRect(x + 34, y + 17, 6, 15, "#2b2424");
      pixelRect(x + (dir > 0 ? 31 : -15), y + (swing ? 6 : 16 + f), 23, 5, brass);
      pixelRect(x + (dir > 0 ? 48 : -19), y + (swing ? -1 : 11 + f), 7, 20, "#f0a642");
      pixelRect(x + 10 + (step === 1 ? 2 : step === 3 ? -1 : 0), y + 32, 8, 10, "#17130e");
      pixelRect(x + 25 + (step === 1 ? -1 : step === 3 ? 2 : 0), y + 32, 8, 10, "#17130e");
      pixelRect(x + 7, y + 40, 13, 3, "#0b0707");
      pixelRect(x + 23, y + 40, 14, 3, "#0b0707");
      pixelRect(x + 4, y + 9, 3, 22, "rgba(240,166,66,.35)");
      if (clockPhase >= 1) {
        pixelRect(x + 4, y - 6, 34, 2, "rgba(165,150,255,.7)");
        pixelRect(x + 18, y - 12, 6, 6, violet);
      }
      if (clockPhase === 2) {
        pixelRect(x - 3, y + 13, e.w + 6, 1, "rgba(255,241,189,.7)");
        pixelRect(x + 2, y + 33, e.w + 7, 2, "rgba(165,150,255,.32)");
      }
      return;
    }
    if (e.type === "gargoyle") {
      const flap = Math.floor(frame / (phaseLevel === 2 ? 3 : 5)) % 4;
      const swoop = e.move === "swoop";
      const peal = e.move === "sonicPeal" || e.move === "aegisPeal";
      const aegisPeal = e.move === "aegisPeal";
      const stone = hit || (phaseLevel === 2 ? "#8b92a2" : "#69728a");
      const darkStone = phaseLevel === 2 ? "#303239" : "#2b3545";
      const horn = phaseLevel === 2 ? "#f0a642" : "#d7be7a";
      const wingLift = swoop ? 5 : peal ? -4 : flap === 1 ? -3 : flap === 3 ? 2 : 0;
      if (swoop) {
        pixelRect(x - e.dir * 14, y + 18, 17, 4, "rgba(215,190,122,.35)");
        pixelRect(x - e.dir * 24, y + 21, 18, 3, "rgba(105,114,138,.35)");
      }
      pixelRect(x + 9, y + 10, 24, 15, stone);
      pixelRect(x + 13, y + 3, 17, 11, stone);
      pixelRect(x + (e.dir > 0 ? 29 : 4), y + 7, 10, 8, darkStone);
      pixelRect(x + (e.dir > 0 ? 36 : 1), y + 10, 6, 3, horn);
      pixelRect(x + (e.dir > 0 ? 32 : 11), y + 9, 2, 2, "#101317");
      pixelRect(x + 9, y - 2, 5, 10, horn);
      pixelRect(x + 25, y - 3, 5, 11, horn);
      pixelRect(x + 15, y + 7, 4, 2, "#101317");
      pixelRect(x + 23, y + 7, 4, 2, "#101317");
      pixelRect(x - 8, y + 12 + wingLift, 21, 6, darkStone);
      pixelRect(x - 13, y + 17 + wingLift, 18, 4, stone);
      pixelRect(x + 29, y + 12 - wingLift, 24, 6, darkStone);
      pixelRect(x + 42, y + 17 - wingLift, 17, 4, stone);
      pixelRect(x + 14, y + 16, 15, 3, "#d7be7a");
      pixelRect(x + 16, y + 20, 10, 8, darkStone);
      pixelRect(x + 10 + f, y + 26, 6, 8, "#20252a");
      pixelRect(x + 26 - f, y + 26, 6, 8, "#20252a");
      pixelRect(x + 4, y + 9, 5, 6, aura);
      pixelRect(x + 34, y + 5, 5, 7, aura);
      if (peal) {
        pixelRect(x - 10, y + 2, 20, 2, "rgba(215,190,122,.72)");
        pixelRect(x + 34, y + 2, 22, 2, "rgba(215,190,122,.72)");
        pixelRect(x + 12, y - 8, 18, 2, "rgba(240,166,66,.5)");
        if (aegisPeal) {
          const cx = x + e.w / 2;
          const cy = y + 13;
          const nextPulse = phaseLevel === 2 && (e.pealHits?.first) ? 10 : phaseLevel === 2 ? 62 : 12;
          const tell = clamp((e.moveTimer || 0) - nextPulse, 0, 50);
          if (tell > 0 && tell <= 50) {
            const grow = (50 - tell) / 50;
            for (let i = 0; i < 3; i++) {
              const r = 18 + grow * 112 - i * 18;
              if (r <= 8) continue;
              ctx.strokeStyle = i === 0 ? "rgba(255,241,189,.58)" : "rgba(215,190,122,.3)";
              ctx.lineWidth = i === 0 ? 3 : 2;
              ctx.beginPath();
              ctx.arc(Math.round(cx + cameraX), Math.round(cy + cameraY), r, 0, Math.PI * 2);
              ctx.stroke();
              pixelRect(cx - r, cy - 1, 5, 2, "rgba(255,231,165,.45)");
              pixelRect(cx + r - 5, cy - 1, 5, 2, "rgba(255,231,165,.45)");
              pixelRect(cx - 1, cy - r, 2, 5, "rgba(255,231,165,.45)");
              pixelRect(cx - 1, cy + r - 5, 2, 5, "rgba(255,231,165,.45)");
            }
          }
          pixelRect(x + 6, y - 12, 31, 4, "#fff1bd");
          pixelRect(x + 13, y - 17, 17, 5, "#f0a642");
        }
      }
      if (e.radialWave > 0) {
        const cx = x + e.w / 2;
        const cy = y + 14;
        const max = e.radialMax || 52;
        const r = 24 + (max - e.radialWave) * ((Math.max(W, H) + 92) / max);
        ctx.strokeStyle = "rgba(255,241,189,.5)";
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(Math.round(cx + cameraX), Math.round(cy + cameraY), r, 0, Math.PI * 2);
        ctx.stroke();
        ctx.strokeStyle = "rgba(240,166,66,.24)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(Math.round(cx + cameraX), Math.round(cy + cameraY), r + 12, 0, Math.PI * 2);
        ctx.stroke();
      }
      if (phaseLevel >= 1) pixelRect(x + 7, y + 1, 30, 1, "rgba(240,166,66,.56)");
      return;
    }
    if (e.type === "boneGuard") {
      const guard = Math.max(0, e.shieldArmor || 0);
      const bracing = e.move === "aegisBrace" || guard > 0;
      const rushing = e.move === "shieldRush";
      const antiAir = e.move === "aegisUppercut";
      const slashing = e.move === "swordCombo";
      const metal = hit || (phaseLevel === 2 ? "#f1d7a4" : "#d7d2be");
      const cloth = phaseLevel === 2 ? "#3d2638" : "#303239";
      if (slashing) {
        const age = (phaseLevel >= 1 ? 40 : 32) - (e.moveTimer || 0);
        const arcY = age % 18 < 8 ? 5 : 15;
        const cx = x + (e.dir > 0 ? 11 : 25) + cameraX;
        const cy = y + 14 + cameraY;
        const highArc = age % 18 < 8;
        ctx.save();
        ctx.lineCap = "square";
        ctx.strokeStyle = "rgba(255,255,255,.26)";
        ctx.lineWidth = 8;
        ctx.beginPath();
        if (e.dir > 0) ctx.arc(cx, cy, highArc ? 29 : 24, -1.05, highArc ? 0.5 : 0.92);
        else ctx.arc(cx, cy, highArc ? 29 : 24, Math.PI + 1.05, highArc ? Math.PI - 0.5 : Math.PI - 0.92, true);
        ctx.stroke();
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 4;
        ctx.stroke();
        ctx.strokeStyle = "rgba(132,197,208,.42)";
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.restore();
        pixelRect(x + (e.dir > 0 ? 28 : -24), y + arcY, 32, 4, "rgba(255,241,189,.72)");
        pixelRect(x + (e.dir > 0 ? 42 : -31), y + arcY - 5, 13, 3, "rgba(215,210,190,.78)");
        if (phaseLevel >= 1) pixelRect(x + (e.dir > 0 ? 31 : -24), y + arcY + 7, 24, 3, "rgba(132,197,208,.5)");
      }
      if (antiAir) {
        const age = 34 - (e.moveTimer || 0);
        ctx.save();
        ctx.lineCap = "square";
        ctx.strokeStyle = "rgba(255,255,255,.25)";
        ctx.lineWidth = 8;
        ctx.beginPath();
        ctx.arc(x + e.w / 2 + cameraX, y + 4 + cameraY, 31, Math.PI * 1.08, Math.PI * 1.92);
        ctx.stroke();
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 4;
        ctx.stroke();
        ctx.restore();
        pixelRect(x - 11, y - 24 - (age % 5), e.w + 22, 3, "rgba(132,197,208,.58)");
        pixelRect(x - 3, y - 36 - (age % 4), e.w + 6, 2, "rgba(255,241,189,.72)");
        pixelRect(x + (e.dir > 0 ? 19 : -4), y - 27, 5, 34, "#fff1bd");
        pixelRect(x + (e.dir > 0 ? 22 : -7), y - 36, 3, 13, "#d7d2be");
      }
      pixelRect(x - 5, y - 19, Math.round((guard / (e.shieldMax || 18)) * (e.w + 10)), 3, "#84c5d0");
      pixelRect(x - 6, y - 20, e.w + 12, 1, "#f3cc67");
      pixelRect(x + 8, y - 1, 15, 9, metal);
      pixelRect(x + 5, y + 7, 23, 21, cloth);
      pixelRect(x + 9, y + 10, 14, 4, "#f3cc67");
      pixelRect(x + 11, y + 3, 2, 2, "#101317");
      pixelRect(x + 20, y + 3, 2, 2, "#101317");
      pixelRect(x + (e.dir > 0 ? 26 : -8), y + 9, 14, 22, "#84c5d0");
      pixelRect(x + (e.dir > 0 ? 29 : -5), y + 12, 8, 15, "#2d4658");
      pixelRect(x + (e.dir > 0 ? 32 : -2), y + 10, 2, 19, "#f3cc67");
      pixelRect(x + (e.dir > 0 ? 28 : -6), y + 17, 12, 3, "#f3cc67");
      pixelRect(x + (e.dir > 0 ? -6 : 25), y + (antiAir ? 2 : slashing ? 8 : 12 + f), slashing ? 22 : 16, 3, "#fff1bd");
      pixelRect(x + (e.dir > 0 ? -8 : 37), y + (antiAir ? -6 : slashing ? 4 : 10 + f), 3, antiAir ? 18 : slashing ? 15 : 8, "#d7d2be");
      pixelRect(x + 7 + f, y + 28, 7, 8, "#20252a");
      pixelRect(x + 21 - f, y + 28, 7, 8, "#20252a");
      if (bracing) {
        pixelRect(x + (e.dir > 0 ? 24 : -10), y + 5, 18, 30, "rgba(132,197,208,.24)");
        pixelRect(x + (e.dir > 0 ? 22 : -12), y + 3, 2, 34, "#f3cc67");
      }
      if (rushing) pixelRect(x - e.dir * 18, y + 24, 20, 3, "rgba(132,197,208,.45)");
      return;
    }
    if (["gargoyle", "bellBat"].includes(e.type)) {
      const flap = Math.floor(frame / 4) % 3;
      pixelRect(x + 7, y + 4, 13, 13, hit || "#69728a");
      pixelRect(x + 3, y, 5, 8, aura);
      pixelRect(x + 18, y, 5, 8, aura);
      pixelRect(x - 2, y + 8 + flap, 10, 5, "#303239");
      pixelRect(x + 18, y + 8 + (2 - flap), 12, 5, "#303239");
      pixelRect(x + 10, y + 7, 2, 2, "#101317");
      pixelRect(x + 16, y + 7, 2, 2, "#101317");
      pixelRect(x + 9, y + 15, 10, 4, "#2b3545");
      return;
    }
    if (["hound", "thornImp", "cinderImp"].includes(e.type)) {
      pixelRect(x + 2, y + 10, 19, 11, hit || (e.type === "thornImp" ? "#6ea35f" : e.type === "cinderImp" ? "#e16b43" : "#5a342f"));
      pixelRect(x + 17, y + 6, 9, 9, hit || "#875045");
      pixelRect(x + 21, y + 9, 2, 2, "#101317");
      pixelRect(x + 6, y + 6, 12, 4, aura);
      pixelRect(x + 4 + f, y + 20, 5, 5, "#1a1110");
      pixelRect(x + 15 - f, y + 20, 5, 5, "#1a1110");
      if (phaseLevel === 2) pixelRect(x + 1, y + 8, 24, 1, "#fff1bd");
      return;
    }
    if (["moonKnight", "boneGuard", "anvilGuard", "penitent"].includes(e.type)) {
      const metal = e.type === "moonKnight" ? "#7fa0bd" : e.type === "anvilGuard" ? "#6d6255" : e.type === "boneGuard" ? "#d7d2be" : "#c4c8bc";
      pixelRect(x + 8, y - 1, 10, 7, metal);
      pixelRect(x + 5, y + 6, 17, 17, hit || "#3f4650");
      pixelRect(x + 8, y + 10, 11, 3, aura);
      pixelRect(x + 10, y + 2, 2, 2, "#fff");
      pixelRect(x + 15, y + 8, 3, 2, "#101317");
      pixelRect(x + 2, y + 13, 7, 9, metal);
      pixelRect(x + 20, y + 10, 11, 3, "#fff1bd");
      pixelRect(x + 25, y + 4 + f, 3, 13, "#d7d2be");
      pixelRect(x + 7 + f, y + 22, 5, 5, "#20252a");
      pixelRect(x + 17 - f, y + 22, 5, 5, "#20252a");
      return;
    }
    if (["drowned", "eel"].includes(e.type)) {
      pixelRect(x + 5, y + 5, 16, 14, hit || "#247083");
      pixelRect(x + 9, y, 9, 8, "#74d1c7");
      pixelRect(x + 11, y + 4, 2, 2, "#101317");
      pixelRect(x + 16, y + 4, 2, 2, "#101317");
      pixelRect(x + 3, y + 15, 20, 4, "#123a4c");
      pixelRect(x + 7, y + 20 + f, 4, 5, "#74d1c7");
      pixelRect(x + 17, y + 20 - f, 4, 5, "#74d1c7");
      pixelRect(x + 1, y + 9, 5, 12, aura);
      return;
    }
  }
  const body = hit || (ghost ? "rgba(154,202,216,.38)" : "#875045");
  if (["halberd", "royalGuard", "moonKnight", "anvilGuard", "boneGuard", "penitent", "crossbow"].includes(e.type)) {
    const metal = e.type === "moonKnight" ? "#7fa0bd" : e.type === "anvilGuard" ? "#6d6255" : "#c4c8bc";
    const bob = Math.abs(e.vx) > 0.1 ? f : 0;
    pixelRect(x + 4, y - bob, 7, 5, metal);
    pixelRect(x + 2, y + 5 - bob, 10, 9, hit || (e.type === "royalGuard" ? "#7b2635" : "#3f4650"));
    pixelRect(x + 5, y + 8, 5, 2, "#d59b44");
    pixelRect(x + 5, y + 1 - bob, 2, 1, "#fff");
    pixelRect(x + 8, y + 6 - bob, 3, 1, "#101317");
    pixelRect(x + 3, y + 10 - bob, 8, 1, "rgba(255,255,255,.2)");
    pixelRect(x + 1, y + 14, 4, 4 + f, "#20252a");
    pixelRect(x + 9, y + 14 + f, 4, 4 - f, "#20252a");
    pixelRect(x + (e.vx > 0 ? 12 : -6), y + 2 + f, 7, 2, "#d7d2be");
    pixelRect(x + (e.vx > 0 ? 17 : -7), y - 1 + f, 2, 6, "#d7d2be");
    if (e.type === "crossbow") pixelRect(x + (e.vx > 0 ? 10 : -4), y + 7, 9, 3, "#7d5c35");
    return;
  }
  if (["hound", "mossling", "thornImp", "cinderImp", "scarab"].includes(e.type)) {
    const c = hit || (e.type === "mossling" ? "#6ea35f" : e.type === "cinderImp" ? "#e16b43" : e.type === "scarab" ? "#247083" : "#5a342f");
    const pounce = e.vy < -0.4 ? -2 : f;
    pixelRect(x + 1, y + 7 + pounce, 12, 7, c);
    pixelRect(x + (e.vx > 0 ? 10 : -1), y + 4, 5, 6, c);
    pixelRect(x + (e.vx > 0 ? 12 : 0), y + 6, 2, 2, "#101317");
    pixelRect(x + 3, y + 9 + pounce, 7, 1, "rgba(255,255,255,.22)");
    pixelRect(x + (e.vx > 0 ? 13 : 0), y + 3, 2, 2, "#f7e7bd");
    pixelRect(x + 2 + (f ? 1 : 0), y + 14, 3, 3, "#1a1110");
    pixelRect(x + 9 - (f ? 1 : 0), y + 14, 3, 3, "#1a1110");
    if (e.type === "thornImp") pixelRect(x + 4, y + 3, 6, 3, "#d7b167");
    return;
  }
  if (["wraith", "starWraith", "lanternSkull", "voidEye"].includes(e.type)) {
    const c = hit || (e.type === "starWraith" || e.type === "voidEye" ? "rgba(165,150,255,.72)" : ghost ? "rgba(154,202,216,.38)" : "#90a5ad");
    const float = Math.sin(frame / 10 + x) * 2;
    pixelRect(x + 3, y + float, 9, 10, c);
    pixelRect(x + 1, y + 8 + float, 13, 4, c);
    pixelRect(x + 5, y + 4, 2, 2, "#101317");
    pixelRect(x + 10, y + 4, 2, 2, "#101317");
    pixelRect(x + 7, y + 7 + float, 3, 1, "rgba(255,255,255,.32)");
    pixelRect(x + 2, y + 3 + float, 2, 2, "rgba(255,255,255,.18)");
    pixelRect(x + 6, y + 11 + f + float, 2, 5, c);
    pixelRect(x + 10, y + 11 + (1 - f) + float, 2, 5, c);
    if (frame % 20 < 8) pixelRect(x + 4, y + 2 + float, 9, 1, "rgba(255,255,255,.22)");
    return;
  }
  if (["gargoyle", "bellBat", "eel", "ossuaryBird", "drowned", "censer", "crossbow"].includes(e.type)) {
    const c = hit || (e.type === "eel" || e.type === "drowned" ? "#247083" : e.type === "bellBat" || e.type === "ossuaryBird" ? "#8f806d" : "#666b74");
    const flap = Math.floor(frame / 4) % 3;
    pixelRect(x + 4, y + 3, 7, 7, c);
    pixelRect(x - 1, y + 5 + flap, 6, 3, c);
    pixelRect(x + 10, y + 5 + (2 - flap), 6, 3, c);
    pixelRect(x + 6, y + 5, 2, 2, "#101317");
    pixelRect(x + 10, y + 5, 2, 2, "#101317");
    pixelRect(x + 5, y + 4, 1, 4, "rgba(255,255,255,.25)");
    pixelRect(x + 8, y + 9, 5, 1, "rgba(0,0,0,.28)");
    if (e.type === "crossbow") pixelRect(x + (e.vx > 0 ? 10 : -3), y + 8, 7, 2, "#d7b167");
    return;
  }
  pixelRect(x + 2, y + 2, e.w - 4, e.h - 2, body);
  pixelRect(x + 4, y, e.w - 8, 4, "#c4c8bc");
  pixelRect(x + 4, y + 6, 2, 2, "#120b0b");
  pixelRect(x + e.w - 6, y + 6, 2, 2, "#120b0b");
}

function drawNpc(npc) {
  const x = npc.x;
  const y = npc.y + Math.sin(frame / 24 + x) * 0.8;
  const walk = Math.floor(frame / 18 + x) % 2;
  const roleColors = {
    baker: ["#f1d7a4", "#9a6b43", "#ffd166"],
    smith: ["#c4c8bc", "#303239", "#f0a642"],
    child: ["#ffd166", "#2f7d71", "#f7e7bd"],
    healer: ["#f7e7bd", "#5f6d8a", "#84c5d0"],
    trader: ["#d3ae72", "#6b8c53", "#ffd166"],
    guard: ["#c4c8bc", "#33414a", "#f3cc67"],
    minstrel: ["#f1d7a4", "#8a1f2d", "#ffd166"],
    elder: ["#d7d2be", "#5d4630", "#90a5ad"],
    farmer: ["#d3ae72", "#385d4c", "#9a6b43"]
  };
  const colors = roleColors[npc.role] || ["#d3ae72", "#5d4630", "#ffd166"];
  pixelRect(x - 3, y + npc.h - 2, npc.w + 6, 3, "rgba(0,0,0,.32)");
  pixelRect(x + 3, y, 7, 7, colors[0]);
  pixelRect(x + 1, y + 6, 11, 13, colors[1]);
  pixelRect(x + 3, y + 10, 7, 3, colors[2]);
  pixelRect(x + 1, y + 17, 4, 7, "#20252a");
  pixelRect(x + 8, y + 17, 4, 7, "#20252a");
  pixelRect(x + 1 + walk, y + 23, 5, 2, "#111");
  pixelRect(x + 7 - walk, y + 23, 6, 2, "#111");
  pixelRect(x + (npc.dir > 0 ? 8 : 3), y + 3, 2, 2, "#101317");
  pixelRect(x + (npc.dir > 0 ? 12 : -2), y + 9 + walk, 4, 3, colors[0]);
  pixelRect(x + (npc.dir > 0 ? -3 : 11), y + 9 - walk, 4, 3, colors[0]);
  if (npc.role === "smith") pixelRect(x + (npc.dir > 0 ? 13 : -5), y + 7, 3, 12, "#d7d2be");
  if (npc.role === "guard") pixelRect(x + (npc.dir > 0 ? 13 : -6), y + 5, 4, 16, "#f7e7bd");
  if (npc.role === "minstrel") {
    pixelRect(x - 4, y + 11, 5, 8, "#9a6b43");
    pixelRect(x - 3, y + 13, 3, 1, "#ffd166");
  }
  if (npc.near) {
    pixelRect(x + 2, y - 13, 10, 9, "rgba(7,9,12,.82)");
    pixelRect(x + 5, y - 11, 2, 5, "#ffd166");
    pixelRect(x + 5, y - 5, 2, 2, "#f7e7bd");
  }
}

function drawItem(it) {
  if (it.taken) {
    if (it.wyvernCorpse) {
      const x = it.x;
      const y = it.y;
      pixelRect(x - 1, y + 37, 76, 3, "rgba(0,0,0,.48)");
      pixelRect(x + 18, y + 19, 31, 14, "#413934");
      pixelRect(x + 25, y + 12, 19, 9, "#8f806d");
      pixelRect(x + 45, y + 16, 14, 7, "#d7d2be");
      pixelRect(x + 58, y + 18, 7, 3, "#f1d7a4");
      pixelRect(x + 22, y + 28, 5, 9, "#d7d2be");
      pixelRect(x + 43, y + 27, 5, 9, "#d7d2be");
      pixelRect(x + 6, y + 23, 16, 4, "#413934");
      pixelRect(x + 49, y + 24, 17, 4, "#413934");
      pixelRect(x + 29, y + 18, 13, 3, "#c6423c");
    }
    if (it.cinderTorch) {
      const x = it.x;
      const y = it.y;
      pixelRect(x - 11, y + 37, 60, 4, "rgba(0,0,0,.42)");
      pixelRect(x + 5, y + 30, 28, 7, "#2b2424");
      pixelRect(x + 10, y + 24, 18, 7, "#3b3030");
      pixelRect(x + 14, y + 8, 10, 22, "#4f3b2b");
      pixelRect(x + 11, y + 6, 16, 5, "#171317");
      pixelRect(x + 17, y + 1, 5, 3, "#5b2417");
    }
    return;
  }
  const bob = Math.sin(frame / 14 + it.x) * 2;
  const room = currentRoom();
  const ready = !it.trial || guardianDefeated(room);
  const near = rects(player, it);
  if (it.wyvernCorpse && !ready && !it.falling) return;
  if (it.moonHookDrop && !ready) return;
  if (it.sundialDrop && !ready) return;
  if (it.corpse && it.ability === "dash") {
    const x = it.x;
    const y = it.y;
    pixelRect(x - 1, y - 2, 8, 40, "rgba(35,24,19,.82)");
    pixelRect(x + 1, y + 36, 58, 4, "rgba(0,0,0,.45)");
    pixelRect(x + 5, y + 4, 13, 12, "#b8bec5");
    pixelRect(x + 7, y + 8, 5, 2, "#101317");
    pixelRect(x + 2, y + 15, 19, 20, "#415f78");
    pixelRect(x + 1, y + 20, 7, 16, "#232a31");
    pixelRect(x + 8, y + 17, 10, 4, "#d59b44");
    pixelRect(x + 17, y + 25, 24, 8, "#2b2f35");
    pixelRect(x + 36, y + 30, 19, 5, "#111820");
    pixelRect(x + 49, y + 33, 10, 3, "#0a0d10");
    pixelRect(x + 4, y + 31, 24, 5, "#8a1f2d");
    pixelRect(x + 17, y + 35, 25, 3, "#5f1f2d");
    pixelRect(x + 23, y + 20, 17, 2, "#fff1bd");
    pixelRect(x + 35, y + 17, 3, 9, "#d7dce1");
    pixelRect(x + 9, y - 1, 14, 4, "#3b3030");
    pixelRect(x + 1, y + 2, 4, 9, "#69728a");
    if (ready) {
      const glint = frame % 36;
      pixelRect(x + 12, y + 27, 4, 4, "#fff1bd");
      pixelRect(x + 14, y + 23, 1, 12, "#ffe7a5");
      pixelRect(x + 9, y + 29, 12, 1, "#ffe7a5");
      if (glint < 18) pixelRect(x + 17, y + 25, 3, 3, "#f3cc67");
    }
    if (near && ready) drawTinyText("F", x + 18, y + 16, "#ffe7a5");
    return;
  }
  if (it.wallGreaves && it.ability === "wall") {
    const x = it.x;
    const y = it.y;
    pixelRect(x + 18, y - 4, 6, 60, "rgba(7,9,12,.45)");
    pixelRect(x + 20, y - 8, 4, 68, "#2b3545");
    pixelRect(x + 10, y + 3, 12, 3, "#7d5c35");
    pixelRect(x + 10, y + 27, 12, 3, "#7d5c35");
    pixelRect(x + 4, y + 6, 8, 19, "#6b8c53");
    pixelRect(x + 12, y + 8, 6, 18, "#26362d");
    pixelRect(x + 1, y + 22, 14, 5, "#26362d");
    pixelRect(x + 2, y + 27, 4, 5, "#d7be7a");
    pixelRect(x + 8, y + 27, 4, 5, "#d7be7a");
    pixelRect(x + 5, y + 31, 2, 6, "#fff1bd");
    pixelRect(x + 11, y + 31, 2, 6, "#fff1bd");
    pixelRect(x + 5, y + 31, 2, 5, "#6b8c53");
    pixelRect(x + 9, y + 32, 2, 5, "#6b8c53");
    pixelRect(x + 1, y + 41, 13, 5, "#26362d");
    pixelRect(x + 2, y + 46, 4, 5, "#d7be7a");
    pixelRect(x + 8, y + 46, 4, 5, "#d7be7a");
    pixelRect(x + 5, y + 50, 2, 6, "#fff1bd");
    pixelRect(x + 11, y + 50, 2, 6, "#fff1bd");
    if (ready) {
      pixelRect(x + 6, y + 2, 4, 4, "#fff1bd");
      pixelRect(x + 8, y - 2, 1, 12, "#ffe7a5");
      pixelRect(x + 3, y + 4, 12, 1, "#ffe7a5");
      if (frame % 44 < 22) pixelRect(x + 12, y, 3, 3, "#d7be7a");
    }
    if (near && ready) drawTinyText("F", x + 2, y - 10, "#ffe7a5");
    return;
  }
  if (it.bellMantle && it.ability === "superDash") {
    const x = it.x;
    const y = it.y + (ready ? bob : 0);
    pixelRect(x - 10, y + 28, 50, 3, "rgba(215,190,122,.32)");
    pixelRect(x + 6, y + 2, 17, 8, "#2b3545");
    pixelRect(x + 2, y + 9, 25, 22, "#d7be7a");
    pixelRect(x + 6, y + 12, 17, 17, "#5b4a35");
    pixelRect(x - 1, y + 16, 8, 13, "#69728a");
    pixelRect(x + 22, y + 16, 8, 13, "#69728a");
    pixelRect(x + 10, y + 8, 8, 20, "#fff1bd");
    pixelRect(x + 13, y + 11, 2, 15, "#2b3545");
    pixelRect(x + 8, y - 3, 13, 5, "#d7be7a");
    if (ready) {
      const r = 9 + (frame % 36) / 5;
      ctx.strokeStyle = "rgba(255,241,189,.55)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(Math.round(x + 15 + cameraX), Math.round(y + 16 + cameraY), r, 0, Math.PI * 2);
      ctx.stroke();
      pixelRect(x + 14, y - 7, 2, 9, "#fff1bd");
      pixelRect(x + 6, y + 17, 18, 1, "#fff1bd");
    }
    if (near && ready) drawTinyText("F", x + 10, y - 12, "#ffe7a5");
    return;
  }
  if (it.aegisDrop && it.ability === "shield") {
    const x = it.x;
    const y = it.y + (ready ? bob : 0);
    pixelRect(x - 7, y + 26, 44, 3, "rgba(132,197,208,.32)");
    if (ready) {
      pixelRect(x - 8, y + 5, 42, 24, "rgba(132,197,208,.16)");
      pixelRect(x + 11, y - 4, 1, 40, "rgba(255,231,165,.45)");
      pixelRect(x - 2, y + 11, 28, 1, "rgba(255,231,165,.45)");
    }
    pixelRect(x + 4, y + 1, 18, 23, "#84c5d0");
    pixelRect(x + 7, y + 4, 12, 17, "#2d4658");
    pixelRect(x + 10, y + 2, 4, 21, "#f3cc67");
    pixelRect(x + 5, y + 8, 16, 4, "#f3cc67");
    pixelRect(x + 8, y + 6, 10, 11, "rgba(255,241,189,.26)");
    if (near && ready) drawTinyText("F", x + 9, y - 9, "#ffe7a5");
    return;
  }
  if (it.cinderTorch && it.ability === "fire") {
    const x = it.x;
    const y = it.y;
    pixelRect(x - 11, y + 37, 60, 4, "rgba(0,0,0,.42)");
    pixelRect(x + 5, y + 30, 28, 7, "#2b2424");
    pixelRect(x + 10, y + 24, 18, 7, "#3b3030");
    pixelRect(x + 14, y + 8, 10, 22, "#7d5c35");
    pixelRect(x + 11, y + 6, 16, 5, "#24171a");
    pixelRect(x + 6, y + 27, 26, 3, "#69728a");
    if (ready) {
      const flare = frame % 18 < 9 ? 1 : 0;
      pixelRect(x + 13, y - 4 - flare, 12, 12, "rgba(255,122,61,.5)");
      pixelRect(x + 15, y - 9 - flare, 8, 13, "#ff7a3d");
      pixelRect(x + 17, y - 13 - flare, 5, 12, "#fff1bd");
      pixelRect(x + 18, y - 17 - flare, 2, 8, "#ffffff");
      pixelRect(x + 19, y - 2, 1, 36, "rgba(255,231,165,.45)");
      pixelRect(x + 2, y + 14, 35, 1, "rgba(255,231,165,.34)");
      if (frame % 38 < 19) pixelRect(x + 25, y - 8, 4, 4, "#f0a642");
    } else {
      pixelRect(x + 16, y + 2, 7, 3, "#3b3030");
      pixelRect(x + 18, y - 2, 3, 4, "#5b2417");
    }
    if (near && ready) drawTinyText("F", x + 16, y - 22, "#ffe7a5");
    return;
  }
  if (it.moonHookDrop && it.ability === "grapple") {
    const x = it.x;
    const y = it.y + (ready ? bob : 0);
    pixelRect(x - 8, y + 28, 44, 3, "rgba(159,208,208,.3)");
    if (ready) {
      pixelRect(x - 5, y - 6, 36, 32, "rgba(159,208,208,.14)");
      pixelRect(x + 12, y - 8, 1, 38, "rgba(255,241,189,.42)");
      pixelRect(x - 2, y + 11, 30, 1, "rgba(255,241,189,.34)");
    }
    pixelRect(x + 10, y + 2, 4, 20, "#9fd0d0");
    pixelRect(x + 12, y, 13, 4, "#f7e7bd");
    pixelRect(x + 22, y + 3, 4, 8, "#9fd0d0");
    pixelRect(x + 19, y + 9, 8, 4, "#27384b");
    pixelRect(x + 5, y + 18, 13, 4, "#27384b");
    pixelRect(x + 3, y + 14, 5, 7, "#9fd0d0");
    pixelRect(x + 15, y + 21, 4, 7, "#f7e7bd");
    if (near && ready) drawTinyText("F", x + 10, y - 14, "#ffe7a5");
    return;
  }
  if (it.sundialDrop && it.ability === "time") {
    const x = it.x;
    const y = it.y + (ready ? bob : 0);
    const tick = Math.floor(frame / 8) % 8;
    pixelRect(x - 8, y + 28, 52, 3, "rgba(165,150,255,.28)");
    pixelRect(x - 5, y - 8, 45, 36, "rgba(240,166,66,.12)");
    pixelRect(x + 6, y + 3, 24, 24, "#f0a642");
    pixelRect(x + 9, y + 6, 18, 18, "#17130e");
    pixelRect(x + 12, y + 9, 12, 12, "#a596ff");
    pixelRect(x + 17, y + 7, 3, 16, "#fff1bd");
    pixelRect(x + 11, y + 15, 19, 3, "#fff1bd");
    pixelRect(x + 16 + (tick % 3), y - 3, 5, 6, "#f0a642");
    pixelRect(x + 2, y + 10, 5, 4, "#6d6255");
    pixelRect(x + 29, y + 18, 7, 4, "#6d6255");
    if (ready && frame % 18 < 9) {
      pixelRect(x + 5, y - 13, 26, 2, "rgba(255,241,189,.62)");
      pixelRect(x - 1, y + 13, 38, 1, "rgba(165,150,255,.55)");
    }
    if (near && ready) drawTinyText("F", x + 12, y - 15, "#ffe7a5");
    return;
  }
  if (it.wyvernCorpse && it.ability === "doubleJump") {
    const x = it.x;
    const y = it.y;
    const pulls = it.pulls || 0;
    const tug = near && ready && frame % 12 < 6 ? pulls : 0;
    if (!it.falling) pixelRect(x - 1, y + 37, 76, 3, "rgba(0,0,0,.5)");
    else {
      pixelRect(x + 21, y + 37, 8, 2, "rgba(241,215,164,.28)");
      pixelRect(x + 43, y + 35, 6, 2, "rgba(143,128,109,.3)");
    }
    pixelRect(x + 19, y + 18, 30, 15, "#413934");
    pixelRect(x + 25, y + 11, 20, 10, "#8f806d");
    pixelRect(x + 44, y + 15, 16, 8, "#d7d2be");
    pixelRect(x + 58, y + 17, 8, 3, "#f1d7a4");
    pixelRect(x + 50, y + 18, 2, 2, "#101317");
    pixelRect(x + 16, y + 22, 12, 3, "#f1d7a4");
    pixelRect(x + 41, y + 22, 12, 3, "#f1d7a4");
    pixelRect(x + 22, y + 28, 5, 9, "#d7d2be");
    pixelRect(x + 43, y + 27, 5, 9, "#d7d2be");
    pixelRect(x + 3 - tug, y + 15 - pulls, 28, 6, "#8f806d");
    pixelRect(x - 1 - tug, y + 20 - pulls, 25, 4, "#d7d2be");
    pixelRect(x + 40 + tug, y + 13 - pulls, 30, 6, "#8f806d");
    pixelRect(x + 49 + tug, y + 19 - pulls, 26, 4, "#d7d2be");
    pixelRect(x + 30, y + 18, 10, 2, "#c6423c");
    if (ready) {
      const glint = frame % 34 < 17;
      pixelRect(x + 34, y + 11, 4, 4, "#fff1bd");
      pixelRect(x + 36, y + 5, 1, 16, "#ffe7a5");
      pixelRect(x + 27, y + 13, 20, 1, "#ffe7a5");
      for (let i = 0; i < pulls; i++) pixelRect(x + 18 + i * 8, y + 5, 5, 2, i % 2 ? "#c6423c" : "#f1d7a4");
      if (glint) pixelRect(x + 43, y + 8, 3, 3, "#fff1bd");
    }
    if (near && ready) drawTinyText(`F ${pulls}/${it.pullsNeeded || 5}`, x + 24, y - 7, "#ffe7a5");
    return;
  }
  if (it.type !== "ability") {
    pixelRect(it.x - 3, it.y + 3 + bob, 18, 2, "rgba(243,204,103,.35)");
    pixelRect(it.x + 3, it.y + bob, 6, 10, "#e8dcb0");
    pixelRect(it.x + 1, it.y + 3 + bob, 10, 4, "#fff1bd");
    if (near) drawTinyText("F", it.x + 5, it.y - 8 + bob, "#ffe7a5");
    return;
  }
  const art = abilityArtifacts[it.ability];
  const [main, shine, dark] = art.colors;
  const x = it.x;
  const y = it.y + bob;
  pixelRect(x - 4, y + 14, 24, 2, "rgba(243,204,103,.32)");
  if (ready) pixelRect(x + 6, y - 7, 4, 4, shine);
  if (it.ability === "sword") {
    pixelRect(x + 7, y - 3, 3, 18, dark);
    pixelRect(x + 6, y - 1, 5, 12, main);
    pixelRect(x + 4, y + 10, 9, 3, shine);
    pixelRect(x + 8, y + 13, 1, 5, "#5b3a23");
    pixelRect(x + 7, y - 5, 3, 3, "#fff1bd");
  } else if (it.ability === "dash") {
    pixelRect(x + 2, y, 11, 14, main); pixelRect(x + 5, y + 2, 8, 12, dark); pixelRect(x, y + 7, 4, 5, main); pixelRect(x + 10, y + 5, 5, 8, shine);
  } else if (it.ability === "superDash") {
    pixelRect(x + 3, y + 1, 11, 13, main); pixelRect(x + 5, y + 3, 7, 9, dark); pixelRect(x + 7, y - 2, 3, 16, shine); pixelRect(x + 1, y + 5, 15, 2, shine);
  } else if (it.ability === "wall") {
    pixelRect(x + 2, y + 2, 5, 12, main); pixelRect(x + 9, y + 2, 5, 12, main); pixelRect(x + 1, y + 13, 7, 3, dark); pixelRect(x + 8, y + 13, 7, 3, dark); pixelRect(x + 3, y, 3, 3, shine); pixelRect(x + 10, y, 3, 3, shine);
  } else if (it.ability === "fire") {
    pixelRect(x + 7, y - 1, 3, 16, dark); pixelRect(x + 6, y, 5, 10, main); pixelRect(x + 5, y + 1, 7, 4, shine); pixelRect(x + 2, y + 12, 12, 3, dark);
  } else if (it.ability === "grapple") {
    pixelRect(x + 4, y + 2, 8, 3, shine); pixelRect(x + 10, y + 4, 3, 8, main); pixelRect(x + 3, y + 9, 9, 3, main); pixelRect(x + 1, y + 7, 3, 5, dark);
  } else if (it.ability === "shield") {
    pixelRect(x + 3, y + 1, 11, 13, main); pixelRect(x + 5, y + 3, 7, 9, dark); pixelRect(x + 7, y + 1, 3, 13, shine); pixelRect(x + 2, y + 4, 13, 3, shine);
  } else if (it.ability === "swim") {
    pixelRect(x + 3, y + 4, 10, 9, main); pixelRect(x + 5, y + 2, 6, 3, shine); pixelRect(x + 4, y + 11, 8, 3, dark); pixelRect(x + 6, y + 6, 4, 4, shine);
  } else if (it.ability === "doubleJump") {
    pixelRect(x + 2, y + 5, 5, 10, main); pixelRect(x + 9, y + 5, 5, 10, main); pixelRect(x + 1, y + 2, 6, 4, shine); pixelRect(x + 9, y + 2, 6, 4, shine); pixelRect(x + 4, y + 13, 9, 3, dark);
  } else if (it.ability === "time") {
    pixelRect(x + 3, y + 2, 12, 12, main); pixelRect(x + 5, y + 4, 8, 8, dark); pixelRect(x + 7, y + 6, 2, 5, shine); pixelRect(x + 9, y + 8, 4, 2, shine);
  }
  if (near && ready) drawTinyText("F", x + 6, y - 10, "#ffe7a5");
}

function drawProjectile(p) {
  if (p.boosted && p.fire) {
    const tail = p.vx > 0 ? -8 : p.w + 2;
    pixelRect(p.x + tail, p.y + 3, 9, 3, "rgba(255,241,189,.5)");
    pixelRect(p.x - Math.sign(p.vx) * 6, p.y + 1, p.w + 4, p.h + 2, "rgba(255,122,61,.38)");
    pixelRect(p.x, p.y, p.w, p.h, "#ff7a3d");
    pixelRect(p.x + 3, p.y + 2, p.w - 6, p.h - 4, "#fff1bd");
    pixelRect(p.x + (p.vx > 0 ? p.w - 2 : 1), p.y + 3, 2, 3, "#ffffff");
    return;
  }
  if (p.hostile) {
    if (p.kind === "rootSpike") {
      if ((p.warning || 0) > 0) {
        const warnT = p.warning / (p.warningMax || 90);
        const flicker = frame % 8 < 4;
        pixelRect(p.x - 4, p.y + p.h - 4, p.w + 8, 3, p.ironKing ? flicker ? "rgba(243,204,103,.78)" : "rgba(198,66,60,.5)" : flicker ? "rgba(215,177,103,.78)" : "rgba(110,163,95,.5)");
        pixelRect(p.x + p.w / 2 - 2, p.y + p.h - 10 - (1 - warnT) * 4, 4, 6, "#d7b167");
        pixelRect(p.x - 1, p.y + p.h - 7, p.w + 2, 2, p.ironKing ? "rgba(5,6,8,.68)" : "rgba(198,66,60,.35)");
        return;
      }
      const activeAge = Math.max(0, (p.maxLife || 40) - p.life - (p.warningMax || 0));
      const grow = Math.min(1, activeAge / 7);
      const h = Math.max(8, p.h * grow);
      pixelRect(p.x - 2, p.y + p.h - h, p.w + 4, h, p.ironKing ? "rgba(48,61,71,.82)" : "rgba(28,57,34,.72)");
      pixelRect(p.x + 1, p.y + p.h - h - 5, p.w - 2, h + 5, p.color || "#6ea35f");
      pixelRect(p.x + p.w / 2 - 2, p.y + p.h - h - 10, 4, 10, "#d7b167");
      pixelRect(p.x + 2, p.y + p.h - h + 5, 2, h - 4, "#101710");
      return;
    }
    if (p.kind === "thornShot") {
      const dir = p.vx >= 0 ? 1 : -1;
      pixelRect(p.x, p.y + 2, p.w, 3, p.color || "#6ea35f");
      pixelRect(p.x + (dir > 0 ? p.w - 3 : 0), p.y, 4, 7, "#d7b167");
      pixelRect(p.x - dir * 5, p.y + 3, 6, 1, "rgba(110,163,95,.45)");
      return;
    }
    if (p.kind === "boneShard") {
      const dir = p.vx >= 0 ? 1 : -1;
      pixelRect(p.x, p.y + 2, p.w, 3, p.color || "#f1d7a4");
      pixelRect(p.x + (dir > 0 ? p.w - 3 : 0), p.y, 4, 6, "#fff1bd");
      pixelRect(p.x + (dir > 0 ? 2 : p.w - 5), p.y + 1, 4, 5, "#8f806d");
      pixelRect(p.x - dir * 5, p.y + 3, 6, 1, "rgba(241,215,164,.45)");
      return;
    }
    if (p.kind === "bellTone") {
      const pulse = Math.floor(frame / 3) % 3;
      pixelRect(p.x + 3, p.y + 3, p.w - 6, p.h - 6, "rgba(215,190,122,.42)");
      pixelRect(p.x + pulse, p.y + 1, p.w - pulse * 2, 2, p.color || "#d7be7a");
      pixelRect(p.x + pulse, p.y + p.h - 3, p.w - pulse * 2, 2, p.color || "#d7be7a");
      pixelRect(p.x + 1, p.y + pulse, 2, p.h - pulse * 2, "#fff1bd");
      pixelRect(p.x + p.w - 3, p.y + pulse, 2, p.h - pulse * 2, "#fff1bd");
      return;
    }
    if (p.kind === "cinderBall" || p.kind === "ironFire") {
      const dir = p.vx >= 0 ? 1 : -1;
      const flare = Math.floor(frame / 3) % 2;
      pixelRect(p.x - dir * 8, p.y + p.h / 2 - 1, 10, 2, p.kind === "ironFire" ? "rgba(5,6,8,.55)" : "rgba(198,66,60,.46)");
      pixelRect(p.x - dir * 4, p.y + 2, p.w, p.h - 4, p.kind === "ironFire" ? "rgba(243,204,103,.48)" : "rgba(255,122,61,.52)");
      pixelRect(p.x + 2, p.y + 2 - flare, p.w - 4, p.h - 4, p.color || "#ff7a3d");
      pixelRect(p.x + 5, p.y + 4 - flare, Math.max(3, p.w - 10), Math.max(3, p.h - 8), p.kind === "ironFire" ? "#ffffff" : "#fff1bd");
      pixelRect(p.x + (dir > 0 ? p.w - 3 : 1), p.y + p.h / 2 - 1, 3, 3, "#ffffff");
      return;
    }
    if (p.kind === "ironBolt") {
      const dir = p.vx >= 0 ? 1 : -1;
      const flare = Math.floor(frame / 3) % 2;
      pixelRect(p.x - dir * 9, p.y + 4, 11, 2, "rgba(243,204,103,.48)");
      pixelRect(p.x, p.y + 2 - flare, p.w, p.h - 4, p.color || "#f3cc67");
      pixelRect(p.x + 3, p.y + 4 - flare, p.w - 6, 3, "#fff1bd");
      pixelRect(p.x + (dir > 0 ? p.w - 3 : 1), p.y + 2, 3, p.h - 4, "#cfd8dc");
      return;
    }
    const c = p.color || "#f0a642";
    const spike = Math.floor(frame / 4) % 2;
    pixelRect(p.x, p.y + 4, p.w, 4, c);
    pixelRect(p.x + 2, p.y + 1 - spike, 5, 7, "#fff1bd");
    pixelRect(p.x + p.w - 7, p.y + 1 + spike, 5, 7, c);
    pixelRect(p.x - 5, p.y + 6, 7, 2, "rgba(198,66,60,.45)");
    return;
  }
  const tail = p.vx > 0 ? -4 : 8;
  pixelRect(p.x + tail, p.y + 1, 5, 2, "#9b5030");
  pixelRect(p.x + tail - Math.sign(p.vx) * 3, p.y + 2, 3, 1, "rgba(255,122,61,.45)");
  pixelRect(p.x, p.y, p.w, p.h, "#ff7a3d");
  pixelRect(p.x + 2, p.y + 1, p.w - 3, 2, "#fff1bd");
  pixelRect(p.x + (p.vx > 0 ? p.w - 1 : 0), p.y + 2, 1, 1, "#ffffff");
}

function drawPortal(portal, theme, open, label) {
  const p = palette[theme] || palette.castle;
  const x = portal.x;
  const y = portal.y;
  pixelRect(x - 4, y + portal.h - 2, portal.w + 8, 3, "rgba(243,204,103,.35)");
  pixelRect(x, y, portal.w, portal.h, open ? "rgba(7,9,12,.86)" : "#171317");
  pixelRect(x + 3, y + 3, portal.w - 6, portal.h - 6, open ? "#10151b" : "#3b2429");
  pixelRect(x + 5, y + 5, 4, portal.h - 10, p[2]);
  pixelRect(x + portal.w - 9, y + 5, 4, portal.h - 10, p[2]);
  pixelRect(x + 7, y + 7, portal.w - 14, 4, p[3]);
  if (open) {
    const glow = Math.sin(frame / 9) * 2;
    pixelRect(x + 10, y + 14 + glow, portal.w - 20, 13, "rgba(255,231,165,.62)");
    pixelRect(x + 13, y + 18 + glow, portal.w - 26, 5, "#fff1bd");
    drawTinyText(label, x - 3, y - 6, "#ffe7a5");
  } else {
    pixelRect(x + portal.w / 2 - 5, y + 15, 10, 12, "#7d5c35");
    pixelRect(x + portal.w / 2 - 2, y + 18, 4, 6, "#c6423c");
    if (frame % 60 < 30) drawTinyText("BOSS", x - 1, y - 6, "#c6423c");
  }
}

function drawFinalDoor(door, theme) {
  const p = palette[theme] || palette.throne;
  const x = door.x;
  const y = door.y;
  const unlocked = finalDoorUnlocked();
  const owned = finalDoorOwnedCount();
  pixelRect(x - 8, y + door.h - 3, door.w + 16, 4, "rgba(243,204,103,.35)");
  pixelRect(x, y, door.w, door.h, unlocked ? "rgba(7,9,12,.9)" : "#120d12");
  pixelRect(x + 4, y + 5, door.w - 8, door.h - 10, unlocked ? "#1b1620" : "#29202a");
  pixelRect(x + 7, y + 8, 5, door.h - 16, p[3]);
  pixelRect(x + door.w - 12, y + 8, 5, door.h - 16, p[3]);
  pixelRect(x + 12, y + 12, door.w - 24, 5, unlocked ? "#fff1bd" : "#79573e");
  pixelRect(x + 12, y + door.h - 18, door.w - 24, 5, unlocked ? "#fff1bd" : "#79573e");
  for (let i = 0; i < requiredFinalDoorAbilities.length; i++) {
    const sx = x + 13 + (i % 4) * 7;
    const sy = y + 27 + Math.floor(i / 4) * 16;
    pixelRect(sx, sy, 4, 8, i < owned ? "#f3cc67" : "#3d2638");
    pixelRect(sx + 1, sy + 1, 2, 2, i < owned ? "#fff1bd" : "#79573e");
  }
  if (unlocked) {
    const glow = Math.sin(frame / 10) * 2;
    pixelRect(x + 18, y + 31 + glow, door.w - 36, 17, "rgba(255,231,165,.55)");
    drawTinyText("OPEN", x + 10, y - 8, "#ffe7a5");
  } else if (frame % 60 < 30) {
    drawTinyText("8 OATHS", x - 2, y - 8, "#c6423c");
  }
}

function drawCheckpointAltar(room) {
  const altar = room.checkpointAltar;
  if (!altar) return;
  const x = altar.x;
  const y = altar.y;
  const active = checkpointAltarActive(room, altar);
  const near = rects(player, altarInteractBox(altar));
  const flame = Math.floor(frame / 8) % 2;
  const glow = active ? Math.sin(frame / 11) * 2 : 0;
  const moss = altar.style === "moss" || room.theme === "moss";
  const tower = altar.style === "tower" || room.theme === "tower";
  const bone = altar.style === "bone" || room.theme === "bone";
  const sundial = altar.style === "sundial";
  const moon = altar.style === "moon";
  pixelRect(x - 7, y + altar.h - 2, altar.w + 14, 4, active ? moss ? "rgba(215,177,103,.42)" : tower ? "rgba(215,190,122,.42)" : bone ? "rgba(241,215,164,.42)" : sundial ? "rgba(240,166,66,.44)" : moon ? "rgba(159,208,208,.42)" : "rgba(255,241,189,.42)" : "rgba(0,0,0,.42)");
  if (active) {
    pixelRect(x - 8, y + 4 + glow, altar.w + 16, altar.h - 4, moss ? "rgba(110,163,95,.16)" : tower ? "rgba(215,190,122,.15)" : bone ? "rgba(241,215,164,.14)" : sundial ? "rgba(165,150,255,.16)" : moon ? "rgba(159,208,208,.17)" : "rgba(255,231,165,.13)");
    pixelRect(x + altar.w / 2 - 1, y - 6, 2, altar.h + 7, moss ? "rgba(215,177,103,.38)" : tower ? "rgba(255,241,189,.4)" : bone ? "rgba(241,215,164,.38)" : sundial ? "rgba(240,166,66,.4)" : moon ? "rgba(247,231,189,.38)" : "rgba(255,241,189,.38)");
    pixelRect(x + 1, y + 15, altar.w - 2, 1, moss ? "rgba(215,177,103,.35)" : tower ? "rgba(215,190,122,.35)" : bone ? "rgba(241,215,164,.34)" : sundial ? "rgba(165,150,255,.34)" : moon ? "rgba(159,208,208,.36)" : "rgba(255,241,189,.35)");
  }
  pixelRect(x + 3, y + 12, altar.w - 6, altar.h - 12, moss ? "#2c4630" : tower ? "#2b3545" : bone ? "#413934" : sundial ? "#563118" : moon ? "#27384b" : "#2b3545");
  pixelRect(x + 1, y + 19, altar.w - 2, 7, moss ? "#6b8c53" : tower ? "#69728a" : bone ? "#8f806d" : sundial ? "#9b5030" : moon ? "#5b6f86" : "#54606a");
  pixelRect(x, y + altar.h - 10, altar.w, 10, moss ? "#1d3922" : tower ? "#121923" : bone ? "#141313" : sundial ? "#17130e" : moon ? "#10161d" : "#33414a");
  pixelRect(x + 4, y + altar.h - 8, altar.w - 8, 2, moss ? "#d7b167" : tower ? "#d7be7a" : bone ? "#f1d7a4" : sundial ? "#f0a642" : moon ? "#9fd0d0" : "#b48850");
  pixelRect(x + 6, y + 7, altar.w - 12, 8, active ? moss ? "#d7b167" : tower ? "#fff1bd" : bone ? "#f1d7a4" : sundial ? "#f0a642" : moon ? "#f7e7bd" : "#fff1bd" : moss ? "#385d4c" : tower ? "#5b4a35" : bone ? "#413934" : sundial ? "#563118" : moon ? "#27384b" : "#7d5c35");
  pixelRect(x + 8, y + 9, altar.w - 16, 4, active ? moss ? "#fff1bd" : tower ? "#d7be7a" : bone ? "#fff1bd" : sundial ? "#a596ff" : moon ? "#9fd0d0" : "#f3cc67" : moss ? "#26362d" : tower ? "#2b3545" : bone ? "#5d5148" : sundial ? "#17130e" : moon ? "#10161d" : "#3b3030");
  pixelRect(x + altar.w / 2 - 2, y + 2, 4, 18, active ? moss ? "#6ea35f" : tower ? "#d7be7a" : bone ? "#f1d7a4" : sundial ? "#f0a642" : moon ? "#9fd0d0" : "#d7be7a" : moss ? "#385d4c" : bone ? "#8f806d" : sundial ? "#6d6255" : moon ? "#5b6f86" : "#69728a");
  pixelRect(x + altar.w / 2 - 6, y + 1, 12, 3, active ? moss ? "#d7b167" : tower ? "#fff1bd" : bone ? "#fff1bd" : sundial ? "#fff1bd" : moon ? "#f7e7bd" : "#fff1bd" : moss ? "#6b8c53" : bone ? "#8f806d" : sundial ? "#9b5030" : moon ? "#5b6f86" : "#54606a");
  if (moss) {
    const crawl = frame % 28 < 14 ? 1 : 0;
    pixelRect(x - 4, y + 14, 5, 3, "#26362d");
    pixelRect(x - 6, y + 17, 4, 10, "#26362d");
    pixelRect(x + altar.w - 1, y + 13, 5, 3, "#26362d");
    pixelRect(x + altar.w + 2, y + 16, 4, 11, "#26362d");
    pixelRect(x + 2, y + 5 + crawl, 4, 3, "#6ea35f");
    pixelRect(x + altar.w - 6, y + 23 - crawl, 4, 3, "#6ea35f");
  } else if (tower) {
    const ring = frame % 24 < 12 ? 1 : 0;
    pixelRect(x + 5, y + 4, altar.w - 10, 2, "#d7be7a");
    pixelRect(x + 7, y + 6, altar.w - 14, 8, active ? "#d7be7a" : "#7d5c35");
    pixelRect(x + 9, y + 11, altar.w - 18, 3, "#2b3545");
    pixelRect(x + altar.w / 2 - 1, y + 13, 2, 5, active ? "#fff1bd" : "#69728a");
    if (active) {
      pixelRect(x - 6 - ring, y + 8, 5, 2, "rgba(255,241,189,.55)");
      pixelRect(x + altar.w + 1 + ring, y + 8, 5, 2, "rgba(255,241,189,.55)");
      pixelRect(x - 4 - ring, y + 15, 4, 1, "rgba(215,190,122,.45)");
      pixelRect(x + altar.w + ring, y + 15, 4, 1, "rgba(215,190,122,.45)");
    }
  } else if (bone) {
    const pulse = frame % 32 < 16 ? 1 : 0;
    pixelRect(x - 3, y + 9, 4, 20, "#f1d7a4");
    pixelRect(x + altar.w - 1, y + 9, 4, 20, "#f1d7a4");
    pixelRect(x + 3, y + 5, 5, 3, "#f1d7a4");
    pixelRect(x + altar.w - 8, y + 5, 5, 3, "#f1d7a4");
    for (let i = 0; i < 3; i++) {
      pixelRect(x + 6 + i * 5, y + 16 + i, 3, 2, active ? "#fff1bd" : "#8f806d");
    }
    pixelRect(x + altar.w / 2 - 5, y + 4, 10, 4, active ? "#fff1bd" : "#8f806d");
    pixelRect(x + altar.w / 2 - 3, y + 2, 6, 2, "#f1d7a4");
    if (active) {
      pixelRect(x - 7 - pulse, y + 13, 5, 1, "rgba(241,215,164,.55)");
      pixelRect(x + altar.w + 2 + pulse, y + 13, 5, 1, "rgba(241,215,164,.55)");
      pixelRect(x + 4, y - 4 - pulse, altar.w - 8, 1, "rgba(255,241,189,.45)");
    }
  } else if (sundial) {
    const tick = Math.floor(frame / 8) % 8;
    pixelRect(x + 4, y + 4, altar.w - 8, altar.w - 8, active ? "#f0a642" : "#9b5030");
    pixelRect(x + 7, y + 7, altar.w - 14, altar.w - 14, "#17130e");
    pixelRect(x + 10, y + 10, altar.w - 20, altar.w - 20, active ? "#a596ff" : "#563118");
    pixelRect(x + altar.w / 2 - 1, y + 6, 2, 16, active ? "#fff1bd" : "#6d6255");
    pixelRect(x + 8, y + 14, 14, 2, active ? "#fff1bd" : "#6d6255");
    pixelRect(x + 2 + (tick % 4), y + 1, 5, 4, "#f0a642");
    pixelRect(x + altar.w - 7 - (tick % 3), y + 21, 6, 4, "#6d6255");
    if (active) {
      pixelRect(x - 7, y + 8, 5, 1, "rgba(165,150,255,.55)");
      pixelRect(x + altar.w + 2, y + 17, 5, 1, "rgba(240,166,66,.55)");
      pixelRect(x + 5, y - 5, altar.w - 10, 2, "rgba(255,241,189,.5)");
    }
  } else if (moon) {
    const phase = frame % 40 < 20 ? 1 : 0;
    pixelRect(x + 6, y + 4, 11, 15, active ? "#f7e7bd" : "#5b6f86");
    pixelRect(x + 10, y + 4, 10, 15, "#27384b");
    pixelRect(x + 13, y + 8, 8, 3, active ? "#9fd0d0" : "#10161d");
    pixelRect(x + 11, y + 16, 3, 9, active ? "#f7e7bd" : "#5b6f86");
    pixelRect(x + 6, y + 22, 11, 3, active ? "#9fd0d0" : "#27384b");
    pixelRect(x + 4, y + 20, 4, 5, active ? "#9fd0d0" : "#5b6f86");
    if (active) {
      pixelRect(x - 6 - phase, y + 8, 5, 1, "rgba(159,208,208,.58)");
      pixelRect(x + altar.w + 1 + phase, y + 15, 5, 1, "rgba(247,231,189,.5)");
      pixelRect(x + 5, y - 5 - phase, altar.w - 10, 1, "rgba(159,208,208,.48)");
    }
  }
  if (active) {
    pixelRect(x + altar.w / 2 - 7, y - 9 - flame, 14, 12, moss ? "rgba(110,163,95,.45)" : tower ? "rgba(215,190,122,.45)" : bone ? "rgba(241,215,164,.38)" : sundial ? "rgba(240,166,66,.45)" : moon ? "rgba(159,208,208,.45)" : "rgba(255,122,61,.45)");
    pixelRect(x + altar.w / 2 - 4, y - 15 - flame, 8, 13, moss ? "#6ea35f" : tower ? "#d7be7a" : bone ? "#f1d7a4" : sundial ? "#f0a642" : moon ? "#9fd0d0" : "#ff7a3d");
    pixelRect(x + altar.w / 2 - 2, y - 19 - flame, 4, 11, moss ? "#fff1bd" : "#fff1bd");
  } else {
    pixelRect(x + altar.w / 2 - 3, y - 4, 6, 5, moss ? "#26362d" : tower ? "#2b3545" : bone ? "#413934" : sundial ? "#17130e" : moon ? "#10161d" : "#3b3030");
    if (near && frame % 18 < 9) pixelRect(x + altar.w / 2 - 1, y - 6, 2, 4, moss ? "#6ea35f" : bone ? "#f1d7a4" : sundial ? "#f0a642" : moon ? "#9fd0d0" : "#d7be7a");
  }
  if (near) drawTinyText("F", x + altar.w / 2 - 3, y - 22, "#ffe7a5");
}

function drawRoomPortals(room) {
  drawCheckpointAltar(room);
  if (room.finalDoor) drawFinalDoor(room.finalDoor, room.theme);
  if (room.castleGatePortal && frame % 60 < 30) drawTinyText("CASTLE GATE", room.castleGatePortal.x - 12, room.castleGatePortal.y - 8, "#ffd166");
  if (room.knightHouseDoor && frame % 60 < 30) drawTinyText("HOME", room.knightHouseDoor.x - 1, room.knightHouseDoor.y - 8, "#ffd166");
  if (room.houseExitDoor && frame % 60 < 30) drawTinyText("OUT", room.houseExitDoor.x + 4, room.houseExitDoor.y - 8, "#ffd166");
  if (room.rewardPortal) drawPortal(room.rewardPortal, room.theme, guardianDefeated(room), "REWARD");
  if (player.finalBossDefeated && room.ironKingExitPortal) drawPortal(room.ironKingExitPortal, room.theme, true, "EXIT");
  if (player.finalBossDefeated && room.villageReturnPortal) drawPortal(room.villageReturnPortal, room.theme, true, "HOME");
  if (room.returnPortal) drawPortal(room.returnPortal, room.theme, true, "BACK");
}

function drawBossBarriers(room) {
  const locked = lockedGuardian(room);
  if (!locked) return;
  const root = locked.type === "thornImp";
  const bone = locked.type === "ossuaryBird";
  const bell = locked.type === "gargoyle";
  const moon = locked.type === "moonKnight";
  const clock = locked.type === "anvilGuard";
  const color = root ? frame % 12 < 6 ? "#6ea35f" : "#d7b167" : bone ? frame % 12 < 6 ? "#f1d7a4" : "#8f806d" : bell ? frame % 12 < 6 ? "#d7be7a" : "#69728a" : moon ? frame % 12 < 6 ? "#9fd0d0" : "#fff1bd" : clock ? frame % 12 < 6 ? "#a596ff" : "#f0a642" : frame % 12 < 6 ? "#f0a642" : "#c6423c";
  const glow = root ? "rgba(110,163,95,.44)" : bone ? "rgba(241,215,164,.38)" : bell ? "rgba(215,190,122,.38)" : moon ? "rgba(159,208,208,.4)" : clock ? "rgba(165,150,255,.4)" : frame % 18 < 9 ? "rgba(240,166,66,.45)" : "rgba(198,66,60,.42)";
  const dark = root ? "#1d3922" : bone ? "#413934" : bell ? "#2b3545" : moon ? "#27384b" : clock ? "#17130e" : "#5b2417";
  const drawSide = (x, inner) => {
    pixelRect(x, 154, 14, 42, "rgba(7,9,12,.82)");
    pixelRect(x + 2, 152, 10, 46, glow);
    for (let y = 154; y < 196; y += 9) {
      pixelRect(x + 4, y, 6, 7, color);
      pixelRect(x + 6, y - 3, 2, 5, "#fff1bd");
    }
    pixelRect(x - 3, 150, 20, 3, dark);
    pixelRect(x - 3, 198, 20, 3, dark);
    pixelRect(inner, 166, 7, 20, color);
  };
  const drawTop = () => {
    pixelRect(W / 2 - 38, 0, 76, 18, "rgba(7,9,12,.78)");
    for (let x = W / 2 - 35; x < W / 2 + 35; x += 10) {
      pixelRect(x, 3, 7, 12, color);
      pixelRect(x + 2, 1, 3, 5, "#fff1bd");
    }
  };
  const drawBottom = () => {
    pixelRect(W / 2 - 38, H - 18, 76, 18, "rgba(7,9,12,.78)");
    for (let x = W / 2 - 35; x < W / 2 + 35; x += 10) {
      pixelRect(x, H - 15, 7, 12, color);
      pixelRect(x + 2, H - 6, 3, 5, "#fff1bd");
    }
  };
  const openLeft = room.tiles.some(row => row[0] === ".");
  const openRight = room.tiles.some(row => row[COLS - 1] === ".");
  const openTop = room.tiles[0].some(tile => tile === ".") || room.tiles[1].some(tile => tile === ".");
  const openBottom = room.tiles[FLOOR_ROW].some(tile => tile === ".");
  if (openLeft) drawSide(0, 14);
  if (openRight) drawSide(W - 14, W - 21);
  if (openTop) drawTop();
  if (openBottom) drawBottom();
  if (openLeft || openRight || openTop || openBottom) drawTinyText(root ? "ROOT WARD" : bone ? "BONE WARD" : bell ? "BELL WARD" : moon ? "MOON WARD" : clock ? "TIME WARD" : "IRON WARD", W / 2 - 31, 22, color);
}

function drawForeground(room) {
  const p = palette[room.theme];
  for (let x = -20; x < W + 20; x += 52) {
    const sway = Math.sin(frame / 35 + x) * 2;
    if (room.theme === "water") {
      pixelRect(x + sway, 8, 2, 28 + (x % 23), "rgba(12,42,55,.45)");
      pixelRect(x - 2 + sway, 34 + (x % 26), 8, 3, "rgba(116,209,199,.25)");
    } else if (room.theme === "moss") {
      continue;
    } else if (["castle", "tower", "chapel", "keep", "throne"].includes(room.theme)) {
      pixelRect(x + sway, 8, 2, 32, "rgba(0,0,0,.38)");
      pixelRect(x - 4 + sway, 40, 10, 3, p[3]);
      pixelRect(x - 2 + sway, 43, 6, 18, "rgba(140,47,56,.26)");
      pixelRect(x - 1 + sway, 47, 2, 8, "rgba(213,155,68,.26)");
      if ((x + room.id) % 104 === 0) pixelRect(x - 7 + sway, 62, 16, 2, "rgba(247,231,189,.18)");
    } else {
      pixelRect(x + sway, 5, 2, 24, "rgba(0,0,0,.42)");
      pixelRect(x - 3 + sway, 28, 8, 5, "#8f806d");
    }
  }
  ctx.fillStyle = "rgba(0,0,0,.2)";
  for (let x = 0; x < W; x += 38) ctx.fillRect(x, H - 8 - ((x + room.id) % 5), 22, 8);
}

function drawScreenTexture() {
  ctx.fillStyle = "rgba(255,255,255,.025)";
  for (let y = 0; y < H; y += 4) ctx.fillRect(0, y, W, 1);
  ctx.fillStyle = "rgba(0,0,0,.12)";
  for (let x = 0; x < W; x += 3) ctx.fillRect(x, 0, 1, H);
  if (frame % 90 < 5) {
    ctx.fillStyle = "rgba(255,255,255,.035)";
    ctx.fillRect(0, 20 + (frame * 7) % 170, W, 1);
  }
}

function mapDisplayRooms() {
  const nodes = rooms
    .map((room, id) => ({ ...room, id }))
    .filter(room => !room.removed && !room.hidden);
  const house = world.get(KNIGHT_HOUSE_ROOM_ID);
  const village = world.get(VILLAGE_START_ROOM_ID);
  if (house && village && (village.visited || house.visited || player.room === KNIGHT_HOUSE_ROOM_ID)) {
    nodes.push({ id: KNIGHT_HOUSE_ROOM_ID, x: rooms[VILLAGE_START_ROOM_ID].x, y: rooms[VILLAGE_START_ROOM_ID].y - 1, theme: "village", label: "HOME", mapOnly: true });
  }
  return nodes;
}

function rebuildMapStatic() {
  const panelW = 212;
  const panelH = 158;
  const nodes = mapDisplayRooms();
  const xs = nodes.map(r => r.x);
  const ys = nodes.map(r => r.y);
  const minX = Math.min(...xs);
  const minY = Math.min(...ys);
  const maxX = Math.max(...xs);
  const maxY = Math.max(...ys);
  const mapW = 178;
  const mapH = 104;
  const cellW = Math.max(7, Math.min(22, Math.floor(mapW / Math.max(1, maxX - minX + 1))));
  const cellH = Math.max(7, Math.min(17, Math.floor(mapH / Math.max(1, maxY - minY + 1))));
  const startX = 15;
  const startY = 35;
  mapStaticCanvas = mapStaticCanvas || document.createElement("canvas");
  mapStaticCanvas.width = panelW;
  mapStaticCanvas.height = panelH;
  const m = mapStaticCanvas.getContext("2d");
  m.imageSmoothingEnabled = false;
  m.clearRect(0, 0, panelW, panelH);
  m.fillStyle = "rgba(7,9,12,.88)";
  m.fillRect(0, 0, panelW, panelH);
  m.strokeStyle = "#7d5c35";
  m.strokeRect(0.5, 0.5, panelW - 1, panelH - 1);
  m.fillStyle = "#f1d38b";
  m.font = "10px monospace";
  m.fillText("Vesper Map", 13, 18);
  const layoutNodes = nodes.map(r => {
    const x = startX + (r.x - minX) * cellW;
    const y = startY + (r.y - minY) * cellH;
    return { ...r, sx: x, sy: y, sw: Math.max(4, cellW - 3), sh: Math.max(4, cellH - 3) };
  });
  const villageNode = layoutNodes.find(node => node.id === VILLAGE_START_ROOM_ID);
  const homeNode = layoutNodes.find(node => node.id === KNIGHT_HOUSE_ROOM_ID);
  if (villageNode && homeNode) {
    m.strokeStyle = "rgba(255,209,102,.45)";
    m.beginPath();
    m.moveTo(homeNode.sx + homeNode.sw / 2, homeNode.sy + homeNode.sh);
    m.lineTo(villageNode.sx + villageNode.sw / 2, villageNode.sy);
    m.stroke();
  }
  for (const node of layoutNodes) {
    const room = world.get(node.id);
    const p = palette[node.theme] || palette.castle;
    const visited = !!room?.visited || node.id === VILLAGE_START_ROOM_ID;
    m.fillStyle = visited ? p[2] : "#272d32";
    m.fillRect(node.sx, node.sy, node.sw, node.sh);
    if (node.mapOnly) {
      m.fillStyle = visited ? "#ffd166" : "#59616a";
      m.fillRect(node.sx + 1, node.sy + 1, Math.max(2, node.sw - 2), 1);
      m.fillRect(node.sx + Math.floor(node.sw / 2), node.sy + 2, 1, Math.max(2, node.sh - 3));
    }
    if (node.req && !has(node.req)) {
      m.fillStyle = "#101317";
      m.fillRect(node.sx + Math.max(1, node.sw / 2 - 3), node.sy + Math.max(1, node.sh / 2 - 3), 6, 6);
      m.fillStyle = "#c6423c";
      m.fillRect(node.sx + Math.max(3, node.sw / 2 - 1), node.sy + Math.max(1, node.sh / 2 - 4), 2, 5);
    }
  }
  mapLayout = { panelW, panelH, panelX: (W - panelW) / 2, panelY: 24, nodes: layoutNodes };
  mapStaticDirty = false;
}

function drawMap() {
  if (!mapOpen) return;
  if (mapStaticDirty || !mapStaticCanvas || !mapLayout) rebuildMapStatic();
  ctx.drawImage(mapStaticCanvas, mapLayout.panelX, mapLayout.panelY);
  const active = mapLayout.nodes.find(node => node.id === player.room);
  if (active) {
    const x = mapLayout.panelX + active.sx;
    const y = mapLayout.panelY + active.sy;
    ctx.strokeStyle = "#ffe7a5";
    ctx.strokeRect(x - 2, y - 2, active.sw + 4, active.sh + 4);
    ctx.fillStyle = "#fff1bd";
    ctx.fillRect(x + Math.max(1, active.sw / 2 - 1), y + Math.max(1, active.sh / 2 - 1), 2, 2);
  }
  ctx.fillStyle = "#f7e7bd";
  ctx.font = "8px monospace";
  ctx.fillText(displayRoomName(currentRoom()), mapLayout.panelX + 13, mapLayout.panelY + mapLayout.panelH - 15);
}

function drawAreaCard() {
  if (!areaCard) return;
  const p = palette[areaCard.theme] || palette.castle;
  const t = areaCard.time / areaCard.max;
  const fade = Math.min(1, t * 4, (1 - t) * 6);
  ctx.save();
  ctx.globalAlpha = Math.max(0, fade);
  if (areaCard.first) {
    const w = 260;
    const h = areaCard.story ? 98 : 82;
    const x = (W - w) / 2;
    const y = 46;
    ctx.fillStyle = "rgba(6,8,11,.72)";
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = "rgba(7,9,12,.9)";
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = p[3];
    ctx.strokeRect(x + 0.5, y + 0.5, w, h);
    ctx.strokeStyle = "rgba(255,231,165,.35)";
    ctx.strokeRect(x + 6.5, y + 6.5, w - 13, h - 13);
    for (let i = 0; i < 8; i++) {
      pixelRect(x + 14 + i * 29, y + 14, 12, 2, p[2]);
      pixelRect(x + 20 + i * 29, y + h - 17, 12, 2, p[3]);
    }
    ctx.fillStyle = "#f7e7bd";
    ctx.font = "18px monospace";
    ctx.fillText(areaCard.title, x + 20, y + 43);
    ctx.font = "8px monospace";
    ctx.fillStyle = p[3];
    if (areaCard.story) {
      const words = areaCard.subtitle.split(" ");
      let line = "";
      let lineY = y + 58;
      for (const word of words) {
        const next = line ? `${line} ${word}` : word;
        if (next.length > 46 && line) {
          ctx.fillText(line, x + 22, lineY);
          line = word;
          lineY += 10;
        } else {
          line = next;
        }
      }
      if (line) ctx.fillText(line, x + 22, lineY);
    } else {
      ctx.fillText(areaCard.subtitle, x + 22, y + 58);
    }
    ctx.fillStyle = "rgba(255,255,255,.2)";
    ctx.fillText(areaCard.story ? "ARTIFACT STORY RECORDED" : "NEW PATH RECORDED", x + 22, y + h - 12);
  } else {
    const x = 8;
    const h = areaCard.boss ? 24 : 20;
    const y = H - h - 7;
    const w = areaCard.boss ? 150 : 112;
    ctx.fillStyle = "rgba(7,9,12,.68)";
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = p[3];
    ctx.strokeRect(x + 0.5, y + 0.5, w, h);
    pixelRect(x + 5, y + 6, 7, 10, p[2]);
    pixelRect(x + 7, y + 4, 3, 14, p[3]);
    if (areaCard.boss) {
      pixelRect(x + 4, y + h - 5, w - 8, 1, "rgba(255,231,165,.2)");
      pixelRect(x + 12, y + h - 8, 18, 1, p[3]);
    }
    ctx.font = areaCard.boss ? "8px monospace" : "7px monospace";
    ctx.fillStyle = "#ffe7a5";
    const maxTitle = areaCard.boss ? 22 : 17;
    const title = areaCard.title.length > maxTitle ? `${areaCard.title.slice(0, maxTitle - 3)}...` : areaCard.title;
    ctx.fillText(title, x + 17, y + 10);
    ctx.font = "6px monospace";
    ctx.fillStyle = "#b8a581";
    const maxSubtitle = areaCard.boss ? 25 : 18;
    const subtitle = areaCard.subtitle.length > maxSubtitle ? `${areaCard.subtitle.slice(0, maxSubtitle - 3)}...` : areaCard.subtitle;
    ctx.fillText(subtitle, x + 17, y + 18);
  }
  ctx.restore();
  ctx.font = "8px monospace";
}

function drawBlockText(text, centerX, y, scale, color = "#ffffff", border = "#050608") {
  const glyphs = {
    I: ["11111", "00100", "00100", "00100", "00100", "00100", "11111"],
    R: ["11110", "10001", "10001", "11110", "10100", "10010", "10001"],
    O: ["01110", "10001", "10001", "10001", "10001", "10001", "01110"],
    N: ["10001", "11001", "10101", "10011", "10001", "10001", "10001"],
    K: ["10001", "10010", "10100", "11000", "10100", "10010", "10001"],
    G: ["01110", "10001", "10000", "10111", "10001", "10001", "01110"],
    " ": ["000", "000", "000", "000", "000", "000", "000"]
  };
  const rows = Array.from({ length: 7 }, () => "");
  for (const ch of text) {
    const glyph = glyphs[ch] || glyphs[" "];
    for (let row = 0; row < rows.length; row++) rows[row] += glyph[row] + "0";
  }
  const width = Math.max(...rows.map(row => row.length)) * scale;
  const x = Math.round(centerX - width / 2);
  const drawPass = (dx, dy, fill) => {
    ctx.fillStyle = fill;
    rows.forEach((row, gy) => {
      [...row].forEach((cell, gx) => {
        if (cell !== "1") return;
        ctx.fillRect(x + gx * scale + dx, y + gy * scale + dy, scale, scale);
      });
    });
  };
  drawPass(-2, 0, border);
  drawPass(2, 0, border);
  drawPass(0, -2, border);
  drawPass(0, 2, border);
  drawPass(2, 2, border);
  drawPass(0, 0, color);
}

function drawIronKingIntroTitle() {
  if (!bossIntro || bossIntro.room !== FINAL_BOSS_ROOM_ID || bossIntro.type !== "ironKing" || bossIntro.time <= 0) return;
  const t = 1 - bossIntro.time / bossIntro.max;
  const alpha = Math.min(1, t * 4, (1 - t) * 5);
  const rumble = t > 0.22 && t < 0.58 ? (frame % 4 < 2 ? -2 : 2) : 0;
  ctx.save();
  ctx.globalAlpha = alpha;
  drawBlockText("IRON KING", W / 2 + rumble, 34 + (t < 0.25 ? 8 : 0), 5, "#ffffff", "#030405");
  if (t > 0.34) {
    ctx.globalAlpha = alpha * 0.45;
    drawBlockText("IRON KING", W / 2 - rumble, 35, 5, "#fff1bd", "#030405");
  }
  ctx.restore();
}

function draw() {
  const room = currentRoom();
  const zoom = WORLD_RENDER_ZOOM;
  const focusX = clamp(player.x + player.w / 2, W / (2 * zoom), W - W / (2 * zoom));
  const focusY = clamp(player.y + player.h / 2, H / (2 * zoom), H - H / (2 * zoom));
  ctx.setTransform(GAME_RENDER_SCALE, 0, 0, GAME_RENDER_SCALE, 0, 0);
  ctx.imageSmoothingEnabled = false;
  ctx.save();
  ctx.translate(Math.round(W / 2 - focusX * zoom), Math.round(H / 2 - focusY * zoom));
  ctx.scale(zoom, zoom);
  drawBackground(room);
  for (let y = 0; y < room.tiles.length; y++) for (let x = 0; x < room.tiles[y].length; x++) drawTile(x, y, room.theme, room.tiles[y][x]);
  for (const r of room.rings) {
    ctx.strokeStyle = "#d6b765";
    ctx.strokeRect(r.x - 5 + cameraX, r.y - 5 + cameraY, 10, 10);
  }
  drawRoomPortals(room);
  drawBossBarriers(room);
  for (const it of room.items) drawItem(it);
  for (const npc of room.npcs || []) drawNpc(npc);
  for (const p of projectiles) drawProjectile(p);
  for (const e of room.enemies) drawEnemy(e);
  for (const p of particles) pixelRect(p.x, p.y, 2, 2, p.color);
  drawPlayer();
  drawForeground(room);
  ctx.restore();
  drawVignette();
  drawScreenTexture();
  drawIronKingIntroTitle();
  drawAreaCard();
  drawMap();
}

function drawVignette() {
  ctx.fillStyle = "rgba(0,0,0,.22)";
  ctx.fillRect(0, 0, W, 8);
  ctx.fillRect(0, H - 10, W, 10);
  ctx.fillRect(0, 0, 8, H);
  ctx.fillRect(W - 8, 0, 8, H);
  ctx.fillStyle = "rgba(255,231,165,.035)";
  ctx.fillRect(10, 10, W - 20, 1);
  ctx.fillRect(10, H - 12, W - 20, 1);
}

function updateUi() {
  const hpWidth = `${(player.hp / player.maxHp) * 100}%`;
  const mpWidth = `${(player.mp / player.maxMp) * 100}%`;
  ui.hpBar.style.width = hpWidth;
  ui.mpBar.style.width = mpWidth;
  if (ui.hpBarOverlay) ui.hpBarOverlay.style.width = hpWidth;
  if (ui.mpBarOverlay) ui.mpBarOverlay.style.width = mpWidth;
  const ownedCount = Object.keys(abilityInfo).filter(key => has(key)).length;
  const artifactTotal = Object.keys(abilityInfo).length;
  ui.questStatus.textContent = player.finalBossDefeated ? "Iron King defeated" : ownedCount >= artifactTotal ? "Face the Iron King" : `${ownedCount} / ${artifactTotal} artifacts`;
  ui.roomName.textContent = displayRoomName(currentRoom());
  updateControlsList();
  if (inventoryOpen) updateInventory();
}

function controlLine(label, keysText) {
  return `<p class="control-line"><b>${label}</b><span>${keysText}</span></p>`;
}

function updateControlsList() {
  const lines = [
    controlLine("Move", "A/D or arrows"),
    controlLine("Jump", "Up / Space"),
    controlLine("Look Up", "W")
  ];
  if (has("dash")) lines.push(controlLine("Dash", "L"));
  if (has("superDash")) lines.push(controlLine("Bell Dash", "Hold N"));
  if (has("grapple")) lines.push(controlLine("Grapple", "I"));
  if (has("sword")) lines.push(controlLine("Attack", "J"));
  if (has("fire")) lines.push(controlLine("Cast", "K"));
  lines.push(controlLine("Interact", "F"));
  lines.push(has("shield") ? controlLine("Shield", "S") : controlLine("Crouch", "S"));
  if (has("shield")) lines.push(controlLine("Parry Counter", has("fire") ? "J / Full Mana K" : "J"));
  if (has("time")) lines.push(controlLine("Slow Time", "Tap Shift"));
  lines.push(
    controlLine("Heal", "Hold H"),
    controlLine("Map", "M"),
    controlLine("Inventory", "V"),
    controlLine("Pause", "P / Esc"),
    controlLine("Mute", "O")
  );
  ui.controlsList.innerHTML = lines.join("");
}

function updateInventory() {
  const owned = Object.entries(abilityInfo).filter(([key]) => has(key));
  ui.abilities.innerHTML = owned.length
    ? owned.map(([key, info]) => `<div class="ability on"><b>${abilityArtifacts[key].article}</b>${info[1]}<p>${abilityArtifacts[key].story} ${abilityDescriptions[key]}</p></div>`).join("")
    : `<div class="ability"><b>No artifacts yet</b>Defeat area guardians to earn movement arts.<p>The first paths lead toward the Outer Rampart and Bell Tower.</p></div>`;
}

function loop() {
  update();
  drawTitleCanvas();
  draw();
  requestAnimationFrame(loop);
}

ui.newGameBtn.addEventListener("click", () => {
  playSfx("menuStart");
  beginGame(false);
});
ui.continueBtn.addEventListener("click", () => {
  if (loadGame()) {
    playSfx("menuContinue");
    beginGame(true);
  }
});
ui.continueBtn.disabled = !readSave();
ui.settingsBtn.addEventListener("click", () => {
  playSfx("menuMove");
  ui.settingsPanel.classList.toggle("hidden");
});
for (const button of [ui.newGameBtn, ui.continueBtn, ui.settingsBtn]) {
  button.addEventListener("pointerenter", () => selectTitleButton(button));
  button.addEventListener("focus", () => selectTitleButton(button, false));
}
ui.masterVolume.addEventListener("input", e => setAudioLevel("master", e.target.value));
ui.musicVolume.addEventListener("input", e => setAudioLevel("music", e.target.value));
ui.sfxVolume.addEventListener("input", e => setAudioLevel("sfx", e.target.value));
ui.pauseMasterVolume.addEventListener("input", e => setAudioLevel("master", e.target.value));
ui.pauseMusicVolume.addEventListener("input", e => setAudioLevel("music", e.target.value));
ui.pauseSfxVolume.addEventListener("input", e => setAudioLevel("sfx", e.target.value));
syncAudioSettingsUi();
ui.sidebarScale?.addEventListener("input", e => setSidebarScale(e.target.value));
syncSidebarScaleUi();
ui.inventoryBtn.addEventListener("click", () => setInventory(true));
ui.pauseBtn.addEventListener("click", () => setPaused(true));
ui.fullscreenPauseBtn.addEventListener("click", () => setPaused(true));
ui.fullscreenBtn.addEventListener("click", toggleFullscreenView);
ui.fullscreenExitBtn.addEventListener("click", toggleFullscreenView);
ui.resumeBtn.addEventListener("click", () => setPaused(false));
ui.saveBtn.addEventListener("click", () => {
  saveGame();
  playSfx("pickup");
  say("Game saved.");
});
ui.pauseSettingsBtn.addEventListener("click", () => {
  ui.pauseSettingsPanel.classList.toggle("hidden");
});
ui.titleBtn.addEventListener("click", returnToTitle);
ui.closeInventoryBtn.addEventListener("click", () => setInventory(false));
ui.inventoryModal.addEventListener("click", e => {
  if (e.target === ui.inventoryModal) setInventory(false);
});
ui.pauseModal.addEventListener("click", e => {
  if (e.target === ui.pauseModal) setPaused(false);
});
updateTitleSelection(0, false);
setTitleActive(!gameStarted);

window.addEventListener("keydown", e => {
  const k = e.key.toLowerCase();
  const menuControl = ["button", "input"].includes(e.target?.tagName?.toLowerCase());
  if (k === "escape" && inventoryOpen) {
    setInventory(false);
    return;
  }
  if (!gameStarted && !menuControl && ["arrowup", "w", "arrowleft", "a"].includes(k)) {
    ensureAudio();
    updateTitleSelection(titleSelection - 1);
    e.preventDefault();
    return;
  }
  if (!gameStarted && !menuControl && ["arrowdown", "s", "arrowright", "d"].includes(k)) {
    ensureAudio();
    updateTitleSelection(titleSelection + 1);
    e.preventDefault();
    return;
  }
  if (gameStarted && !menuControl && (k === "escape" || k === "p")) {
    setPaused(!paused);
    e.preventDefault();
    return;
  }
  if (!gameStarted && !menuControl && (k === "enter" || k === " ")) {
    const button = titleButtons()[titleSelection] || ui.newGameBtn;
    button.click();
    e.preventDefault();
    return;
  }
  if (!keys.has(k)) pressed.add(k);
  keys.add(k);
  if (["arrowup", "arrowdown", "arrowleft", "arrowright", " "].includes(k)) e.preventDefault();
});

window.addEventListener("keyup", e => keys.delete(e.key.toLowerCase()));
window.addEventListener("resize", scheduleGameCanvasFit);
window.addEventListener("blur", pauseForFocusLoss);
document.addEventListener("visibilitychange", () => {
  if (document.hidden) pauseForFocusLoss();
});
document.addEventListener("fullscreenchange", () => {
  if (!document.fullscreenElement && fullscreenView) setFullscreenView(false);
  scheduleGameCanvasFit();
});

ctx.font = "8px monospace";
fitGameCanvas();
updateUi();
loop();
