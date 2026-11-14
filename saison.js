/* Trainingshalle – Saison: Spielplan, Lernblöcke, Rückmeldung */
"use strict";

// Rasterspielplan 2026/27, 9–10 Mannschaften, mC-Jugend RL/OL/BL. paar = [Heim, Gast] als Rasternummern.
const RASTER = [{"nr":1,"sa":"2026-09-19","stern":false,"paar":[[1,2],[3,4],[5,6],[7,8],[9,10]]},{"nr":2,"sa":"2026-10-03","stern":false,"paar":[[4,1],[6,3],[8,5],[9,7],[10,2]]},{"nr":3,"sa":"2026-10-10","stern":false,"paar":[[2,4],[1,6],[3,8],[5,9],[7,10]]},{"nr":4,"sa":"2026-10-17","stern":false,"paar":[[6,2],[8,1],[9,3],[7,5],[10,4]]},{"nr":5,"sa":"2026-10-24","stern":false,"paar":[[4,6],[2,8],[1,9],[3,7],[5,10]]},{"nr":6,"sa":"2026-10-31","stern":true,"paar":[[8,4],[9,2],[7,1],[5,3],[10,6]]},{"nr":7,"sa":"2026-11-07","stern":false,"paar":[[6,8],[4,9],[2,7],[1,5],[3,10]]},{"nr":8,"sa":"2026-11-14","stern":false,"paar":[[9,6],[7,4],[5,2],[3,1],[10,8]]},{"nr":9,"sa":"2026-11-21","stern":false,"paar":[[8,9],[6,7],[4,5],[2,3],[1,10]]},{"nr":10,"sa":"2026-11-28","stern":false,"paar":[[2,1],[4,3],[6,5],[8,7],[10,9]]},{"nr":11,"sa":"2026-12-05","stern":false,"paar":[[1,4],[3,6],[5,8],[7,9],[2,10]]},{"nr":12,"sa":"2026-12-12","stern":false,"paar":[[4,2],[6,1],[8,3],[9,5],[10,7]]},{"nr":13,"sa":"2027-01-09","stern":false,"paar":[[2,6],[1,8],[3,9],[5,7],[4,10]]},{"nr":14,"sa":"2027-02-13","stern":false,"paar":[[6,4],[8,2],[9,1],[7,3],[10,5]]},{"nr":15,"sa":"2027-02-20","stern":false,"paar":[[4,8],[2,9],[1,7],[3,5],[6,10]]},{"nr":16,"sa":"2027-02-27","stern":true,"paar":[[8,6],[9,4],[7,2],[5,1],[10,3]]},{"nr":17,"sa":"2027-03-06","stern":false,"paar":[[6,9],[4,7],[2,5],[1,3],[8,10]]},{"nr":18,"sa":"2027-03-13","stern":true,"paar":[[9,8],[7,6],[5,4],[3,2],[10,1]]}];
const WT = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"];
const FERIEN = {
  by: [
    { n: "Herbstferien", von: "2026-11-02", bis: "2026-11-06" },
    { n: "Weihnachtsferien", von: "2026-12-24", bis: "2027-01-08" },
    { n: "Faschingsferien", von: "2027-02-08", bis: "2027-02-12" },
    { n: "Osterferien", von: "2027-03-22", bis: "2027-04-02" },
    { n: "Pfingstferien", von: "2027-05-18", bis: "2027-05-28" },
    { n: "Sommerferien", von: "2027-08-02", bis: "2027-09-13" }
  ],
  nds: [
    { n: "Herbstferien", von: "2026-10-12", bis: "2026-10-24" },
    { n: "Weihnachtsferien", von: "2026-12-23", bis: "2027-01-09" },
    { n: "Halbjahresferien", von: "2027-02-01", bis: "2027-02-02" },
    { n: "Osterferien", von: "2027-03-22", bis: "2027-04-03" },
    { n: "Himmelfahrt/Pfingsten", von: "2027-05-18", bis: "2027-05-18" },
    { n: "Sommerferien", von: "2027-07-08", bis: "2027-08-18" }
  ]
};
// HVNB-Jugend-Terminplan 2026/27, Oberliga mJC (3 Staffeln à 10): Samstage der 18 Spieltage
const TERMINE_NDS = ["2026-09-12", "2026-09-19", "2026-09-26", "2026-11-07", "2026-11-14", "2026-11-21", "2026-12-05", "2026-12-12", "2026-12-19", "2027-01-30", "2027-02-06", "2027-02-13", "2027-02-20", "2027-03-06", "2027-03-13", "2027-04-10", "2027-04-17", "2027-04-24"];
const verb = () => (S.verband === "nds" ? "nds" : "by");
const FB_T = { sitzt: "sitzt", mehr: "braucht mehr", nicht: "klappt noch nicht" };
const FB_B = { niedrig: "zu niedrig", ok: "passend", hoch: "zu hoch" };
const SN = { wochen: 4, rasterNr: null };

/* ---------------- Datum ---------------- */
const dObj = iso => { const [y, m, d] = iso.split("-").map(Number); return new Date(y, m - 1, d); };
const dIso = dt => dt.getFullYear() + "-" + String(dt.getMonth() + 1).padStart(2, "0") + "-" + String(dt.getDate()).padStart(2, "0");
const dAdd = (iso, n) => { const d = dObj(iso); d.setDate(d.getDate() + n); return dIso(d); };
const dShort = iso => { const d = dObj(iso); return WT[d.getDay()] + " " + String(d.getDate()).padStart(2, "0") + "." + String(d.getMonth() + 1).padStart(2, "0") + "."; };
const heute = () => dIso(new Date());

/* ---------------- Zustand ---------------- */
function snState() {
  if (!S.saison) S.saison = {};
  const s = S.saison;
  if (!Array.isArray(s.tage)) s.tage = [2, 4]; // Di, Do
  if (s.ferienTraining === undefined) s.ferienTraining = false;
  if (!Array.isArray(s.ferien)) { s.ferien = structuredClone(FERIEN[verb()]); s.ferienVon = verb(); }
  if (!Array.isArray(s.frei)) s.frei = [];
  if (!Array.isArray(s.spiele)) s.spiele = [];
  if (!Array.isArray(s.bloecke)) s.bloecke = [];
  if (!s.gegner) s.gegner = {};
  return s;
}
const sn = () => snState();
function inFerien(iso) { return sn().ferien.find(f => f.von && f.bis && iso >= f.von && iso <= f.bis); }
function isTraining(iso) {
  const s = sn();
  if (!s.tage.includes(dObj(iso).getDay())) return false;
  if (s.frei.includes(iso)) return false;
  if (!s.ferienTraining && inFerien(iso)) return false;
  return true;
}
function lageFor(iso) {
  const g = sn().spiele.map(x => x.datum);
  if (g.includes(dAdd(iso, 1)) || g.includes(iso)) return "vor";
  if (g.includes(dAdd(iso, -1))) return "nach";
  return "normal";
}
// Einheiten eines Blocks aus Start, Dauer und Einstellungen berechnen
function blockDates(b) { const out = []; for (let i = 0; i < b.wochen * 7; i++) { const d = dAdd(b.start, i); if (isTraining(d)) out.push(d); } return out; }
function blockEnd(b) { return dAdd(b.start, b.wochen * 7 - 1); }
function ses(b, d) { if (!b.e) b.e = {}; if (!b.e[d]) b.e[d] = {}; return b.e[d]; }

/* ---------------- Einheit eines Blocks planen ---------------- */
function snPlanSession(blockId, datum, force) {
  const b = sn().bloecke.find(x => x.id === blockId); if (!b) return;
  const dates = blockDates(b), idx = dates.indexOf(datum), n = dates.length, T = THMAP[b.thema];
  if (idx < 0 || !T) return toast("Dieser Termin ist kein Trainingstag mehr");
  const e = ses(b, datum);
  if (e.plan && !force) { S.plan = structuredClone(e.plan); save(); return; }
  // Fortschritt im Block: 0 = Einstieg, 1 = spielnah. Rückmeldung der letzten Einheit verschiebt ihn.
  let p = n > 1 ? idx / (n - 1) : .5, lage = lageFor(datum), hinweis = "";
  const prev = dates.slice(0, idx).reverse().map(d => b.e && b.e[d]).find(x => x && x.fb && (x.fb.t || x.fb.b));
  if (prev && prev.fb.t === "nicht") { p -= .3; hinweis = "Letzte Einheit: klappt noch nicht – heute mehr Zeit für Vorübung und Übung."; }
  else if (prev && prev.fb.t === "mehr") { p -= .12; hinweis = "Letzte Einheit: braucht mehr – Stufen 1 und 2 bleiben etwas länger."; }
  else if (prev && prev.fb.t === "sitzt") { p += .15; hinweis = "Letzte Einheit: sitzt – heute spielnäher."; }
  if (prev && prev.fb.b === "hoch" && lage === "normal") { lage = "nach"; hinweis += (hinweis ? " " : "") + "Belastung war zu hoch – heute dosierter."; }
  p = Math.max(0, Math.min(1, p));
  // Drei Phasen: Einstieg (zwei Übungen der Stufen 1–2), Mitte (1 → 2 → 3), spielnah (ohne Vorübung, zwei Komplexübungen)
  const stufen = p < .34 ? [1, 2, 2] : p > .66 ? [2, 3, 3] : [1, 2, 3];
  const anteil = p < .34 ? { 1: .38, 2: .40, 3: .22 } : p > .66 ? { 1: .18, 2: .30, 3: .52 } : { 1: .28, 2: .34, 3: .38 };
  const recent = []; dates.slice(Math.max(0, idx - 1), idx).forEach(d => { const x = b.e && b.e[d]; if (x && x.plan) x.plan.items.forEach(i => recent.push(i.exId)); });
  const alt = { modus: S.modus, thema: S.thema };
  S.modus = "thema"; S.thema = b.thema;
  generate(force ? 4 : 1.2, {
    stufen, anteil, stretch: 8, spielF: .85 + .35 * p, lage, datum, recent,
    ziel: "Block „" + T.titel + "“ – Einheit " + (idx + 1) + " von " + n + (hinweis ? ". " + hinweis : ""),
    block: { id: b.id, idx, n },
    aus: idx === 0 ? "pe-ziele" : idx === n - 1 ? "aus-feedback" : undefined,
    ausNote: idx === 0 ? "Blockstart: Jeder Spieler setzt sich ein Technik- und ein Verhaltensziel zum Thema." : idx === n - 1 ? "Blockabschluss: Rückblick – was können wir jetzt besser? Selbsteinschätzung der eigenen Ziele (1–5)." : ""
  });
  S.modus = alt.modus; S.thema = alt.thema;
  e.plan = structuredClone(S.plan); save();
}
// Änderungen am geöffneten Block-Plan zurück in den Block schreiben (wird von save() aufgerufen)
function syncBlockPlan() {
  const P = S.plan; if (!P || !P.block || !S.saison) return;
  const b = S.saison.bloecke.find(x => x.id === P.block.id); if (!b || !b.e || !b.e[P.datum] || !b.e[P.datum].plan) return;
  if (b.e[P.datum].plan.id === P.id) b.e[P.datum].plan = structuredClone(P);
}

/* ---------------- Anzeige ---------------- */
function gameLabel(g) { if (g.offen && !g.gegner) return "Spieltag " + g.st + " – Gegner und Ort offen"; return (g.art && g.art !== "Liga" ? g.art + ": " : "") + (g.art === "Turnier" ? (g.gegner || "Turnier") : (g.heim ? "Heim gegen " : "Auswärts bei ") + (g.gegner || "?")); }
function snRender() {
  if (!$("#snNext")) return; const s = sn(), t0 = heute();
  // --- Nächste Termine
  const ev = [];
  s.spiele.filter(g => g.datum >= t0).forEach(g => ev.push({ d: g.datum, game: g }));
  s.bloecke.forEach(b => blockDates(b).forEach((d, i, a) => { if (d >= t0) ev.push({ d, b, i, n: a.length }); }));
  for (let i = 0; i < 28; i++) { const d = dAdd(t0, i); if (isTraining(d) && !ev.some(x => x.d === d && x.b)) ev.push({ d, free: true }); }
  ev.sort((a, b) => a.d.localeCompare(b.d) || (a.game ? 1 : -1));
  $("#snNext").innerHTML = ev.slice(0, 9).map(x => x.game
    ? `<div class="ev game"><div class="d">${dShort(x.d)}<small>Spiel</small></div><div><b>${esc(gameLabel(x.game))}</b></div><span class="badge">${x.game.offen && !x.game.gegner ? "?" : x.game.heim ? "H" : "A"}</span></div>`
    : x.free ? `<div class="ev"><div class="d">${dShort(x.d)}<small>Training</small></div><div class="hint">ohne Lernblock – im Planer frei planen</div><span></span></div>`
    : `<div class="ev"><div class="d">${dShort(x.d)}<small>Training</small></div><div><b>${esc(THMAP[x.b.thema] ? THMAP[x.b.thema].titel : "")}</b><div class="hint">Einheit ${x.i + 1}/${x.n}${lageFor(x.d) === "vor" ? " · Tag vor Spiel" : lageFor(x.d) === "nach" ? " · Tag nach Spiel" : ""}</div></div><button class="btn small primary" data-open="${x.b.id}|${x.d}">${x.b.e && x.b.e[x.d] && x.b.e[x.d].plan ? "Öffnen" : "Planen"}</button></div>`
  ).join("") || '<p class="hint">Keine Termine. Trainingstage, Spielplan und Lernblöcke unten einrichten.</p>';
  // --- Blöcke
  $("#snBlocks").innerHTML = s.bloecke.slice().sort((a, b) => b.start.localeCompare(a.start)).map(b => {
    const T = THMAP[b.thema], dates = blockDates(b), done = dates.filter(d => b.e && b.e[d] && b.e[d].fb && b.e[d].fb.t).length;
    const sums = Object.fromEntries(AXES.map(a => [a.k, 0])); let tot = 0;
    dates.forEach(d => { const p = b.e && b.e[d] && b.e[d].plan; if (!p) return; p.items.forEach(it => { const ex = EXMAP[it.exId]; if (!ex) return; const z = AXES.reduce((q, a) => q + (ex.ziele[a.k] || 0), 0) || 1; AXES.forEach(a => sums[a.k] += it.dauer * (ex.ziele[a.k] || 0) / z); tot += it.dauer; }); });
    const stat = tot ? AXES.filter(a => sums[a.k] / tot >= .08).sort((x, y) => sums[y.k] - sums[x.k]).map(a => a.s + " " + Math.round(sums[a.k]) + "′").join(" · ") : "";
    return `<div class="blk"><div class="bh"><h3>${esc(T ? T.titel : "Thema fehlt")}</h3><small>${dShort(b.start)} – ${dShort(blockEnd(b))} · ${dates.length} Einheiten · ${done} mit Rückmeldung</small></div><div class="in">
      ${stat ? `<p class="hint">Geplante Minuten: ${esc(stat)}</p>` : ""}
      ${dates.map((d, i) => { const e = (b.e && b.e[d]) || {}, fb = e.fb || {}, lg = lageFor(d), show = d <= t0 || fb.t || fb.b;
        return `<div class="ses ${d < t0 ? "past" : ""}"><div class="row" style="justify-content:space-between"><div><b>${i + 1}. ${dShort(d)}</b> ${lg !== "normal" ? `<span class="badge">${lg === "vor" ? "Tag vor Spiel" : "Tag nach Spiel"}</span>` : ""} ${fb.t ? `<span class="badge st">${FB_T[fb.t]}</span>` : ""}</div>
          <div class="row"><button class="btn small ${e.plan ? "" : "primary"}" data-open="${b.id}|${d}">${e.plan ? "Öffnen" : "Planen"}</button>${show ? "" : `<button class="btn small" data-fbshow="${b.id}|${d}">Rückmeldung</button>`}</div></div>
          <div class="fb" data-fb="${b.id}|${d}" ${show ? "" : "hidden"}>
            <div><b>Thema</b><div class="chips">${Object.entries(FB_T).map(([k, l]) => `<button class="chip" data-k="t" data-v="${k}" aria-pressed="${fb.t === k}">${l}</button>`).join("")}</div></div>
            <div><b>Belastung</b><div class="chips">${Object.entries(FB_B).map(([k, l]) => `<button class="chip" data-k="b" data-v="${k}" aria-pressed="${fb.b === k}">${l}</button>`).join("")}</div></div>
            <div class="row"><b>Spieler da</b><div class="stepper"><button data-k="n" data-v="-1" aria-label="weniger">−</button><output>${fb.n || "–"}</output><button data-k="n" data-v="1" aria-label="mehr">+</button></div></div>
          </div></div>`; }).join("") || '<p class="hint">In diesem Zeitraum liegt kein Trainingstag (Ferien oder Einstellungen prüfen).</p>'}
      <div class="row" style="margin-top:.6rem"><button class="btn small" data-btxt="${b.id}">💬 Block als Text</button><button class="btn small" data-bprint="${b.id}">🖨 Alle Einheiten drucken</button><button class="btn small danger" data-bdel="${b.id}">Block löschen</button></div>
    </div></div>`;
  }).join("") || '<p class="hint">Noch kein Lernblock angelegt.</p>';
  // --- Spielplan
  $("#snGames").innerHTML = s.spiele.slice().sort((a, b) => a.datum.localeCompare(b.datum)).map(g => `<div class="ev ${g.datum < t0 ? "past" : ""}"><div class="d">${dShort(g.datum)}<small>${g.datum.slice(0, 4)}${g.st ? " · ST " + g.st : ""}</small></div><div>${esc(gameLabel(g))}${g.stern ? ' <span class="hint">(Termin mit *: Antrag nötig)</span>' : ""}</div><button class="btn small" data-gedit="${g.id}">✎</button></div>`).join("") || '<p class="hint">Noch keine Spiele eingetragen.</p>';
  bindSaison();
}
function bindSaison() {
  const s = sn();
  $$("#v-saison [data-open]").forEach(b => b.onclick = () => { const [id, d] = b.dataset.open.split("|"); snPlanSession(id, d); show("plan"); });
  $$("#v-saison [data-fbshow]").forEach(b => b.onclick = () => { const box = $(`.fb[data-fb="${b.dataset.fbshow}"]`); box.hidden = false; b.remove(); });
  $$("#v-saison .fb").forEach(box => box.querySelectorAll("[data-k]").forEach(btn => btn.onclick = () => {
    const [id, d] = box.dataset.fb.split("|"), b = s.bloecke.find(x => x.id === id), e = ses(b, d); e.fb = e.fb || {};
    const k = btn.dataset.k;
    if (k === "n") e.fb.n = Math.max(1, Math.min(30, (e.fb.n || S.rahmen.spieler) + (e.fb.n ? +btn.dataset.v : 0)));
    else e.fb[k] = e.fb[k] === btn.dataset.v ? null : btn.dataset.v;
    // Rückmeldung wirkt auf die nächste noch nicht angepasste Einheit: deren Plan neu erzeugen lassen
    const dates = blockDates(b), nx = dates[dates.indexOf(d) + 1];
    if (k !== "n" && nx && b.e[nx] && b.e[nx].plan && !b.e[nx].plan.items.some(i => i.edited) && !(b.e[nx].fb && b.e[nx].fb.t)) { delete b.e[nx].plan; toast("Nächste Einheit wird an die Rückmeldung angepasst"); }
    save(); snRender();
  }));
  $$("#v-saison [data-bdel]").forEach(b => b.onclick = () => { if (!confirm("Lernblock mit allen Plänen und Rückmeldungen löschen?")) return; s.bloecke = s.bloecke.filter(x => x.id !== b.dataset.bdel); save(); snRender(); });
  $$("#v-saison [data-btxt]").forEach(b => b.onclick = () => shareBlockText(b.dataset.btxt));
  $$("#v-saison [data-bprint]").forEach(b => b.onclick = () => printBlock(b.dataset.bprint));
  $$("#v-saison [data-gedit]").forEach(b => b.onclick = () => editGame(b.dataset.gedit));
}

/* ---------------- Block teilen ---------------- */
function ensurePlans(b) { const keep = S.plan ? structuredClone(S.plan) : null; blockDates(b).forEach(d => { if (!(b.e && b.e[d] && b.e[d].plan)) snPlanSession(b.id, d); }); S.plan = keep; save(); }
async function shareBlockText(id) {
  const b = sn().bloecke.find(x => x.id === id), T = THMAP[b.thema]; ensurePlans(b);
  const dates = blockDates(b);
  let txt = `Lernblock: ${T.titel}\n${dShort(b.start)} – ${dShort(blockEnd(b))} · ${dates.length} Einheiten\nSonderregel Spielform: ${T.regel}\n`;
  dates.forEach((d, i) => { const p = b.e[d].plan, lg = p.rahmen.lage; txt += `\n${i + 1}. ${dShort(d)}${lg === "vor" ? " (Tag vor Spiel)" : lg === "nach" ? " (dosiert)" : ""}\n` + p.items.filter(x => x.stufe).map(x => `   ${x.stufe}) ${x.titel} – ${x.dauer}'`).join("\n") + "\n"; });
  if (navigator.share) { try { await navigator.share({ title: "Lernblock", text: txt }); return; } catch (e) { if (e.name === "AbortError") return; } }
  window.open("https://wa.me/?text=" + encodeURIComponent(txt), "_blank", "noopener");
  snRender();
}
function printBlock(id) {
  const b = sn().bloecke.find(x => x.id === id); ensurePlans(b);
  $("#printArea").innerHTML = blockDates(b).map((d, i) => `<div style="${i ? "page-break-before:always;break-before:page" : ""}">${planDocHTML(b.e[d].plan, false)}</div>`).join("");
  snRender(); setTimeout(() => window.print(), 80);
}

/* ---------------- Spielplan ---------------- */
function editGame(id) {
  const s = sn(), g = id ? s.spiele.find(x => x.id === id) : { id: uid(), datum: heute(), gegner: "", heim: true, art: "Liga" };
  openSheet(id ? "Spiel bearbeiten" : "Spiel / Turnier eintragen", `
    <span class="lbl">Datum</span><input type="date" id="gDatum" value="${g.datum}">
    <span class="lbl">Art</span><div class="seg" id="gArt">${["Liga", "Turnier", "Pokal", "Test"].map(a => `<button data-v="${a}" aria-pressed="${g.art === a}">${a}</button>`).join("")}</div>
    <span class="lbl">Gegner / Name des Turniers</span><input type="text" id="gGegner" value="${esc(g.gegner || "")}">
    <span class="lbl">Ort</span><div class="seg" id="gHeim"><button data-v="1" aria-pressed="${!!g.heim}">Heim</button><button data-v="0" aria-pressed="${!g.heim}">Auswärts</button></div>
    <div style="height:1rem"></div><div class="row"><button class="btn primary" id="gSave">Speichern</button>${id ? '<button class="btn danger" id="gDel">Löschen</button>' : ""}</div>`);
  ["gArt", "gHeim"].forEach(k => $$("#" + k + " button").forEach(b => b.onclick = () => $$("#" + k + " button").forEach(x => x.setAttribute("aria-pressed", x === b))));
  $("#gSave").onclick = () => {
    g.datum = $("#gDatum").value || g.datum; g.gegner = $("#gGegner").value.trim();
    g.art = $("#gArt [aria-pressed=true]").dataset.v; g.heim = $("#gHeim [aria-pressed=true]").dataset.v === "1";
    if (g.gegner) delete g.offen; if (!id) s.spiele.push(g); save(); closeSheet(); snRender(); toast("Gespeichert");
  };
  if (id) $("#gDel").onclick = () => { s.spiele = s.spiele.filter(x => x.id !== id); save(); closeSheet(); snRender(); };
}
function renderRaster() {
  const s = sn(); if (SN.rasterNr === null) SN.rasterNr = s.rasterNr || null;
  $("#snRasterNr").innerHTML = Array.from({ length: 10 }, (_, i) => `<button class="chip" data-nr="${i + 1}" aria-pressed="${SN.rasterNr === i + 1}">${i + 1}</button>`).join("");
  $$("#snRasterNr .chip").forEach(c => c.onclick = () => { SN.rasterNr = +c.dataset.nr; renderRaster(); });
  $("#snGegner").innerHTML = SN.rasterNr ? Array.from({ length: 10 }, (_, i) => i + 1).filter(n => n !== SN.rasterNr).map(n => `<div class="row" style="margin-bottom:.3rem"><b style="width:2.2rem">Nr. ${n}</b><input type="text" data-gn="${n}" value="${esc(s.gegner[n] || "")}" placeholder="Vereinsname" style="flex:1;min-height:44px"></div>`).join("") : '<p class="hint">Erst die eigene Rasternummer wählen.</p>';
}
function applyRaster() {
  const s = sn(), nr = SN.rasterNr; if (!nr) return toast("Bitte zuerst die eigene Rasternummer wählen");
  $$("#snGegner [data-gn]").forEach(i => { const v = i.value.trim(); if (v) s.gegner[i.dataset.gn] = v; else delete s.gegner[i.dataset.gn]; });
  s.rasterNr = nr; s.spiele = s.spiele.filter(g => !g.st);
  RASTER.forEach(t => { const p = t.paar.find(x => x.includes(nr)); if (!p) return; const heim = p[0] === nr, gn = heim ? p[1] : p[0];
    s.spiele.push({ id: uid(), datum: t.sa, gegner: s.gegner[gn] || "Nr. " + gn, heim, art: "Liga", st: t.nr, gn, stern: t.stern }); });
  save(); snRender(); toast("18 Spieltage eingetragen – Tag und Gegner je Spiel anpassbar");
}

function applyTermineNDS() {
  const s = sn(); s.spiele = s.spiele.filter(g => !g.st);
  TERMINE_NDS.forEach((d, i) => s.spiele.push({ id: uid(), datum: d, gegner: "", heim: true, art: "Liga", st: i + 1, offen: true }));
  save(); snRender(); toast("18 Spieltage eingetragen – Gegner, Ort und Tag je Spiel nachtragen");
}
// Verband gewechselt: passende Spielplan-Übernahme zeigen, vorbelegte Ferien auf Wunsch tauschen
function snVerband(changed) {
  const s = sn(), v = verb();
  if ($("#snRasterBY")) { $("#snRasterBY").hidden = v !== "by"; $("#snRasterNDS").hidden = v !== "nds"; }
  if ($("#snFerienLbl")) $("#snFerienLbl").textContent = "Schulferien (" + (v === "nds" ? "Niedersachsen" : "Bayern") + " 2026/27 vorbelegt, änderbar)";
  if (changed && s.ferienVon !== v && confirm("Schulferien für " + (v === "nds" ? "Niedersachsen" : "Bayern") + " 2026/27 eintragen? Die bisherige Ferienliste wird ersetzt.")) { s.ferien = structuredClone(FERIEN[v]); s.ferienVon = v; save(); }
  if (changed) { renderSettings(); previewBlock(); snRender(); }
}

/* ---------------- Einstellungen ---------------- */
function renderSettings() {
  const s = sn();
  $("#snTage").innerHTML = [1, 2, 3, 4, 5, 6, 0].map(d => `<button class="chip" data-d="${d}" aria-pressed="${s.tage.includes(d)}">${WT[d]}</button>`).join("");
  $$("#snTage .chip").forEach(c => c.onclick = () => { const d = +c.dataset.d, i = s.tage.indexOf(d); if (i >= 0) s.tage.splice(i, 1); else s.tage.push(d); save(); renderSettings(); snRender(); previewBlock(); });
  $$("#snFerienTr button").forEach(b => { b.setAttribute("aria-pressed", (b.dataset.v === "1") === !!s.ferienTraining); b.onclick = () => { s.ferienTraining = b.dataset.v === "1"; save(); renderSettings(); snRender(); previewBlock(); }; });
  $("#snFerien").innerHTML = s.ferien.map((f, i) => `<div class="frow"><input type="text" data-i="${i}" data-f="n" value="${esc(f.n || "")}" aria-label="Bezeichnung"><input type="date" data-i="${i}" data-f="von" value="${f.von || ""}" aria-label="von"><input type="date" data-i="${i}" data-f="bis" value="${f.bis || ""}" aria-label="bis"><button class="btn small danger" data-fdel="${i}" aria-label="entfernen">✕</button></div>`).join("");
  $$("#snFerien input").forEach(inp => inp.onchange = () => { s.ferien[+inp.dataset.i][inp.dataset.f] = inp.value; save(); snRender(); previewBlock(); });
  $$("#snFerien [data-fdel]").forEach(b => b.onclick = () => { s.ferien.splice(+b.dataset.fdel, 1); save(); renderSettings(); snRender(); });
  $("#snFrei").innerHTML = s.frei.slice().sort().map(d => `<button class="chip" data-frei="${d}" aria-pressed="false">${dShort(d)}${d.slice(0, 4)} ✕</button>`).join(" ") || '<span class="hint">keine</span>';
  $$("#snFrei [data-frei]").forEach(b => b.onclick = () => { s.frei = s.frei.filter(x => x !== b.dataset.frei); save(); renderSettings(); snRender(); });
}
function nextTrainingDay() { for (let i = 0; i < 60; i++) { const d = dAdd(heute(), i); if (isTraining(d)) return d; } return heute(); }
function previewBlock() {
  if (!$("#snStart")) return; const st = $("#snStart").value; if (!st) return;
  const b = { start: st, wochen: SN.wochen }, dates = blockDates(b), games = sn().spiele.filter(g => g.datum >= st && g.datum <= blockEnd(b)).length;
  $("#snPreview").textContent = dates.length ? `${dates.length} Einheiten (${dates.map(dShort).join(", ")}) · ${games} Spiel(e) im Zeitraum` : "In diesem Zeitraum liegt kein Trainingstag.";
}

/* ---------------- Initialisierung ---------------- */
function snInit() {
  const s = sn();
  $("#snThema").innerHTML = [...new Set(THEMEN.map(t => t.bereich))].map(g => `<optgroup label="${esc(g)}">${THEMEN.filter(t => t.bereich === g).map(t => `<option value="${t.id}">${esc(t.titel)}</option>`).join("")}</optgroup>`).join("");
  $("#snStart").value = nextTrainingDay(); $("#snStart").onchange = previewBlock;
  $$("#snWochen button").forEach(b => { b.setAttribute("aria-pressed", +b.dataset.v === SN.wochen); b.onclick = () => { SN.wochen = +b.dataset.v; $$("#snWochen button").forEach(x => x.setAttribute("aria-pressed", x === b)); previewBlock(); }; });
  $("#snCreate").onclick = () => {
    const st = $("#snStart").value; if (!st) return toast("Bitte Startdatum wählen");
    const b = { id: uid(), thema: $("#snThema").value, start: st, wochen: SN.wochen, e: {} };
    if (!blockDates(b).length) return toast("In diesem Zeitraum liegt kein Trainingstag");
    s.bloecke.push(b); save(); $("#snNewBox").open = false; snRender(); toast("Lernblock angelegt – Einheiten einzeln planen oder öffnen");
  };
  $("#snAddGame").onclick = () => editGame(null);
  $("#snRasterGo").onclick = applyRaster;
  $("#snTermineGo").onclick = applyTermineNDS;
  $("#snAddFerien").onclick = () => { s.ferien.push({ n: "", von: "", bis: "" }); save(); renderSettings(); };
  $("#snAddFrei").onclick = () => { const d = $("#snFreiDate").value; if (!d) return toast("Bitte Datum wählen"); if (!s.frei.includes(d)) s.frei.push(d); save(); renderSettings(); snRender(); };
  $("#snExport").onclick = async () => {
    const name = "Saison-" + heute() + ".json", file = new File([JSON.stringify({ typ: "trainingshalle-saison", v: 1, saison: s }, null, 1)], name, { type: "application/json" });
    if (navigator.canShare && navigator.canShare({ files: [file] })) { try { await navigator.share({ files: [file], title: "Saisonplanung" }); return; } catch (e) { if (e.name === "AbortError") return; } }
    download(file, name); toast("Datei gespeichert – jetzt z. B. per WhatsApp verschicken");
  };
  $("#snImportBtn").onclick = () => $("#snImportFile").click();
  $("#snImportFile").onchange = ev => {
    const f = ev.target.files[0]; if (!f) return; const rd = new FileReader();
    rd.onload = () => { try { const d = JSON.parse(rd.result); if (d.typ !== "trainingshalle-saison" || !d.saison) throw 0;
      if (!confirm("Saison-Datei laden? Einstellungen, Spielplan und Lernblöcke auf diesem Gerät werden ersetzt.")) return;
      S.saison = d.saison; snState(); if (S.plan && S.plan.block) S.plan = null; save(); SN.rasterNr = null; renderSettings(); renderRaster(); snRender(); toast("Saison geladen");
    } catch (e) { toast("Das ist keine Saison-Datei"); } ev.target.value = ""; };
    rd.readAsText(f);
  };
  renderSettings(); renderRaster(); previewBlock(); snRender(); snVerband(false);
}
