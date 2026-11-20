/* Trainingshalle – App-Logik (ohne Frameworks, läuft offline) */
"use strict";

const APP_VERSION = "1.7.0";
const STORE_KEY = "trainingshalle.v1";
const OLD_KEYS = ["dhbcoach.v1"]; // frühere Version: Daten werden einmalig übernommen
const EX = window.UEBUNGEN || [];
const EXMAP = Object.fromEntries(EX.map(e => [e.id, e]));
const THEMEN = window.THEMEN || [];
const THMAP = Object.fromEntries(THEMEN.map(t => [t.id, t]));
const STUFEN = { 1: "Vorübung", 2: "Übung mit Gegner", 3: "Komplexübung", 4: "Spielform" };
// Zu welchen Methodikreihen gehört eine Übung? exId -> [{t, s}]
const EX_REIHE = {};
THEMEN.forEach(t => Object.entries(t.stufen).forEach(([s, ids]) => ids.forEach(id => (EX_REIHE[id] = EX_REIHE[id] || []).push({ t: t.id, s: +s }))));

const AXES = [
  { k: "ia", l: "Individuell Angriff", s: "Ind. Angriff", c: "#0040d6" },
  { k: "iv", l: "Individuell Abwehr", s: "Ind. Abwehr", c: "#c8001e" },
  { k: "ko", l: "Kooperation (2–3 Spieler)", s: "Kooperation", c: "#7b2cbf" },
  { k: "ma", l: "Mannschaftstaktik", s: "Mannschaft", c: "#111111" },
  { k: "te", l: "Tempospiel / Umschalten", s: "Tempo", c: "#e07000" },
  { k: "wt", l: "Wurf & Torwart", s: "Wurf / TW", c: "#007a8a" },
  { k: "at", l: "Athletik & Prävention", s: "Athletik", c: "#007a33" }
];
const PHASES = { auf: "Aufwärmen", prae: "Prävention", haupt: "Hauptteil", spiel: "Spielform", aus: "Ausklang" };
const MATERIAL = ["Hütchen", "Leibchen", "Weichboden", "Bänke/Kästen", "Koordinationsleiter", "Reifen", "Softbälle"];
const FLAECHE_RANG = { drittel: 1, halb: 2, ganz: 3 };
const FLAECHE_TXT = { drittel: "Hallendrittel", halb: "halbe Halle", ganz: "ganze Halle" };
const PRESETS = [
  { n: "Ausgewogen", v: { ia: 3, iv: 3, ko: 3, ma: 2, te: 3, wt: 2, at: 2 } },
  { n: "Balleroberung & Abwehr", v: { ia: 1, iv: 5, ko: 3, ma: 4, te: 3, wt: 1, at: 2 } },
  { n: "Angriff gegen offensive Abwehr", v: { ia: 4, iv: 1, ko: 4, ma: 4, te: 1, wt: 2, at: 1 } },
  { n: "Tempo & Umschalten", v: { ia: 2, iv: 2, ko: 3, ma: 1, te: 5, wt: 2, at: 3 } },
  { n: "1-gegen-1 & Wurf", v: { ia: 5, iv: 3, ko: 1, ma: 0, te: 1, wt: 4, at: 2 } },
  { n: "Spielvorbereitung (leicht)", v: { ia: 2, iv: 1, ko: 3, ma: 4, te: 2, wt: 4, at: 0 } }
];

/* ---------------- Zustand ---------------- */
const today = () => new Date().toISOString().slice(0, 10);
const DEFAULT = {
  v: 1, theme: "light", repo: "", verband: "by",
  rahmen: { dauer: 90, spieler: 14, tw: 1, flaeche: "ganz", baelle: 14, harz: 1, material: ["Hütchen", "Leibchen"], lage: "normal" },
  radar: { ...PRESETS[0].v },
  modus: "thema", thema: "offensiv",
  ziel: "",
  plan: null,
  saved: []
};
let S = load();

function load() {
  try {
    let raw = localStorage.getItem(STORE_KEY);
    if (!raw) for (const k of OLD_KEYS) { raw = localStorage.getItem(k); if (raw) { localStorage.setItem(STORE_KEY, raw); localStorage.removeItem(k); break; } }
    if (!raw) return structuredClone(DEFAULT);
    const d = JSON.parse(raw);
    return { ...structuredClone(DEFAULT), ...d, rahmen: { ...DEFAULT.rahmen, ...(d.rahmen || {}) }, radar: { ...DEFAULT.radar, ...(d.radar || {}) } };
  } catch (e) { return structuredClone(DEFAULT); }
}
function save() { if (typeof syncBlockPlan === "function") syncBlockPlan(); try { localStorage.setItem(STORE_KEY, JSON.stringify(S)); } catch (e) { /* Speicher voll oder gesperrt */ } }

/* ---------------- Hilfen ---------------- */
const $ = s => document.querySelector(s);
const $$ = s => Array.from(document.querySelectorAll(s));
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const r5 = n => Math.max(5, Math.round(n / 5) * 5);
const uid = () => Math.random().toString(36).slice(2, 9);
function toast(msg) { const t = $("#toast"); t.textContent = msg; t.style.display = "block"; clearTimeout(toast.t); toast.t = setTimeout(() => t.style.display = "none", 2600); }
function fmtDate(iso) { try { return new Date(iso + "T12:00:00").toLocaleDateString("de-DE", { weekday: "short", day: "2-digit", month: "2-digit", year: "numeric" }); } catch (e) { return iso; } }
function fmtMin(m) { return m + "'"; }

/* ---------------- Navigation & Wischen ---------------- */
const VIEWS = ["planer", "plan", "bib", "saison", "taktik", "info"];
let current = "planer";
function show(view) {
  current = view;
  $$(".view").forEach(v => v.classList.toggle("active", v.id === "v-" + view));
  $$(".tab").forEach(t => t.setAttribute("aria-selected", t.dataset.view === view));
  const tb = $(`.tab[data-view="${view}"]`); if (tb) tb.scrollIntoView({ inline: "center", block: "nearest" });
  if (view === "plan") renderPlan();
  if (view === "bib") renderLib();
  if (view === "taktik" && typeof tkRender === "function") tkRender();
  if (view === "saison" && typeof snRender === "function") snRender();
  window.scrollTo({ top: 0 });
}
function step(dir) { const i = VIEWS.indexOf(current); const n = i + dir; if (n >= 0 && n < VIEWS.length) show(VIEWS[n]); }
function initNav() {
  $$(".tab").forEach(t => t.addEventListener("click", () => show(t.dataset.view)));
  const h = $("#hdr"); let x0 = null, y0 = null;
  h.addEventListener("touchstart", e => { x0 = e.touches[0].clientX; y0 = e.touches[0].clientY; }, { passive: true });
  h.addEventListener("touchend", e => {
    if (x0 === null) return;
    const dx = e.changedTouches[0].clientX - x0, dy = e.changedTouches[0].clientY - y0;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) step(dx < 0 ? 1 : -1);
    x0 = null;
  }, { passive: true });
  document.addEventListener("keydown", e => {
    if ($("#sheet").classList.contains("open")) { if (e.key === "Escape") closeSheet(); return; }
    if (["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement.tagName)) return;
    if (e.key === "ArrowRight") step(1); if (e.key === "ArrowLeft") step(-1);
  });
}

/* ---------------- Design ---------------- */
function applyTheme() {
  document.documentElement.dataset.theme = S.theme;
  $$("#themeSeg button").forEach(b => b.setAttribute("aria-pressed", b.dataset.v === S.theme));
  $("#themeBtn").textContent = S.theme === "dark" ? "☀" : "☾";
  const m = document.querySelector('meta[name="theme-color"]'); if (m) m.content = S.theme === "dark" ? "#000000" : "#ffffff";
}

/* ---------------- Planer: Rahmenbedingungen ---------------- */
function initRahmen() {
  const d = $("#dauer");
  d.value = S.rahmen.dauer; $("#dauerOut").textContent = S.rahmen.dauer;
  d.addEventListener("input", () => { S.rahmen.dauer = +d.value; $("#dauerOut").textContent = d.value; save(); });

  $$(".stepper").forEach(st => {
    const k = st.dataset.key, min = +st.dataset.min, max = +st.dataset.max, out = st.querySelector("output");
    const [minus, plus] = st.querySelectorAll("button");
    const upd = () => out.textContent = S.rahmen[k];
    minus.onclick = () => { S.rahmen[k] = Math.max(min, S.rahmen[k] - 1); upd(); save(); };
    plus.onclick = () => { S.rahmen[k] = Math.min(max, S.rahmen[k] + 1); upd(); save(); };
    upd();
  });
  $$("#v-planer .seg").forEach(sg => {
    const k = sg.dataset.key;
    const upd = () => sg.querySelectorAll("button").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.v) === String(S.rahmen[k])));
    sg.querySelectorAll("button").forEach(b => b.onclick = () => {
      S.rahmen[k] = (k === "tw" || k === "harz") ? +b.dataset.v : b.dataset.v; upd(); save();
    });
    upd();
  });
  const mc = $("#matChips");
  mc.innerHTML = MATERIAL.map(m => `<button class="chip" data-m="${esc(m)}" aria-pressed="${S.rahmen.material.includes(m)}">${esc(m)}</button>`).join("");
  mc.querySelectorAll(".chip").forEach(c => c.onclick = () => {
    const m = c.dataset.m, i = S.rahmen.material.indexOf(m);
    if (i >= 0) S.rahmen.material.splice(i, 1); else S.rahmen.material.push(m);
    c.setAttribute("aria-pressed", i < 0); save();
  });
  const z = $("#ziel"); z.value = S.ziel || ""; z.addEventListener("input", () => { S.ziel = z.value; save(); });
}

/* ---------------- Planer: Thema oder Schwerpunkte ---------------- */
function themeStagesHTML(T) {
  return `<div class="stages">${[1, 2, 3, 4].map(st => `<div><i>${st}</i><div><small>${STUFEN[st]}</small>${(T.stufen[st] || []).map(id => EXMAP[id] ? esc(EXMAP[id].titel) : "").filter(Boolean).join("<br><span class=\"hint\">oder</span> ")}</div></div>`).join("")}</div>
    <div class="note ok"><b>Sonderregel in der Spielform:</b> ${esc(T.regel)}</div>`;
}
function renderModus() {
  $$("#modusSeg button").forEach(b => b.setAttribute("aria-pressed", b.dataset.v === S.modus));
  const th = S.modus === "thema";
  $("#themaBox").hidden = !th;
  $("#radarTitle").textContent = th ? "Nebenthemen (optional)" : "Schwerpunkte setzen";
  $("#radarHint").textContent = th ? "Beeinflussen Aufwärmen und eine Ergänzungsübung, wenn Zeit bleibt – z. B. Athletik oder Torwart. Das Hauptthema kommt aus der Reihe." : "Im Diagramm entlang einer Achse ziehen oder tippen – oder unten mit − / + einstellen. 0 = kein Thema, 5 = Hauptthema.";
  const groups = [...new Set(THEMEN.map(t => t.bereich))];
  $("#themaList").innerHTML = groups.map(g => `<div class="thgroup">${esc(g)}</div>` + THEMEN.filter(t => t.bereich === g).map(t => `<button class="thm" data-th="${t.id}" aria-pressed="${t.id === S.thema}"><b>${esc(t.titel)}</b><span>${esc(t.kurz)}</span></button>`).join("")).join("");
  $$("#themaList .thm").forEach(b => b.onclick = () => { S.thema = b.dataset.th; save(); renderModus(); });
  const T = THMAP[S.thema];
  $("#themaInfo").innerHTML = T ? `<span class="lbl">Reihe „${esc(T.titel)}“</span>` + themeStagesHTML(T) : "";
}
function initModus() {
  if (!THMAP[S.thema]) S.thema = THEMEN[0] ? THEMEN[0].id : null;
  $$("#modusSeg button").forEach(b => b.onclick = () => { S.modus = b.dataset.v; save(); renderModus(); });
  renderModus();
}

/* ---------------- Planer: Spinnendiagramm ---------------- */
const RC = 200, RR = 135; // Mittelpunkt, Radius
function axisAngle(i) { return -Math.PI / 2 + i * 2 * Math.PI / AXES.length; }
function renderRadar() {
  const svg = $("#radar"); let h = "";
  for (let lv = 1; lv <= 5; lv++) {
    const pts = AXES.map((a, i) => { const r = RR * lv / 5; return [RC + r * Math.cos(axisAngle(i)), RC + r * Math.sin(axisAngle(i))].join(","); }).join(" ");
    h += `<polygon points="${pts}" fill="none" stroke="var(--fg)" stroke-opacity="${lv === 5 ? .9 : .28}" stroke-width="${lv === 5 ? 2.5 : 1.2}"/>`;
  }
  AXES.forEach((a, i) => {
    const x = RC + RR * Math.cos(axisAngle(i)), y = RC + RR * Math.sin(axisAngle(i));
    h += `<line x1="${RC}" y1="${RC}" x2="${x}" y2="${y}" stroke="var(--fg)" stroke-opacity=".45" stroke-width="1.5"/>`;
    const lx = RC + (RR + 34) * Math.cos(axisAngle(i)), ly = RC + (RR + 30) * Math.sin(axisAngle(i));
    h += `<text x="${lx}" y="${ly}" text-anchor="middle" dominant-baseline="middle" font-size="17" font-weight="800" fill="var(--fg)">${esc(a.s)}</text>`;
  });
  const pts = AXES.map((a, i) => { const r = RR * S.radar[a.k] / 5; return [RC + r * Math.cos(axisAngle(i)), RC + r * Math.sin(axisAngle(i))]; });
  h += `<polygon points="${pts.map(p => p.join(",")).join(" ")}" fill="var(--acc)" fill-opacity=".28" stroke="var(--acc)" stroke-width="4" stroke-linejoin="round"/>`;
  pts.forEach((p, i) => {
    h += `<circle cx="${p[0]}" cy="${p[1]}" r="14" fill="var(--acc)" stroke="var(--bg)" stroke-width="3"/>`;
    h += `<text x="${p[0]}" y="${p[1] + 1}" text-anchor="middle" dominant-baseline="middle" font-size="15" font-weight="900" fill="var(--acc-fg)">${S.radar[AXES[i].k]}</text>`;
  });
  svg.innerHTML = h;
  renderAxisList();
}
function renderAxisList() {
  $("#axisList").innerHTML = AXES.map(a => `
    <div class="axisrow"><div><b>${esc(a.l)}</b><div class="dots">${"●".repeat(S.radar[a.k])}${"○".repeat(5 - S.radar[a.k])}</div></div>
    <div class="stepper"><button data-ax="${a.k}" data-d="-1" aria-label="${esc(a.l)} weniger">−</button><output>${S.radar[a.k]}</output><button data-ax="${a.k}" data-d="1" aria-label="${esc(a.l)} mehr">+</button></div></div>`).join("");
  $$("#axisList button").forEach(b => b.onclick = () => {
    const k = b.dataset.ax; S.radar[k] = Math.min(5, Math.max(0, S.radar[k] + +b.dataset.d)); save(); renderRadar();
  });
}
function initRadar() {
  const svg = $("#radar"); let drag = null;
  const pt = e => { const p = svg.createSVGPoint(); p.x = e.clientX; p.y = e.clientY; const q = p.matrixTransform(svg.getScreenCTM().inverse()); return [q.x, q.y]; };
  const setFrom = (p, axis) => {
    const dx = p[0] - RC, dy = p[1] - RC;
    if (axis === null) { // nächstgelegene Achse über den Winkel
      let ang = Math.atan2(dy, dx), best = 0, bd = 9;
      AXES.forEach((a, i) => { let d = Math.abs(Math.atan2(Math.sin(ang - axisAngle(i)), Math.cos(ang - axisAngle(i)))); if (d < bd) { bd = d; best = i; } });
      axis = best;
    }
    const proj = dx * Math.cos(axisAngle(axis)) + dy * Math.sin(axisAngle(axis));
    const v = Math.max(0, Math.min(5, Math.round(proj / (RR / 5))));
    if (S.radar[AXES[axis].k] !== v) { S.radar[AXES[axis].k] = v; renderRadar(); }
    return axis;
  };
  // Achse erst festlegen, wenn der Finger weit genug vom Mittelpunkt entfernt ist
  const near = p => Math.hypot(p[0] - RC, p[1] - RC) < 30;
  svg.addEventListener("pointerdown", e => { svg.setPointerCapture(e.pointerId); const p = pt(e); drag = near(p) ? -1 : setFrom(p, null); });
  svg.addEventListener("pointermove", e => { if (drag === null) return; const p = pt(e); if (drag === -1) { if (!near(p)) drag = setFrom(p, null); } else setFrom(p, drag); });
  const end = () => { if (drag !== null) { drag = null; save(); } };
  svg.addEventListener("pointerup", end); svg.addEventListener("pointercancel", end);
  $("#presets").innerHTML = PRESETS.map((p, i) => `<button class="chip" data-p="${i}" aria-pressed="false">${esc(p.n)}</button>`).join("");
  $$("#presets .chip").forEach(c => c.onclick = () => { S.radar = { ...PRESETS[+c.dataset.p].v }; save(); renderRadar(); toast("Vorlage „" + PRESETS[+c.dataset.p].n + "“ gesetzt"); });
  renderRadar();
}

/* ---------------- Eignung einer Übung für die heutigen Bedingungen ---------------- */
function ballsNeeded(ex, n) { return ex.baelle === "viel" ? n : ex.baelle === "mittel" ? Math.ceil(n / 2) : Math.min(4, n); }
function fitCheck(ex, R = S.rahmen) {
  const why = [];
  if (FLAECHE_RANG[ex.flaeche] > FLAECHE_RANG[R.flaeche]) why.push("braucht " + FLAECHE_TXT[ex.flaeche]);
  if (ex.tw > R.tw) why.push(ex.tw === 1 ? "braucht einen Torhüter" : "braucht " + ex.tw + " Torhüter");
  if (R.spieler < ex.spieler[0]) why.push("ab " + ex.spieler[0] + " Spielern");
  const miss = ex.material.filter(m => !R.material.includes(m));
  if (miss.length) why.push("fehlt: " + miss.join(", "));
  const soft = [];
  const bn = ballsNeeded(ex, Math.min(R.spieler, ex.spieler[1]));
  if (R.baelle < bn) soft.push("eigentlich " + bn + " Bälle – längere Wartezeiten");
  if (R.spieler > ex.spieler[1]) soft.push("mehr als " + ex.spieler[1] + " Spieler: in Gruppen/Stationen teilen");
  if (!R.harz && ex.harz) soft.push("ohne Harz eingeschränkt");
  return { ok: why.length === 0, why, soft };
}

/* ---------------- Generator ---------------- */
function score(ex, w, ctx) {
  let s = 0; for (const a of AXES) s += (w[a.k] || 0) * (ex.ziele[a.k] || 0);
  const f = fitCheck(ex);
  if (!f.ok) return -Infinity;
  s -= f.soft.length * 1.5;
  if (ctx.lage === "vor" && ex.intens === 3) s -= 8;
  if (ctx.lage === "nach" && ex.intens === 3) s -= 5;
  if (ctx.recent.has(ex.id)) s -= 4;
  const tw = S.rahmen.tw;
  if (tw >= 1 && ex.tw >= 1) s += 1;                       // Torhüter sinnvoll einbinden
  if (tw >= 1 && ex.phase === "spiel" && ex.tw === 0) s -= 4; // Spielformen mit Tor bevorzugen
  if (ctx.used.has(ex.id)) return -Infinity;
  if (ex.nurTW) return -Infinity; // Torhüter-Parallelprogramm nur manuell
  return s + Math.random() * ctx.jitter;
}
function pick(phase, w, ctx) {
  const c = EX.filter(e => e.phase === phase).map(e => [e, score(e, w, ctx)]).filter(x => x[1] > -Infinity).sort((a, b) => b[1] - a[1]);
  if (c.length) return c[0][0];
  // Nichts passt streng: Material ignorieren und eine Flächenstufe größer zulassen (wird im Plan markiert)
  const R = S.rahmen;
  const relaxed = EX.filter(e => e.phase === phase && !ctx.used.has(e.id) && e.tw <= R.tw && R.spieler >= e.spieler[0] && FLAECHE_RANG[e.flaeche] <= FLAECHE_RANG[R.flaeche] + 1)
    .map(e => { let s = 0; for (const a of AXES) s += (w[a.k] || 0) * (e.ziele[a.k] || 0); return [e, s - (ctx.recent.has(e.id) ? 4 : 0) + Math.random() * ctx.jitter]; })
    .sort((a, b) => b[1] - a[1]);
  return relaxed.length ? relaxed[0][0] : null;
}
// Auswahl aus einer festen Liste (Stufe einer Methodikreihe): erst streng passend, dann gelockert
function pickFrom(ids, w, ctx) {
  const c = ids.map(id => EXMAP[id]).filter(Boolean);
  const strict = c.map(e => [e, score(e, w, ctx)]).filter(x => x[1] > -Infinity).sort((a, b) => b[1] - a[1]);
  if (strict.length) return { ex: strict[0][0], ok: true };
  const R = S.rahmen;
  const relaxed = c.filter(e => !ctx.used.has(e.id) && e.tw <= R.tw && R.spieler >= e.spieler[0] && FLAECHE_RANG[e.flaeche] <= FLAECHE_RANG[R.flaeche] + 1);
  return relaxed.length ? { ex: relaxed[0], ok: false } : null;
}
function recentIds() {
  const s = new Set();
  S.saved.slice(0, 2).forEach(p => p.items.forEach(i => s.add(i.exId)));
  return s;
}
/* Aufwärmen: eigene Rotation, damit es nicht langweilig wird.
 * - Gedächtnis: Aufwärmspiele der letzten 6 Trainingstage vor dem Plandatum (auch ohne gespeicherte Pläne)
 * - Kategorie (Fangen, Zweikampf, Spiel, Ball, Reaktion, Lauf, Leiten) nie zweimal hintereinander
 * - Radar zählt nur ein Drittel, dazu kräftiger Zufall; Abwehrthemen bevorzugen Zweikampf- und Fangspiele
 * - Vor dem Spieltag niedrig dosiert */
function logAuf(d, id) {
  const L = (S.aufLog || []).filter(x => x.d !== d);
  L.push({ d, id }); L.sort((a, b) => b.d.localeCompare(a.d));
  S.aufLog = L.slice(0, 30);
}
function pickAuf(w, ctx, datum) {
  const rec = (S.aufLog || []).filter(x => x.d < datum).slice(0, 6).map(x => x.id);
  const lastKat = rec.length && EXMAP[rec[0]] ? EXMAP[rec[0]].kat : null;
  const th = S.modus === "thema" ? THMAP[S.thema] : null;
  const c = EX.filter(e => e.phase === "auf" && !ctx.used.has(e.id) && !e.nurTW).map(e => {
    const f = fitCheck(e); if (!f.ok) return null;
    let s = 0; for (const a of AXES) s += (w[a.k] || 0) * (e.ziele[a.k] || 0) / 3;
    s -= f.soft.length * 1.5;
    const pos = rec.indexOf(e.id); if (pos >= 0) s -= 14 - pos;
    if (lastKat && e.kat === lastKat) s -= 6;
    if (ctx.recent.has(e.id)) s -= 4;
    if (th && th.bereich === "Abwehr" && (e.kat === "zweikampf" || e.kat === "fangen")) s += 2;
    if (ctx.lage === "vor") s -= (e.intens - 1) * 3;
    if (ctx.lage === "nach" && e.intens === 3) s -= 4;
    if (S.rahmen.tw >= 1 && e.tw >= 1) s += 1;
    return [e, s + Math.random() * 3];
  }).filter(Boolean).sort((a, b) => b[1] - a[1]);
  return c.length ? c[0][0] : pick("auf", w, ctx);
}
function generate(jitter = 1.2, opt = {}) {
  const lageAlt = S.rahmen.lage; if (opt.lage) S.rahmen.lage = opt.lage; // Block-Einheit: Lage aus dem Spielplan
  const R = S.rahmen, D = R.dauer;
  const ctx = { lage: R.lage, recent: recentIds(), used: new Set(), jitter };
  (opt.recent || []).forEach(id => ctx.recent.add(id));
  if (S.plan && jitter > 1.2) S.plan.items.forEach(i => ctx.recent.add(i.exId)); // „Neu vorschlagen“: Abwechslung erzwingen
  const w = { ...S.radar };
  const items = [];
  const add = (ex, min) => { if (!ex) return; ctx.used.add(ex.id); items.push(mkItem(ex, min)); };

  // 1. Zeitgerüst
  const tAus = D >= 60 ? 5 : 0;
  const tAuf = D >= 75 ? 10 : 7;
  const tPrae = D >= 75 ? 10 : 7;
  const tSpiel = Math.max(10, r5(D * 0.2 * (opt.spielF || 1)));
  let tHaupt = D - tAus - tAuf - tPrae - tSpiel;
  const nHaupt = Math.max(1, Math.min(4, Math.round(tHaupt / 17)));

  // 2. Aufwärmen + Prävention
  const wAuf = { ...w }; if (S.modus === "thema" && THMAP[S.thema]) AXES.forEach(a => wAuf[a.k] += (THMAP[S.thema].ziele[a.k] || 0)); if (R.tw >= 1 && w.wt >= 3) wAuf.wt += 3;
  const aufEx = pickAuf(wAuf, ctx, opt.datum || today()); add(aufEx, tAuf); if (aufEx) logAuf(opt.datum || today(), aufEx.id);
  const wPrae = { at: 3, ia: w.ia > 3 ? 1 : 0 };
  const praeCtx = { ...ctx, jitter: 3 }; // Präventionsblöcke rotieren
  if (R.lage === "vor") praeCtx.lage = "vor";
  add(pick("prae", wPrae, praeCtx), tPrae);

  const T = S.modus === "thema" ? THMAP[S.thema] : null;
  const hw = { ...w }; const haupt = [];
  let stageItems = null;
  if (T) {
    // 3a. Thema: Hauptteil als Methodikreihe Stufe 1 → 2 → 3
    const tw = {}; AXES.forEach(a => tw[a.k] = (T.ziele[a.k] || 0) * 2 + (w[a.k] || 0) * 0.3);
    const anteil = opt.anteil || { 1: .28, 2: .34, 3: .38 };
    stageItems = [];
    const seq = opt.stufen || [1, 2, 3], got = new Set();
    seq.forEach((st, k) => {
      let r = pickFrom(T.stufen[st] || [], tw, ctx), stufe = st;
      // Stufe doppelt gewünscht, aber keine zweite Übung vorhanden: auf eine noch fehlende Stufe ausweichen
      if (!r) for (const alt of [3, 2, 1].filter(x => !got.has(x) && !seq.slice(k + 1).includes(x))) { r = pickFrom(T.stufen[alt] || [], tw, ctx); if (r) { stufe = alt; break; } }
      if (!r) { const ex = pick("haupt", T.ziele, ctx); if (ex) r = { ex, ok: true, ersatz: true }; }
      if (!r) return;
      ctx.used.add(r.ex.id); got.add(stufe);
      stageItems.push({ ex: r.ex, stufe, ersatz: r.ersatz });
    });
    // Zeit nach Stufe gewichten; zwei Übungen derselben Stufe teilen sich deren Gewicht (je 70 %)
    const cnt = {}; stageItems.forEach(x => cnt[x.stufe] = (cnt[x.stufe] || 0) + 1);
    const gew = stageItems.map(x => anteil[x.stufe] * (cnt[x.stufe] > 1 ? .7 : 1)), gs = gew.reduce((a, b) => a + b, 0) || 1;
    stageItems = stageItems.map((x, k) => { const it = mkItem(x.ex, tHaupt * gew[k] / gs, opt.stretch || 0); it.stufe = x.stufe; if (x.ersatz) it.ersatz = true; return it; });
    stageItems.sort((x, y) => x.stufe - y.stufe);
    // Nebenthemen aus dem Diagramm werden nicht doppelt bedient
    stageItems.forEach(it => { const ex = EXMAP[it.exId]; AXES.forEach(a => hw[a.k] = Math.max(0, hw[a.k] - 0.7 * (ex.ziele[a.k] || 0))); });
  }
  // 3. Hauptteil (Modus Schwerpunkte): Schwerpunkte nacheinander abdecken
  if (!T) {
  for (let i = 0; i < nHaupt; i++) {
    const ex = pick("haupt", hw, ctx); if (!ex) break;
    ctx.used.add(ex.id); haupt.push(ex);
    for (const a of AXES) hw[a.k] = Math.max(0, hw[a.k] - 0.7 * (ex.ziele[a.k] || 0)); // abgedeckte Themen abwerten
  }
  // Reihenfolge: Schnelligkeit & Technik früh, Komplexes später
  const ord = ex => (ex.id.startsWith("at-sprint") ? 0 : 0) + ({ at: 1, ia: 2, iv: 3, wt: 4, ko: 5, te: 6, ma: 7 }[primary(ex)] || 5);
  haupt.sort((a, b) => ord(a) - ord(b));
  const per = r5(tHaupt / Math.max(1, haupt.length));
  haupt.forEach(ex => items.push(mkItem(ex, per)));
  }
  if (T) items.push(...stageItems);

  // 4. Spielform (im Thema: Stufe 4 mit Sonderregel)
  if (T) {
    const tw4 = {}; AXES.forEach(a => tw4[a.k] = (T.ziele[a.k] || 0) * 2);
    let r = pickFrom(T.stufen[4] || [], tw4, ctx);
    const ex = r ? r.ex : pick("spiel", T.ziele, ctx);
    if (ex) { ctx.used.add(ex.id); const it = mkItem(ex, tSpiel); it.stufe = 4; it.notiz = "Sonderregel: " + T.regel; it.auto = true; items.push(it); }
  } else add(pick("spiel", w, ctx), tSpiel);
  // 5. Ausklang
  if (tAus) { add(EXMAP[opt.aus || (R.lage === "vor" ? "aus-feedback" : (Math.random() < .5 ? "aus-feedback" : "aus-mobil"))], tAus); if (opt.ausNote) { const l = items[items.length - 1]; l.notiz = opt.ausNote; l.auto = true; } }

  fitDurations(items, D, opt.stretch || 0);
  // Reicht die Zeit nicht (Übungen haben Höchstdauern), weitere Hauptteil-Übung vor der Spielform ergänzen
  for (let k = 0; k < 2; k++) {
    const rest = D - items.reduce((s, i) => s + i.dauer, 0);
    if (rest < 8) break;
    const ex = pick("haupt", hw, ctx); if (!ex) break;
    ctx.used.add(ex.id);
    const si = items.findIndex(i => EXMAP[i.exId].phase === "spiel");
    items.splice(si >= 0 ? si : items.length, 0, mkItem(ex, rest));
    fitDurations(items, D, opt.stretch || 0);
  }
  S.plan = { id: uid(), datum: opt.datum || today(), ziel: opt.ziel !== undefined ? opt.ziel : (S.ziel || ""), thema: T ? T.id : null, block: opt.block || null, rahmen: { ...R, material: [...R.material] }, radar: { ...S.radar }, items };
  S.rahmen.lage = lageAlt;
  save();
}
function primary(ex) { let b = "ia", v = -1; for (const a of AXES) if ((ex.ziele[a.k] || 0) > v) { v = ex.ziele[a.k] || 0; b = a.k; } return b; }
function mkItem(ex, min, stretch = 0) {
  return { uid: uid(), exId: ex.id, dauer: Math.min(ex.dauer[2] + stretch, Math.max(ex.dauer[0], r5(min))), titel: ex.titel, ablauf: [...ex.ablauf], coaching: [...ex.coaching], notiz: "", edited: false };
}
function fitDurations(items, D, stretch = 0) {
  // Gesamtzeit auf die Trainingszeit bringen, innerhalb der sinnvollen Dauer jeder Übung
  const rows = items.map(it => ({ it, ex: EXMAP[it.exId] })), core = rows.filter(o => ["haupt", "spiel"].includes(o.ex.phase)), rest = rows.filter(o => !core.includes(o));
  const sum = () => items.reduce((s, i) => s + i.dauer, 0);
  let guard = 80;
  while (D - sum() >= 5 && guard-- > 0) { // verlängern: zuerst die kürzeste Kernübung, die noch Luft hat
    const c = [...core, ...rest].filter(o => o.it.dauer + 5 <= o.ex.dauer[2] + (core.includes(o) ? stretch : 0)).sort((x, y) => (core.includes(y) - core.includes(x)) || (x.it.dauer - y.it.dauer))[0];
    if (!c) break; c.it.dauer += 5;
  }
  while (sum() - D >= 5 && guard-- > 0) { // kürzen: zuerst die längste Kernübung über ihrer Mindestdauer
    const c = [...core, ...rest].filter(o => o.it.dauer - 5 >= o.ex.dauer[0]).sort((x, y) => (core.includes(y) - core.includes(x)) || (y.it.dauer - x.it.dauer))[0];
    if (!c) break; c.it.dauer -= 5;
  }
  // Rest auf die Spielform legen (lässt sich gut verlängern/kürzen), sonst auf die längste Kernübung
  const diff = D - sum();
  if (diff !== 0) { const tgt = core.find(o => o.ex.phase === "spiel") || core.slice().sort((x, y) => y.it.dauer - x.it.dauer)[0] || rows[0]; if (tgt) tgt.it.dauer = Math.max(5, tgt.it.dauer + diff); }
}

/* ---------------- Plan anzeigen & bearbeiten ---------------- */
function planNotes(plan) {
  const R = plan.rahmen, n = [];
  if (!R.harz) n.push("Harzverbot: haftmittelfreie Bälle verwenden, Wurfauswahl auf Fingerspitzenkontrolle ausrichten, Dreher weglassen.");
  if (R.lage === "vor") n.push("Tag vor dem Spiel: geringe Belastung, kurze Intensitäten, viel Abschluss und Selbstvertrauen.");
  if (R.lage === "nach") n.push("Tag nach dem Spiel: Belastung dosieren, Spieler mit viel Einsatzzeit entlasten.");
  if (R.spieler >= 16 && R.flaeche !== "ganz") n.push(R.spieler + " Spieler auf " + FLAECHE_TXT[R.flaeche] + ": Übungen in Gruppen bzw. Stationen aufteilen, Wartezeiten kurz halten.");
  if (R.tw === 0) n.push("Kein Torhüter: Würfe auf Zielflächen (Matten, Reifen) oder Spiel auf Endzonen.");
  if (plan.thema && plan.items.some(i => i.stufe && !fitCheck(EXMAP[i.exId], R).ok)) n.push("Die Methodikreihe braucht teilweise mehr Platz oder Material als heute vorhanden. Markierte Übungen verkleinern (Feld, Gruppen) oder über „Alternative“ tauschen – oder heute den Modus „Mehrere Schwerpunkte“ nutzen.");
  return n;
}
function renderPlan() {
  const list = $("#planList");
  if (!S.plan || !S.plan.items.length) {
    $("#planTitle").textContent = "Noch kein Plan";
    $("#planSub").textContent = "Im Planer Rahmenbedingungen und Schwerpunkte setzen, dann „Plan erstellen“.";
    $("#planTotal").textContent = ""; $("#planNotes").innerHTML = ""; $("#distBar").innerHTML = ""; $("#distLegend").innerHTML = "";
    list.innerHTML = ""; renderSaved(); return;
  }
  const P = S.plan, total = P.items.reduce((s, i) => s + i.dauer, 0), D = P.rahmen.dauer;
  $("#planTitle").textContent = "Training " + fmtDate(P.datum) + (P.block ? " · Einheit " + (P.block.idx + 1) + "/" + P.block.n : "");
  $("#planSub").innerHTML = (P.thema && THMAP[P.thema] ? "<b>Thema:</b> " + esc(THMAP[P.thema].titel) + "<br>" : "") + (P.ziel ? "<b>Ziel:</b> " + esc(P.ziel) + " · " : "") + esc(P.rahmen.spieler + " Spieler, " + P.rahmen.tw + " TW, " + FLAECHE_TXT[P.rahmen.flaeche]);
  const tt = $("#planTotal"); tt.textContent = total + " / " + D + " Min"; tt.classList.toggle("off", total !== D);
  const notes = planNotes(P);
  if (total !== D) notes.unshift("Gesamtzeit weicht um " + Math.abs(total - D) + " Minuten von der geplanten Trainingszeit ab.");
  $("#planNotes").innerHTML = notes.map(t => `<div class="note">${esc(t)}</div>`).join("");
  // Verteilung
  const sums = Object.fromEntries(AXES.map(a => [a.k, 0]));
  P.items.forEach(it => { const ex = EXMAP[it.exId]; if (!ex) return; const tot = AXES.reduce((s, a) => s + (ex.ziele[a.k] || 0), 0) || 1; AXES.forEach(a => sums[a.k] += it.dauer * (ex.ziele[a.k] || 0) / tot); });
  const all = Object.values(sums).reduce((a, b) => a + b, 0) || 1;
  $("#distBar").innerHTML = AXES.map(a => `<span style="width:${(sums[a.k] / all * 100).toFixed(1)}%;background:${a.c}" title="${esc(a.l)}"></span>`).join("");
  $("#distLegend").innerHTML = AXES.map(a => `<span><i style="background:${a.c}"></i>${esc(a.s)} ${Math.round(sums[a.k] / all * 100)}%</span>`).join("");

  let t = 0;
  list.innerHTML = P.items.map((it, idx) => {
    const ex = EXMAP[it.exId] || {}; const from = t; t += it.dauer;
    const f = ex.id ? fitCheck(ex, P.rahmen) : { ok: true, why: [], soft: [] };
    return `<article class="item" data-i="${idx}">
      <div class="top">
        <div class="time">${fmtMin(from)}–${fmtMin(t)}<small>${it.dauer} Min</small></div>
        <div>
          <span class="badge ph-${ex.phase}">${esc(PHASES[ex.phase] || "")}</span> ${it.stufe ? `<span class="badge st">Stufe ${it.stufe} · ${STUFEN[it.stufe]}</span>` : ""} ${it.edited ? '<span class="edited">✎ angepasst</span>' : ""}
          ${it.ersatz ? '<div class="fitmsg">⚠ Keine Übung dieser Stufe passt heute – Ersatz aus der Bibliothek</div>' : ""}
          <h3>${esc(it.titel)}</h3>
          <div class="meta">${esc(FLAECHE_TXT[ex.flaeche] || "")} · ${esc((ex.material || []).join(", ") || "kein Zusatzmaterial")}${ex.tw ? " · Torhüter" : ""}</div>
          ${[...f.why, ...f.soft].map(x => `<div class="fitmsg">⚠ ${esc(x)}</div>`).join("")}
          ${it.notiz ? `<div class="hint" style="margin-top:.3rem"><b>${esc(it.notiz)}</b></div>` : ""}
        </div>
      </div>
      <div class="acts">
        <button class="btn small" data-a="det">▾ Details</button>
        <button class="btn small" data-a="minus" aria-label="5 Minuten weniger">−5</button>
        <button class="btn small" data-a="plus" aria-label="5 Minuten mehr">+5</button>
        <button class="btn small" data-a="up" aria-label="nach oben">▲</button>
        <button class="btn small" data-a="down" aria-label="nach unten">▼</button>
        <button class="btn small" data-a="alt">⇄ Alternative</button>
        <button class="btn small" data-a="edit">✎ Anpassen</button>
        <button class="btn small danger" data-a="del" aria-label="entfernen">✕</button>
      </div>
      <div class="det" hidden></div>
    </article>`;
  }).join("");
  list.querySelectorAll(".item").forEach(el => el.querySelectorAll("[data-a]").forEach(b => b.onclick = () => planAction(+el.dataset.i, b.dataset.a, el)));
  renderSaved();
}
function planAction(i, a, el) {
  const items = S.plan.items, it = items[i];
  if (a === "det") {
    const d = el.querySelector(".det"); d.hidden = !d.hidden;
    if (!d.hidden) d.innerHTML = itemDetailHTML(it); return;
  }
  if (a === "minus") it.dauer = Math.max(5, it.dauer - 5);
  if (a === "plus") it.dauer += 5;
  if (a === "up" && i > 0) [items[i - 1], items[i]] = [items[i], items[i - 1]];
  if (a === "down" && i < items.length - 1) [items[i + 1], items[i]] = [items[i], items[i + 1]];
  if (a === "del") { if (!confirm("„" + it.titel + "“ aus dem Plan entfernen?")) return; items.splice(i, 1); }
  if (a === "alt") return openAlternatives(i);
  if (a === "edit") return openEdit(i);
  save(); renderPlan();
}
function itemDetailHTML(it) {
  const ex = EXMAP[it.exId] || {};
  return `${ex.g ? fieldSVG(ex.g, "field") : ""}
    ${it.notiz ? `<div class="note ok"><b>Meine Anpassung:</b> ${esc(it.notiz)}</div>` : ""}
    <p><b>Aufbau:</b> ${esc(ex.aufbau || "")}</p>
    <b>Ablauf</b><ol>${it.ablauf.map(x => `<li>${esc(x)}</li>`).join("")}</ol>
    <b>Coaching</b><ul>${it.coaching.map(x => `<li>${esc(x)}</li>`).join("")}</ul>
    <p class="hint">Leichter: ${esc(ex.leichter || "—")} · Schwerer: ${esc(ex.schwerer || "—")}</p>`;
}

/* ---------------- Alternativen ---------------- */
function openAlternatives(i) {
  const it = S.plan.items[i], cur = EXMAP[it.exId];
  const ctx = { lage: S.plan.rahmen.lage, recent: new Set(), used: new Set(S.plan.items.map(x => x.exId)), jitter: 0 };
  const w = { ...S.plan.radar };
  const phases = cur.phase === "haupt" || cur.phase === "spiel" ? ["haupt", "spiel"] : [cur.phase];
  const T = S.plan.thema && THMAP[S.plan.thema], sameStage = new Set(T && it.stufe ? (T.stufen[it.stufe] || []) : []);
  const cand = EX.filter(e => phases.includes(e.phase) && e.id !== cur.id).map(e => ({ e, s: score(e, w, ctx), f: fitCheck(e, S.plan.rahmen), same: sameStage.has(e.id) }))
    .sort((a, b) => (b.same - a.same) || ((b.s === -Infinity ? -1e9 : b.s) - (a.s === -Infinity ? -1e9 : a.s)));
  const html = `<p class="hint">Sortiert nach Passung zu deinen Schwerpunkten und Rahmenbedingungen. Ausgegraute Übungen passen heute nicht.</p>` +
    cand.map(c => `<div class="alt ${c.f.ok ? "" : "unfit"}">
      <div><span class="badge ph-${c.e.phase}">${PHASES[c.e.phase]}</span> ${c.same ? `<span class="badge st">gleiche Stufe</span>` : ""} <b>${esc(c.e.titel)}</b>
      <div class="hint">${esc(c.e.kurz)}</div>${c.f.why.map(x => `<div class="fitmsg">⚠ ${esc(x)}</div>`).join("")}</div>
      <button class="btn small primary" data-id="${c.e.id}" ${c.f.ok ? "" : "disabled"}>Nehmen</button></div>`).join("");
  openSheet("Alternative für: " + it.titel, html);
  $$("#sheetBody [data-id]").forEach(b => b.onclick = () => {
    const ex = EXMAP[b.dataset.id]; const n = mkItem(ex, it.dauer); n.dauer = Math.min(ex.dauer[2], Math.max(ex.dauer[0], it.dauer));
    if (it.stufe) { n.stufe = it.stufe; if (it.stufe === 4 && it.notiz) n.notiz = it.notiz; }
    S.plan.items[i] = n; save(); closeSheet(); renderPlan(); toast("Übung getauscht");
  });
}

/* ---------------- Übung im Plan anpassen ---------------- */
function openEdit(i) {
  const it = S.plan.items[i];
  openSheet("Übung anpassen", `
    <p class="hint">Änderungen gelten nur für diesen Plan. Die Bibliothek bleibt unverändert.</p>
    <span class="lbl">Titel</span><input type="text" id="edTitel" value="${esc(it.titel)}">
    <span class="lbl">Dauer (Minuten)</span><input type="text" inputmode="numeric" id="edDauer" value="${it.dauer}">
    <span class="lbl">Ablauf (ein Schritt pro Zeile)</span><textarea id="edAblauf" rows="7">${esc(it.ablauf.join("\n"))}</textarea>
    <span class="lbl">Coaching-Punkte (einer pro Zeile)</span><textarea id="edCoach" rows="4">${esc(it.coaching.join("\n"))}</textarea>
    <span class="lbl">Meine Anpassung / Notiz</span><textarea id="edNotiz" rows="3" placeholder="z. B. Gruppen: A gegen B, Paul als Joker">${esc(it.notiz)}</textarea>
    <div style="height:1rem"></div>
    <div class="row"><button class="btn primary" id="edSave">Übernehmen</button><button class="btn" id="edReset">Original wiederherstellen</button></div>`);
  $("#edSave").onclick = () => {
    it.titel = $("#edTitel").value.trim() || it.titel;
    it.dauer = Math.max(1, parseInt($("#edDauer").value, 10) || it.dauer);
    it.ablauf = $("#edAblauf").value.split("\n").map(s => s.trim()).filter(Boolean);
    it.coaching = $("#edCoach").value.split("\n").map(s => s.trim()).filter(Boolean);
    it.notiz = $("#edNotiz").value.trim();
    const ex = EXMAP[it.exId];
    const autoNote = it.stufe === 4 && S.plan.thema && THMAP[S.plan.thema] ? "Sonderregel: " + THMAP[S.plan.thema].regel : "";
    it.edited = it.titel !== ex.titel || it.ablauf.join() !== ex.ablauf.join() || it.coaching.join() !== ex.coaching.join() || (!!it.notiz && it.notiz !== autoNote);
    save(); closeSheet(); renderPlan(); toast("Gespeichert");
  };
  $("#edReset").onclick = () => { const ex = EXMAP[it.exId], T = S.plan.thema && THMAP[S.plan.thema]; Object.assign(it, { titel: ex.titel, ablauf: [...ex.ablauf], coaching: [...ex.coaching], notiz: it.stufe === 4 && T ? "Sonderregel: " + T.regel : "", edited: false }); save(); closeSheet(); renderPlan(); };
}

/* ---------------- Gespeicherte Pläne ---------------- */
function renderSaved() {
  const el = $("#savedList");
  if (!S.saved.length) { el.innerHTML = '<p class="hint">Noch keine gespeicherten Pläne. Gespeicherte Pläne sorgen auch für Abwechslung: Übungen der letzten zwei Einheiten werden seltener vorgeschlagen.</p>'; return; }
  el.innerHTML = S.saved.map((p, i) => `<div class="alt"><div><b>${esc(fmtDate(p.datum))}</b> · ${p.items.reduce((s, x) => s + x.dauer, 0)} Min<div class="hint">${esc(p.ziel || p.items.filter(x => EXMAP[x.exId]?.phase === "haupt").map(x => x.titel).join(" · "))}</div></div>
    <div class="row"><button class="btn small" data-load="${i}">Öffnen</button><button class="btn small danger" data-del="${i}" aria-label="löschen">✕</button></div></div>`).join("");
  el.querySelectorAll("[data-load]").forEach(b => b.onclick = () => { S.plan = structuredClone(S.saved[+b.dataset.load]); save(); renderPlan(); toast("Plan geladen"); });
  el.querySelectorAll("[data-del]").forEach(b => b.onclick = () => { if (confirm("Gespeicherten Plan löschen?")) { S.saved.splice(+b.dataset.del, 1); save(); renderSaved(); } });
}
function savePlan() {
  if (!S.plan) return toast("Kein Plan vorhanden");
  const i = S.saved.findIndex(p => p.id === S.plan.id);
  const copy = structuredClone(S.plan);
  if (i >= 0) S.saved[i] = copy; else S.saved.unshift(copy);
  S.saved = S.saved.slice(0, 40); save(); renderSaved(); toast("Plan gespeichert");
}

/* ---------------- Bibliothek ---------------- */
const LIB = { q: "", phase: "alle", axis: "alle", thema: "alle", fit: "all", pickFor: false };
function initLib() {
  $("#phaseChips").innerHTML = [["alle", "Alle"], ...Object.entries(PHASES)].map(([k, l]) => `<button class="chip" data-ph="${k}" aria-pressed="${k === "alle"}">${l}</button>`).join("");
  $("#axisChips").innerHTML = [["alle", "Alle"], ...AXES.map(a => [a.k, a.s])].map(([k, l]) => `<button class="chip" data-ax="${k}" aria-pressed="${k === "alle"}">${esc(l)}</button>`).join("");
  $("#themeChips").innerHTML = [["alle", "Alle"], ...THEMEN.map(t => [t.id, t.titel])].map(([k, l]) => `<button class="chip" data-th="${k}" aria-pressed="${k === "alle"}">${esc(l)}</button>`).join("");
  $$("#themeChips .chip").forEach(c => c.onclick = () => { LIB.thema = c.dataset.th; $$("#themeChips .chip").forEach(x => x.setAttribute("aria-pressed", x === c)); renderLib(); });
  $$("#phaseChips .chip").forEach(c => c.onclick = () => { LIB.phase = c.dataset.ph; $$("#phaseChips .chip").forEach(x => x.setAttribute("aria-pressed", x === c)); renderLib(); });
  $$("#axisChips .chip").forEach(c => c.onclick = () => { LIB.axis = c.dataset.ax; $$("#axisChips .chip").forEach(x => x.setAttribute("aria-pressed", x === c)); renderLib(); });
  $$("#fitSeg button").forEach(b => b.onclick = () => { LIB.fit = b.dataset.v; $$("#fitSeg button").forEach(x => x.setAttribute("aria-pressed", x === b)); renderLib(); });
  $("#q").addEventListener("input", e => { LIB.q = e.target.value.toLowerCase(); renderLib(); });
}
function renderLib() {
  const q = LIB.q.trim();
  const list = EX.filter(e => {
    if (LIB.phase !== "alle" && e.phase !== LIB.phase) return false;
    if (LIB.axis !== "alle" && (e.ziele[LIB.axis] || 0) < 2) return false;
    if (LIB.thema !== "alle" && !(EX_REIHE[e.id] || []).some(r => r.t === LIB.thema)) return false;
    if (LIB.fit === "fit" && !fitCheck(e).ok) return false;
    if (q) { const hay = (e.titel + " " + e.kurz + " " + e.rtk.join(" ") + " " + e.ablauf.join(" ")).toLowerCase(); if (!q.split(/\s+/).every(w => hay.includes(w))) return false; }
    return true;
  });
  if (LIB.thema !== "alle") { const st = e => ((EX_REIHE[e.id] || []).find(r => r.t === LIB.thema) || { s: 9 }).s; list.sort((a, b) => st(a) - st(b)); }
  $("#libCount").textContent = list.length + " von " + EX.length + " Übungen" + (LIB.pickFor ? " · Tippe „+ Plan“, um eine Übung anzuhängen" : "");
  $("#libGrid").innerHTML = list.map(e => {
    const f = fitCheck(e);
    return `<article class="ex ${f.ok ? "" : "unfit"}">
      <div class="pic">${e.g ? fieldSVG(e.g) : ""}</div>
      <div class="body">${LIB.thema !== "alle" ? (r => r ? `<span class="badge st">Stufe ${r.s}</span> ` : "")((EX_REIHE[e.id] || []).find(r => r.t === LIB.thema)) : ""}<span class="badge ph-${e.phase}">${PHASES[e.phase]}</span> <span class="badge">${e.dauer[1]} Min</span> <span class="badge">Belastung ${["", "gering", "mittel", "hoch"][e.intens]}</span>
        <h3 style="margin-top:.4rem">${esc(e.titel)}</h3><p>${esc(e.kurz)}</p>
        ${f.why.map(x => `<div class="fitmsg">⚠ ${esc(x)}</div>`).join("")}</div>
      <div class="foot"><button class="btn small" data-open="${e.id}">Details</button><button class="btn small primary" data-add="${e.id}">+ Plan</button></div>
    </article>`;
  }).join("") || '<p class="hint">Keine Übung gefunden.</p>';
  $$("#libGrid [data-open]").forEach(b => b.onclick = () => openExercise(b.dataset.open));
  $$("#libGrid [data-add]").forEach(b => b.onclick = () => addToPlan(b.dataset.add));
}
function addToPlan(id) {
  const ex = EXMAP[id];
  if (!S.plan) S.plan = { id: uid(), datum: today(), ziel: S.ziel || "", rahmen: { ...S.rahmen, material: [...S.rahmen.material] }, radar: { ...S.radar }, items: [] };
  const it = mkItem(ex, ex.dauer[1]);
  // vor dem Ausklang einfügen
  const ausIdx = S.plan.items.findIndex(x => EXMAP[x.exId]?.phase === "aus");
  if (ausIdx >= 0) S.plan.items.splice(ausIdx, 0, it); else S.plan.items.push(it);
  save(); toast("„" + ex.titel + "“ zum Plan hinzugefügt");
  if (LIB.pickFor) { LIB.pickFor = false; show("plan"); }
}
function openExercise(id) {
  const e = EXMAP[id], f = fitCheck(e);
  const issue = issueURL(e);
  openSheet(e.titel, `
    ${e.g ? fieldSVG(e.g, "field") : ""}
    ${legendHTML()}
    <p><b>${esc(e.kurz)}</b></p>
    <div class="facts">
      <div><b>Phase</b>${PHASES[e.phase]}</div><div><b>Dauer</b>${e.dauer[0]}–${e.dauer[2]} Min (Std. ${e.dauer[1]})</div>
      <div><b>Spieler</b>${e.spieler[0]}–${e.spieler[1]}${e.tw ? " · " + e.tw + " TW" : ""}</div><div><b>Fläche</b>${FLAECHE_TXT[e.flaeche]}</div>
      <div><b>Bälle</b>${{ wenig: "wenige (≤ 4)", mittel: "1 je 2 Spieler", viel: "1 je Spieler" }[e.baelle]}</div>
      <div><b>Material</b>${esc(e.material.join(", ") || "keins")}</div><div><b>Belastung</b>${["", "gering", "mittel", "hoch"][e.intens]}</div>
      <div><b>Ohne Harz</b>${e.harz ? "eingeschränkt" : "geeignet"}</div>
    </div>
    ${e.nurTW ? `<div class="note ok">Parallelprogramm nur für Torhüter – z. B. mit Co-Trainer, während die Feldspieler eine andere Übung machen. Wird nicht automatisch eingeplant.</div>` : ""}
    ${f.ok ? "" : `<div class="note">Passt heute nicht: ${esc(f.why.join(" · "))}</div>`}
    ${f.soft.length ? `<div class="note">${esc(f.soft.join(" · "))}</div>` : ""}
    <h3>Aufbau</h3><p>${esc(e.aufbau)}</p>
    <h3>Ablauf</h3><ol>${e.ablauf.map(x => `<li>${esc(x)}</li>`).join("")}</ol>
    <h3>Coaching-Punkte</h3><ul>${e.coaching.map(x => `<li>${esc(x)}</li>`).join("")}</ul>
    <h3>Typische Fehler</h3><ul>${e.fehler.map(x => `<li>${esc(x)}</li>`).join("")}</ul>
    <h3>Variationen</h3><p><b>Leichter:</b> ${esc(e.leichter)}<br><b>Schwerer:</b> ${esc(e.schwerer)}</p>
    ${(EX_REIHE[e.id] || []).length ? `<h3>Teil der Methodikreihen</h3><p>${EX_REIHE[e.id].map(r => esc(THMAP[r.t].titel) + " – Stufe " + r.s + " (" + STUFEN[r.s] + ")").join("<br>")}</p>` : ""}
    <h3>Schwerpunkte</h3><p>${AXES.filter(a => e.ziele[a.k]).map(a => esc(a.l) + " " + "●".repeat(e.ziele[a.k])).join(" · ") || "—"}<br><span class="hint">RTK-Zielbereiche: ${esc(e.rtk.join(", "))}</span></p>
    <div class="src"><b>Quelle:</b> ${esc(e.quelle.art)}: <a href="${esc(e.quelle.url)}" target="_blank" rel="noopener">${esc(e.quelle.titel)}</a>
      <p class="hint">Die Übungsbeschreibung ist eine eigene Ausarbeitung; die Quelle nennt die fachliche Grundlage zum Nachlesen.</p>
      <a class="btn small" href="${esc(issue)}" target="_blank" rel="noopener" id="issueBtn">✎ Änderung vorschlagen</a></div>
    <div style="height:1rem"></div>
    <div class="row"><button class="btn primary big" id="sheetAdd">+ Zum Plan hinzufügen</button>
    ${e.g ? '<button class="btn big" id="sheetBoard">📐 In Taktiktafel öffnen</button>' : ""}</div>`);
  if ($("#sheetBoard")) $("#sheetBoard").onclick = () => { tkFromExercise(e); closeSheet(); show("taktik"); toast("Übung auf der Tafel – jetzt anpassen oder Schritte anlegen"); };
  $("#sheetAdd").onclick = () => { addToPlan(id); closeSheet(); };
  $("#issueBtn").onclick = ev => { if (!S.repo) { ev.preventDefault(); closeSheet(); show("info"); $("#repo").focus(); toast("Bitte zuerst dein GitHub-Repository eintragen"); } };
}
function issueURL(e) {
  const repo = (S.repo || "").trim().replace(/^https?:\/\/github\.com\//, "").replace(/\/$/, "");
  const title = "Übung: " + e.titel + " [" + e.id + "]";
  const body = `**Übung:** ${e.titel}\n**ID:** \`${e.id}\`\n**Quelle:** ${e.quelle.titel} (${e.quelle.url})\n\n### Was soll sich ändern?\n\n\n### Begründung / Erfahrung aus dem Training\n\n`;
  return repo ? `https://github.com/${repo}/issues/new?labels=uebung&title=${encodeURIComponent(title)}&body=${encodeURIComponent(body)}` : "#";
}

/* ---------------- Overlay ---------------- */
function openSheet(title, html) {
  $("#sheetTitle").textContent = title; $("#sheetBody").innerHTML = html;
  const sh = $("#sheet"); if (!sh.classList.contains("open")) { sh.classList.add("open"); history.pushState({ sheet: 1 }, ""); }
  sh.scrollTop = 0; $("#sheetClose").focus();
}
function closeSheet(fromPop) { const sh = $("#sheet"); if (!sh.classList.contains("open")) return; sh.classList.remove("open"); if (!fromPop && history.state && history.state.sheet) history.back(); }
window.addEventListener("popstate", () => closeSheet(true)); // Android-Zurücktaste schließt das Overlay

/* ---------------- Spielfeld-Grafik (gemeinsame Engine für Bibliothek und künftige Taktiktafel) ---------------- */
let svgN = 0;
function halfLines(clipId) {
  return `<g fill="none" stroke="var(--fieldline)" stroke-width=".7" clip-path="url(#${clipId})">
    <path d="M12.5 0 A30 30 0 0 0 42.5 30 L57.5 30 A30 30 0 0 0 87.5 0"/>
    <path d="M-2.5 0 A45 45 0 0 0 42.5 45 L57.5 45 A45 45 0 0 0 102.5 0" stroke-dasharray="2.2 1.6"/>
    <line x1="48.5" y1="35" x2="51.5" y2="35" stroke-width="1"/>
    <line x1="49.2" y1="20" x2="50.8" y2="20"/>
    <rect x="42.5" y="-2.2" width="15" height="2.2" fill="var(--fieldline)" stroke="none"/>
  </g>`;
}
function fieldH(f) { return f === "ganz" ? 200 : f === "frei" ? 60 : 100; }
// Gemeinsame Bausteine für Bibliothek, Plan-Export und Taktiktafel
function fieldDefs(n, H) {
  return `<defs>
    <clipPath id="c${n}"><rect x="0" y="0" width="100" height="${H}"/></clipPath>
    <marker id="m${n}" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="4.5" markerHeight="4.5" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" fill="var(--fieldline)"/></marker>
    <marker id="w${n}" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="3.5" markerHeight="3.5" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" fill="var(--def)"/></marker>
  </defs>`;
}
function fieldBase(f, n) {
  const H = fieldH(f);
  let s = `<rect x="0" y="0" width="100" height="${H}" fill="var(--field)" stroke="var(--fieldline)" stroke-width="1"/>`;
  if (f === "halb" || f === "ganz") s += halfLines("c" + n);
  if (f === "ganz") s += `<g transform="translate(0,200) scale(1,-1)">${halfLines("c" + n)}</g><line x1="0" y1="100" x2="100" y2="100" stroke="var(--fieldline)" stroke-width=".8"/><circle cx="50" cy="100" r="2" fill="none" stroke="var(--fieldline)" stroke-width=".5"/>`;
  return s;
}
function lineSVG(t, p, n, extra = "") {
  const pts = p.map(q => q.map(v => +(+v).toFixed(2)).join(",")).join(" ");
  if (t === "l") return `<polyline points="${pts}" fill="none" stroke="var(--fieldline)" stroke-width=".8" stroke-linejoin="round" marker-end="url(#m${n})" ${extra}/>`;
  if (t === "p") return `<polyline points="${pts}" fill="none" stroke="var(--fieldline)" stroke-width=".7" stroke-dasharray="1.8 1.3" marker-end="url(#m${n})" ${extra}/>`;
  if (t === "w") return `<polyline points="${pts}" fill="none" stroke="var(--def)" stroke-width="1.4" stroke-linejoin="round" marker-end="url(#w${n})" ${extra}/>`;
  if (t === "dr") { // Prellen als Zickzack
    let d = `M${p[0][0]} ${p[0][1]}`;
    for (let i = 1; i < p.length; i++) {
      const [x0, y0] = p[i - 1], [x1, y1] = p[i], L = Math.hypot(x1 - x0, y1 - y0) || 1, k = Math.max(2, Math.floor(L / 2.2));
      const nx = -(y1 - y0) / L, ny = (x1 - x0) / L;
      for (let j = 1; j <= k; j++) { const tt = j / k, a = (j === k || i < p.length - 1 && j === k ? 0 : (j % 2 ? 1.1 : -1.1)); d += ` L${(x0 + (x1 - x0) * tt + nx * a).toFixed(2)} ${(y0 + (y1 - y0) * tt + ny * a).toFixed(2)}`; }
    }
    return `<path d="${d}" fill="none" stroke="var(--fieldline)" stroke-width=".7" marker-end="url(#m${n})" ${extra}/>`;
  }
  return "";
}
function decoSVG(e) {
  return `<rect x="${e[1]}" y="${e[2]}" width="${e[3]}" height="${e[4]}" fill="var(--fieldline)" fill-opacity=".12" stroke="var(--fieldline)" stroke-width=".5"/>` + (e[5] ? `<text x="${e[1] + e[3] / 2}" y="${e[2] + e[4] / 2}" font-size="3" text-anchor="middle" dominant-baseline="middle" fill="var(--fieldline)" font-weight="700">${esc(e[5])}</text>` : "");
}
function tokenSVG(t, x, y, l, sc = 1) {
  x = +(+x).toFixed(2); y = +(+y).toFixed(2); l = l || "";
  const k = v => (v * sc).toFixed(2);
  if (t === "a") return `<circle cx="${x}" cy="${y}" r="${k(3.6)}" fill="var(--att)" stroke="#fff" stroke-width=".6"/>` + (l ? `<text x="${x}" y="${y + .2}" font-size="${k(l.length > 2 ? 2.2 : 2.8)}" text-anchor="middle" dominant-baseline="middle" fill="#fff" font-weight="900">${esc(l)}</text>` : "");
  if (t === "d") return `<polygon points="${x},${y - 4 * sc} ${x - 3.8 * sc},${y + 2.8 * sc} ${x + 3.8 * sc},${y + 2.8 * sc}" fill="var(--def)" stroke="#fff" stroke-width=".6"/>` + (l ? `<text x="${x}" y="${y + .6 * sc}" font-size="${k(2.6)}" text-anchor="middle" dominant-baseline="middle" fill="#fff" font-weight="900">${esc(l)}</text>` : "");
  if (t === "tw") return `<rect x="${x - 3.4 * sc}" y="${y - 3 * sc}" width="${k(6.8)}" height="${k(6)}" rx="1.2" fill="var(--gk)" stroke="#fff" stroke-width=".6"/><text x="${x}" y="${y + .3}" font-size="${k(2.6)}" text-anchor="middle" dominant-baseline="middle" fill="#fff" font-weight="900">${esc(l || "TW")}</text>`;
  if (t === "k") return `<polygon points="${x},${y - 2.2 * sc} ${x - 1.9 * sc},${y + 1.6 * sc} ${x + 1.9 * sc},${y + 1.6 * sc}" fill="var(--cone)" stroke="var(--fieldline)" stroke-width=".35"/>`;
  if (t === "b") return `<circle cx="${x}" cy="${y}" r="${k(1.5)}" fill="#ffd400" stroke="#000" stroke-width=".45"/>`;
  if (t === "t") return `<text x="${x}" y="${y}" font-size="${k(3.4)}" text-anchor="middle" dominant-baseline="middle" fill="var(--fieldline)" font-weight="800">${esc(l)}</text>`;
  return "";
}
function fieldSVG(g, cls = "") {
  const n = ++svgN, H = fieldH(g.f), pad = 3;
  let s = `<svg class="${cls}" viewBox="${-pad} ${-pad} ${100 + 2 * pad} ${H + 2 * pad}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Übungsgrafik">${fieldDefs(n, H)}${fieldBase(g.f, n)}`;
  const tops = [];
  for (const e of g.e) {
    if (["l", "p", "dr", "w"].includes(e[0])) s += lineSVG(e[0], e[1], n);
    else if (e[0] === "m") s += decoSVG(e);
    else tops.push(e);
  }
  for (const e of tops) s += tokenSVG(e[0], e[1], e[2], e[3]);
  return s + "</svg>";
}
function legendHTML() {
  return `<div class="glegend"><span style="color:var(--att)">● Angreifer</span><span style="color:var(--def)">▲ Abwehr</span><span style="color:var(--gk)">■ Torhüter</span><span>── Laufweg</span><span>- - Pass</span><span>∿ Prellen</span><span style="color:var(--def)">━ Wurf</span><span style="color:var(--cone)">▲ Hütchen</span></div>`;
}

/* ---------------- Export ---------------- */
function planDocHTML(P, standalone) {
  let t = 0;
  const rows = P.items.map(it => {
    const ex = EXMAP[it.exId] || {}; const from = t; t += it.dauer;
    return `<div class="pi">
      <div class="ph"><span class="tm">${from}–${t}'</span><span class="bd">${it.stufe ? "Stufe " + it.stufe : (PHASES[ex.phase] || "")}</span><b>${esc(it.titel)}</b><span class="du">${it.dauer} Min</span></div>
      <div class="pb">${ex.g ? `<div class="pg">${fieldSVG(ex.g)}</div>` : ""}
        <div class="pt">${it.notiz ? `<p class="nz"><b>Anpassung:</b> ${esc(it.notiz)}</p>` : ""}
          <p><b>Aufbau:</b> ${esc(ex.aufbau || "")}</p>
          <ol>${it.ablauf.map(x => `<li>${esc(x)}</li>`).join("")}</ol>
          <p><b>Coaching:</b> ${it.coaching.map(esc).join(" · ")}</p>
          <p class="sm">Material: ${esc((ex.material || []).join(", ") || "—")} · Quelle: ${esc(ex.quelle ? ex.quelle.titel : "")}</p></div></div></div>`;
  }).join("");
  const notes = planNotes(P).map(n => `<li>${esc(n)}</li>`).join("");
  const css = `
    .pd{font-family:system-ui,Arial,sans-serif;color:#000;background:#fff;max-width:900px;margin:0 auto;padding:10px;font-size:10.5pt;line-height:1.35}
    .pd h1{font-size:16pt;margin:0 0 2px}.pd .sub{font-size:9.5pt;margin-bottom:6px}
    .pi{border:1.5px solid #000;border-radius:8px;margin:0 0 8px;page-break-inside:avoid;break-inside:avoid}
    .ph{display:flex;gap:8px;align-items:center;background:#000;color:#fff;padding:4px 8px;border-radius:6px 6px 0 0}
    .ph b{flex:1}.tm{font-weight:900;min-width:58px}.bd{font-size:8.5pt;border:1px solid #fff;border-radius:4px;padding:0 4px}.du{font-weight:900}
    .pb{display:flex;gap:10px;padding:6px 8px}.pg{flex:0 0 34%}.pg svg{width:100%;height:auto;border:1px solid #000;border-radius:4px}
    .pt{flex:1}.pt p{margin:2px 0 4px}.pt ol{margin:2px 0 4px;padding-left:18px}.sm{font-size:8.5pt;color:#333}.nz{background:#fff3c4;padding:3px 5px;border-radius:4px}
    .pd ul.no{margin:4px 0 8px;padding-left:18px;font-size:9.5pt}
    .pd svg{--field:#fbf6e8;--fieldline:#111;--att:#0040d6;--def:#c8001e;--gk:#007a33;--cone:#e07000}
    .ft{font-size:8pt;color:#333;margin-top:6px}
    @media(max-width:600px){.pb{flex-direction:column}.pg{flex:none;max-width:320px}}`;
  const body = `<div class="pd">
    <h1>Training ${esc(fmtDate(P.datum))} · ${P.items.reduce((s, i) => s + i.dauer, 0)} Minuten</h1>
    <div class="sub">${P.thema && THMAP[P.thema] ? "<b>Thema:</b> " + esc(THMAP[P.thema].titel) + " · " : ""}${P.ziel ? "<b>Ziel:</b> " + esc(P.ziel) + " · " : ""}${esc(P.rahmen.spieler + " Spieler, " + P.rahmen.tw + " TW, " + FLAECHE_TXT[P.rahmen.flaeche] + ", " + P.rahmen.baelle + " Bälle" + (P.rahmen.harz ? "" : ", Harzverbot"))}</div>
    ${notes ? `<ul class="no">${notes}</ul>` : ""}
    ${rows}
    <div class="ft">Erstellt mit Trainingshalle · Legende: ● Angreifer ▲ Abwehr ■ Torhüter · ── Laufweg · - - Pass · ∿ Prellen · ━ Wurf</div></div>`;
  if (!standalone) return `<style>${css}</style>${body}`;
  return `<!DOCTYPE html><html lang="de"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Training ${esc(P.datum)}</title><style>body{margin:0;background:#fff}${css}</style></head><body>${body}</body></html>`;
}
function doPrint() {
  if (!S.plan) return toast("Kein Plan vorhanden");
  $("#printArea").innerHTML = planDocHTML(S.plan, false);
  setTimeout(() => window.print(), 50);
}
function planText(P) {
  let t = 0;
  const lines = P.items.map(it => { const from = t; t += it.dauer; return `${from}–${t}' ${it.titel}${it.notiz ? " (" + it.notiz + ")" : ""}`; });
  return `Training ${fmtDate(P.datum)} – ${t} Min\n${P.thema && THMAP[P.thema] ? "Thema: " + THMAP[P.thema].titel + "\n" : ""}${P.ziel ? "Ziel: " + P.ziel + "\n" : ""}\n${lines.join("\n")}`;
}
async function shareText() {
  if (!S.plan) return toast("Kein Plan vorhanden");
  const text = planText(S.plan);
  if (navigator.share) { try { await navigator.share({ title: "Trainingsplan", text }); return; } catch (e) { if (e.name === "AbortError") return; } }
  window.open("https://wa.me/?text=" + encodeURIComponent(text), "_blank", "noopener");
}
async function shareFile() {
  if (!S.plan) return toast("Kein Plan vorhanden");
  const name = "Training-" + S.plan.datum + ".html";
  const file = new File([planDocHTML(S.plan, true)], name, { type: "text/html" });
  if (navigator.canShare && navigator.canShare({ files: [file] })) { try { await navigator.share({ files: [file], title: "Trainingsplan " + S.plan.datum }); return; } catch (e) { if (e.name === "AbortError") return; } }
  download(file, name); toast("Datei gespeichert – jetzt in WhatsApp anhängen");
}
function download(blob, name) { const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500); }

/* ---------------- Landesverband: Regeln je Verband ---------------- */
const VERBAND = {
  by: { name: "Bayern", titel: "C-Jugend Bayern – was im Spiel gilt", regeln: [
    "<b>Offensive Deckung ist Pflicht.</b> Erlaubt: Manndeckung der ganzen Mannschaft, 1:5, 2:4, 3:3, 3:2:1. Nicht erlaubt: 6:0, 5:1, 4:2 und Einzel-Manndeckung gegen nur 1–2 Spieler.",
    "<b>Sanktionskette:</b> Vorwarnzeichen (gelbe Karte hochgehalten) → Verwarnung des Mannschaftsverantwortlichen → bei weiterem Verstoß erneut Vorwarnzeichen, dann 7-m-Wurf.",
    "<b>Hinausstellung:</b> Während einer Hinausstellung entfällt die Pflicht zur offensiven Deckung.",
    "<b>Torwart bleibt in der eigenen Hälfte:</b> Er darf die Mittellinie nur für einen 7-m-Wurf oder ein 7-m-Werfen überschreiten. Dasselbe gilt für einen 7. Feldspieler – also kein Spiel 7 gegen 6. Verstoß: Verwarnung des Mannschaftsverantwortlichen und Freiwurf für den Gegner.",
    "<b>Harz:</b> im BHV grundsätzlich verboten. In der Oberliga gilt eine Haftmittelerlaubnis nur, wenn sie in den Informationen zur Halle angegeben ist; Baumharz ist ausgeschlossen. Im Bezirksspielbetrieb ist Harz nie erlaubt.",
    "<b>Spielzeit C-Jugend:</b> 2 × 25 Minuten (IHF-Regel 2.1)."],
    stand: "Stand: BHV-Durchführungsbestimmungen 2026/27, Teil I (Abschnitte 1.5 und 8.5). Die Spielzeit ist aus den Handballregeln übernommen.",
    link: ["https://www.bhv-online.com/saison", "BHV: Unterlagen zur Saison"] },
  nds: { name: "Niedersachsen-Bremen", titel: "C-Jugend Niedersachsen-Bremen – was im Spiel gilt", regeln: [
    "<b>Offensive Deckung ist Pflicht (unterhalb der Regionalliga).</b> Erlaubt: Manndeckung und sinkende Manndeckung, 1:5, 2:4, 3:3 sowie 3:2:1 für fortgeschrittene Mannschaften. Die 3:2:1 darf gegen mehrere Kreisspieler zu einer 4:2 werden. Nicht erlaubt: Einzel-Manndeckung und Systeme wie 5:0+1.",
    "<b>Regionalliga:</b> Dort sind auch defensive Formationen wie 5:1 oder 6:0 erlaubt.",
    "<b>Sanktionskette:</b> Time-out mit Information an den Mannschaftsverantwortlichen → nach etwa zwei Angriffen mündliche Ermahnung → Verwarnung des Mannschaftsverantwortlichen → 2 Minuten Hinausstellung für die abwehrende Mannschaft; im Wiederholungsfall Geldbuße. Auch der Gegner kann den Hinweis beantragen.",
    "<b>Unterzahl:</b> Nach Hinausstellung oder Disqualifikation entfällt die Pflicht zur offensiven Deckung.",
    "<b>Torwart bleibt in der eigenen Hälfte, kein 7. Feldspieler.</b> Beim ersten Verstoß Time-out und Information, im Wiederholungsfall Freiwurf für den Gegner.",
    "<b>Ball:</b> Größe 2 für die männliche, Größe 1 für die weibliche C-Jugend.",
    "<b>Spielerwechsel:</b> nur bei eigenem Ballbesitz oder im Time-out (DHB-Zusatzbestimmung zu Regel 4:4).",
    "<b>Harz:</b> In den Regionalligen der Jugend muss Haftmittel erlaubt sein. In der Oberliga Jugend hängt es von der Halle ab – die Freigabe steht in nuLiga bei der Halle oder der Mannschaft.",
    "<b>Spielzeit C-Jugend:</b> 2 × 25 Minuten (IHF-Regel 2.1)."],
    stand: "Stand: HVNB-Richtlinien Kinder- und Jugendhandball (Juli 2026) und HVNB-Durchführungsbestimmungen 2026/27. Die Regionen können Ergänzungen festlegen; die Spielzeit ist aus den Handballregeln übernommen.",
    link: null }
};
function renderRegeln() {
  const V = VERBAND[S.verband] || VERBAND.by, box = $("#regelBox"); if (!box) return;
  box.innerHTML = `<h2>${V.titel}</h2><ul>${V.regeln.map(r => `<li>${r}</li>`).join("")}</ul><p class="hint">${V.stand}</p>${V.link ? `<p><a href="${V.link[0]}" target="_blank" rel="noopener">${V.link[1]}</a></p>` : ""}`;
  $$("#verbandSeg button").forEach(b => b.setAttribute("aria-pressed", b.dataset.v === S.verband));
}

/* ---------------- Einstellungen & Backup ---------------- */
function initInfo() {
  const r = $("#repo"); r.value = S.repo; r.addEventListener("change", () => { S.repo = r.value.trim(); save(); toast("Repository gespeichert"); });
  $$("#themeSeg button").forEach(b => b.onclick = () => { S.theme = b.dataset.v; save(); applyTheme(); renderRadar(); });
  $("#themeBtn").onclick = () => { S.theme = S.theme === "dark" ? "light" : "dark"; save(); applyTheme(); renderRadar(); };
  $("#backupBtn").onclick = () => download(new Blob([JSON.stringify(S, null, 1)], { type: "application/json" }), "trainingshalle-backup-" + today() + ".json");
  $("#restoreBtn").onclick = () => $("#restoreFile").click();
  $("#restoreFile").onchange = ev => {
    const f = ev.target.files[0]; if (!f) return;
    const rd = new FileReader();
    rd.onload = () => { try { const d = JSON.parse(rd.result); if (!d.rahmen || !d.radar) throw 0; S = { ...structuredClone(DEFAULT), ...d }; save(); location.reload(); } catch (e) { toast("Datei ist kein gültiges Backup"); } };
    rd.readAsText(f);
  };
  if (!VERBAND[S.verband]) S.verband = "by";
  $$("#verbandSeg button").forEach(b => b.onclick = () => { if (S.verband === b.dataset.v) return; S.verband = b.dataset.v; save(); renderRegeln(); if (typeof snVerband === "function") snVerband(true); toast("Landesverband: " + VERBAND[S.verband].name); });
  renderRegeln();
  $("#version").textContent = "Version " + APP_VERSION + " · " + EX.length + " Übungen";
}

/* ---------------- Update-Hinweis ----------------
 * Neue Version wird im Hintergrund geladen (Service Worker „wartet“).
 * Die App zeigt dann „Neue Version verfügbar“ mit den Neuerungen aus version.json
 * und schaltet erst nach Bestätigung um. Daten (localStorage) bleiben unberührt. */
function initUpdate() {
  const btn = $("#updCheck");
  if (!("serviceWorker" in navigator) || !location.protocol.startsWith("http")) { if (btn) btn.hidden = true; return; }
  let reg = null, last = 0, reloading = false, dismissed = false;
  const offer = async (w, manual) => {
    if (!w || (dismissed && !manual)) return;
    let info = null;
    try { info = await (await fetch("version.json", { cache: "no-store" })).json(); } catch (e) { }
    $("#updTitle").textContent = "Neue Version verfügbar" + (info && info.version ? " (" + info.version + ")" : "");
    $("#updList").innerHTML = info && info.neu ? info.neu.map(x => "<li>" + esc(x) + "</li>").join("") : "";
    $("#upd").hidden = false;
    $("#updYes").onclick = () => { $("#updYes").textContent = "Wird aktualisiert …"; w.postMessage({ type: "SKIP_WAITING" }); };
    $("#updNo").onclick = () => { dismissed = true; $("#upd").hidden = true; toast("Update beim nächsten Start oder unter „Regeln & Mehr“"); };
  };
  const watch = r => {
    if (r.waiting && navigator.serviceWorker.controller) offer(r.waiting);
    r.addEventListener("updatefound", () => {
      const n = r.installing; if (!n) return;
      n.addEventListener("statechange", () => { if (n.state === "installed" && navigator.serviceWorker.controller) offer(n); });
    });
  };
  const check = async manual => {
    if (!reg) return;
    last = Date.now();
    try { await reg.update(); } catch (e) { if (manual) return toast("Keine Verbindung – später erneut versuchen"); }
    if (reg.waiting) offer(reg.waiting, manual);
    else if (manual) setTimeout(() => { if (reg.waiting) offer(reg.waiting, true); else if (!reg.installing) toast("Ihr habt die aktuelle Version " + APP_VERSION); }, 1500);
  };
  navigator.serviceWorker.addEventListener("controllerchange", () => { if (reloading) return; reloading = true; location.reload(); });
  navigator.serviceWorker.register("sw.js").then(r => { reg = r; watch(r); check(false); }).catch(() => { });
  // Die App bleibt oft lange offen: beim Zurückholen höchstens alle 30 Minuten nachsehen
  document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible" && Date.now() - last > 30 * 60 * 1000) check(false); });
  if (btn) btn.onclick = () => check(true);
}

/* ---------------- Start ---------------- */
function init() {
  applyTheme(); initNav(); initRahmen(); initModus(); initRadar(); initLib(); initInfo();
  if (typeof tkInit === "function") tkInit();
  if (typeof snInit === "function") snInit();
  $("#genBtn").onclick = () => { generate(); show("plan"); toast("Plan erstellt – jetzt anpassen"); };
  $("#regenBtn").onclick = () => { if (!confirm("Neuen Vorschlag erstellen? Eigene Anpassungen am aktuellen Plan gehen verloren (vorher speichern).")) return; if (S.plan && S.plan.block && typeof snPlanSession === "function") snPlanSession(S.plan.block.id, S.plan.datum, true); else generate(4); renderPlan(); toast("Neuer Vorschlag"); };
  $("#addFromLib").onclick = () => { LIB.pickFor = true; show("bib"); };
  $("#printBtn").onclick = doPrint; $("#waBtn").onclick = shareText; $("#fileBtn").onclick = shareFile; $("#saveBtn").onclick = savePlan;
  $("#sheetClose").onclick = () => closeSheet();
  initUpdate();
}
document.addEventListener("DOMContentLoaded", init);
