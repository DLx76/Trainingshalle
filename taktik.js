/* Trainingshalle – Taktiktafel
 * Nutzt die Feld-Bausteine aus app.js (fieldDefs, fieldBase, lineSVG, tokenSVG).
 * Szene = { id, name, field: halb|ganz|frei, frames: [ { tokens: [...], lines: [...], deco: [...] } ] }
 * Token = { id, t: a|d|tw|b|k|t, x, y, l }   Linie = { id, t: l|p|dr|w, p: [[x,y],…], from: tokenId|null }
 */
"use strict";

const TK_TOOLS = [
  { k: "move", i: "✋", l: "Ziehen" },
  { k: "a", i: "●", l: "Angreifer", c: "var(--att)" },
  { k: "d", i: "▲", l: "Abwehr", c: "var(--def)" },
  { k: "tw", i: "■", l: "Torhüter", c: "var(--gk)" },
  { k: "b", i: "◉", l: "Ball", c: "#c9a400" },
  { k: "k", i: "▴", l: "Hütchen", c: "var(--cone)" },
  { k: "l", i: "➝", l: "Laufweg" },
  { k: "p", i: "⇢", l: "Pass" },
  { k: "dr", i: "〰", l: "Prellen" },
  { k: "w", i: "➚", l: "Wurf", c: "var(--def)" },
  { k: "t", i: "T", l: "Text" },
  { k: "erase", i: "⌫", l: "Löschen", c: "var(--bad)" }
];
const ATT_POS = { LA: [8, 14], RL: [22, 52], RM: [50, 58], RR: [78, 52], RA: [92, 14], KM: [60, 37] };
const DEF_FORM = {
  "3:3": [[26, 46], [50, 48], [74, 46], [18, 28], [50, 31], [82, 28]],
  "1:5": [[12, 22], [30, 31], [50, 33], [70, 31], [88, 22], [50, 48]],
  "3:2:1": [[14, 24], [50, 31], [86, 24], [30, 42], [70, 42], [50, 53]],
  "2:4": [[12, 22], [36, 32], [64, 32], [88, 22], [34, 46], [66, 46]]
};
const TK = { tool: "move", frame: 0, sel: null, hist: [], fut: [], drag: null, draft: null, playing: false, n: 0 };

/* ---------------- Datenzugriff ---------------- */
function newScene(field = "halb") { return { id: uid(), name: "", field, frames: [{ tokens: [], lines: [], deco: [] }] }; }
function tkInitState() {
  if (!S.taktik) S.taktik = { cur: null, scenes: [] };
  if (!S.taktik.cur) { S.taktik.cur = newScene(); tkFormAtt(true); tkPlaceTW(true); }
}
const scn = () => S.taktik.cur;
const frm = () => scn().frames[TK.frame];
const H = () => fieldH(scn().field);
function snap() { TK.hist.push(JSON.stringify({ s: scn(), f: TK.frame })); if (TK.hist.length > 80) TK.hist.shift(); TK.fut = []; }
function undo() { if (!TK.hist.length) return toast("Nichts rückgängig zu machen"); TK.fut.push(JSON.stringify({ s: scn(), f: TK.frame })); restore(TK.hist.pop()); }
function redo() { if (!TK.fut.length) return; TK.hist.push(JSON.stringify({ s: scn(), f: TK.frame })); restore(TK.fut.pop()); }
function restore(js) { const o = JSON.parse(js); S.taktik.cur = o.s; TK.frame = Math.min(o.f, o.s.frames.length - 1); TK.sel = null; save(); tkRender(); }

/* ---------------- Rendering ---------------- */
let TK_N = 0;
function tkRender(tokensOverride) {
  const svg = $("#board"); if (!svg) return;
  const sc = scn(), f = frm(), h = H(), n = "tk" + (++TK_N);
  svg.setAttribute("viewBox", `-3 -3 106 ${h + 6}`);
  let s = fieldDefs(n, h) + fieldBase(sc.field, n);
  (f.deco || []).forEach(e => s += decoSVG(e));
  // Vorheriger Schritt als Schatten, damit die Bewegung erkennbar ist
  if (TK.frame > 0 && !tokensOverride) sc.frames[TK.frame - 1].tokens.forEach(t => { if (t.t !== "t") s += `<g opacity=".18" pointer-events="none">${tokenSVG(t.t, t.x, t.y, "", 1.15)}</g>`; });
  f.lines.forEach(L => s += `<g data-line="${L.id}">${lineSVG(L.t, L.p, n, TK.sel === L.id ? 'stroke-width="1.6"' : "")}</g>`);
  if (TK.draft) s += `<g id="tkDraft">${lineSVG(TK.draft.t, TK.draft.p, n, 'opacity=".75"')}</g>`;
  const toks = tokensOverride || f.tokens;
  [...toks].sort((a, b) => (a.t === "b") - (b.t === "b")).forEach(t => {
    if (TK.sel === t.id) s += `<circle cx="${t.x}" cy="${t.y}" r="6.2" fill="none" stroke="var(--focus)" stroke-width="1.2" stroke-dasharray="2 1"/>`;
    s += `<g data-tok="${t.id}">${tokenSVG(t.t, t.x, t.y, t.l, 1.15)}</g>`;
  });
  svg.innerHTML = s;
  const nf = sc.frames.length;
  $("#tkStep").textContent = `Schritt ${TK.frame + 1} / ${nf}`;
  $("#tkPrev").disabled = TK.frame === 0 || TK.playing;
  $("#tkNextNav").disabled = TK.frame >= nf - 1 || TK.playing;
  $("#tkUndo").disabled = !TK.hist.length; $("#tkRedo").disabled = !TK.fut.length;
  $$("#tkField button").forEach(b => b.setAttribute("aria-pressed", b.dataset.v === sc.field));
  $("#tkName").value = sc.name || "";
  tkRenderSel();
}
function tkRenderSel() {
  const box = $("#tkSel"), t = frm().tokens.find(x => x.id === TK.sel);
  if (!t) { box.hidden = true; return; }
  box.hidden = false;
  $("#tkSelLabel").value = t.l || "";
  $("#tkSelLabel").disabled = ["b", "k"].includes(t.t);
}

/* ---------------- Geometrie ---------------- */
function tkPt(e) { const svg = $("#board"), p = svg.createSVGPoint(); p.x = e.clientX; p.y = e.clientY; const q = p.matrixTransform(svg.getScreenCTM().inverse()); return [q.x, q.y]; }
const clampP = p => [Math.max(0, Math.min(100, p[0])), Math.max(0, Math.min(H(), p[1]))];
function hitToken(p, r = 6.5) { let best = null, bd = r; frm().tokens.forEach(t => { const d = Math.hypot(t.x - p[0], t.y - p[1]) + (t.t === "b" ? -1 : 0); if (d < bd) { bd = d; best = t; } }); return best; }
function segDist(p, a, b) { const dx = b[0] - a[0], dy = b[1] - a[1], L = dx * dx + dy * dy || 1; let t = ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / L; t = Math.max(0, Math.min(1, t)); return Math.hypot(p[0] - a[0] - t * dx, p[1] - a[1] - t * dy); }
function hitLine(p) { let best = null, bd = 3.5; frm().lines.forEach(L => { for (let i = 1; i < L.p.length; i++) { const d = segDist(p, L.p[i - 1], L.p[i]); if (d < bd) { bd = d; best = L; } } }); return best; }
function simplify(pts, eps) { // Ramer-Douglas-Peucker
  if (pts.length < 3) return pts;
  let idx = 0, md = 0; const a = pts[0], b = pts[pts.length - 1];
  for (let i = 1; i < pts.length - 1; i++) { const d = segDist(pts[i], a, b); if (d > md) { md = d; idx = i; } }
  if (md <= eps) return [a, b];
  return [...simplify(pts.slice(0, idx + 1), eps).slice(0, -1), ...simplify(pts.slice(idx), eps)];
}
const pathLen = p => p.reduce((s, q, i) => i ? s + Math.hypot(q[0] - p[i - 1][0], q[1] - p[i - 1][1]) : 0, 0);
function alongPath(p, f) { const L = pathLen(p) * f; let acc = 0; for (let i = 1; i < p.length; i++) { const seg = Math.hypot(p[i][0] - p[i - 1][0], p[i][1] - p[i - 1][1]); if (acc + seg >= L) { const t = seg ? (L - acc) / seg : 0; return [p[i - 1][0] + (p[i][0] - p[i - 1][0]) * t, p[i - 1][1] + (p[i][1] - p[i - 1][1]) * t]; } acc += seg; } return p[p.length - 1]; }

/* ---------------- Bedienung auf der Tafel ---------------- */
function nextLabel(t) {
  const used = new Set(frm().tokens.filter(x => x.t === t).map(x => x.l));
  if (t === "a") { for (const l of Object.keys(ATT_POS)) if (!used.has(l)) return l; }
  if (t === "d") { for (let i = 1; i < 20; i++) if (!used.has(String(i))) return String(i); }
  return "";
}
function tkDown(e) {
  if (TK.playing) return;
  const svg = $("#board"); svg.setPointerCapture(e.pointerId);
  const p = clampP(tkPt(e)), tool = TK.tool;
  if (tool === "move") {
    const t = hitToken(p);
    if (t) { TK.drag = { id: t.id, dx: t.x - p[0], dy: t.y - p[1], moved: false }; TK.sel = t.id; }
    else { const L = hitLine(p); TK.sel = L ? L.id : null; }
    tkRender(); return;
  }
  if (tool === "erase") {
    const t = hitToken(p);
    if (t) { snap(); const f = frm(); f.tokens = f.tokens.filter(x => x !== t); f.lines = f.lines.filter(L => L.from !== t.id); }
    else { const L = hitLine(p); if (!L) return; snap(); frm().lines = frm().lines.filter(x => x !== L); }
    save(); tkRender(); return;
  }
  if (["a", "d", "tw", "b", "k", "t"].includes(tool)) {
    let l = tool === "tw" ? "TW" : nextLabel(tool);
    if (tool === "t") { l = prompt("Text auf der Tafel:", ""); if (!l) return; }
    if (tool === "b") { // nur ein Ball: vorhandenen versetzen
      const ball = frm().tokens.find(x => x.t === "b");
      snap(); if (ball) { ball.x = p[0]; ball.y = p[1]; } else frm().tokens.push({ id: uid(), t: "b", x: p[0], y: p[1], l: "" });
    } else { snap(); frm().tokens.push({ id: uid(), t: tool, x: p[0], y: p[1], l }); }
    save(); tkRender(); return;
  }
  // Linienwerkzeuge
  const from = hitToken(p, 6);
  const start = from ? [from.x, from.y] : p;
  TK.draft = { t: tool, p: [start], from: from ? from.id : null };
  tkRender();
}
function tkMove(e) {
  if (TK.playing) return;
  if (TK.drag) {
    const p = clampP(tkPt(e)), f = frm(), t = f.tokens.find(x => x.id === TK.drag.id); if (!t) return;
    if (!TK.drag.moved) { snap(); TK.drag.moved = true; }
    const nx = p[0] + TK.drag.dx, ny = p[1] + TK.drag.dy, ddx = nx - t.x, ddy = ny - t.y;
    // Ball am Spieler wandert mit
    if (t.t !== "b") { const ball = f.tokens.find(x => x.t === "b" && Math.hypot(x.x - t.x, x.y - t.y) < 5.5); if (ball) { ball.x += ddx; ball.y += ddy; } }
    t.x = nx; t.y = ny;
    f.lines.forEach(L => { if (L.from === t.id) L.p[0] = [nx, ny]; });
    tkRender(); return;
  }
  if (TK.draft) {
    const p = clampP(tkPt(e)), last = TK.draft.p[TK.draft.p.length - 1];
    if (Math.hypot(p[0] - last[0], p[1] - last[1]) > 1.2) {
      TK.draft.p.push(p);
      const g = $("#tkDraft"); if (g) g.innerHTML = lineSVG(TK.draft.t, simplify(TK.draft.p, 1.4), "tk" + TK_N, 'opacity=".75"'); else tkRender();
    }
  }
}
function tkUp() {
  if (TK.drag) { if (TK.drag.moved) save(); TK.drag = null; return; }
  if (TK.draft) {
    const d = TK.draft; TK.draft = null;
    let p = simplify(d.p, 1.4);
    if (pathLen(p) < 4) { tkRender(); return; }
    if (p.length > 14) p = simplify(p, 2.5);
    // Pass endet auf einem Mitspieler: Ende knapp vor dessen Mitte setzen
    if (d.t === "p") { const tgt = hitToken(p[p.length - 1], 6); if (tgt && tgt.id !== d.from) { const a = p[p.length - 2], L = Math.hypot(tgt.x - a[0], tgt.y - a[1]) || 1; p[p.length - 1] = [tgt.x - (tgt.x - a[0]) / L * 4.5, tgt.y - (tgt.y - a[1]) / L * 4.5]; } }
    snap(); frm().lines.push({ id: uid(), t: d.t, p: p.map(q => [+q[0].toFixed(2), +q[1].toFixed(2)]), from: d.from });
    save(); tkRender();
  }
}

/* ---------------- Formationen ---------------- */
function tkFormAtt(silent) {
  if (!silent) snap();
  const f = frm(); f.tokens = f.tokens.filter(t => t.t !== "a");
  Object.entries(ATT_POS).forEach(([l, p]) => f.tokens.push({ id: uid(), t: "a", x: p[0], y: p[1], l }));
  if (!f.tokens.some(t => t.t === "b")) f.tokens.push({ id: uid(), t: "b", x: ATT_POS.RM[0] + 3, y: ATT_POS.RM[1] - 3, l: "" });
  if (!silent) { save(); tkRender(); }
}
function tkFormDef(name) {
  snap(); const f = frm(); f.tokens = f.tokens.filter(t => t.t !== "d");
  let pos;
  if (name === "Mann") {
    const atts = f.tokens.filter(t => t.t === "a"); const src = atts.length ? atts.map(a => [a.x, a.y]) : Object.values(ATT_POS);
    pos = src.map(([x, y]) => { const dx = 50 - x, dy = 0 - y, L = Math.hypot(dx, dy) || 1; return [x + dx / L * 6, y + dy / L * 6]; });
  } else pos = DEF_FORM[name];
  pos.forEach((p, i) => f.tokens.push({ id: uid(), t: "d", x: p[0], y: p[1], l: String(i + 1) }));
  tkPlaceTW(true); save(); tkRender(); toast(name === "Mann" ? "Manndeckung gesetzt" : name + "-Abwehr gesetzt");
}
function tkPlaceTW(silent) { const f = frm(); if (!f.tokens.some(t => t.t === "tw")) f.tokens.push({ id: uid(), t: "tw", x: 50, y: 5, l: "TW" }); if (!silent) { save(); tkRender(); } }

/* ---------------- Schritte ---------------- */
function holderOf(f) { const b = f.tokens.find(t => t.t === "b"); if (!b) return null; let best = null, bd = 6.5; f.tokens.forEach(t => { if (t.t === "b" || t.t === "k" || t.t === "t") return; const d = Math.hypot(t.x - b.x, t.y - b.y); if (d < bd) { bd = d; best = t; } }); return best; }
function tkNextStep() {
  snap();
  const f = frm(), nt = structuredClone(f.tokens), ball = nt.find(t => t.t === "b"), holder = holderOf(f);
  const byId = Object.fromEntries(nt.map(t => [t.id, t]));
  let ballDone = false, receiver = null;
  const players = f.tokens.filter(t => !["b", "k", "t"].includes(t.t));
  // Pass/Wurf: Ball fliegt zum Empfänger (auch wenn dieser gleichzeitig weiterläuft) bzw. ans Linienende
  f.lines.filter(L => L.t === "p" || L.t === "w").forEach(L => {
    if (!ball || ballDone) return;
    const st = L.p[0], e = L.p[L.p.length - 1];
    const fromHolder = holder && (L.from === holder.id || Math.hypot(st[0] - holder.x, st[1] - holder.y) < 6.5);
    if (!fromHolder && Math.hypot(st[0] - ball.x, st[1] - ball.y) >= 6.5) return;
    ballDone = true;
    if (L.t === "p") {
      const cand = players.filter(t => t.id !== (holder && holder.id) && (!holder || t.t === holder.t || t.t === "tw" || holder.t === "tw"))
        .map(t => [t, Math.hypot(t.x - e[0], t.y - e[1])]).filter(x => x[1] < 8).sort((x, y) => x[1] - y[1]);
      if (cand.length) { receiver = cand[0][0].id; return; }
    }
    ball.x = e[0]; ball.y = e[1];
  });
  f.lines.filter(L => (L.t === "l" || L.t === "dr") && L.from && byId[L.from]).forEach(L => {
    const t = byId[L.from], e = L.p[L.p.length - 1];
    t.x = e[0]; t.y = e[1];
    if (L.t === "dr" && ball && !ballDone && holder && holder.id === t.id) { ball.x = e[0] + 2.6; ball.y = e[1] - 2.6; ballDone = true; }
  });
  if (ball && receiver) { const r = byId[receiver]; ball.x = r.x + 2.6; ball.y = r.y - 2.6; }
  // Ballbesitzer läuft ohne Pass/Prellen (z. B. Laufweg nach Annahme): Ball mitnehmen
  if (ball && !ballDone && holder) { const h2 = byId[holder.id]; ball.x = h2.x + (ball.x - holder.x); ball.y = h2.y + (ball.y - holder.y); }
  nt.forEach(t => delete t._via);
  scn().frames.splice(TK.frame + 1, 0, { tokens: nt, lines: [], deco: structuredClone(f.deco || []) });
  TK.frame++; TK.sel = null; save(); tkRender();
  if (!f.lines.length) toast("Neuer Schritt – Spieler jetzt ziehen oder Wege zeichnen");
}
function tkDelStep() {
  const sc = scn(); if (sc.frames.length < 2) { snap(); sc.frames[0].lines = []; save(); tkRender(); return toast("Pfeile gelöscht"); }
  if (!confirm("Schritt " + (TK.frame + 1) + " löschen?")) return;
  snap(); sc.frames.splice(TK.frame, 1); TK.frame = Math.max(0, TK.frame - 1); save(); tkRender();
}
function tkPlay() {
  const sc = scn();
  if (TK.playing) { TK.playing = false; return; }
  if (sc.frames.length < 2) return toast("Erst mit „＋ Schritt“ weitere Schritte anlegen");
  TK.playing = true; TK.sel = null; $("#tkPlay").textContent = "■ Stopp";
  let i = TK.frame >= sc.frames.length - 1 ? 0 : TK.frame;
  TK.frame = i; tkRender();
  const DUR = 1100, PAUSE = 450;
  const step = () => {
    if (!TK.playing || i >= sc.frames.length - 1) return finish();
    const a = sc.frames[i], b = sc.frames[i + 1];
    // Bewegungspfad je Token: entlang gezeichneter Linie, sonst gerade
    const paths = b.tokens.map(t => {
      const o = a.tokens.find(x => x.id === t.id); if (!o) return { t, p: [[t.x, t.y]] };
      const near = q => Math.hypot(q[0] - t.x, q[1] - t.y) < 4;
      let L = a.lines.find(L => L.from === t.id && (L.t === "l" || L.t === "dr") && near(L.p[L.p.length - 1]));
      if (!L && t.t === "b") L = a.lines.find(L => (L.t === "p" || L.t === "w") && Math.hypot(L.p[0][0] - o.x, L.p[0][1] - o.y) < 9);
      return { t, p: L ? [[o.x, o.y], ...L.p.slice(1), [t.x, t.y]] : [[o.x, o.y], [t.x, t.y]] };
    });
    const t0 = performance.now();
    const anim = now => {
      if (!TK.playing) return finish();
      const k = Math.min(1, (now - t0) / DUR), e = k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
      TK.frame = i;
      tkRender(paths.map(({ t, p }) => { const q = alongPath(p, e); return { ...t, x: q[0], y: q[1] }; }));
      if (k < 1) requestAnimationFrame(anim); else { i++; TK.frame = i; tkRender(); setTimeout(step, PAUSE); }
    };
    requestAnimationFrame(anim);
  };
  const finish = () => { TK.playing = false; $("#tkPlay").textContent = "▶ Abspielen"; tkRender(); };
  setTimeout(step, 300);
}

/* ---------------- Szenen ---------------- */
function tkSaveScene() {
  const sc = scn(); sc.name = $("#tkName").value.trim() || ("Szene " + new Date().toLocaleDateString("de-DE"));
  sc.updated = Date.now();
  const i = S.taktik.scenes.findIndex(x => x.id === sc.id), copy = structuredClone(sc);
  if (i >= 0) S.taktik.scenes[i] = copy; else S.taktik.scenes.unshift(copy);
  save(); tkRenderScenes(); tkRender(); toast("Szene gespeichert");
}
function tkNewScene() {
  if (!confirm("Neue, leere Tafel beginnen? Nicht gespeicherte Änderungen gehen verloren.")) return;
  snap(); S.taktik.cur = newScene(scn().field); TK.frame = 0; TK.sel = null; tkFormAtt(true); tkPlaceTW(true); save(); tkRender();
}
function tkRenderScenes() {
  const el = $("#tkScenes"), L = S.taktik.scenes;
  if (!L.length) { el.innerHTML = '<p class="hint">Noch keine gespeicherten Szenen.</p>'; return; }
  el.innerHTML = L.map((s, i) => `<div class="alt"><div><b>${esc(s.name)}</b><div class="hint">${s.frames.length} Schritt(e) · ${{ halb: "Halbfeld", ganz: "ganzes Feld", frei: "freie Fläche" }[s.field]}</div></div>
    <div class="row"><button class="btn small" data-tkload="${i}">Öffnen</button><button class="btn small danger" data-tkdel="${i}" aria-label="löschen">✕</button></div></div>`).join("");
  el.querySelectorAll("[data-tkload]").forEach(b => b.onclick = () => { snap(); S.taktik.cur = structuredClone(L[+b.dataset.tkload]); TK.frame = 0; TK.sel = null; save(); tkRender(); window.scrollTo({ top: 0, behavior: "smooth" }); toast("Szene geladen"); });
  el.querySelectorAll("[data-tkdel]").forEach(b => b.onclick = () => { if (confirm("Szene löschen?")) { L.splice(+b.dataset.tkdel, 1); save(); tkRenderScenes(); } });
}
function tkSetField(f) {
  const sc = scn(); if (sc.field === f) return;
  snap(); const oldH = H(); sc.field = f; const nh = fieldH(f);
  if (nh < oldH) sc.frames.forEach(fr => { fr.tokens.forEach(t => t.y = Math.min(t.y, nh - 2)); fr.lines.forEach(L => L.p = L.p.map(q => [q[0], Math.min(q[1], nh - 1)])); });
  save(); tkRender();
}
// Übung aus der Bibliothek auf die Tafel übernehmen
function tkFromExercise(ex) {
  const g = ex.g, tokens = [], lines = [], deco = [];
  g.e.forEach(e => {
    if (["a", "d", "tw", "k", "b", "t"].includes(e[0])) tokens.push({ id: uid(), t: e[0], x: e[1], y: e[2], l: e[0] === "tw" ? "TW" : (e[3] || "") });
    else if (e[0] === "m") deco.push(e);
  });
  g.e.forEach(e => {
    if (!["l", "p", "dr", "w"].includes(e[0])) return;
    const st = e[1][0]; let from = null, bd = 6;
    tokens.forEach(t => { if (["b", "k", "t"].includes(t.t)) return; const d = Math.hypot(t.x - st[0], t.y - st[1]); if (d < bd) { bd = d; from = t.id; } });
    lines.push({ id: uid(), t: e[0], p: e[1].map(q => [...q]), from });
  });
  snap();
  S.taktik.cur = { id: uid(), name: ex.titel, field: g.f, frames: [{ tokens, lines, deco }] };
  TK.frame = 0; TK.sel = null; save();
}

/* ---------------- Bild-Export (PNG, z. B. für WhatsApp) ---------------- */
const EXPORT_COLORS = { field: "#f7efd9", fieldline: "#1a1a1a", att: "#0040d6", def: "#c8001e", gk: "#007a33", cone: "#e07000", focus: "#ffbf00" };
function frameSVGString(fi) {
  const sc = scn(), f = sc.frames[fi], h = fieldH(sc.field), n = "ex" + fi;
  let s = fieldDefs(n, h) + fieldBase(sc.field, n);
  (f.deco || []).forEach(e => s += decoSVG(e));
  if (fi > 0) sc.frames[fi - 1].tokens.forEach(t => { if (t.t !== "t") s += `<g opacity=".18">${tokenSVG(t.t, t.x, t.y, "", 1.15)}</g>`; });
  f.lines.forEach(L => s += lineSVG(L.t, L.p, n));
  [...f.tokens].sort((a, b) => (a.t === "b") - (b.t === "b")).forEach(t => s += tokenSVG(t.t, t.x, t.y, t.l, 1.15));
  s = s.replace(/var\(--([a-z]+)\)/g, (m, k) => EXPORT_COLORS[k] || "#000");
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-3 -3 106 ${h + 6}" width="${1060}" height="${(h + 6) * 10}"><style>text{font-family:Arial,Helvetica,sans-serif}</style>${s}</svg>`;
}
function svgToPng(svgStr, title) {
  return new Promise((res, rej) => {
    const img = new Image();
    img.onload = () => {
      const top = 90, c = document.createElement("canvas"); c.width = img.width; c.height = img.height + top;
      const x = c.getContext("2d"); x.fillStyle = "#fff"; x.fillRect(0, 0, c.width, c.height);
      x.fillStyle = "#000"; x.font = "bold 40px system-ui, Arial, sans-serif"; x.fillText(title, 24, 58);
      x.drawImage(img, 0, top); c.toBlob(b => b ? res(b) : rej(), "image/png");
    };
    img.onerror = rej;
    img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svgStr);
  });
}
async function tkShareImages() {
  const sc = scn(), name = ($("#tkName").value.trim() || sc.name || "Taktik");
  try {
    const files = [];
    for (let i = 0; i < sc.frames.length; i++) {
      const blob = await svgToPng(frameSVGString(i), name + (sc.frames.length > 1 ? ` – Schritt ${i + 1}/${sc.frames.length}` : ""));
      files.push(new File([blob], `${name.replace(/[^\wäöüÄÖÜß-]+/g, "_")}_${i + 1}.png`, { type: "image/png" }));
    }
    if (navigator.canShare && navigator.canShare({ files })) { try { await navigator.share({ files, title: name }); return; } catch (e) { if (e.name === "AbortError") return; } }
    files.forEach(f => download(f, f.name)); toast(files.length > 1 ? files.length + " Bilder gespeichert" : "Bild gespeichert");
  } catch (e) { toast("Bild konnte nicht erstellt werden"); }
}

/* ---------------- Vollbild ---------------- */
function tkFullscreen() {
  const w = $("#tkWrap");
  if (document.fullscreenElement) { document.exitFullscreen(); return; }
  if (w.requestFullscreen) w.requestFullscreen().catch(() => w.classList.toggle("pseudo-fs")); else w.classList.toggle("pseudo-fs");
}

/* ---------------- Initialisierung ---------------- */
function tkInit() {
  tkInitState();
  $("#tkTools").innerHTML = TK_TOOLS.map(t => `<button class="tool" data-tool="${t.k}" aria-pressed="${t.k === TK.tool}" title="${t.l}"><span class="ti" style="${t.c ? "color:" + t.c : ""}">${t.i}</span><span class="tl">${t.l}</span></button>`).join("");
  $$("#tkTools .tool").forEach(b => b.onclick = () => { TK.tool = b.dataset.tool; TK.sel = null; $$("#tkTools .tool").forEach(x => x.setAttribute("aria-pressed", x === b)); $("#tkHint").textContent = tkHintText(); tkRender(); });
  $("#tkHint").textContent = tkHintText();
  const svg = $("#board");
  svg.addEventListener("pointerdown", tkDown); svg.addEventListener("pointermove", tkMove);
  svg.addEventListener("pointerup", tkUp); svg.addEventListener("pointercancel", tkUp);
  $("#tkUndo").onclick = undo; $("#tkRedo").onclick = redo;
  $("#tkPrev").onclick = () => { if (TK.frame > 0) { TK.frame--; TK.sel = null; tkRender(); } };
  $("#tkNextNav").onclick = () => { if (TK.frame < scn().frames.length - 1) { TK.frame++; TK.sel = null; tkRender(); } };
  $("#tkNext").onclick = tkNextStep; $("#tkDel").onclick = tkDelStep; $("#tkPlay").onclick = tkPlay;
  $("#tkClear").onclick = () => { if (!confirm("Alle Spieler und Pfeile dieses Schritts entfernen?")) return; snap(); const f = frm(); f.tokens = []; f.lines = []; save(); tkRender(); };
  $("#tkClearLines").onclick = () => { snap(); frm().lines = []; save(); tkRender(); };
  $("#tkFs").onclick = tkFullscreen;
  $$("#tkField button").forEach(b => b.onclick = () => tkSetField(b.dataset.v));
  $("#tkAtt").onclick = () => { tkFormAtt(); toast("Angriff auf Grundpositionen"); };
  $$("#tkDef button").forEach(b => b.onclick = () => tkFormDef(b.dataset.f));
  $("#tkSave").onclick = tkSaveScene; $("#tkNew").onclick = tkNewScene; $("#tkImg").onclick = tkShareImages;
  $("#tkName").addEventListener("change", () => { scn().name = $("#tkName").value.trim(); save(); });
  $("#tkSelLabel").addEventListener("input", () => { const t = frm().tokens.find(x => x.id === TK.sel); if (t) { t.l = $("#tkSelLabel").value.slice(0, 3); save(); tkRender(); } });
  $("#tkSelDel").onclick = () => { const f = frm(), t = f.tokens.find(x => x.id === TK.sel); if (!t) return; snap(); f.tokens = f.tokens.filter(x => x !== t); f.lines = f.lines.filter(L => L.from !== t.id); TK.sel = null; save(); tkRender(); };
  document.addEventListener("keydown", e => {
    if (current !== "taktik" || ["INPUT", "TEXTAREA"].includes(document.activeElement.tagName)) return;
    if ((e.ctrlKey || e.metaKey) && e.key === "z") { e.preventDefault(); undo(); }
    if ((e.ctrlKey || e.metaKey) && e.key === "y") { e.preventDefault(); redo(); }
    if (e.key === "Delete" && TK.sel) { const f = frm(); snap(); f.tokens = f.tokens.filter(x => x.id !== TK.sel); f.lines = f.lines.filter(L => L.id !== TK.sel && L.from !== TK.sel); TK.sel = null; save(); tkRender(); }
  });
  document.addEventListener("fullscreenchange", () => setTimeout(tkRender, 50));
  tkRenderScenes(); tkRender();
}
function tkHintText() {
  return {
    move: "Spieler, Ball oder Hütchen antippen und ziehen. Antippen zeigt Beschriftung und Löschen.",
    a: "Aufs Feld tippen, um Angreifer zu setzen (Beschriftung LA, RL, RM … automatisch).",
    d: "Aufs Feld tippen, um Abwehrspieler zu setzen.", tw: "Aufs Feld tippen, um einen Torhüter zu setzen.",
    b: "Aufs Feld tippen: Der Ball wird dorthin gesetzt (es gibt nur einen Ball).", k: "Aufs Feld tippen, um Hütchen zu setzen.",
    l: "Vom Spieler aus einen Laufweg zeichnen. „＋ Schritt“ bewegt ihn dann ans Ende.",
    p: "Vom Ballbesitzer zum Mitspieler zeichnen. Im nächsten Schritt ist der Ball dort.",
    dr: "Vom Ballbesitzer aus zeichnen: Spieler prellt mit Ball ans Ende.",
    w: "Vom Werfer zum Tor zeichnen.", t: "Aufs Feld tippen und Text eingeben.",
    erase: "Spieler oder Linie antippen, um sie zu löschen."
  }[TK.tool];
}
