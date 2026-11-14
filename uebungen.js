/*
 * Trainingshalle – Übungsbibliothek
 * ------------------------------------------------------------
 * Jede Übung ist ein Objekt. Änderungen bitte per Pull Request oder
 * über „Änderung vorschlagen“ in der App (öffnet ein GitHub-Issue).
 *
 * Felder:
 *  id        eindeutige Kennung (nicht ändern, Pläne verweisen darauf)
 *  titel     Name der Übung
 *  phase     auf = Aufwärmen | prae = Prävention | haupt = Hauptteil | spiel = Spielform | aus = Ausklang
 *  ziele     Gewichtung 0–3 je Radar-Achse:
 *            ia = Individuell Angriff, iv = Individuell Abwehr, ko = Kooperation (2–3 Spieler),
 *            ma = Mannschaftstaktik, te = Tempospiel/Umschalten, wt = Wurf & Torwart, at = Athletik
 *  rtk       Zielbereiche der Rahmentrainingskonzeption (Grundlagentraining)
 *  dauer     [min, standard, max] in Minuten
 *  spieler   [min, max] Feldspieler + Torhüter gesamt (max = sinnvoll ohne Stationsteilung)
 *  tw        mindestens benötigte Torhüter
 *  flaeche   kleinste nötige Fläche: drittel | halb | ganz
 *  baelle    wenig (≤ 4) | mittel (1 Ball je 2 Spieler) | viel (1 Ball je Spieler)
 *  material  zusätzlich benötigtes Material (Hütchen, Leibchen, Weichboden, Bänke/Kästen, Koordinationsleiter, Reifen, Softbälle)
 *  intens    Belastung 1 = gering, 2 = mittel, 3 = hoch
 *  harz      true, wenn die Übung ohne Haftmittel deutlich an Wert verliert
 *  nurTW     true = Parallelprogramm nur für Torhüter (wird nicht automatisch für die ganze Gruppe geplant)
 *  quelle    {art, titel, url} – Grundlage zum Nachschlagen
 *  g         Grafik: f = Feld (halb | ganz | frei), e = Elemente
 *            ['a',x,y,'Text'] Angreifer · ['d',x,y,'Text'] Abwehr · ['tw',x,y] Torhüter
 *            ['k',x,y] Hütchen · ['b',x,y] Ball · ['m',x,y,b,h,'Text'] Matte/Fläche
 *            ['l',[[x,y],…]] Laufweg · ['p',[[x,y],…]] Pass · ['dr',[[x,y],…]] Prellen · ['w',[[x,y],…]] Wurf
 *            ['t',x,y,'Text'] Beschriftung
 *            Halbfeld: 100 × 100 Einheiten = 20 m × 20 m (5 Einheiten = 1 m), Tor oben bei y = 0
 *            Ganzes Feld: 100 × 200, Tore oben und unten · frei: 100 × 60 ohne Linien
 */

const Q = {
  RTK_ZIELE: { titel: "DHB-RTK Grundlagentraining – alle Ziele auf einen Blick", url: "https://www.dhb-trainercenter.de/dhb-rahmentrainingskonzeption/grundlagentraining/alle-ziele-auf-einen-blick/?L=0" },
  RTK_IA: { titel: "DHB-RTK Grundlagentraining – Individuelles Angriffsspiel", url: "https://www.dhb-trainercenter.de/dhb-rahmentrainingskonzeption/grundlagentraining/individuelles-angriffspiel/?L=0" },
  RTK_GT: { titel: "DHB-RTK Grundlagentraining", url: "https://www.dhb-trainercenter.de/dhb-rahmentrainingskonzeption/grundlagentraining/?L=0" },
  RTK_WETT: { titel: "DHB-RTK – Wettspiele in den Ausbildungsstufen", url: "https://www.dhb-trainercenter.de/dhb-rahmentrainingskonzeption/einfuehrung-und-uebergreifende-hinweise/wettspiele-in-den-ausbildungsstufen/?L=0" },
  ATK: { titel: "DHB-Athletikkonzept (ATK)", url: "https://www.dhb-trainercenter.de/dhb-rahmentrainingskonzeption/einfuehrung-und-uebergreifende-hinweise/athletikkonzept-atk-des-dhb/?L=0" },
  PRAEV: { titel: "BHV / Achenbach: Präventions-ABC – Übungen für das Handballspiel und -training (2020)", url: "https://www.hs.mh.tum.de/fileadmin/w00bbr/sportdidaktik/Dateien/Praeventions_ABC_BHV.pdf" },
  VBG: { titel: "VBG: Trainingsübungen für ein starkes Handballteam („Das 4x4 des Handballs“)", url: "https://cdn.vbg.de/media/386d7bf0ed92424cab04fe7c27afad8b/dld:attachment/Trainingsuebungen_fuer_ein_starkes_Handballteam.pdf" },
  HVNB: { titel: "HVNB: Durchführungsbestimmungen und Richtlinien im Kinder- und Jugendhandball (Stand Juli 2026)", url: "https://www.hvnb-online.de/" },
  BHV: { titel: "BHV-Durchführungsbestimmungen Teil I, Abschnitt 1.5 (C-Jugend: offensive Deckung)", url: "https://bhv-handball.liga.nu/pdfuploads/2024/2024-10-07-11-53-15/DFB_Teil_I_gekennzeichnete_Anderungen_3.0.pdf" }
};
const EIGEN = "Eigene Ausarbeitung nach";
const PROG = "Übernommen aus Präventionsprogramm";

// Häufig genutzte Positionen im Halbfeld
const P = { LA: [8, 14], RL: [22, 52], RM: [50, 58], RR: [78, 52], RA: [92, 14], KM: [50, 33], TW: [50, 5] };

window.UEBUNGEN = [

/* ============================== AUFWÄRMEN ============================== */
{
  id: "auf-laufschule", titel: "Laufschule mit Richtungswechseln", phase: "auf",
  ziele: { at: 2, iv: 1 }, rtk: ["Motorik/Athletik"],
  dauer: [6, 8, 12], spieler: [4, 24], tw: 0, flaeche: "drittel", baelle: "wenig", material: ["Hütchen"], intens: 1, harz: false,
  kurz: "Lockeres Einlaufen in spieltypischen Bewegungen – bereitet Gelenke auf Stopps und Richtungswechsel vor.",
  aufbau: "Zwei Hütchenreihen im Abstand von ca. 15 m. Spieler in 3–4 Gruppen hintereinander an der Startlinie.",
  ablauf: [
    "Je eine Bahn hin, locker zurück: Traben, Anfersen, Kniehebelauf, Hopserlauf.",
    "Seitwärts im Abwehr-Gleitschritt (Nachstellschritt), Blick nach vorn, Hände vor dem Körper.",
    "Rückwärtslaufen, auf Zuruf Drehung und Antritt vorwärts.",
    "Zickzack um versetzte Hütchen: vor jedem Hütchen abbremsen, mit Außenfuß abdrücken.",
    "Zum Schluss 2 × Steigerungslauf auf 80 %."
  ],
  coaching: ["Knie zeigt beim Abbremsen über den Fuß – nicht nach innen knicken.", "Leise landen, über den Vorfuß arbeiten.", "Tempo erst steigern, wenn die Technik sauber ist."],
  fehler: ["Abbremsen mit gestrecktem Bein", "Hohlkreuz beim Seitwärtsgleiten"],
  leichter: "Weniger Richtungswechsel, größere Abstände.",
  schwerer: "Richtungswechsel auf optisches Signal (Trainer zeigt Richtung).",
  quelle: { art: EIGEN, ...Q.VBG },
  g: { f: "frei", e: [["k",10,15],["k",10,45],["k",90,15],["k",90,45],["k",35,30],["k",55,22],["k",75,38],["a",10,30,""],["l",[[14,30],[35,26],[55,26],[75,34],[88,30]]],["t",50,55,"15 m"]] }
},
{
  id: "auf-parteiball", titel: "Parteiball 10er-Pass mit Zusatzaufgaben", phase: "auf",
  ziele: { ko: 1, iv: 1, at: 1 }, rtk: ["Kooperatives Angriffsspiel", "Individuelles Abwehrspiel"],
  dauer: [8, 10, 12], spieler: [8, 20], tw: 0, flaeche: "halb", baelle: "wenig", material: ["Leibchen"], intens: 2, harz: false,
  kurz: "Zwei Teams spielen sich den Ball zu; zehn Pässe in Folge ergeben einen Punkt. Aktiviert Kreislauf, Passspiel und Abwehr-Bereitschaft.",
  aufbau: "Halbe Halle, zwei Teams mit Leibchen. Ein Ball (bei 16+ Spielern zwei Felder).",
  ablauf: [
    "Team A versucht, 10 Pässe in Folge zu spielen, ohne dass Team B den Ball abfängt.",
    "Kein Prellen erlaubt, maximal 3 Schritte. Kein Rückpass zum Passgeber.",
    "Bei Ballgewinn startet das andere Team bei null.",
    "Nach 3 Minuten Zusatzregel: Nur Bodenpässe zählen doppelt / nur Sprungpässe zählen."
  ],
  coaching: ["Freilaufen in den freien Raum, nicht zum Ball laufen.", "Abwehr: Passwege zustellen, Ball früh attackieren – passt zur offensiven Deckung der C-Jugend.", "Kommunikation: Namen rufen."],
  fehler: ["Alle laufen zum Ball (Knäuel)", "Abwehr wartet passiv"],
  leichter: "Überzahl für das ballbesitzende Team (Joker).",
  schwerer: "Feld verkleinern, Pass nur mit der schwachen Hand.",
  quelle: { art: EIGEN, ...Q.RTK_ZIELE },
  g: { f: "frei", e: [["a",20,15,""],["a",45,40,""],["a",70,20,""],["a",85,45,""],["d",30,25,""],["d",55,30,""],["d",72,35,""],["d",50,10,""],["p",[[20,15],[45,40]]],["p",[[45,40],[70,20]]],["b",20,15]] }
},
{
  id: "auf-passstern", titel: "Passen und Fangen in Bewegung (Passviereck)", phase: "auf",
  ziele: { ia: 1, ko: 1, wt: 1 }, rtk: ["Individuelles Angriffsspiel"],
  dauer: [8, 10, 15], spieler: [8, 24], tw: 0, flaeche: "drittel", baelle: "mittel", material: ["Hütchen"], intens: 1, harz: false,
  kurz: "Passen im Laufen mit Nachlaufen zur nächsten Station. Hohe Wiederholungszahl, wärmt Schulter und Hand auf.",
  aufbau: "Vier Hütchen als Quadrat (ca. 8 × 8 m), an jedem Hütchen 2–4 Spieler. Zwei Bälle im Umlauf.",
  ablauf: [
    "Spieler passt im Laufen zum nächsten Hütchen (gegen den Uhrzeigersinn) und läuft dem Ball hinterher.",
    "Annahme im Laufen, maximal 3 Schritte, dann Pass weiter.",
    "Nach 2 Minuten Richtungswechsel.",
    "Steigerung: Pass diagonal und gleichzeitig Pass außen herum (3 Bälle)."
  ],
  coaching: ["Fangen mit „Ballkorb“ (Daumen und Zeigefinger bilden Dreieck).", "Pass in den Lauf des Mitspielers, nicht auf den Körper.", "Ellbogen beim Pass über Schulterhöhe – schützt die Schulter."],
  fehler: ["Stehen beim Fangen", "Wurfarm hängt tief"],
  leichter: "Annahme im Stand, dann Pass.",
  schwerer: "Pass nur mit Sprungwurfbewegung oder mit der schwachen Hand.",
  quelle: { art: EIGEN, ...Q.RTK_IA },
  g: { f: "frei", e: [["k",25,10],["k",75,10],["k",75,50],["k",25,50],["a",25,10,""],["a",75,10,""],["a",75,50,""],["a",25,50,""],["p",[[25,10],[75,10]]],["p",[[75,10],[75,50]]],["l",[[27,14],[70,14]]],["b",25,10]] }
},
{
  id: "auf-reaktion", titel: "Schwarz-Weiß-Reaktionsspiel", phase: "auf",
  ziele: { at: 2, te: 1 }, rtk: ["Motorik/Athletik"],
  dauer: [5, 8, 10], spieler: [4, 24], tw: 0, flaeche: "drittel", baelle: "wenig", material: ["Hütchen"], intens: 2, harz: false,
  kurz: "Paare sitzen/liegen sich gegenüber, auf Zuruf wird gefangen oder geflüchtet. Schult Reaktions- und Antrittsschnelligkeit.",
  aufbau: "Paare an der Mittellinie gegenüber, je 1 m Abstand. Fluchtlinie 8 m hinter jedem Spieler (Hütchen).",
  ablauf: [
    "Eine Seite heißt „Schwarz“, die andere „Weiß“.",
    "Trainer ruft eine Farbe: Diese Seite fängt, die andere flüchtet hinter ihre Fluchtlinie.",
    "Startpositionen wechseln: Bauchlage, Rückenlage, Sitz, Abwehrgrundstellung.",
    "6–8 Durchgänge, dazwischen 20–30 Sekunden Pause."
  ],
  coaching: ["Erster Schritt explosiv – Körperschwerpunkt tief.", "Nach dem Abschlag ganz austrudeln, nicht abrupt stoppen.", "Ausreichend Pause: Es geht um Schnelligkeit, nicht um Ausdauer."],
  fehler: ["Zu kurze Pausen", "Antritt aus hoher Position"],
  leichter: "Startposition stehend.",
  schwerer: "Trainer stellt Rechenaufgaben: gerade Zahl = Schwarz, ungerade = Weiß.",
  quelle: { art: EIGEN, ...Q.ATK },
  g: { f: "frei", e: [["a",50,25,"S"],["d",50,35,"W"],["k",50,5],["k",50,55],["l",[[50,22],[50,8]]],["l",[[50,38],[50,52]]],["t",80,30,"Zuruf"]] }
},
{
  id: "auf-tw-einwerfen", titel: "Torhüter einwerfen (strukturiert)", phase: "auf",
  ziele: { wt: 2 }, rtk: ["Torwartspiel"],
  dauer: [8, 10, 12], spieler: [6, 24], tw: 1, flaeche: "halb", baelle: "mittel", material: [], intens: 1, harz: false,
  kurz: "Feste Reihenfolge von Wurfzielen, damit der Torhüter sich aufwärmt statt abgeschossen zu werden.",
  aufbau: "Feldspieler in einer Reihe auf 9 m mittig, jeder mit Ball. Torhüter im Tor.",
  ablauf: [
    "Runde 1: Würfe kontrolliert halbhoch neben den Körper (rechts/links im Wechsel).",
    "Runde 2: Würfe flach in die Ecken – angekündigt.",
    "Runde 3: Würfe hoch in die Ecken – angekündigt.",
    "Runde 4: Freie Würfe aus 9 m auf 70 % Wurfkraft.",
    "Jeder Werfer holt seinen Ball selbst, Torhüter bekommt zwischen den Würfen Zeit."
  ],
  coaching: ["Wurfrhythmus so wählen, dass der Torhüter wieder in Grundstellung kommt.", "Torhüter: aktive Grundstellung, Hände vorne, Körperschwerpunkt über den Fußballen.", "Werfer treffen das Ziel – Präzision vor Härte."],
  fehler: ["Volle Härte von Beginn an", "Würfe an den Kopf"],
  leichter: "Würfe aus 7 m im Stand.",
  schwerer: "Würfe aus Positionen (Außen, Rückraum links/rechts) in fester Folge.",
  quelle: { art: EIGEN, ...Q.RTK_ZIELE },
  g: { f: "halb", e: [["tw",50,5],["a",40,48,""],["a",50,48,""],["a",60,48,""],["w",[[50,46],[46,6]]],["t",50,62,"Wurfreihenfolge 1–4"]] }
},

/* ============================== PRÄVENTION ============================== */
{
  id: "prae-landeschule", titel: "Landeschule: stabil und leise landen", phase: "prae",
  ziele: { at: 3 }, rtk: ["Motorik/Athletik"],
  dauer: [6, 8, 10], spieler: [2, 24], tw: 0, flaeche: "drittel", baelle: "wenig", material: [], intens: 1, harz: false,
  kurz: "Sprung- und Landeübungen mit Fokus auf die Beinachse. Die Landung nach Sprungwurf und Finte ist ein häufiger Verletzungsmoment.",
  aufbau: "Spieler verteilt in der Hallenhälfte, ausreichend Abstand. Partner beobachtet und gibt Rückmeldung.",
  ablauf: [
    "Beidbeinig: kleiner Sprung nach oben, Landung weich, Hüfte nach hinten, 2 s halten (6 ×).",
    "Beidbeinig nach vorn springen und stabil landen (6 ×).",
    "Einbeinig: Sprung auf der Stelle, Landung auf demselben Bein, 2 s halten (je Bein 5 ×).",
    "Einbeinig seitlich: von links nach rechts springen (Eisschnellläufer-Sprung), Landung halten (je Seite 5 ×).",
    "Partner kontrolliert: Zeigt das Knie über den 2. Zeh?"
  ],
  coaching: ["Knie über dem Fuß – nicht nach innen fallen lassen.", "Oberkörper leicht nach vorn, Hüfte beugen.", "„Leise landen“ ist die einfachste Anweisung."],
  fehler: ["X-Bein bei der Landung", "Landung auf der Ferse mit gestrecktem Knie"],
  leichter: "Nur beidbeinig, geringe Sprunghöhe.",
  schwerer: "Landung mit Ballfangen in der Luft (Partner wirft zu).",
  quelle: { art: PROG, ...Q.PRAEV },
  g: { f: "frei", e: [["a",30,30,""],["l",[[34,30],[66,30]]],["a",70,30,""],["t",50,48,"Landung halten: 2 Sekunden"]] }
},
{
  id: "prae-kniekontrolle", titel: "Kniekontrolle im Einbeinstand mit Partner", phase: "prae",
  ziele: { at: 3 }, rtk: ["Motorik/Athletik"],
  dauer: [5, 6, 8], spieler: [2, 24], tw: 0, flaeche: "drittel", baelle: "wenig", material: [], intens: 1, harz: false,
  kurz: "Gleichgewicht und Beinachsenkontrolle auf einem Bein, mit Störung durch den Partner.",
  aufbau: "Paare, ein Ball pro Paar (alternativ ohne Ball).",
  ablauf: [
    "Spieler A steht auf einem Bein, Knie leicht gebeugt. Partner B passt den Ball zu, A fängt und passt zurück (10 ×).",
    "B gibt leichte Stöße gegen Schulter und Hüfte, A bleibt stabil (20 s).",
    "A macht eine einbeinige Kniebeuge (halbtief) und hält 2 s (6 ×).",
    "Bein- und Rollenwechsel."
  ],
  coaching: ["Becken bleibt waagerecht.", "Knie zeigt nach vorn über den Fuß.", "Langsam und kontrolliert."],
  fehler: ["Ausweichen in die Hüfte", "Fuß knickt nach außen"],
  leichter: "Ohne Störung, mit Abstützen an der Wand.",
  schwerer: "Auf weicher Matte oder mit geschlossenen Augen.",
  quelle: { art: PROG, ...Q.PRAEV },
  g: { f: "frei", e: [["a",35,30,"A"],["a",65,30,"B"],["p",[[62,30],[38,30]]],["t",35,45,"Einbeinstand"]] }
},
{
  id: "prae-rumpf", titel: "Rumpfkraft-Zirkel ohne Geräte", phase: "prae",
  ziele: { at: 3 }, rtk: ["Motorik/Athletik"],
  dauer: [6, 8, 12], spieler: [2, 24], tw: 0, flaeche: "drittel", baelle: "wenig", material: [], intens: 1, harz: false,
  kurz: "Stützübungen für Bauch, Rücken und Seite. Grundlage für stabile Würfe und Landungen.",
  aufbau: "Alle auf dem Hallenboden, Blickrichtung Trainer.",
  ablauf: [
    "Unterarmstütz 30 s – Körper gerade wie ein Brett.",
    "Seitstütz links/rechts je 20 s.",
    "Rückenlage, Becken heben (Brücke), 30 s, dann einbeinig je 10 s.",
    "Unterarmstütz mit abwechselndem Beinheben 30 s.",
    "Zwei Runden, dazwischen 30 s Pause."
  ],
  coaching: ["Bauchnabel nach innen ziehen, kein Hohlkreuz.", "Kopf in Verlängerung der Wirbelsäule.", "Lieber kürzer halten als mit schlechter Haltung."],
  fehler: ["Hüfte hängt durch", "Luft anhalten"],
  leichter: "Auf den Knien abstützen.",
  schwerer: "Partner legt leichten Ball auf den Rücken, der nicht herunterfallen darf.",
  quelle: { art: PROG, ...Q.VBG },
  g: { f: "frei", e: [["t",50,30,"Unterarmstütz · Seitstütz · Brücke · Beinheben"]] }
},
{
  id: "prae-kniekraft", titel: "Kniekraft exzentrisch (Partnerübung)", phase: "prae",
  ziele: { at: 3 }, rtk: ["Motorik/Athletik"],
  dauer: [5, 6, 8], spieler: [2, 24], tw: 0, flaeche: "drittel", baelle: "wenig", material: [], intens: 2, harz: false,
  kurz: "Kontrolliertes Absenken des Oberkörpers nach vorn bei fixierten Fersen kräftigt die hintere Oberschenkelmuskulatur.",
  aufbau: "Paare. Spieler A kniet aufrecht, B hält dessen Fersen am Boden fest.",
  ablauf: [
    "A lässt sich mit geradem Körper langsam nach vorn sinken, so weit es kontrolliert geht.",
    "Kurz vor dem Boden mit den Händen abfangen und zurück in die Ausgangsposition drücken.",
    "Einstieg: 3–4 Wiederholungen. Später maximal 2 Sätze à 6–8 Wiederholungen (Empfehlung Präventions-ABC).",
    "Rollentausch."
  ],
  coaching: ["Hüfte gestreckt lassen – nicht abknicken.", "Langsam ablassen ist die eigentliche Übung.", "Bei Schmerzen im Knie abbrechen."],
  fehler: ["Abknicken in der Hüfte", "Zu viele Wiederholungen am Anfang"],
  leichter: "Nur ein kurzes Stück nach vorn sinken.",
  schwerer: "Pause in der Mitte des Absenkens (2 s halten).",
  quelle: { art: PROG, ...Q.PRAEV },
  g: { f: "frei", e: [["a",40,30,"A"],["a",60,30,"B"],["t",50,48,"B fixiert die Fersen"]] }
},
{
  id: "prae-schulter", titel: "Schulterkräftigung Y-T-W und Wurfarm-Aktivierung", phase: "prae",
  ziele: { at: 2, wt: 1 }, rtk: ["Motorik/Athletik"],
  dauer: [5, 6, 8], spieler: [2, 24], tw: 0, flaeche: "drittel", baelle: "wenig", material: [], intens: 1, harz: false,
  kurz: "Kräftigung der Schulterblattmuskulatur vor Wurfbelastung. Schulterbeschwerden sind im Jugend-Leistungssport häufig.",
  aufbau: "Bauchlage auf dem Hallenboden (Stirn auf dem Handrücken oder leicht angehoben).",
  ablauf: [
    "Y: Arme schräg nach vorn oben, Daumen zeigen nach oben, Arme 10 × leicht anheben.",
    "T: Arme seitlich, 10 × anheben.",
    "W: Ellbogen gebeugt, Schulterblätter zusammenziehen, 10 ×.",
    "Stehend: Wurfarm 10 × langsam durch die Wurfbewegung führen, dann 10 × lockere Pässe zum Partner."
  ],
  coaching: ["Schulterblätter nach hinten unten ziehen.", "Langsam, ohne Schwung.", "Nacken entspannt lassen."],
  fehler: ["Schwung holen", "Kopf überstrecken"],
  leichter: "Weniger Wiederholungen, im Stehen gegen die Wand.",
  schwerer: "Mit leichtem Ball in der Hand.",
  quelle: { art: PROG, ...Q.PRAEV },
  g: { f: "frei", e: [["t",50,30,"Y · T · W in Bauchlage"]] }
},
{
  id: "prae-finten", titel: "Fintenschule: Richtungswechsel sicher ausführen", phase: "prae",
  ziele: { at: 2, ia: 2 }, rtk: ["Motorik/Athletik", "Individuelles Angriffsspiel"],
  dauer: [6, 8, 10], spieler: [4, 24], tw: 0, flaeche: "drittel", baelle: "mittel", material: ["Hütchen"], intens: 2, harz: false,
  kurz: "Körpertäuschungen langsam und mit sauberer Knieachse – erst ohne, dann mit Ball. Verbindet Prävention und 1-gegen-1-Technik.",
  aufbau: "Pro Gruppe ein Hütchen als „Gegner“ 5 m vor der Startlinie.",
  ablauf: [
    "Anlaufen, vor dem Hütchen Stemmschritt nach links, Abdruck nach rechts vorbei (langsam, 4 ×).",
    "Gegenseite (4 ×).",
    "Mit Ball: Fangen im Lauf, Finte, vorbeiprellen.",
    "Tempo steigern, solange die Knieachse stabil bleibt."
  ],
  coaching: ["Stemmbein: Knie über dem Fuß, Fußspitze leicht nach außen.", "Körperschwerpunkt tief und zwischen den Füßen.", "Erst sauber, dann schnell."],
  fehler: ["Knie fällt beim Abdruck nach innen", "Oberkörper kippt zu weit zur Seite"],
  leichter: "Ohne Ball, Gehtempo.",
  schwerer: "Partner als passiver Verteidiger statt Hütchen.",
  quelle: { art: PROG, ...Q.PRAEV },
  g: { f: "frei", e: [["a",20,30,""],["k",55,30],["l",[[24,30],[50,26],[62,40],[85,40]]],["t",55,15,"Stemmschritt"]] }
},

/* ============================ INDIVIDUELL ANGRIFF ============================ */
{
  id: "ia-1g1-korridor", titel: "1-gegen-1 im Korridor (Körpertäuschung)", phase: "haupt",
  ziele: { ia: 3, iv: 2, at: 1 }, rtk: ["Individuelles Angriffsspiel", "Individuelles Abwehrspiel"],
  dauer: [10, 15, 20], spieler: [6, 20], tw: 1, flaeche: "halb", baelle: "mittel", material: ["Hütchen"], intens: 3, harz: false,
  kurz: "Angreifer muss im markierten Korridor (ca. 4 m breit) am Verteidiger vorbei und zum Torwurf kommen. Kernübung des Grundlagentrainings.",
  aufbau: "Zwei bis drei Korridore mit Hütchen von 12 m bis 6 m. Angreifer mit Ball an der Startlinie, Verteidiger auf ca. 8 m.",
  ablauf: [
    "Angreifer startet mit Ball (Prellen erlaubt) und versucht, sich am Verteidiger vorbei zu täuschen.",
    "Gelingt der Durchbruch, folgt der Torwurf aus dem Korridor.",
    "Verteidiger darf nur frontal arbeiten und den Ball herausspielen (fair, mit offener Hand).",
    "Nach jeder Aktion Rollenwechsel, Verteidiger wird Angreifer.",
    "Wertung: Tor = 2 Punkte für Angreifer, Ballgewinn = 2 Punkte für Verteidiger."
  ],
  coaching: ["Tempo aufnehmen, dann vor dem Verteidiger abbremsen – nicht in ihn hineinlaufen.", "Täuschung groß zeigen (Schulter, Ball, Blick), Durchbruch klein und explosiv.", "Nach dem Durchbruch Körper zwischen Verteidiger und Ball."],
  fehler: ["Zu früh täuschen (Verteidiger zu weit weg)", "Kein Tempowechsel"],
  leichter: "Verteidiger mit Hände hinter dem Rücken oder breiterer Korridor.",
  schwerer: "Korridor 3 m, Angreifer muss Pass vom Zuspieler im Lauf annehmen.",
  quelle: { art: EIGEN, ...Q.RTK_IA },
  g: { f: "halb", e: [["tw",50,5],["k",38,32],["k",38,62],["k",62,32],["k",62,62],["a",50,65,"A"],["d",50,45,"V"],["dr",[[50,62],[46,52]]],["l",[[46,52],[56,44],[53,36]]],["w",[[53,35],[45,6]]]] }
},
{
  id: "ia-wurffinte", titel: "Wurffinte und Durchbruch gegen offensiven Verteidiger", phase: "haupt",
  ziele: { ia: 3, wt: 2 }, rtk: ["Individuelles Angriffsspiel", "Positionsspezifisches Angriffsspiel"],
  dauer: [10, 15, 20], spieler: [6, 20], tw: 1, flaeche: "halb", baelle: "mittel", material: [], intens: 2, harz: false,
  kurz: "Aus dem Rückraum mit Wurfauftakt den heraustretenden Verteidiger binden, dann durchbrechen oder werfen.",
  aufbau: "Zwei Reihen Rückraum (RL, RR) mit Bällen, je ein Verteidiger auf 9 m. Zuspieler auf RM.",
  ablauf: [
    "RM passt zum RL, der im Anlauf fängt und einen deutlichen Wurfauftakt zeigt.",
    "Tritt der Verteidiger heraus: Durchbruch an der Wurfarmseite oder Gegenseite.",
    "Bleibt der Verteidiger stehen: Sprungwurf über ihn.",
    "Verteidiger entscheidet frei – Angreifer liest und reagiert.",
    "Seitenwechsel nach 6 Aktionen."
  ],
  coaching: ["Wurfauftakt muss echt aussehen – Ball hoch, Blick zum Tor.", "Entscheidung erst nach der Reaktion des Verteidigers.", "Durchbruch nicht zur Seitenlinie, sondern Richtung Tor."],
  fehler: ["Finte und Durchbruch vorher festgelegt", "Ball beim Durchbruch ungeschützt"],
  leichter: "Verteidiger reagiert nach Ansage.",
  schwerer: "Zweiter Verteidiger hilft auf 6 m.",
  quelle: { art: EIGEN, ...Q.RTK_IA },
  g: { f: "halb", e: [["tw",50,5],["a",50,60,"RM"],["a",24,56,"RL"],["d",28,44,""],["p",[[47,59],[27,56]]],["l",[[24,53],[22,46],[34,34]]],["w",[[34,33],[46,6]]]] }
},
{
  id: "ia-sprungwurf-serie", titel: "Sprungwurfserie aus dem Rückraum nach Stoßbewegung", phase: "haupt",
  ziele: { ia: 2, wt: 3, at: 1 }, rtk: ["Individuelles Angriffsspiel", "Torwartspiel"],
  dauer: [10, 12, 15], spieler: [6, 20], tw: 1, flaeche: "halb", baelle: "viel", material: ["Hütchen"], intens: 2, harz: false,
  kurz: "Hohe Wurfanzahl: Stoßen auf eine Hütchenlücke, Sprungwurf über ein Hindernis. Trainiert Wurftechnik und Torhüter zugleich.",
  aufbau: "Zwei Reihen auf RL und RR mit Bällen. Hütchen-Tor auf ca. 10 m. Zuspieler auf RM.",
  ablauf: [
    "RL passt zum RM und startet, RM spielt zurück in den Lauf.",
    "RL stößt durch das Hütchentor und springt ab der 9-m-Linie zum Sprungwurf.",
    "Dann Gegenseite (RR).",
    "Torhüter: nach jedem Wurf zurück in die Grundstellung.",
    "Pro Spieler 8–10 Würfe, dann kurze Pause."
  ],
  coaching: ["Absprung mit dem Gegenbein zum Wurfarm, Knie zieht nach oben.", "Wurfarm früh hoch, Ellbogen über Schulterhöhe.", "Ziel vorher wählen, Torhüter beobachten."],
  fehler: ["Absprung nach vorn statt nach oben", "Wurf aus der Seite (Ellbogen tief)"],
  leichter: "Würfe aus dem Stand (Schlagwurf).",
  schwerer: "Passiver Verteidiger mit hochgestreckten Armen auf 8 m.",
  quelle: { art: EIGEN, ...Q.RTK_IA },
  g: { f: "halb", e: [["tw",50,5],["a",22,58,"RL"],["a",50,62,"RM"],["a",78,58,"RR"],["k",26,50],["k",34,50],["p",[[25,58],[47,62]]],["p",[[47,60],[30,52]]],["l",[[22,55],[30,47],[34,44]]],["w",[[34,43],[44,6]]]] }
},
{
  id: "ia-wurfvielfalt", titel: "Wurfvielfalt: Schlagwurf, Hüftwurf, Knickwurf", phase: "haupt",
  ziele: { ia: 2, wt: 3 }, rtk: ["Individuelles Angriffsspiel", "Torwartspiel"],
  dauer: [10, 12, 15], spieler: [4, 20], tw: 1, flaeche: "halb", baelle: "viel", material: ["Hütchen"], intens: 2, harz: true,
  kurz: "Unterschiedliche Wurfarten an Stationen. Erweitert das Repertoire gegen große Torhüter.",
  aufbau: "Drei Stationen vor dem Tor (RL-Bereich, RM, RR). Pro Station ein Wurfthema.",
  ablauf: [
    "Station 1 (Mitte): Schlagwurf aus dem Stand mit Stemmschritt, Ziel untere Ecken.",
    "Station 2 (RL): Hüftwurf – Wurf seitlich an der Hüfte vorbei unter dem Verteidigerarm.",
    "Station 3 (RR): Knickwurf aus dem Sprung (Ellbogen bleibt hoch, Handgelenk knickt den Ball).",
    "Wechsel nach je 6 Würfen.",
    "Torhüter wechseln sich ab oder es wird nacheinander geworfen."
  ],
  coaching: ["Jede Wurfart sauber vorzeigen (Trainer oder älterer Spieler).", "Die Wurfauswahl hängt vom Torhüter und Verteidiger ab – darüber sprechen.", "Bei Harzverbot: Fingerspitzenkontrolle betonen, Dreher weglassen."],
  fehler: ["Zu viele Würfe mit voller Kraft", "Hüftwurf mit hängendem Ellbogen"],
  leichter: "Ohne Torhüter auf Zielflächen (Matten, Reifen).",
  schwerer: "Torhüter ruft kurz vor dem Wurf die Ecke, die nicht getroffen werden darf.",
  quelle: { art: EIGEN, ...Q.RTK_IA },
  g: { f: "halb", e: [["tw",50,5],["a",30,52,"2"],["a",50,55,"1"],["a",70,52,"3"],["w",[[50,52],[44,6]]],["w",[[30,50],[56,6]]],["w",[[70,50],[44,8]]]] }
},
{
  id: "ia-aussen", titel: "Außenspiel: Einlaufen und Wurf aus spitzem Winkel", phase: "haupt",
  ziele: { ia: 2, wt: 3 }, rtk: ["Positionsspezifisches Angriffsspiel", "Torwartspiel"],
  dauer: [10, 12, 15], spieler: [4, 16], tw: 1, flaeche: "halb", baelle: "mittel", material: ["Hütchen"], intens: 2, harz: false,
  kurz: "Alle Spieler üben die Außenposition (RTK: noch keine Festlegung auf Positionen). Absprung in den Raum, Wurf mit Winkelvergrößerung.",
  aufbau: "Reihen auf LA und RA. Zuspieler auf RL bzw. RR. Hütchen markiert den Absprungpunkt (ca. 1 m vor dem 6-m-Raum).",
  ablauf: [
    "LA läuft kurz Richtung Mitte an, startet zurück an die Seitenlinie.",
    "Pass vom RL in den Lauf, Annahme im Lauf.",
    "Absprung am Hütchen weit in den Torraum, Wurf flach, lang oder kurz.",
    "Nach dem Wurf: Zuspieler-Position übernehmen.",
    "Gegenseite."
  ],
  coaching: ["Absprung möglichst weit innen, Flugphase nutzen, um den Winkel zu vergrößern.", "Torhüter so lange wie möglich warten lassen – spät entscheiden.", "Landung sicher auf beiden Beinen (Prävention)."],
  fehler: ["Absprung zu nah an der Grundlinie", "Wurf immer in dieselbe Ecke"],
  leichter: "Absprung aus dem Stand.",
  schwerer: "Verteidiger stellt den Außen zu, Ziel: Absprung trotzdem in den Raum.",
  quelle: { art: EIGEN, ...Q.RTK_ZIELE },
  g: { f: "halb", e: [["tw",50,5],["a",6,26,"LA"],["a",24,52,"RL"],["k",18,20],["l",[[8,26],[12,32],[16,22]]],["p",[[24,49],[14,26]]],["w",[[18,18],[53,5]]]] }
},
{
  id: "ia-kreis", titel: "Kreisspiel: Ballannahme unter Bedrängnis und Drehung", phase: "haupt",
  ziele: { ia: 2, ko: 1, wt: 2 }, rtk: ["Positionsspezifisches Angriffsspiel"],
  dauer: [10, 12, 15], spieler: [4, 16], tw: 1, flaeche: "halb", baelle: "mittel", material: [], intens: 2, harz: false,
  kurz: "Kreisläufer behauptet Position gegen einen Verteidiger, nimmt Pass an und dreht zum Wurf ab.",
  aufbau: "Kreisläufer und Verteidiger am 6-m-Raum, Zuspieler auf RL, RM, RR mit Bällen.",
  ablauf: [
    "Kreisläufer arbeitet mit dem Verteidiger am Körper (Körperkontakt, fair).",
    "Zuspieler sucht den Moment, in dem der Kreisläufer frei ist (Handzeichen).",
    "Annahme mit beiden Händen, sofortige Drehung zum Tor (Innen- oder Außendrehung).",
    "Verteidiger arbeitet zunächst halbaktiv, später aktiv.",
    "Alle Spieler wechseln durch – auch große Rückraumspieler lernen Kreis."
  ],
  coaching: ["Breiter Stand, tiefer Schwerpunkt.", "Hände als Ziel anbieten.", "Nach Annahme nicht prellen – direkt drehen."],
  fehler: ["Kreisläufer steht im Torraum", "Pass zu hoch"],
  leichter: "Ohne Verteidiger, nur Annahme und Drehung.",
  schwerer: "Zwei Verteidiger, Kreisläufer muss Sperre stellen und abrollen.",
  quelle: { art: EIGEN, ...Q.RTK_ZIELE },
  g: { f: "halb", e: [["tw",50,5],["a",50,32,"KM"],["d",50,38,""],["a",22,52,"RL"],["a",50,58,"RM"],["a",78,52,"RR"],["p",[[47,56],[50,36]]],["w",[[50,30],[44,6]]]] }
},
{
  id: "ia-tauschung-serie", titel: "Täuschungsrepertoire: drei Finten in Serie", phase: "haupt",
  ziele: { ia: 3, at: 1 }, rtk: ["Individuelles Angriffsspiel"],
  dauer: [8, 12, 15], spieler: [4, 24], tw: 0, flaeche: "drittel", baelle: "mittel", material: ["Hütchen"], intens: 2, harz: false,
  kurz: "Stationsübung ohne Tor: Pro Durchgang drei unterschiedliche Täuschungen gegen Hütchen und passive Verteidiger. Ziel: großes Repertoire statt einer Lieblingsfinte.",
  aufbau: "Bahn mit drei „Gegnern“ im Abstand von 4 m (Hütchen, dann zwei passive Verteidiger). Mehrere Bahnen parallel.",
  ablauf: [
    "Gegner 1 (Hütchen): einfache Körpertäuschung zur Wurfarmseite.",
    "Gegner 2 (passiv): Täuschung zur Gegenseite (Doppeltäuschung).",
    "Gegner 3 (passiv, Arme aktiv): Wurftäuschung und Durchbruch.",
    "Verteidiger rotieren nach 4 Durchgängen."
  ],
  coaching: ["Jede Täuschung anders – der Trainer ruft Wiederholungen ab.", "Ball schützen (Körper zwischen Ball und Gegner).", "Nach der Täuschung immer Richtung Tor (gedachte Linie)."],
  fehler: ["Immer dieselbe Seite", "Langsam nach der Täuschung"],
  leichter: "Nur Hütchen.",
  schwerer: "Verteidiger 3 wird aktiv.",
  quelle: { art: EIGEN, ...Q.RTK_IA },
  g: { f: "frei", e: [["a",8,30,""],["k",30,30],["d",52,30,""],["d",74,30,""],["l",[[12,30],[26,24],[38,36],[48,40],[58,22],[70,22],[80,36],[94,30]]]] }
},

/* ============================ INDIVIDUELL ABWEHR ============================ */
{
  id: "iv-grundstellung", titel: "Abwehr-Grundstellung und Beinarbeit im Spiegelspiel", phase: "haupt",
  ziele: { iv: 3, at: 2 }, rtk: ["Individuelles Abwehrspiel", "Motorik/Athletik"],
  dauer: [8, 10, 12], spieler: [4, 24], tw: 0, flaeche: "drittel", baelle: "wenig", material: ["Hütchen"], intens: 2, harz: false,
  kurz: "Ein Partner führt, der andere spiegelt die Bewegungen in Abwehrhaltung. Grundlage für jede offensive Deckung.",
  aufbau: "Paare gegenüber in einem Feld von 5 × 5 m (Hütchen).",
  ablauf: [
    "A bewegt sich frei (vor, zurück, seitlich), B bleibt in Grundstellung frontal vor A.",
    "20 s Belastung, 20 s Pause, 4 Durchgänge, dann Rollenwechsel.",
    "Steigerung: A hat einen Ball und prellt, B versucht, frontal zu bleiben.",
    "B darf auf Signal einmal den Ball herausspielen."
  ],
  coaching: ["Füße schulterbreit, Knie gebeugt, Gewicht auf den Fußballen.", "Nachstellschritt – Füße kreuzen nicht.", "Arme aktiv, eine Hand Richtung Ball."],
  fehler: ["Aufrichten während der Bewegung", "Überkreuzen der Beine"],
  leichter: "Nur seitliche Bewegungen.",
  schwerer: "Feld vergrößern, längere Belastung.",
  quelle: { art: EIGEN, ...Q.RTK_ZIELE },
  g: { f: "frei", e: [["k",30,10],["k",70,10],["k",30,50],["k",70,50],["a",50,22,"A"],["d",50,38,"B"],["l",[[50,20],[38,15]]],["l",[[50,40],[38,35]]]] }
},
{
  id: "iv-1g1-raum", titel: "1-gegen-1 verteidigen im großen Raum (Breite und Tiefe)", phase: "haupt",
  ziele: { iv: 3, ia: 2, at: 2 }, rtk: ["Individuelles Abwehrspiel"],
  dauer: [10, 15, 20], spieler: [6, 20], tw: 1, flaeche: "halb", baelle: "mittel", material: ["Hütchen"], intens: 3, harz: false,
  kurz: "Die RTK fordert im Grundlagentraining, das 1-gegen-1 in großen Breiten- und Tiefenräumen zu beherrschen. Der Verteidiger startet weit vorn und muss den Angreifer bis zum 6-m-Raum begleiten.",
  aufbau: "Feld ca. 8 m breit zwischen 6 m und 15 m. Verteidiger startet auf 12 m, Angreifer auf 15 m mit Ball.",
  ablauf: [
    "Angreifer versucht mit Prellen und Täuschung zum Torwurf zu kommen.",
    "Verteidiger arbeitet frontal, drängt nach außen ab und versucht den Ball herauszuspielen.",
    "Aktion endet bei Torwurf, Ballgewinn oder Aus.",
    "Rollentausch, Verteidiger geht zur Angreiferreihe.",
    "Punktwertung über 5 Minuten, dann neue Paarungen."
  ],
  coaching: ["Abstand ca. eine Armlänge – nicht anlaufen und vorbeilaufen lassen.", "Angreifer in die ungünstige Wurfposition (nach außen) abdrängen.", "Ball beim Prellen attackieren, wenn er von der Hand weg ist."],
  fehler: ["Verteidiger steht zu tief am 6-m-Raum", "Foul durch Halten statt Beinarbeit"],
  leichter: "Feld schmaler (6 m).",
  schwerer: "Angreifer bekommt einen Zuspieler für einen Doppelpass.",
  quelle: { art: EIGEN, ...Q.RTK_ZIELE },
  g: { f: "halb", e: [["tw",50,5],["k",30,30],["k",70,30],["k",30,75],["k",70,75],["a",50,75,"A"],["d",50,60,"V"],["dr",[[50,72],[58,55],[62,40]]],["l",[[50,58],[60,44]]]] }
},
{
  id: "iv-passwege", titel: "Balleroberung: Passwege lesen und abfangen", phase: "haupt",
  ziele: { iv: 3, te: 2, ma: 1 }, rtk: ["Individuelles Abwehrspiel", "Tempospielangriff/-abwehr"],
  dauer: [10, 12, 15], spieler: [6, 20], tw: 1, flaeche: "halb", baelle: "wenig", material: ["Leibchen"], intens: 3, harz: false,
  kurz: "Drei Angreifer passen sich im Rückraum zu, zwei Verteidiger versuchen, Pässe abzufangen. Nach Ballgewinn sofort Gegenstoß. Kernidee der offensiven C-Jugend-Deckung: Balleroberung.",
  aufbau: "Drei Angreifer auf RL, RM, RR (9–11 m). Zwei Verteidiger auf 8–9 m. Gegenstoßziel: Mittellinie oder Gegentor.",
  ablauf: [
    "Angreifer passen ohne Prellen, nur Bodenkontakt mit beiden Füßen, max. 3 s pro Ballbesitz.",
    "Verteidiger stellen Passwege zu, antizipieren und fangen ab.",
    "Nach Ballgewinn: Gegenstoß über das ganze Feld (ein Pass, Torwurf).",
    "Nach 1 Minute Wechsel der Verteidiger."
  ],
  coaching: ["Zwischen Ball und Gegenspieler stehen, mit Blick auf beide.", "Den Pass „anbieten“ und dann abfangen (Antizipation).", "Nach Ballgewinn ist der erste Gedanke: nach vorn."],
  fehler: ["Spekulatives Herauslaufen ohne Absicherung", "Nach Ballgewinn stehen bleiben"],
  leichter: "Angreifer passen nur im Stand.",
  schwerer: "Vier Angreifer gegen drei Verteidiger.",
  quelle: { art: EIGEN, ...Q.BHV },
  g: { f: "halb", e: [["tw",50,5],["a",22,56,"RL"],["a",50,62,"RM"],["a",78,56,"RR"],["d",36,48,""],["d",64,48,""],["p",[[47,61],[25,57]]],["l",[[36,48],[38,58]]],["l",[[40,62],[50,95]]],["t",50,92,"Gegenstoß"]] }
},
{
  id: "iv-heraustreten", titel: "Heraustreten und Zurückziehen in der Tiefe", phase: "haupt",
  ziele: { iv: 3, ma: 1, at: 2 }, rtk: ["Individuelles Abwehrspiel", "Kooperatives Abwehrspiel"],
  dauer: [8, 10, 15], spieler: [4, 20], tw: 0, flaeche: "halb", baelle: "wenig", material: ["Hütchen"], intens: 3, harz: false,
  kurz: "Verteidiger tritt dem Ballbesitzer entgegen und zieht sich beim Abspiel zurück. Typische Grundbewegung für 3:3 und 1:5.",
  aufbau: "Zwei Angreifer auf 10 m, ein Verteidiger zwischen 6 m und 9 m. Mehrere Gruppen nebeneinander.",
  ablauf: [
    "Angreifer A hat den Ball: Verteidiger tritt heraus bis auf eine Armlänge, Arm Richtung Ball.",
    "A passt zu B: Verteidiger zieht sich schräg zurück und tritt B entgegen.",
    "Erst langsam im Passrhythmus, dann Spieltempo.",
    "30 s Belastung, 30 s Pause, 4 Durchgänge."
  ],
  coaching: ["Heraustreten in Richtung Wurfarm des Angreifers.", "Zurückziehen im Rückwärts-Seitwärtsschritt, nicht umdrehen.", "Füße immer in Bewegung."],
  fehler: ["Zu spät herausgetreten", "Stehenbleiben nach dem Pass"],
  leichter: "Angreifer passen langsam mit Ansage.",
  schwerer: "Dritter Angreifer, Verteidiger muss zwischen zwei Räumen entscheiden.",
  quelle: { art: EIGEN, ...Q.RTK_ZIELE },
  g: { f: "halb", e: [["a",30,55,"A"],["a",70,55,"B"],["d",40,40,""],["p",[[33,55],[67,55]]],["l",[[40,40],[50,34],[60,42]]],["k",30,30],["k",70,30]] }
},
{
  id: "iv-kreisverteidigung", titel: "Kreisläufer verteidigen: Vorlaufen und Abdrängen", phase: "haupt",
  ziele: { iv: 3, ko: 1 }, rtk: ["Individuelles Abwehrspiel"],
  dauer: [8, 10, 12], spieler: [4, 16], tw: 1, flaeche: "halb", baelle: "mittel", material: [], intens: 2, harz: false,
  kurz: "Verteidiger hält den Kreisläufer vom Ball fern, indem er auf der Ballseite vorläuft.",
  aufbau: "Kreisläufer und Verteidiger am 6-m-Raum, zwei Zuspieler auf RL und RR.",
  ablauf: [
    "Zuspieler passen sich den Ball zu, Kreisläufer bewegt sich mit.",
    "Verteidiger bleibt immer auf der Ballseite des Kreisläufers (vorlaufen).",
    "Zuspieler darf jederzeit zum Kreis passen, wenn eine Lücke entsteht.",
    "Nach 45 s Rollenwechsel."
  ],
  coaching: ["Körperkontakt halten, Hände sichtbar (keine Fouls).", "Blick auf Ball und Gegenspieler.", "Kreisläufer nach außen drängen."],
  fehler: ["Hinter dem Kreisläufer stehen", "Klammern"],
  leichter: "Langsamer Passrhythmus.",
  schwerer: "Dritter Zuspieler auf RM.",
  quelle: { art: EIGEN, ...Q.RTK_ZIELE },
  g: { f: "halb", e: [["tw",50,5],["a",50,33,"KM"],["d",44,36,""],["a",22,52,"RL"],["a",78,52,"RR"],["p",[[25,52],[75,52]]],["l",[[44,36],[56,36]]]] }
},

/* ============================ KOOPERATION ============================ */
{
  id: "ko-2g1-parallel", titel: "2-gegen-1: Parallelstoß und richtiges Abspiel", phase: "haupt",
  ziele: { ko: 3, ia: 2 }, rtk: ["Kooperatives Angriffsspiel"],
  dauer: [10, 12, 15], spieler: [6, 20], tw: 1, flaeche: "halb", baelle: "mittel", material: [], intens: 2, harz: false,
  kurz: "Zwei Angreifer gegen einen Verteidiger: Der Ballbesitzer stößt in den Verteidiger und spielt den freien Mitspieler an. Grundform des Zusammenspiels mit dem Nachbarn.",
  aufbau: "Zwei Reihen auf RL und RM, ein Verteidiger auf 8 m in der Mitte zwischen beiden.",
  ablauf: [
    "RL stößt mit Ball auf den Verteidiger zu.",
    "Nimmt der Verteidiger RL an: Pass zu RM, der parallel mitgestoßen ist und wirft.",
    "Bleibt der Verteidiger bei RM: RL wirft selbst.",
    "Danach Seitenwechsel (RM–RR).",
    "Verteidiger wechselt nach 5 Aktionen."
  ],
  coaching: ["Stoßen in die Lücke, nicht nach außen weglaufen.", "Mitspieler läuft parallel und tief – nicht auf Höhe des Ballbesitzers stehen bleiben.", "Pass erst, wenn der Verteidiger festgemacht ist."],
  fehler: ["Pass zu früh", "Zweiter Angreifer wartet im Stand"],
  leichter: "Verteidiger entscheidet nach Ansage.",
  schwerer: "3-gegen-2 mit zweitem Verteidiger.",
  quelle: { art: EIGEN, ...Q.RTK_ZIELE },
  g: { f: "halb", e: [["tw",50,5],["a",30,58,"RL"],["a",54,62,"RM"],["d",42,44,""],["dr",[[30,55],[38,46]]],["l",[[54,59],[52,44]]],["p",[[38,46],[52,45]]],["w",[[52,42],[46,6]]]] }
},
{
  id: "ko-kreuzen", titel: "Kreuzen Rückraum: Grundform und Weiterspielen", phase: "haupt",
  ziele: { ko: 3, ma: 1, ia: 1 }, rtk: ["Kooperatives Angriffsspiel"],
  dauer: [12, 15, 20], spieler: [6, 20], tw: 1, flaeche: "halb", baelle: "mittel", material: [], intens: 2, harz: false,
  kurz: "RM kreuzt mit RL hinter dessen Rücken. Gegen offensive Abwehr entsteht so Tiefe und Entscheidungsdruck für die Verteidiger.",
  aufbau: "Reihen auf RL, RM, RR. Zunächst ohne, dann mit zwei Verteidigern.",
  ablauf: [
    "RM prellt diagonal Richtung RL-Raum.",
    "RL läuft hinter RM vorbei in die Mitte und bekommt den Ball übergeben (kurzer Pass).",
    "RL wirft oder spielt weiter zu RR.",
    "Mit zwei Verteidigern: Angreifer lesen, ob die Verteidiger übergeben oder mitlaufen.",
    "Beide Seiten üben (RM–RR)."
  ],
  coaching: ["Der Kreuzende startet erst, wenn der Ballbesitzer an ihm vorbei ist – Timing.", "Kurzer, harter Pass auf Hüfthöhe.", "Ballbesitzer muss selbst gefährlich sein (Richtung Tor), sonst reagiert die Abwehr nicht."],
  fehler: ["Kreuzen parallel zur 9-m-Linie ohne Torgefahr", "Zu großer Abstand"],
  leichter: "Ohne Verteidiger, nur Laufwege.",
  schwerer: "Fortsetzung mit Pass zum Kreisläufer, der eine Sperre stellt.",
  quelle: { art: EIGEN, ...Q.RTK_ZIELE },
  g: { f: "halb", e: [["tw",50,5],["a",50,60,"RM"],["a",24,56,"RL"],["a",78,56,"RR"],["dr",[[50,57],[36,48]]],["l",[[24,53],[40,52],[52,44]]],["p",[[36,48],[48,46]]],["w",[[52,42],[54,6]]]] }
},
{
  id: "ko-sperre-absetzen", titel: "Sperre und Absetzen mit dem Kreisläufer (2-gegen-2)", phase: "haupt",
  ziele: { ko: 3, ia: 1, wt: 1 }, rtk: ["Kooperatives Angriffsspiel"],
  dauer: [12, 15, 20], spieler: [6, 16], tw: 1, flaeche: "halb", baelle: "mittel", material: [], intens: 2, harz: false,
  kurz: "Rückraumspieler und Kreisläufer gegen zwei Verteidiger. Der Kreisläufer sperrt, der Rückraum geht durch oder spielt den sich absetzenden Kreisläufer an.",
  aufbau: "Rückraumspieler (RM) und Kreisläufer gegen zwei Verteidiger in einem Raum von ca. 8 m Breite.",
  ablauf: [
    "Kreisläufer stellt eine Sperre seitlich am Verteidiger des Rückraumspielers.",
    "RM nutzt die Sperre und geht an ihr vorbei zum Wurf.",
    "Übernimmt der zweite Verteidiger: Kreisläufer dreht sich ab (Absetzen) und bekommt den Ball.",
    "5 Aktionen, dann Wechsel der Rollen."
  ],
  coaching: ["Sperre: breit, stabil, ohne Arme zu benutzen.", "Ballbesitzer läuft eng an der Sperre vorbei.", "Kreisläufer dreht sich zum Ball, Hände als Ziel."],
  fehler: ["Laufende Sperre (Stürmerfoul)", "Ballbesitzer läuft zu weit weg"],
  leichter: "Passive Verteidiger.",
  schwerer: "3-gegen-3 mit Außen.",
  quelle: { art: EIGEN, ...Q.RTK_ZIELE },
  g: { f: "halb", e: [["tw",50,5],["a",50,58,"RM"],["a",58,34,"KM"],["d",50,46,""],["d",58,38,""],["l",[[58,34],[54,44]]],["dr",[[50,55],[42,46],[44,36]]],["w",[[44,34],[50,6]]]] }
},
{
  id: "ko-uebergang", titel: "Übergang: Außen läuft zum Kreis ein", phase: "haupt",
  ziele: { ko: 3, ma: 2 }, rtk: ["Kooperatives Angriffsspiel", "Kollektives Angriffsspiel"],
  dauer: [10, 15, 20], spieler: [8, 20], tw: 1, flaeche: "halb", baelle: "mittel", material: [], intens: 2, harz: false,
  kurz: "Der Außenspieler läuft zum zweiten Kreisläufer ein. Gegen offensive Abwehrformen erzeugt das Überzahl am Kreis.",
  aufbau: "Angreifer auf LA, RL, RM. Zwei bis drei Verteidiger.",
  ablauf: [
    "RM spielt zu RL, LA startet Richtung Kreis zwischen den Verteidigern.",
    "RL bindet seinen Verteidiger und spielt LA am Kreis an oder wirft selbst.",
    "Nächste Gruppe auf der anderen Seite (RA läuft ein).",
    "Später gegen 3:3-Abwehr mit vier Verteidigern."
  ],
  coaching: ["Einläufer startet, wenn der Ball beim Nachbarn ist.", "Einlaufweg hinter dem Verteidiger, nicht vor ihm.", "Rückraum muss zuerst selbst Torgefahr erzeugen."],
  fehler: ["Einlaufen zu früh", "Der Platz auf Außen bleibt leer ohne Absprache"],
  leichter: "Ohne Verteidiger.",
  schwerer: "Gegen aktive 3:3-Abwehr mit freiem Weiterspielen.",
  quelle: { art: EIGEN, ...Q.RTK_ZIELE },
  g: { f: "halb", e: [["tw",50,5],["a",8,16,"LA"],["a",24,54,"RL"],["a",50,60,"RM"],["d",22,30,""],["d",34,44,""],["l",[[10,18],[24,26],[38,32]]],["p",[[47,59],[27,55]]],["p",[[26,51],[37,34]]]] }
},
{
  id: "ko-helfen-sichern", titel: "Abwehrkooperation: Helfen und Sichern (2-gegen-2/3-gegen-3)", phase: "haupt",
  ziele: { iv: 2, ko: 3, ma: 2 }, rtk: ["Kooperatives Abwehrspiel"],
  dauer: [12, 15, 20], spieler: [6, 20], tw: 1, flaeche: "halb", baelle: "wenig", material: ["Leibchen"], intens: 3, harz: false,
  kurz: "Zwei bzw. drei Verteidiger arbeiten zusammen: Einer greift an, der Nachbar sichert den Raum dahinter.",
  aufbau: "Zwei Angreifer (RL, RM) gegen zwei Verteidiger, später 3-gegen-3 mit Kreisläufer.",
  ablauf: [
    "Angreifer spielen frei 2-gegen-2 mit Ziel Torwurf.",
    "Verteidiger am Ball tritt heraus, der Nachbar rückt nach innen und sichert (helfen).",
    "Nach Pass wechseln die Rollen: Der vorherige Helfer tritt heraus.",
    "Erweiterung: Kreisläufer und dritter Verteidiger – Übergeben/Übernehmen üben."
  ],
  coaching: ["Laut kommunizieren: „Ich hab ihn“, „Hilfe“.", "Helfer steht zwischen Ball und Tor, nicht auf Höhe des Partners.", "Nach Hilfe schnell zurück zum eigenen Gegenspieler."],
  fehler: ["Beide greifen gleichzeitig an", "Keine Absprache"],
  leichter: "Angreifer dürfen nicht prellen.",
  schwerer: "3-gegen-3 mit Kreuzen der Angreifer.",
  quelle: { art: EIGEN, ...Q.RTK_ZIELE },
  g: { f: "halb", e: [["tw",50,5],["a",28,56,"RL"],["a",56,60,"RM"],["d",32,44,"1"],["d",52,38,"2"],["l",[[52,38],[44,34]]],["t",72,36,"Sichern"]] }
},
{
  id: "ko-3g3-seite", titel: "3-gegen-3 auf einer Seite (Rückraum, Außen, Kreis)", phase: "haupt",
  ziele: { ko: 3, ia: 1, iv: 1, ma: 1 }, rtk: ["Kooperatives Angriffsspiel", "Kooperatives Abwehrspiel"],
  dauer: [12, 15, 20], spieler: [8, 20], tw: 1, flaeche: "halb", baelle: "wenig", material: ["Leibchen"], intens: 3, harz: false,
  kurz: "Freies Spiel auf einer Angriffsseite mit drei Positionen. Verbindet Parallelstoß, Übergang und Kreisanspiel unter echtem Gegnerdruck.",
  aufbau: "Halbe Spielfeldbreite (LA, RL, KM gegen drei Verteidiger). Zwei Gruppen im Wechsel.",
  ablauf: [
    "Angriff spielt frei bis zum Torwurf, maximal 30 s.",
    "Abwehr verteidigt offensiv (Vorgabe C-Jugend) und versucht, den Ball zu erobern.",
    "Nach Ballgewinn: Abwehr wird zum Angriff mit Gegenstoß auf das andere Tor (wenn ganze Halle verfügbar).",
    "Wechsel nach 4 Angriffen."
  ],
  coaching: ["Angriff: erst Breite (Außen bleibt außen), dann Tiefe.", "Abwehr: Ballseite stark machen, Kreis sichern.", "Trainer friert Situationen ein und fragt nach Lösungen („Was siehst du?“)."],
  fehler: ["Alle drei Angreifer im selben Raum", "Abwehr zieht sich auf 6 m zurück"],
  leichter: "Joker auf RM, der nur passen darf.",
  schwerer: "Aktion muss in 15 s abgeschlossen sein.",
  quelle: { art: EIGEN, ...Q.RTK_ZIELE },
  g: { f: "halb", e: [["tw",50,5],["a",8,16,"LA"],["a",28,56,"RL"],["a",36,34,"KM"],["d",14,24,""],["d",30,44,""],["d",40,36,""],["k",55,30],["k",55,75],["t",76,55,"Hälfte frei"]] }
},

/* ============================ MANNSCHAFTSTAKTIK ============================ */
{
  id: "ma-33-grundform", titel: "3:3-Abwehr: Grundformation und Verschieben", phase: "haupt",
  ziele: { ma: 3, iv: 2 }, rtk: ["Kollektives Abwehrspiel", "Kooperatives Abwehrspiel"],
  dauer: [15, 20, 25], spieler: [12, 20], tw: 1, flaeche: "halb", baelle: "wenig", material: ["Hütchen"], intens: 2, harz: false,
  kurz: "Zweilinien-Abwehr mit drei vorderen und drei hinteren Verteidigern. In der C-Jugend ausdrücklich zulässig (offensive Deckung ist Pflicht).",
  aufbau: "Sechs Verteidiger: vorne auf ca. 9–10 m (links, Mitte, rechts), hinten am 6-m-Raum. Sechs Angreifer passen um die Abwehr.",
  ablauf: [
    "Phase 1 (ohne Gegnerdruck): Angreifer passen langsam, Abwehr verschiebt ballorientiert.",
    "Vordere Reihe: Ballseite tritt heraus, die anderen sichern nach innen.",
    "Hintere Reihe: verschiebt zur Ballseite, Kreisläufer wird übergeben.",
    "Phase 2: Angreifer dürfen nach 4 Pässen frei angreifen.",
    "Phase 3: Spiel 6-gegen-6 mit Wertung (Ballgewinn = 1 Punkt für die Abwehr)."
  ],
  coaching: ["Abstände halten: keine Lücke größer als 2 m.", "Der vordere Mittelspieler steuert und spricht.", "Nach Ballgewinn sofort Gegenstoß – die Abwehr ist der Startpunkt fürs Tempospiel."],
  fehler: ["Vordere Reihe zieht sich auf 6 m zurück", "Kreisläufer wird nicht übergeben"],
  leichter: "Nur vordere Reihe gegen drei Rückraumspieler.",
  schwerer: "Angreifer spielen Kreuzen und Übergänge.",
  quelle: { art: EIGEN, ...Q.BHV },
  g: { f: "halb", e: [["tw",50,5],["d",26,48,""],["d",50,50,""],["d",74,48,""],["d",18,30,""],["d",50,33,""],["d",82,30,""],["a",8,14,"LA"],["a",22,60,"RL"],["a",50,66,"RM"],["a",78,60,"RR"],["a",92,14,"RA"],["a",64,37,"KM"],["p",[[47,65],[25,61]]],["l",[[26,48],[23,54]]]] }
},
{
  id: "ma-15-grundform", titel: "1:5-Abwehr: vorgezogener Spieler und Raumdeckung", phase: "haupt",
  ziele: { ma: 3, iv: 2 }, rtk: ["Kollektives Abwehrspiel"],
  dauer: [15, 20, 25], spieler: [12, 20], tw: 1, flaeche: "halb", baelle: "wenig", material: ["Hütchen"], intens: 2, harz: false,
  kurz: "Fünf Verteidiger in einer Linie, einer vorgezogen. Die RTK nennt die 1:5 als erste Raumdeckung im Grundlagentraining; sie zählt zu den in der C-Jugend erlaubten offensiven Formen.",
  aufbau: "Fünf Verteidiger am 6-m-Raum, einer auf ca. 9 m vor dem RM. Sechs Angreifer.",
  ablauf: [
    "Vorgezogener stört RM und Passwege zur Mitte.",
    "Die hinteren fünf treten ballorientiert heraus (bis 8 m) und ziehen sich zurück.",
    "Erst langsames Passen, dann Spieltempo.",
    "Spiel 6-gegen-6 mit Aufgabe: Vorgezogener erobert den Ball = 2 Punkte."
  ],
  coaching: ["Hintere Reihe tritt mutig heraus – keine passive 6:0 (in der C-Jugend unterhalb der Regionalliga nicht erlaubt).", "Vorgezogener bleibt immer zwischen Ball und RM.", "Nachbarn sichern beim Heraustreten nach innen."],
  fehler: ["Hintere Reihe bleibt auf 6 m (Regelverstoß droht)", "Vorgezogener läuft dem Ball hinterher"],
  leichter: "Angreifer passen nur im Stand.",
  schwerer: "Zwei Kreisläufer im Angriff.",
  quelle: { art: EIGEN, ...Q.RTK_ZIELE },
  g: { f: "halb", e: [["tw",50,5],["d",12,22,""],["d",30,34,""],["d",50,36,""],["d",70,34,""],["d",88,22,""],["d",50,50,"V"],["a",8,12,"LA"],["a",22,58,"RL"],["a",50,64,"RM"],["a",78,58,"RR"],["a",92,12,"RA"],["a",40,40,"KM"]] }
},
{
  id: "ma-321", titel: "3:2:1-Abwehr für Fortgeschrittene", phase: "haupt",
  ziele: { ma: 3, iv: 1, ko: 1 }, rtk: ["Kollektives Abwehrspiel"],
  dauer: [15, 20, 25], spieler: [12, 20], tw: 1, flaeche: "halb", baelle: "wenig", material: ["Hütchen"], intens: 2, harz: false,
  kurz: "Dreilinienabwehr mit ballbezogenem Verteidigen (Helfen, Sichern, Übergeben). Laut RTK für fortgeschrittene Teams im Grundlagentraining.",
  aufbau: "Hinten drei Verteidiger, davor zwei Halbverteidiger auf ca. 8 m, ein vorgezogener auf ca. 10 m.",
  ablauf: [
    "Positionen mit Hütchen markieren, langsames Verschieben gegen passende Angreifer.",
    "Halbverteidiger attackieren Rückraum außen, Vorgezogener stört RM.",
    "Kreisläufer wird zwischen den Linien übergeben.",
    "6-gegen-6 mit Aufgabe: Angreifer müssen 5 Pässe spielen, bevor sie werfen dürfen."
  ],
  coaching: ["Jeder kennt seinen Raum und seinen Partner für Übergaben.", "Kurze Ansagen: „Kreis kommt“, „Übernehme“.", "Ruhe bewahren, Fehler gehören zum Lernen."],
  fehler: ["Lücke zwischen Halbverteidiger und Außen", "Vorgezogener zu tief"],
  leichter: "Nur Rückraum-Angriff ohne Kreisläufer.",
  schwerer: "Angreifer spielen Kreuzen und Einläufer.",
  quelle: { art: EIGEN, ...Q.RTK_WETT },
  g: { f: "halb", e: [["tw",50,5],["d",14,24,""],["d",50,34,""],["d",86,24,""],["d",30,44,""],["d",70,44,""],["d",50,54,""],["a",22,62,"RL"],["a",50,68,"RM"],["a",78,62,"RR"]] }
},
{
  id: "ma-angriff-offensiv", titel: "Angriff gegen offensive Abwehr: Tiefe schaffen", phase: "haupt",
  ziele: { ma: 3, ko: 2, ia: 1 }, rtk: ["Kollektives Angriffsspiel"],
  dauer: [15, 20, 25], spieler: [12, 20], tw: 1, flaeche: "halb", baelle: "wenig", material: ["Leibchen"], intens: 2, harz: false,
  kurz: "Weil in der C-Jugend alle Gegner offensiv decken müssen, ist das der wichtigste Angriffsinhalt: Räume hinter der vorderen Abwehrreihe nutzen.",
  aufbau: "Sechs Angreifer gegen sechs Verteidiger (3:3 oder 1:5). Zuerst mit Vorgaben, dann frei.",
  ablauf: [
    "Angriff steht tiefer als gewohnt (Rückraum auf 11–12 m), um Laufraum zu haben.",
    "Prinzip 1: Ballbesitzer stößt in die Lücke, nicht auf den Verteidiger.",
    "Prinzip 2: Einläufer in den Raum hinter der vorderen Reihe.",
    "Prinzip 3: Pässe kurz und schnell, wenig Prellen (Prellen = Ballverlustrisiko gegen aktive Abwehr).",
    "Spiel 6-gegen-6 mit Wertung: Tor nach Anspiel in den Rückraum der Abwehr = 2 Punkte."
  ],
  coaching: ["Tiefe vor Breite: Wer hinter die erste Reihe kommt, hat meist freie Bahn.", "Freilaufen gegen Mann-orientierte Verteidiger: Tempowechsel, Richtungswechsel.", "Ruhig bleiben bei Ballverlust – sofort umschalten."],
  fehler: ["Angreifer laufen sich an der vorderen Reihe fest", "Zu viel Prellen"],
  leichter: "Abwehr spielt halbaktiv.",
  schwerer: "Abwehr wechselt auf Zeichen zwischen 3:3 und Manndeckung.",
  quelle: { art: EIGEN, ...Q.BHV },
  g: { f: "halb", e: [["tw",50,5],["d",26,48,""],["d",50,50,""],["d",74,48,""],["d",18,30,""],["d",50,33,""],["d",82,30,""],["a",22,64,"RL"],["a",50,70,"RM"],["a",78,64,"RR"],["a",8,14,"LA"],["l",[[50,67],[40,42]]],["p",[[25,63],[40,42]]],["t",50,90,"Rückraum tief starten"]] }
},
{
  id: "ma-positionsangriff", titel: "Positionsangriff 6-gegen-6: Breite, Tiefe, freie Entscheidungen", phase: "haupt",
  ziele: { ma: 3, ko: 2 }, rtk: ["Kollektives Angriffsspiel", "Positionsspezifisches Angriffsspiel"],
  dauer: [15, 20, 25], spieler: [12, 20], tw: 1, flaeche: "halb", baelle: "wenig", material: ["Leibchen"], intens: 2, harz: false,
  kurz: "Strukturierte Spielweise im Positionsangriff mit Raumaufteilung. Die RTK betont freies, kreatives Spiel statt fester Spielzüge.",
  aufbau: "6-gegen-6 auf ein Tor. Positionen wechseln alle 5 Angriffe (alle spielen alle Positionen).",
  ablauf: [
    "Aufbauphase: Ball läuft einmal durch alle Rückraumpositionen, Außen bleiben breit.",
    "Abschlussphase: Ein Spieler startet eine Aktion (Stoßen, Kreuzen, Einlaufen) – die anderen reagieren.",
    "Trainer gibt nur Prinzipien vor, keine Spielzüge.",
    "Nach jedem Angriff 10 s Kurzfeedback: Was hat funktioniert?"
  ],
  coaching: ["Breite halten: Außen bis an die Seitenlinie.", "Nach jedem Pass in Bewegung bleiben.", "Positionswechsel bewusst nutzen – RTK: noch keine Festlegung auf eine Position."],
  fehler: ["Stehender Angriff", "Immer derselbe Spieler schließt ab"],
  leichter: "Abwehr mit 5 Spielern.",
  schwerer: "Zeitlimit 25 s pro Angriff.",
  quelle: { art: EIGEN, ...Q.RTK_GT },
  g: { f: "halb", e: [["tw",50,5],["a",8,14,"LA"],["a",22,58,"RL"],["a",50,64,"RM"],["a",78,58,"RR"],["a",92,14,"RA"],["a",50,36,"KM"],["p",[[25,58],[47,63]]],["p",[[53,63],[75,58]]]] }
},
{
  id: "ma-unterzahl", titel: "Über- und Unterzahl bei Hinausstellung", phase: "haupt",
  ziele: { ma: 3, ko: 1 }, rtk: ["Kollektives Angriffsspiel", "Kollektives Abwehrspiel"],
  dauer: [10, 15, 20], spieler: [11, 20], tw: 1, flaeche: "halb", baelle: "wenig", material: ["Leibchen"], intens: 2, harz: false,
  kurz: "6-gegen-5 und 5-gegen-6. Nach BHV-Bestimmungen entfällt die Pflicht zur offensiven Deckung während einer Hinausstellung.",
  aufbau: "Sechs Angreifer gegen fünf Verteidiger, dann umgekehrt.",
  ablauf: [
    "Überzahl: Ball schnell über alle Positionen laufen lassen, bis die Lücke entsteht (meist auf Außen).",
    "Unterzahl: Abwehr kompakt in der Mitte, Außen dürfen frei werfen (bewusst geringeres Risiko).",
    "Wertung: Überzahl muss in 40 s ein Tor erzielen.",
    "Rollentausch nach 4 Angriffen."
  ],
  coaching: ["Überzahl: Geduld, Breite, nicht zu früh werfen.", "Unterzahl: Zeit gewinnen, Wurf von außen erzwingen.", "Nach der Hinausstellung wieder offensiv decken – Regel beachten."],
  fehler: ["Hektischer Wurf in Überzahl", "Unterzahl-Abwehr zu breit"],
  leichter: "Überzahl mit zwei Spielern mehr.",
  schwerer: "Zeit kürzen auf 30 s.",
  quelle: { art: EIGEN, ...Q.BHV },
  g: { f: "halb", e: [["tw",50,5],["d",22,30,""],["d",40,36,""],["d",60,36,""],["d",78,30,""],["d",50,48,""],["a",8,14,"LA"],["a",22,58,"RL"],["a",50,64,"RM"],["a",78,58,"RR"],["a",92,14,"RA"],["a",50,40,"KM"],["p",[[81,56],[90,18]]]] }
},

/* ============================ TEMPOSPIEL / UMSCHALTEN ============================ */
{
  id: "te-gegenstoss-32", titel: "Gegenstoß 1. und 2. Welle: 3-gegen-2", phase: "haupt",
  ziele: { te: 3, ko: 2, at: 2 }, rtk: ["Tempospielangriff/-abwehr"],
  dauer: [10, 15, 20], spieler: [8, 20], tw: 1, flaeche: "ganz", baelle: "mittel", material: [], intens: 3, harz: false,
  kurz: "Nach Torwurf oder Ballgewinn laufen drei Angreifer gegen zwei zurücklaufende Verteidiger. Die RTK fordert Gegenstöße über Kleingruppen und Kurzpässe.",
  aufbau: "Ganze Halle. Drei Reihen an der Grundlinie (links, Mitte, rechts), zwei Verteidiger an der Mittellinie. Mit nur einem Torhüter: auf das Tor mit Torhüter abschließen, am anderen Tor auf eine Zielfläche (Matte, Hütchentor) oder nur bis zur Linie.",
  ablauf: [
    "Torhüter startet mit einem Pass auf einen der drei Läufer.",
    "Die drei laufen breit nach vorn und spielen 3-gegen-2 auf das andere Tor.",
    "Die zwei Verteidiger starten an der Mittellinie, sobald der erste Pass gespielt ist.",
    "Nach Abschluss: Die zwei Verteidiger plus ein Angreifer laufen sofort zurück als neue Angreifer (3-gegen-2 in Gegenrichtung).",
    "Fließender Wechsel, 3–4 Minuten am Stück, dann Pause."
  ],
  coaching: ["Breite: Die Außenläufer bleiben an der Seitenlinie.", "Kurze Pässe nach vorn, wenig prellen.", "Abschluss spätestens nach 10 Sekunden."],
  fehler: ["Alle laufen in die Mitte", "Querpässe auf Höhe der Mittellinie"],
  leichter: "3-gegen-1.",
  schwerer: "Dritter Verteidiger läuft verspätet nach (2. Welle).",
  quelle: { art: EIGEN, ...Q.RTK_ZIELE },
  g: { f: "ganz", e: [["tw",50,5],["tw",50,195],["a",15,190,""],["a",50,185,""],["a",85,190,""],["d",35,100,""],["d",65,100,""],["l",[[15,186],[15,60]]],["l",[[85,186],[85,60]]],["p",[[50,182],[52,130],[80,80]]],["w",[[80,60],[54,6]]]] }
},
{
  id: "te-schnelle-mitte", titel: "Schnelle Mitte nach Gegentor", phase: "haupt",
  ziele: { te: 3, ma: 1, at: 1 }, rtk: ["Tempospielangriff/-abwehr"],
  dauer: [10, 12, 15], spieler: [10, 20], tw: 1, flaeche: "ganz", baelle: "wenig", material: [], intens: 3, harz: false,
  kurz: "Nach einem Gegentor wird sofort an der Mittellinie angeworfen, bevor die gegnerische Abwehr formiert ist.",
  aufbau: "Ganze Halle. Angriffsteam (6) auf einem Tor, Abwehrteam (6) im Angriff auf der anderen Seite. Mit nur einem Torhüter: auf das Tor mit Torhüter abschließen, am anderen Tor auf eine Zielfläche (Matte, Hütchentor) oder nur bis zur Linie.",
  ablauf: [
    "Abwehrteam schließt einen Angriff mit Tor ab (Trainer kann ein Tor „schenken“).",
    "Torhüter holt den Ball sofort und passt zum Mittelspieler an der Mittellinie.",
    "Anwurf aus dem Anwurfkreis in der Feldmitte nach Anpfiff, danach schneller Angriff.",
    "Abwehrteam muss nach dem Torwurf sofort zurücklaufen.",
    "Wertung: Tor innerhalb von 10 s nach Anwurf = 2 Punkte."
  ],
  coaching: ["Feste Rollen: Wer holt den Ball, wer läuft zur Mitte?", "Außen laufen sofort breit nach vorn.", "Nicht hektisch: Schnelle Mitte heißt schneller Start, nicht unkontrollierter Wurf."],
  fehler: ["Torhüter wartet zu lange", "Zu viele Spieler warten an der Mitte"],
  leichter: "Abwehrteam läuft erst auf Signal zurück.",
  schwerer: "Abwehrteam darf sofort zurück.",
  quelle: { art: EIGEN, ...Q.RTK_ZIELE },
  g: { f: "ganz", e: [["tw",50,195],["a",50,102,"RM"],["p",[[50,192],[50,106]]],["a",10,110,"LA"],["a",90,110,"RA"],["l",[[10,106],[10,40]]],["l",[[90,106],[90,40]]],["l",[[50,98],[45,60]]],["d",30,40,""],["d",70,40,""]] }
},
{
  id: "te-rueckzug", titel: "Rückzug und Umschalten in die Abwehr", phase: "haupt",
  ziele: { te: 3, iv: 1, at: 2 }, rtk: ["Tempospielangriff/-abwehr"],
  dauer: [10, 12, 15], spieler: [8, 20], tw: 1, flaeche: "ganz", baelle: "wenig", material: [], intens: 3, harz: false,
  kurz: "Nach eigenem Torwurf oder Ballverlust sofort zurücksprinten und den Gegenstoß stoppen. Die RTK nennt das schnelle Zurücklaufen ausdrücklich.",
  aufbau: "Ganze Halle. Vier Angreifer schließen auf Tor A ab, dann wird auf Tor B gekontert. Mit nur einem Torhüter: auf das Tor mit Torhüter abschließen, am anderen Tor auf eine Zielfläche (Matte, Hütchentor) oder nur bis zur Linie.",
  ablauf: [
    "Vier Angreifer spielen gegen zwei passive Verteidiger auf Tor A und werfen.",
    "Torhüter A passt sofort zu drei Konterspielern, die an der Mittellinie warten.",
    "Die vier Angreifer sprinten zurück und versuchen, den Konter zu verhindern (4-gegen-3 im Rückzug).",
    "Wertung: Gegenstoß verhindert = 1 Punkt für das Rückzugsteam."
  ],
  coaching: ["Erst zum eigenen Tor sprinten, dann zum Gegner orientieren.", "Der Spieler, der am nächsten am Ball ist, attackiert den Ballführer.", "Kommunikation: „Ich nehme den Ball!“."],
  fehler: ["Werfer beschwert sich beim Schiedsrichter statt zurückzulaufen", "Rücklauf ohne Blick zum Ball"],
  leichter: "Konterspieler starten mit 2 s Verzögerung.",
  schwerer: "Konterspieler starten sofort.",
  quelle: { art: EIGEN, ...Q.RTK_ZIELE },
  g: { f: "ganz", e: [["tw",50,5],["tw",50,195],["a",30,50,""],["a",70,50,""],["d",40,110,""],["d",50,120,""],["d",60,110,""],["l",[[30,54],[34,160]]],["l",[[70,54],[66,160]]],["p",[[50,8],[48,106]]]] }
},
{
  id: "te-endlos", titel: "Endlos-Gegenstoß 2-gegen-1 im Fluss", phase: "haupt",
  ziele: { te: 3, ko: 2, at: 3 }, rtk: ["Tempospielangriff/-abwehr", "Motorik/Athletik"],
  dauer: [8, 10, 15], spieler: [8, 20], tw: 1, flaeche: "ganz", baelle: "mittel", material: [], intens: 3, harz: false,
  kurz: "Fortlaufende Gegenstöße 2-gegen-1 über das ganze Feld. Hohe Intensität, viele Ballkontakte, schult Pass im Sprint.",
  aufbau: "Ganze Halle. An jedem Ende ein Verteidiger auf 9 m. Paare an der Grundlinie. Mit nur einem Torhüter: auf das Tor mit Torhüter abschließen, am anderen Tor auf eine Zielfläche (Matte, Hütchentor) oder nur bis zur Linie.",
  ablauf: [
    "Paar startet, spielt sich im Sprint den Ball zu und spielt 2-gegen-1 gegen den Verteidiger am anderen Tor.",
    "Nach Abschluss wird der Werfer neuer Verteidiger; der alte Verteidiger stellt sich an.",
    "Nächstes Paar startet, sobald das vorherige die Mittellinie überquert.",
    "3 × 3 Minuten mit 1,5 Minuten Pause."
  ],
  coaching: ["Pass in den Lauf – der Partner verlangsamt nicht.", "Verteidiger zum Ballführer zwingen und dann den Pass abfangen.", "Belastung beachten: im Wachstumsalter lieber kürzer und intensiv."],
  fehler: ["Prellen statt Passen", "Paar läuft zu eng"],
  leichter: "Ohne Verteidiger.",
  schwerer: "3-gegen-2 mit zwei Verteidigern.",
  quelle: { art: EIGEN, ...Q.RTK_ZIELE },
  g: { f: "ganz", e: [["tw",50,5],["tw",50,195],["a",35,185,""],["a",65,185,""],["d",50,50,""],["p",[[37,170],[63,130],[37,90]]],["l",[[35,182],[35,60]]],["l",[[65,182],[65,60]]]] }
},

/* ============================ WURF & TORWART ============================ */
{
  id: "wt-wurf-zeitdruck", titel: "Wurfserie unter Zeitdruck (Rückraum-Wettkampf)", phase: "haupt",
  ziele: { wt: 3, ia: 1, at: 1 }, rtk: ["Individuelles Angriffsspiel", "Torwartspiel"],
  dauer: [8, 10, 12], spieler: [6, 20], tw: 1, flaeche: "halb", baelle: "viel", material: [], intens: 2, harz: false,
  kurz: "Zwei Teams werfen im Wechsel aus dem Rückraum. Wer in 60 s mehr Tore erzielt, gewinnt. Bringt Wettkampfcharakter und viele Würfe.",
  aufbau: "Zwei Teams auf RL und RR, Bälle in Kisten neben den Reihen.",
  ablauf: [
    "Startsignal: Erste Spieler beider Reihen werfen im Wechsel (erst links, dann rechts).",
    "Jeder holt seinen Ball und stellt sich hinten an.",
    "60 s Durchgang, Tore zählen. 3 Durchgänge mit Seitenwechsel.",
    "Torhüter erhalten Punkte für Paraden (eigene Wertung)."
  ],
  coaching: ["Trotz Zeitdruck: Wurfbewegung sauber.", "Wurfziel aussuchen, nicht blind werfen.", "Torhüter: Grundstellung nach jeder Aktion."],
  fehler: ["Würfe ohne Anlauf aus der Hektik", "Gefährdung durch zu dichtes Werfen"],
  leichter: "Wurf aus 7 m.",
  schwerer: "Passiver Verteidiger mit Armen oben.",
  quelle: { art: EIGEN, ...Q.RTK_IA },
  g: { f: "halb", e: [["tw",50,5],["a",24,58,"A"],["a",76,58,"B"],["w",[[26,54],[44,6]]],["w",[[74,54],[56,6]]],["t",50,80,"60 Sekunden"]] }
},
{
  id: "wt-torwart-basis", nurTW: true, titel: "Torhüter-Grundtechnik: Stellung, Beinarbeit, Reaktion", phase: "haupt",
  ziele: { wt: 3, at: 1 }, rtk: ["Torwartspiel"],
  dauer: [10, 15, 20], spieler: [2, 6], tw: 1, flaeche: "drittel", baelle: "mittel", material: ["Hütchen", "Softbälle"], intens: 2, harz: false,
  kurz: "Separates Torhütertraining (parallel zum Feldspieler-Training, z. B. mit Co-Trainer). Die RTK fordert, die Torwartfindung im Grundlagentraining abzuschließen.",
  aufbau: "Tor (oder Hütchen-Tor an der Wand), Co-Trainer oder Feldspieler als Werfer, Softbälle für Reaktionsübungen.",
  ablauf: [
    "Grundstellung: Füße hüftbreit, Knie gebeugt, Hände vorn auf Schulterhöhe – 5 × aus dem Gehen einnehmen.",
    "Beinarbeit: auf Zuruf seitlich zu Hütchen am Pfosten gleiten, zurück in die Mitte (6 ×).",
    "Reaktion: Softbälle aus 4 m auf Signal (rechts/links/hoch/tief), 3 × 8 Bälle.",
    "Würfe aus 7 m mit angekündigter Ecke, dann ohne Ansage."
  ],
  coaching: ["Körper nach vorn, nicht nach hinten ausweichen.", "Bein und Arm der gleichen Seite arbeiten zusammen bei flachen Bällen.", "Nach jeder Parade sofort zurück in die Grundstellung."],
  fehler: ["Hände hängen tief", "Gewicht auf den Fersen"],
  leichter: "Langsamere Würfe, nur angekündigt.",
  schwerer: "Zwei Werfer im schnellen Wechsel.",
  quelle: { art: EIGEN, ...Q.RTK_ZIELE },
  g: { f: "halb", e: [["tw",50,5],["k",38,6],["k",62,6],["a",50,35,"Co"],["w",[[50,33],[40,6]]],["l",[[50,8],[38,8]]]] }
},
{
  id: "wt-ecken-wettkampf", titel: "Ecken-Wettkampf: Feldspieler gegen Torhüter", phase: "haupt",
  ziele: { wt: 3 }, rtk: ["Torwartspiel", "Individuelles Angriffsspiel"],
  dauer: [8, 10, 12], spieler: [6, 20], tw: 1, flaeche: "halb", baelle: "viel", material: ["Reifen"], intens: 1, harz: false,
  kurz: "Feldspieler werfen auf markierte Ecken; Treffer zählen für das Team, Paraden für den Torhüter. Gute Wahl am Tag vor dem Spiel (geringe Belastung, hohe Konzentration).",
  aufbau: "Reifen oder Leibchen in den vier Torecken befestigt (oder Ecken nur angesagt). Werfer auf 9 m.",
  ablauf: [
    "Jeder Spieler sagt seine Ecke an und wirft.",
    "Treffer in die Ecke = 2 Punkte, sonstiges Tor = 1 Punkt, Parade = 1 Punkt für den Torhüter.",
    "3 Runden, dann Torhüterwechsel.",
    "Variante: Torhüter bestimmt die Ecke, die nicht getroffen werden darf."
  ],
  coaching: ["Präzision vor Härte.", "Wurfauftakt immer gleich – Torhüter soll die Ecke nicht ablesen können.", "Torhüter loben, wenn sie Würfe lesen."],
  fehler: ["Würfe mit voller Kraft auf kurze Distanz", "Kein Wurfrhythmus"],
  leichter: "Würfe aus 7 m.",
  schwerer: "Würfe aus dem Sprung über einen passiven Verteidiger.",
  quelle: { art: EIGEN, ...Q.RTK_ZIELE },
  g: { f: "halb", e: [["tw",50,5],["m",41,1,4,3,""],["m",55,1,4,3,""],["a",50,48,""],["w",[[50,46],[43,3]]]] }
},
{
  id: "wt-7m", titel: "7-m-Training unter Druck", phase: "haupt",
  ziele: { wt: 3 }, rtk: ["Torwartspiel"],
  dauer: [6, 8, 10], spieler: [4, 20], tw: 1, flaeche: "halb", baelle: "wenig", material: [], intens: 1, harz: false,
  kurz: "Siebenmeter nach Belastung und mit Zuschauerdruck. Bereitet auf Entscheidungen im Spiel und das 7-m-Werfen bei Turnieren vor.",
  aufbau: "Alle Spieler im Halbkreis hinter der 9-m-Linie, ein Werfer am Punkt.",
  ablauf: [
    "Werfer läuft eine Bahn Sprint (Belastung), dann 7-m-Wurf.",
    "Die anderen dürfen Lärm machen (kein Körperkontakt, keine Beleidigungen).",
    "Fehlwurf: Team macht 5 Hampelmänner gemeinsam (keine Bestrafung des Einzelnen).",
    "Drei Runden; Torhüter wechseln."
  ],
  coaching: ["Eigenes Ritual entwickeln (Ball tippen, Atmen).", "Vor dem Wurf entscheiden, nicht während.", "Fuß bleibt am Boden, bis der Ball die Hand verlassen hat."],
  fehler: ["Fuß hebt ab (Übertreten)", "Entscheidung im letzten Moment ändern"],
  leichter: "Ohne Lärm und ohne Belastung.",
  schwerer: "Torhüter darf vor dem Wurf auf der Linie bewegen.",
  quelle: { art: EIGEN, ...Q.RTK_ZIELE },
  g: { f: "halb", e: [["tw",50,5],["a",50,36,""],["w",[[50,34],[56,6]]],["a",30,50,""],["a",40,52,""],["a",60,52,""],["a",70,50,""]] }
},

/* ============================ ATHLETIK ============================ */
{
  id: "at-sprintstarts", titel: "Sprint- und Reaktionsstarts mit Ball", phase: "haupt",
  ziele: { at: 3, te: 2 }, rtk: ["Motorik/Athletik"],
  dauer: [8, 10, 12], spieler: [4, 24], tw: 0, flaeche: "halb", baelle: "wenig", material: ["Hütchen"], intens: 3, harz: false,
  kurz: "Kurze Sprints (5–15 m) aus verschiedenen Startpositionen, am Ende Ballaufnahme. Schnelligkeit wird frisch trainiert – deshalb früh in der Einheit.",
  aufbau: "Startlinie, Hütchen bei 5, 10 und 15 m. Ball liegt am Ziel.",
  ablauf: [
    "Start aus Abwehrgrundstellung, Sprint 10 m.",
    "Start aus Bauchlage auf Signal, Sprint 5 m, Richtungswechsel 90°, weitere 5 m.",
    "Start rückwärts, Drehung auf Signal, Sprint 10 m.",
    "Ball aufnehmen und zum Trainer passen.",
    "Je 3–4 Wiederholungen, volle Erholung (ca. 45 s)."
  ],
  coaching: ["Erste Schritte kurz und kraftvoll.", "Arme arbeiten aktiv mit.", "Volle Pause – sonst wird es Ausdauertraining."],
  fehler: ["Zu kurze Pausen", "Aufrecht starten"],
  leichter: "Kürzere Strecken.",
  schwerer: "Akustisches und optisches Signal gemischt.",
  quelle: { art: EIGEN, ...Q.ATK },
  g: { f: "frei", e: [["a",8,30,""],["k",30,30],["k",55,30],["k",80,30],["b",88,30],["l",[[12,30],[78,30]]],["t",30,45,"5 m"],["t",55,45,"10 m"],["t",80,45,"15 m"]] }
},
{
  id: "at-sprung", titel: "Sprungkraft mit geringer Intensität (Leiter, Linien)", phase: "haupt",
  ziele: { at: 3 }, rtk: ["Motorik/Athletik"],
  dauer: [8, 10, 12], spieler: [4, 24], tw: 0, flaeche: "drittel", baelle: "wenig", material: ["Koordinationsleiter"], intens: 2, harz: false,
  kurz: "Fußgelenksprünge, Hopserlauf und Sprünge durch die Leiter. Im Wachstumsalter: kurze Bodenkontakte, kleine Höhen, saubere Landung.",
  aufbau: "Koordinationsleiter (alternativ Linien oder Klebeband). 2–3 Leitern parallel.",
  ablauf: [
    "Beidbeinig durch jedes Feld (Fußgelenksprünge).",
    "Einbeinig jedes zweite Feld, dann Beinwechsel.",
    "Seitlich: zwei rein, zwei raus.",
    "Am Ende der Leiter Sprung und stabile Landung (2 s halten).",
    "Je Variante 2 Durchgänge."
  ],
  coaching: ["Kurzer Bodenkontakt, leise.", "Knie über den Füßen.", "Qualität vor Tempo."],
  fehler: ["Laute Landungen", "Fersenkontakt"],
  leichter: "Nur beidbeinig.",
  schwerer: "Ballfangen nach der Leiter mit Sprungwurf (ohne Tor).",
  quelle: { art: EIGEN, ...Q.ATK },
  g: { f: "frei", e: [["m",20,25,60,10,"Leiter"],["a",12,30,""],["l",[[16,30],[84,30]]]] }
},
{
  id: "at-koordparcours", titel: "Koordinationsparcours mit Ball", phase: "haupt",
  ziele: { at: 3, ia: 1 }, rtk: ["Motorik/Athletik", "Individuelles Angriffsspiel"],
  dauer: [10, 12, 15], spieler: [4, 20], tw: 0, flaeche: "halb", baelle: "mittel", material: ["Hütchen", "Bänke/Kästen", "Reifen"], intens: 2, harz: false,
  kurz: "Stationen mit Ballkontrolle: Prellen im Slalom, über Bänke balancieren, Reifenläufe. Die RTK empfiehlt Technikschulung mit koordinativen Aufgaben zu kombinieren.",
  aufbau: "Rundkurs: Hütchenslalom, Turnbank, Reifenfeld, Wandpass-Station.",
  ablauf: [
    "Slalom: links prellen hin, rechts zurück.",
    "Bank: darüber balancieren und dabei den Ball um den Körper führen.",
    "Reifen: in jeden Reifen ein Kontakt, Ball in der schwachen Hand.",
    "Wand: 10 Pässe gegen die Wand im Wechsel links/rechts.",
    "2–3 Runden, kein Wettkampf in Runde 1."
  ],
  coaching: ["Blick vom Ball lösen beim Prellen.", "Schwache Hand gezielt fordern.", "Bei Fehlern neu starten, nicht abkürzen."],
  fehler: ["Blick auf den Ball", "Nur starke Hand"],
  leichter: "Ohne Ball.",
  schwerer: "Zwei Bälle gleichzeitig prellen.",
  quelle: { art: EIGEN, ...Q.RTK_GT },
  g: { f: "frei", e: [["k",15,10],["k",25,18],["k",35,10],["k",45,18],["m",55,8,25,5,"Bank"],["m",60,38,25,12,"Reifen"],["a",8,14,""],["dr",[[10,14],[48,14]]],["l",[[82,12],[82,44],[20,44]]]] }
},
{
  id: "at-intervall-spiel", titel: "Spielspezifische Ausdauer: Intervall-Spielform 4-gegen-4", phase: "spiel",
  ziele: { at: 3, ko: 1, te: 1 }, rtk: ["Motorik/Athletik"],
  dauer: [10, 12, 15], spieler: [8, 18], tw: 0, flaeche: "halb", baelle: "wenig", material: ["Leibchen", "Hütchen"], intens: 3, harz: false,
  kurz: "Ausdauer im Spiel statt mit Läufen: kurze, intensive Spielphasen mit Pausen. Für Jugendliche motivierender und spezifischer als Dauerlauf.",
  aufbau: "Kleinfeld (halbe Halle), Hütchentore an den Enden (Ball muss im Tor abgelegt werden). Teams à 4.",
  ablauf: [
    "4-gegen-4 für 90 Sekunden mit voller Intensität.",
    "60 Sekunden aktive Pause (Gehen, Trinken).",
    "4–6 Durchgänge, wartende Teams machen Technikaufgaben.",
    "Regel: Nach Ballverlust muss die ganze Mannschaft über die Mittellinie zurück."
  ],
  coaching: ["Intensität hoch halten, Pausen einhalten.", "Viel Bewegung ohne Ball.", "Belastung bei Wachstumsbeschwerden individuell reduzieren."],
  fehler: ["Spieltempo fällt ab", "Pausen werden ausgedehnt"],
  leichter: "Längere Pause.",
  schwerer: "Joker spielt nicht mit (echtes 4-gegen-4).",
  quelle: { art: EIGEN, ...Q.ATK },
  g: { f: "frei", e: [["k",5,25],["k",5,35],["k",95,25],["k",95,35],["a",25,15,""],["a",40,40,""],["a",60,20,""],["a",70,45,""],["d",30,30,""],["d",50,15,""],["d",65,35,""],["d",80,25,""]] }
},

/* ===================== KLEINE FLÄCHE (Hallendrittel) ===================== */
{
  id: "kf-rondo", titel: "Passspiel 4-gegen-2 im Quadrat (Rondo)", phase: "haupt",
  ziele: { ko: 2, iv: 2, ia: 1 }, rtk: ["Kooperatives Angriffsspiel", "Individuelles Abwehrspiel"],
  dauer: [8, 12, 15], spieler: [6, 18], tw: 0, flaeche: "drittel", baelle: "wenig", material: ["Hütchen", "Leibchen"], intens: 2, harz: false,
  kurz: "Vier Angreifer am Rand eines Quadrats halten den Ball gegen zwei Jäger in der Mitte. Passt auf jede kleine Fläche und schult Passwege lesen auf beiden Seiten.",
  aufbau: "Quadrat ca. 7 × 7 m. Vier Angreifer an den Seiten, zwei Verteidiger in der Mitte. Bei 12+ Spielern zwei Quadrate.",
  ablauf: [
    "Angreifer passen sich den Ball zu, maximal 3 s Ballbesitz, kein Prellen.",
    "Verteidiger versuchen, den Ball abzufangen oder zu berühren.",
    "Wer den Fehlpass spielt, tauscht mit dem Verteidiger, der am längsten in der Mitte ist.",
    "Zusatzregel nach 4 Minuten: Pass durch die Mitte (zwischen den Verteidigern) = 1 Punkt."
  ],
  coaching: ["Angreifer: Anbieten, bevor der Ball kommt.", "Verteidiger: Zu zweit arbeiten – einer stellt den Ballbesitzer, der andere den Passweg.", "Pässe kurz und hart."],
  fehler: ["Angreifer stehen in der Ecke ohne Passwinkel", "Beide Verteidiger jagen den Ball"],
  leichter: "5-gegen-2 oder größeres Quadrat.",
  schwerer: "3-gegen-1 auf kleinerer Fläche, Pass nur mit schwacher Hand.",
  quelle: { art: EIGEN, ...Q.RTK_ZIELE },
  g: { f: "frei", e: [["k",25,5],["k",75,5],["k",25,55],["k",75,55],["a",50,6,""],["a",26,30,""],["a",74,30,""],["a",50,54,""],["d",44,26,""],["d",56,34,""],["p",[[50,9],[72,28]]],["b",50,6]] }
},
{
  id: "kf-1g1-matte", titel: "1-gegen-1 auf Zielmatte (ohne Tor)", phase: "haupt",
  ziele: { ia: 3, iv: 3, at: 1 }, rtk: ["Individuelles Angriffsspiel", "Individuelles Abwehrspiel"],
  dauer: [10, 12, 15], spieler: [4, 20], tw: 0, flaeche: "drittel", baelle: "mittel", material: ["Hütchen"], intens: 3, harz: false,
  kurz: "1-gegen-1 in schmalen Bahnen quer zur Halle. Punkt durch Ablegen des Balls hinter der Ziellinie. Funktioniert ohne Tor und Torhüter.",
  aufbau: "Mehrere Bahnen (4 m breit, 10 m lang) mit Hütchen, Ziellinie am Ende. Paare pro Bahn.",
  ablauf: [
    "Angreifer startet mit Ball an der Grundlinie, Verteidiger auf 4 m.",
    "Angreifer versucht mit Prellen und Täuschung, den Ball hinter der Ziellinie abzulegen.",
    "Verteidiger arbeitet frontal und versucht den Ball herauszuspielen.",
    "Nach jeder Aktion Rollentausch, 6–8 Aktionen pro Paar, dann Partnerwechsel."
  ],
  coaching: ["Tempo- und Richtungswechsel statt Kraft.", "Verteidiger: Armlänge Abstand, Beine bewegen.", "Saubere Knieachse beim Abstoppen (Prävention)."],
  fehler: ["Verteidiger klammert", "Angreifer läuft ohne Täuschung los"],
  leichter: "Breitere Bahn.",
  schwerer: "Ablegen nur auf einer Matte (kleinere Zielzone).",
  quelle: { art: EIGEN, ...Q.RTK_IA },
  g: { f: "frei", e: [["k",10,20],["k",10,40],["k",90,20],["k",90,40],["a",14,30,"A"],["d",34,30,"V"],["dr",[[17,30],[30,24],[44,36],[86,32]]],["t",90,52,"Ziellinie"]] }
},
{
  id: "kf-abwehr-linie", titel: "2-gegen-2 auf Linie: Abwehr verschieben und übergeben", phase: "haupt",
  ziele: { iv: 3, ko: 2, ma: 1 }, rtk: ["Kooperatives Abwehrspiel"],
  dauer: [10, 12, 15], spieler: [4, 20], tw: 0, flaeche: "drittel", baelle: "wenig", material: ["Hütchen", "Leibchen"], intens: 3, harz: false,
  kurz: "Zwei Verteidiger schützen eine 8 m breite Linie gegen zwei Angreifer. Übt Heraustreten, Helfen und Übergeben auf engem Raum.",
  aufbau: "Hütchenlinie (8 m) als „6-m-Linie“, Angreifer starten 6 m davor. Mehrere Felder nebeneinander.",
  ablauf: [
    "Angreifer versuchen, mit Ball über die Linie zu kommen (Prellen erlaubt, max. 10 s).",
    "Verteidiger dürfen nur vor der Linie verteidigen und müssen heraustreten.",
    "Kreuzen die Angreifer, entscheiden die Verteidiger: übergeben oder mitlaufen.",
    "Rollentausch nach 5 Angriffen."
  ],
  coaching: ["Absprache laut.", "Ballseite tritt heraus, Partner sichert nach innen.", "Ballgewinn ist das Ziel."],
  fehler: ["Verteidiger stehen auf der Linie", "Beide gehen auf den Ballführer"],
  leichter: "Angreifer ohne Prellen.",
  schwerer: "3-gegen-3 auf 10 m Breite.",
  quelle: { art: EIGEN, ...Q.RTK_ZIELE },
  g: { f: "frei", e: [["k",30,15],["k",50,15],["k",70,15],["a",40,48,""],["a",62,50,""],["d",42,26,""],["d",60,24,""],["l",[[60,24],[52,20]]],["t",80,10,"Linie"]] }
},
{
  id: "kf-3g3-matten", titel: "Kleinfeldspiel 3-gegen-3 auf Matten oder Hütchentore", phase: "spiel",
  ziele: { ko: 3, iv: 2, te: 1, at: 1 }, rtk: ["Kooperatives Angriffsspiel", "Kooperatives Abwehrspiel"],
  dauer: [10, 12, 15], spieler: [6, 18], tw: 0, flaeche: "drittel", baelle: "wenig", material: ["Hütchen"], intens: 3, harz: false,
  kurz: "Quer im Hallendrittel: Ein Punkt gelingt, wenn der Ball auf der gegnerischen Weichbodenmatte aufgeprellt wird (ohne Matte: Hütchentor, Ball muss durchrollen). Viele Aktionen, wenig Platz.",
  aufbau: "Hallendrittel quer, an jeder Stirnseite eine Weichbodenmatte oder ein 2 m breites Hütchentor. Teams à 3, weitere Teams warten außen und wechseln nach Punkt.",
  ablauf: [
    "Spiel 3-gegen-3, Prellen erlaubt.",
    "Punkt: Ball auf der Matte aufprellen (Wurf aus mindestens 2 m).",
    "Offensive Manndeckung, Ballgewinn = sofort Gegenangriff.",
    "Siegerteam bleibt (King of the Court), maximal 3 Runden am Stück."
  ],
  coaching: ["Schnell umschalten.", "Freilaufen hinter dem Gegenspieler.", "Fair verteidigen."],
  fehler: ["Alle laufen zum Ball", "Lange Pässe übers Feld"],
  leichter: "Joker.",
  schwerer: "Nur Punkte nach Doppelpass.",
  quelle: { art: EIGEN, ...Q.RTK_WETT },
  g: { f: "frei", e: [["m",0,15,7,30,"Matte"],["m",93,15,7,30,"Matte"],["a",30,20,""],["a",45,42,""],["a",62,25,""],["d",38,28,""],["d",55,38,""],["d",68,18,""]] }
},

/* ============================ SPIELFORMEN ============================ */
{
  id: "sp-4p1", titel: "Spiel 4+1 gegen 4+1 quer (kleiner Kader, geteilte Halle)", phase: "spiel",
  ziele: { ko: 2, ia: 2, iv: 2, te: 1 }, rtk: ["Kooperatives Angriffsspiel", "Kooperatives Abwehrspiel"],
  dauer: [10, 15, 20], spieler: [10, 14], tw: 2, flaeche: "halb", baelle: "wenig", material: ["Leibchen"], intens: 3, harz: false,
  kurz: "Spiel quer in der halben Halle mit kleinen Toren oder Matten. Viele Ballkontakte für jeden, ideal bei halber Halle oder kleinem Kader.",
  aufbau: "Querfeld in der Hallenhälfte, zwei Tore (Kleinfeldtore, Matten oder markierte Wand). Teams à 4 Feldspieler plus Torhüter.",
  ablauf: [
    "Normales Spiel 4+1 gegen 4+1.",
    "Abwehr: Manndeckung oder 1:3 – Ball früh attackieren.",
    "Tore nach Zusammenspiel (Doppelpass) zählen doppelt.",
    "Zwei Halbzeiten à 6–8 Minuten."
  ],
  coaching: ["Breite nutzen trotz kleinem Feld.", "Freilaufen in die Tiefe.", "Fair verteidigen, Balleroberung belohnen."],
  fehler: ["Alle im Zentrum", "Abwehr zieht sich vor das Tor zurück"],
  leichter: "Joker im Angriff.",
  schwerer: "Maximal 2 Prellkontakte.",
  quelle: { art: EIGEN, ...Q.RTK_WETT },
  g: { f: "frei", e: [["tw",4,30],["tw",96,30],["a",25,15,""],["a",35,45,""],["a",55,25,""],["a",60,50,""],["d",30,30,""],["d",45,20,""],["d",65,35,""],["d",75,15,""]] }
},
{
  id: "sp-6g6-aufgabe", titel: "Spiel 6-gegen-6 mit Aufgabe (offensive Abwehr, Balleroberung)", phase: "spiel",
  ziele: { ma: 3, iv: 1, te: 2 }, rtk: ["Kollektives Angriffsspiel", "Kollektives Abwehrspiel", "Tempospielangriff/-abwehr"],
  dauer: [15, 20, 25], spieler: [14, 20], tw: 2, flaeche: "ganz", baelle: "wenig", material: ["Leibchen"], intens: 3, harz: false,
  kurz: "Wettkampfnahes Spiel über das ganze Feld mit Sonderwertung, die das Trainingsthema belohnt. Die Wettkampfregeln der C-Jugend (offensive Deckung) gelten.",
  aufbau: "Ganze Halle, zwei Teams à 6 + Torhüter. Wechselspieler wechseln fliegend.",
  ablauf: [
    "Normales Spiel nach C-Jugend-Regeln.",
    "Sonderwertung passend zum Trainingsthema, z. B.: Tor nach Ballgewinn = 2, Tor nach Kreuzen = 2, Tor aus der 2. Welle = 2.",
    "Trainer unterbricht maximal 3 × pro Halbzeit für kurze Korrekturen.",
    "Zwei Halbzeiten à 8–10 Minuten."
  ],
  coaching: ["Das Thema der Einheit im Spiel sichtbar machen.", "Wenig reden, viel spielen lassen.", "Gute Lösungen laut loben."],
  fehler: ["Zu viele Unterbrechungen", "Sonderregel wird vergessen"],
  leichter: "Joker für das schwächere Team.",
  schwerer: "Zeitspiel-Regel (25 s pro Angriff).",
  quelle: { art: EIGEN, ...Q.BHV },
  g: { f: "ganz", e: [["tw",50,5],["tw",50,195],["d",26,48,""],["d",50,50,""],["d",74,48,""],["d",18,30,""],["d",50,33,""],["d",82,30,""],["a",22,64,""],["a",50,70,""],["a",78,64,""],["a",8,14,""],["a",92,14,""],["a",50,40,""]] }
},
{
  id: "sp-2x3g3", titel: "Zweimal 3-gegen-3 (geteiltes Feld)", phase: "spiel",
  ziele: { ko: 3, iv: 2, ia: 1 }, rtk: ["Kooperatives Angriffsspiel", "Kooperatives Abwehrspiel"],
  dauer: [10, 15, 20], spieler: [12, 16], tw: 2, flaeche: "ganz", baelle: "wenig", material: ["Leibchen", "Hütchen"], intens: 3, harz: false,
  kurz: "Je drei Angreifer und drei Verteidiger pro Hälfte, Spieler dürfen die Mittellinie nicht überqueren. Die RTK nennt diese Wettspielform ausdrücklich.",
  aufbau: "Ganze Halle, Mittellinie als Grenze. Pro Team 3 Angreifer in der gegnerischen Hälfte, 3 Verteidiger in der eigenen.",
  ablauf: [
    "Nach Ballgewinn passen die Verteidiger über die Mittellinie zu ihren Angreifern.",
    "Angreifer spielen 3-gegen-3 bis zum Torwurf.",
    "Nach 4 Minuten tauschen Angreifer und Verteidiger.",
    "Zwei Durchgänge pro Rolle."
  ],
  coaching: ["Abwehr: Ballgewinn ist das Ziel, nicht nur Verhindern.", "Angriff: Positionen nicht starr, Räume nutzen.", "Schnelles Umschalten nach Ballgewinn (Pass über die Mitte)."],
  fehler: ["Lange Pässe ins Nichts", "Abwehr steht am 6-m-Raum"],
  leichter: "Ein Joker darf die Mittellinie überqueren.",
  schwerer: "Torwurf erst nach mindestens einem Zusammenspiel (Parallelstoß/Kreuzen).",
  quelle: { art: EIGEN, ...Q.RTK_WETT },
  g: { f: "ganz", e: [["tw",50,5],["tw",50,195],["a",25,50,""],["a",50,55,""],["a",75,50,""],["d",30,38,""],["d",50,42,""],["d",70,38,""],["a",25,150,""],["a",50,145,""],["a",75,150,""],["d",30,162,""],["d",50,158,""],["d",70,162,""]] }
},
{
  id: "sp-endzone", titel: "Endzonen-Spiel (Parteiball mit Ziel)", phase: "spiel",
  ziele: { ko: 2, te: 2, iv: 1, at: 1 }, rtk: ["Kooperatives Angriffsspiel", "Tempospielangriff/-abwehr"],
  dauer: [8, 10, 15], spieler: [8, 20], tw: 0, flaeche: "halb", baelle: "wenig", material: ["Leibchen", "Hütchen"], intens: 3, harz: false,
  kurz: "Ein Punkt gelingt, wenn ein Spieler den Ball in der gegnerischen Endzone fängt. Ohne Tor und Torhüter – geeignet bei fehlendem Torhüter oder Harzverbot.",
  aufbau: "Halbe oder ganze Halle, an beiden Enden 3 m tiefe Endzonen (Hütchen). Zwei Teams.",
  ablauf: [
    "Kein Prellen, maximal 3 Schritte.",
    "Punkt: Fang in der Endzone.",
    "Nach Punkt bekommt das andere Team den Ball an der eigenen Endzone.",
    "Zwei Durchgänge à 5 Minuten."
  ],
  coaching: ["Schnelles Umschalten nach Ballgewinn.", "Freilaufen in die Tiefe.", "Abwehr: Passwege zustellen."],
  fehler: ["Spieler stehen in der Endzone und warten", "Lange Bogenlampen"],
  leichter: "Prellen erlaubt.",
  schwerer: "Nur Bodenpässe zählen.",
  quelle: { art: EIGEN, ...Q.RTK_ZIELE },
  g: { f: "frei", e: [["m",0,0,10,60,"Zone"],["m",90,0,10,60,"Zone"],["a",30,20,""],["a",45,45,""],["a",65,25,""],["d",40,30,""],["d",55,15,""],["d",70,40,""],["p",[[65,25],[92,30]]]] }
},
{
  id: "sp-themaspiel-kreuzen", titel: "Themenspiel: Tore nach Zusammenspiel zählen doppelt", phase: "spiel",
  ziele: { ko: 3, ma: 2 }, rtk: ["Kooperatives Angriffsspiel", "Kollektives Angriffsspiel"],
  dauer: [10, 15, 20], spieler: [10, 20], tw: 1, flaeche: "halb", baelle: "wenig", material: ["Leibchen"], intens: 2, harz: false,
  kurz: "Spiel auf ein Tor: Angriff wechselt nach jedem Abschluss. Tore nach Kreuzen, Übergang oder Kreisanspiel zählen doppelt.",
  aufbau: "Halbe Halle, ein Tor. Zwei Teams à 5–6, ein Team greift an, eines verteidigt.",
  ablauf: [
    "Angriff spielt bis zum Abschluss, dann wechselt das Angriffsrecht (Abwehrteam bekommt den Ball an der Mittellinie).",
    "Doppelt zählen nur Tore aus der Kooperation, die im Training geübt wurde.",
    "Abwehr spielt offensiv (3:3 oder 1:5).",
    "Zwei Durchgänge à 7 Minuten."
  ],
  coaching: ["Geübte Kooperation bewusst suchen, aber nicht erzwingen.", "Lösungen beim Gegner lesen.", "Abwehrteam bleibt aktiv."],
  fehler: ["Spieler suchen nur noch die Sonderwertung", "Abwehr wird passiv"],
  leichter: "Abwehr mit einem Spieler weniger.",
  schwerer: "Nur Tore aus der Kooperation zählen.",
  quelle: { art: EIGEN, ...Q.RTK_GT },
  g: { f: "halb", e: [["tw",50,5],["a",22,58,"RL"],["a",50,64,"RM"],["a",78,58,"RR"],["a",8,14,"LA"],["a",50,36,"KM"],["d",30,46,""],["d",50,48,""],["d",70,46,""],["d",20,28,""],["d",80,28,""],["l",[[22,55],[40,50]]],["dr",[[50,61],[36,48]]]] }
},

/* ============================ AUSKLANG ============================ */
{
  id: "aus-mobil", titel: "Auslaufen und Mobilisation", phase: "aus",
  ziele: { at: 1 }, rtk: ["Motorik/Athletik"],
  dauer: [5, 5, 10], spieler: [2, 24], tw: 0, flaeche: "drittel", baelle: "wenig", material: [], intens: 1, harz: false,
  kurz: "Lockeres Auslaufen und ruhige Mobilisationsübungen für Hüfte, Brustwirbelsäule und Schulter.",
  aufbau: "Alle im Kreis.",
  ablauf: [
    "2 Minuten lockeres Traben, dann Gehen.",
    "Ausfallschritt mit Oberkörperrotation (je Seite 5 ×).",
    "Vierfüßlerstand: Brustwirbelsäule rotieren (je Seite 5 ×).",
    "Arme kreisen, Schulterblätter bewegen."
  ],
  coaching: ["Ruhig atmen.", "Nicht nachfedern.", "Zeit für kurzes Feedback nutzen."],
  fehler: ["Hektik am Ende der Einheit"],
  leichter: "—",
  schwerer: "—",
  quelle: { art: EIGEN, ...Q.VBG },
  g: { f: "frei", e: [["t",50,30,"Auslaufen · Mobilisation"]] }
},
{
  id: "aus-feedback", titel: "Abschlusskreis: Feedback und Ziel für das nächste Mal", phase: "aus",
  ziele: {}, rtk: ["Spielerpersönlichkeiten entwickeln"],
  dauer: [3, 5, 8], spieler: [2, 24], tw: 0, flaeche: "drittel", baelle: "wenig", material: [], intens: 1, harz: false,
  kurz: "Kurzer Abschluss im Kreis. Die RTK nennt die Persönlichkeitsentwicklung als eigenen Zielbereich – Jugendliche sollen mitdenken und mitreden.",
  aufbau: "Alle im Kreis, Trainer auf Augenhöhe.",
  ablauf: [
    "Ein Spieler nennt, was heute gut lief.",
    "Ein Spieler nennt, was schwer war.",
    "Trainer fasst das Trainingsziel in einem Satz zusammen.",
    "Ausblick: Was nehmen wir mit ins Spiel am Wochenende?"
  ],
  coaching: ["Wechselnde Spieler zu Wort kommen lassen.", "Positiv abschließen.", "Kurz halten (maximal 5 Minuten)."],
  fehler: ["Monolog des Trainers"],
  leichter: "—",
  schwerer: "Spieler leiten den Kreis selbst.",
  quelle: { art: EIGEN, ...Q.RTK_ZIELE },
  g: { f: "frei", e: [["t",50,30,"Abschlusskreis"]] }
},

/* ===================== METHODIKREIHEN: ergänzende Übungen ===================== */
{
  id: "mr-kreuzen-laufwege", titel: "Kreuzen ohne Gegner: Laufwege, Timing, Übergabe", phase: "haupt",
  ziele: { ko: 3, ia: 1 }, rtk: ["Kooperatives Angriffsspiel"],
  dauer: [8, 10, 12], spieler: [6, 20], tw: 1, flaeche: "halb", baelle: "mittel", material: ["Hütchen"], intens: 1, harz: false,
  kurz: "Vorübung zum Kreuzen: Laufwege und Übergabe in Ruhe einschleifen, mit Hütchen als Orientierung. Abschluss mit Wurf.",
  aufbau: "Reihen auf RL, RM und RR. Hütchen auf ca. 9 m vor RL und RR markieren die Stoßpunkte.",
  ablauf: [
    "RM prellt diagonal auf das Hütchen vor RL zu.",
    "RL startet erst, wenn RM an ihm vorbei ist, und läuft hinter RM in die Mitte.",
    "Übergabe: RM gibt den Ball kurz und flach ab (oder spielt ihn aus der Hand weiter).",
    "RL schließt mit Sprungwurf ab; danach dasselbe zur rechten Seite (RM–RR).",
    "Steigerung: Nach dem Kreuzen passt RL weiter zu RR, der wirft."
  ],
  coaching: ["Ballbesitzer zielt auf das Tor, nicht auf den Mitspieler – nur dann reagiert später die Abwehr.", "Kreuzender läuft eng hinter dem Rücken vorbei, Abstand eine Armlänge.", "Ball auf der dem Gegner abgewandten Seite übergeben."],
  fehler: ["Kreuzender startet zu früh und steht im Weg", "Übergabe zu hoch oder zu weit"],
  leichter: "Im Gehtempo, ohne Wurf.",
  schwerer: "Passive Verteidiger auf 9 m, die nur die Arme bewegen.",
  quelle: { art: EIGEN, ...Q.RTK_ZIELE },
  g: { f: "halb", e: [["tw",50,5],["k",34,46],["k",66,46],["a",50,62,"RM"],["a",22,56,"RL"],["a",78,56,"RR"],["dr",[[50,59],[36,48]]],["l",[[24,53],[40,52],[50,44]]],["p",[[36,48],[48,46]]],["w",[[50,42],[54,6]]]] }
},
{
  id: "mr-kreuzen-3g3", titel: "Kreuzen 3-gegen-3 im Rückraum mit freiem Weiterspielen", phase: "haupt",
  ziele: { ko: 3, ma: 2, ia: 1 }, rtk: ["Kooperatives Angriffsspiel", "Kollektives Angriffsspiel"],
  dauer: [12, 15, 20], spieler: [8, 20], tw: 1, flaeche: "halb", baelle: "wenig", material: ["Leibchen"], intens: 2, harz: false,
  kurz: "Drei Rückraumspieler gegen drei offensive Verteidiger. Nach dem Kreuzen lesen die Angreifer, ob übergeben oder mitgelaufen wird, und spielen die Lücke.",
  aufbau: "RL, RM, RR gegen drei Verteidiger auf 8–9 m (vordere Reihe einer 3:3). Gruppen wechseln nach 4 Angriffen.",
  ablauf: [
    "Angriff startet mit Pass zum RM, der das Kreuzen mit RL oder RR auslöst.",
    "Laufen die Verteidiger mit: Der Ballbesitzer nach dem Kreuzen stößt in die entstehende Lücke.",
    "Übergeben die Verteidiger: Pass weiter auf die freie Seite oder Wurf des Kreuzenden.",
    "Abwehr versucht Ballgewinn (Punkt) – danach Rollentausch.",
    "Maximal 20 Sekunden pro Angriff."
  ],
  coaching: ["Erst Torgefahr, dann Kreuzen – sonst bleibt die Abwehr ruhig.", "Nach dem Kreuzen nicht stehen bleiben: weiterspielen ist das Ziel.", "Abwehr klar ansagen: „Übergeben!“ oder „Mit!“."],
  fehler: ["Kreuzen weit vor der Abwehr ohne Wirkung", "Nach dem Kreuzen stehender Angriff"],
  leichter: "Abwehr entscheidet nach Ansage des Trainers.",
  schwerer: "Kreisläufer als vierter Angreifer, Abwehr mit 4 Spielern.",
  quelle: { art: EIGEN, ...Q.RTK_ZIELE },
  g: { f: "halb", e: [["tw",50,5],["a",22,58,"RL"],["a",50,64,"RM"],["a",78,58,"RR"],["d",30,46,""],["d",50,48,""],["d",70,46,""],["dr",[[50,61],[38,52]]],["l",[[24,55],[44,56],[54,42]]],["p",[[38,52],[52,48]]]] }
},
{
  id: "mr-stossen-luecke", titel: "Stoßen in die Lücke gegen passive Abwehr (Tiefe gewinnen)", phase: "haupt",
  ziele: { ko: 2, ia: 2, ma: 2 }, rtk: ["Kooperatives Angriffsspiel", "Kollektives Angriffsspiel"],
  dauer: [8, 10, 15], spieler: [8, 20], tw: 1, flaeche: "halb", baelle: "mittel", material: ["Hütchen"], intens: 2, harz: false,
  kurz: "Vorübung für den Angriff gegen offensive Abwehr: Vier Rückraum- und Außenspieler stoßen nacheinander in markierte Lücken einer passiven 3:3-Vorderreihe und spielen in die Tiefe.",
  aufbau: "Drei passive Verteidiger (oder Hütchen-Paare) auf 9 m bilden zwei Lücken. Angreifer starten auf 12–13 m.",
  ablauf: [
    "Ballbesitzer stößt mit Tempo in die Lücke, der Nachbar läuft parallel mit.",
    "In der Lücke: Wurf, wenn frei – sonst Pass in die Tiefe zum Außen oder Einläufer.",
    "Fortlaufend: Ball zurück zum nächsten Rückraumspieler, nächste Lücke.",
    "Verteidiger heben nur die Arme (passiv), später dürfen sie einen Schritt heraustreten."
  ],
  coaching: ["Tief starten (12 m) – Laufweg ist die halbe Miete gegen offensive Abwehr.", "Lücke attackieren, nicht den Verteidiger.", "Zweiter Angreifer immer in Bewegung in die Tiefe."],
  fehler: ["Start auf 9 m ohne Anlauf", "Stoßen nach außen statt Richtung Tor"],
  leichter: "Hütchen statt Verteidiger.",
  schwerer: "Verteidiger werden halbaktiv.",
  quelle: { art: EIGEN, ...Q.BHV },
  g: { f: "halb", e: [["tw",50,5],["d",30,46,""],["d",50,47,""],["d",70,46,""],["a",36,66,"RL"],["a",62,66,"RR"],["a",10,16,"LA"],["l",[[36,63],[40,50],[40,38]]],["l",[[62,63],[58,52]]],["p",[[40,40],[16,22]]]] }
},
{
  id: "mr-mann-freilaufen", titel: "Freilaufen gegen Manndeckung (Schattenspiel)", phase: "haupt",
  ziele: { ia: 3, at: 2, ko: 1 }, rtk: ["Individuelles Angriffsspiel", "Kooperatives Angriffsspiel"],
  dauer: [8, 10, 12], spieler: [6, 20], tw: 0, flaeche: "halb", baelle: "wenig", material: ["Hütchen", "Leibchen"], intens: 3, harz: false,
  kurz: "Angreifer müssen sich gegen einen eng deckenden Gegenspieler lösen, um einen Pass zu bekommen. Grundlage gegen die in der C-Jugend häufige Manndeckung.",
  aufbau: "Paare (Angreifer und Manndecker) in einem Feld von ca. 8 × 8 m. Ein Zuspieler pro Feld außerhalb.",
  ablauf: [
    "Angreifer versucht, sich mit Tempo- und Richtungswechsel zu lösen, Decker bleibt eng dran.",
    "Zuspieler passt, sobald der Angreifer frei ist und die Hand zeigt.",
    "Angreifer fängt, dreht auf und passt zurück – 1 Punkt.",
    "45 Sekunden Belastung, dann Rollentausch."
  ],
  coaching: ["Erst vom Ball weg, dann explosiv zum Ball (Tempowechsel).", "Körper zwischen Decker und Ball bringen.", "Hand als Ziel zeigen – Zuspieler passt nur auf Signal."],
  fehler: ["Dauerlauf ohne Tempowechsel", "Angreifer läuft direkt zum Ball und wird abgefangen"],
  leichter: "Decker mit Händen hinter dem Rücken.",
  schwerer: "Zwei Angreifer gegen zwei Decker, zwei Zuspieler.",
  quelle: { art: EIGEN, ...Q.BHV },
  g: { f: "frei", e: [["k",20,8],["k",80,8],["k",20,52],["k",80,52],["a",50,50,"Z"],["a",45,22,"A"],["d",50,28,"D"],["l",[[45,22],[30,14],[38,32]]],["p",[[50,47],[40,34]]]] }
},
{
  id: "mr-mann-sperre", titel: "2-gegen-2 gegen Manndeckung: Sperre für den Mitspieler", phase: "haupt",
  ziele: { ko: 3, ia: 1 }, rtk: ["Kooperatives Angriffsspiel"],
  dauer: [10, 12, 15], spieler: [6, 20], tw: 1, flaeche: "halb", baelle: "wenig", material: ["Leibchen"], intens: 2, harz: false,
  kurz: "Gegen Manndecker ist die Sperre ohne Ball das stärkste Mittel: Ein Angreifer sperrt den Decker seines Mitspielers, der sich so freiläuft.",
  aufbau: "Zwei Angreifer und zwei Manndecker im Rückraum, ein Zuspieler auf RM, ein Torhüter.",
  ablauf: [
    "Angreifer A stellt eine Sperre seitlich am Decker von B (stehend, Arme am Körper).",
    "B läuft eng an der Sperre vorbei Richtung Tor und bekommt den Pass.",
    "Übernimmt der Decker von A: A dreht sich ab (Absetzen) und ist selbst frei.",
    "Abschluss mit Torwurf, dann Rollentausch."
  ],
  coaching: ["Sperre steht – keine laufende Sperre (Stürmerfoul).", "Der Freiläufer wartet, bis die Sperre steht, dann Tempo.", "Zuspieler spielt den Freien – nicht den, der gerade sperrt."],
  fehler: ["Sperre zu weit vom Decker entfernt", "Freiläufer läuft zu früh"],
  leichter: "Decker halbaktiv.",
  schwerer: "3-gegen-3 mit freier Wahl, wer sperrt.",
  quelle: { art: EIGEN, ...Q.RTK_ZIELE },
  g: { f: "halb", e: [["tw",50,5],["a",50,66,"Z"],["a",30,52,"A"],["d",32,46,""],["a",56,50,"B"],["d",56,44,""],["l",[[30,52],[50,46]]],["l",[[56,50],[64,52],[44,34]]],["p",[[48,63],[44,38]]]] }
},
{
  id: "mr-mann-4g4", titel: "4-gegen-4 gegen Manndeckung auf ein Tor", phase: "haupt",
  ziele: { ko: 3, ma: 2, ia: 2 }, rtk: ["Kooperatives Angriffsspiel", "Kollektives Angriffsspiel"],
  dauer: [12, 15, 20], spieler: [9, 20], tw: 1, flaeche: "halb", baelle: "wenig", material: ["Leibchen"], intens: 3, harz: false,
  kurz: "Komplexübung: Vier Angreifer gegen vier Manndecker. Freilaufen, Sperren und schnelles Passspiel unter echtem Druck.",
  aufbau: "Halbe Halle, ein Tor. Zwei Teams à 4, weitere Teams warten. Manndeckung über die ganze Hälfte.",
  ablauf: [
    "Angriff beginnt an der Mittellinie und spielt frei auf das Tor.",
    "Abwehr deckt Mann gegen Mann, Ballgewinn = Punkt und Gegenangriff bis zur Mittellinie.",
    "Pflicht: mindestens eine Sperre pro Angriff, bevor geworfen werden darf.",
    "Wechsel nach 3 Angriffen."
  ],
  coaching: ["Raum schaffen: Angreifer verteilen sich breit, damit Platz für 1-gegen-1 entsteht.", "Ballbesitzer nicht allein lassen – immer zwei Anspielstationen.", "Sperren ankündigen (Handzeichen)."],
  fehler: ["Alle stehen eng zusammen", "Ballbesitzer prellt sich fest"],
  leichter: "Ein Joker im Angriff.",
  schwerer: "Prellen verboten.",
  quelle: { art: EIGEN, ...Q.BHV },
  g: { f: "halb", e: [["tw",50,5],["a",14,40,""],["a",36,60,""],["a",64,60,""],["a",86,40,""],["d",18,34,""],["d",38,53,""],["d",62,53,""],["d",82,34,""],["l",[[64,60],[42,56]]],["l",[[36,60],[44,44]]]] }
},
{
  id: "mr-kreis-3g3", titel: "3-gegen-3 mit Kreisläufer: Sperre, Absetzen, Kreisanspiel", phase: "haupt",
  ziele: { ko: 3, ma: 1, wt: 1 }, rtk: ["Kooperatives Angriffsspiel", "Positionsspezifisches Angriffsspiel"],
  dauer: [12, 15, 20], spieler: [8, 20], tw: 1, flaeche: "halb", baelle: "wenig", material: ["Leibchen"], intens: 2, harz: false,
  kurz: "Zwei Rückraumspieler und ein Kreisläufer gegen drei Verteidiger. Der Kreisläufer arbeitet mit Sperren für den Rückraum und löst sich zum Anspiel.",
  aufbau: "RL, RM und KM gegen zwei Verteidiger auf 8 m und einen am Kreis. Halbe Spielfeldbreite.",
  ablauf: [
    "Kreisläufer stellt Sperre für den Ballbesitzer an dessen Verteidiger.",
    "Ballbesitzer geht durch oder spielt den Kreisläufer an, wenn dessen Verteidiger aushilft.",
    "Alternative: Kreisläufer setzt sich nach der Sperre zum Ball ab.",
    "Wechsel der Rollen nach 4 Angriffen – alle spielen einmal Kreis."
  ],
  coaching: ["Sperre im Rücken oder seitlich des Verteidigers, nicht frontal.", "Rückraum muss Torgefahr zeigen, sonst bleibt der Kreis zu.", "Pass zum Kreis flach oder als Bodenpass."],
  fehler: ["Kreisläufer steht starr", "Rückraum spielt Kreis ohne vorherige Bindung"],
  leichter: "Kreisverteidiger passiv.",
  schwerer: "Vierter Verteidiger als Helfer.",
  quelle: { art: EIGEN, ...Q.RTK_ZIELE },
  g: { f: "halb", e: [["tw",50,5],["a",32,58,"RL"],["a",62,60,"RM"],["a",46,34,"KM"],["d",34,46,""],["d",60,48,""],["d",48,38,""],["l",[[46,34],[36,44]]],["dr",[[32,55],[26,44],[30,36]]],["p",[[30,38],[44,36]]]] }
},
{
  id: "mr-gegenstoss-passfolge", titel: "Gegenstoß-Passfolge über das ganze Feld (ohne Gegner)", phase: "haupt",
  ziele: { te: 3, ko: 1, at: 2 }, rtk: ["Tempospielangriff/-abwehr"],
  dauer: [8, 10, 12], spieler: [6, 20], tw: 1, flaeche: "ganz", baelle: "mittel", material: [], intens: 2, harz: false,
  kurz: "Vorübung zum Tempospiel: Torhüter-Abwurf, zwei bis drei Pässe im Sprint und Torwurf – ohne Gegner, damit Passschärfe und Laufwege sitzen.",
  aufbau: "Ganze Halle. Drei Reihen an der Grundlinie (links, Mitte, rechts), Torhüter mit Bällen. Mit nur einem Torhüter: auf das Tor mit Torhüter abschließen, am anderen Tor auf eine Zielfläche (Matte, Hütchentor) oder nur bis zur Linie.",
  ablauf: [
    "Torhüter wirft zum startenden Außen (lang, in den Lauf).",
    "Außen passt zur Mitte, Mitte zurück auf den anderen Außen – alles im Sprint.",
    "Abschluss spätestens nach drei Pässen aus dem Lauf.",
    "Nächste Gruppe startet, sobald die vorige die Mittellinie überquert. Von beiden Seiten im Wechsel."
  ],
  coaching: ["Pass vor den Läufer, nicht auf ihn.", "Breite halten – Außen an der Seitenlinie.", "Torhüter: Abwurf schnell und flach-gestreckt."],
  fehler: ["Läufer verlangsamen zum Fangen", "Zu viele Pässe"],
  leichter: "Halbes Feld.",
  schwerer: "Zeitvorgabe: Abschluss in 6 Sekunden.",
  quelle: { art: EIGEN, ...Q.RTK_ZIELE },
  g: { f: "ganz", e: [["tw",50,195],["tw",50,5],["a",12,190,""],["a",50,186,""],["a",88,190,""],["p",[[50,192],[14,130]]],["l",[[12,186],[12,60]]],["l",[[50,182],[50,80]]],["l",[[88,186],[88,40]]],["p",[[12,120],[48,90]]],["p",[[50,86],[86,50]]],["w",[[86,40],[56,6]]]] }
},
{
  id: "mr-abw-kreuzen", titel: "Abwehr gegen Kreuzen: Übergeben oder Mitlaufen", phase: "haupt",
  ziele: { iv: 2, ko: 3, ma: 2 }, rtk: ["Kooperatives Abwehrspiel"],
  dauer: [10, 12, 15], spieler: [6, 20], tw: 1, flaeche: "halb", baelle: "wenig", material: ["Leibchen"], intens: 2, harz: false,
  kurz: "Zwei Verteidiger der vorderen Reihe lernen, Kreuzbewegungen zu verteidigen: übergeben und übernehmen oder bewusst mitlaufen – mit klarer Ansage.",
  aufbau: "Zwei Angreifer (RL, RM) gegen zwei Verteidiger auf 8–9 m, ein Torhüter.",
  ablauf: [
    "Angreifer kreuzen auf Signal des Trainers, Verteidiger übergeben (Variante 1).",
    "Danach Variante 2: Verteidiger laufen mit dem eigenen Gegenspieler mit.",
    "Dann frei: Angreifer entscheiden, Verteidiger müssen die passende Lösung finden.",
    "Ballgewinn = Punkt, danach Rollentausch."
  ],
  coaching: ["Laut ansagen – Übergaben scheitern an Schweigen.", "Beim Übergeben einen Schritt nach vorn, nicht zurück.", "Ballbesitzer immer attackieren, nie beide Verteidiger auf einen Mann."],
  fehler: ["Beide Verteidiger folgen dem Ball", "Übergabe zu spät"],
  leichter: "Angreifer kreuzen langsam.",
  schwerer: "Dritter Angreifer, der nach dem Kreuzen angespielt werden kann.",
  quelle: { art: EIGEN, ...Q.RTK_ZIELE },
  g: { f: "halb", e: [["tw",50,5],["a",30,60,"RL"],["a",52,62,"RM"],["d",34,48,"1"],["d",52,49,"2"],["dr",[[52,59],[40,52]]],["l",[[30,57],[46,54]]],["l",[[34,48],[42,46]]],["l",[[52,49],[44,50]]]] }
},
{
  id: "sp-themenspiel", titel: "Themenspiel auf ein Tor mit Sonderregel", phase: "spiel",
  ziele: { ma: 2, ko: 2, iv: 1, ia: 1 }, rtk: ["Kollektives Angriffsspiel", "Kollektives Abwehrspiel"],
  dauer: [12, 15, 20], spieler: [8, 20], tw: 1, flaeche: "halb", baelle: "wenig", material: ["Leibchen"], intens: 2, harz: false,
  kurz: "Spiel 5-gegen-5 oder 6-gegen-6 auf ein Tor. Die Sonderregel kommt aus dem Thema der Einheit (der Planer setzt sie automatisch in den Plan).",
  aufbau: "Halbe Halle, ein Tor. Zwei Teams, eines greift an, eines verteidigt offensiv nach C-Jugend-Regel.",
  ablauf: [
    "Angriff spielt bis zum Abschluss, Abwehr verteidigt offensiv.",
    "Nach Abschluss oder Ballgewinn: Das andere Team beginnt seinen Angriff an der Mittellinie.",
    "Wertung nach Sonderregel des Themas (siehe Anpassung im Plan).",
    "Zwei Durchgänge à 6–8 Minuten, dazwischen 1 Minute Besprechung."
  ],
  coaching: ["Die Sonderregel macht das Thema sichtbar – loben, wenn es gelingt.", "Wenig unterbrechen, maximal zwei Korrekturen pro Durchgang.", "In der Besprechung Spieler erklären lassen, was funktioniert hat."],
  fehler: ["Spieler suchen nur noch die Sonderwertung", "Zu lange Besprechungen"],
  leichter: "Abwehr mit einem Spieler weniger.",
  schwerer: "Zeitlimit 25 Sekunden pro Angriff.",
  quelle: { art: EIGEN, ...Q.RTK_GT },
  g: { f: "halb", e: [["tw",50,5],["a",22,58,""],["a",50,64,""],["a",78,58,""],["a",8,14,""],["a",92,14,""],["a",50,36,""],["d",28,46,""],["d",50,48,""],["d",72,46,""],["d",20,28,""],["d",80,28,""],["t",50,88,"Sonderregel des Themas"]] }
}
,

/* ============================ TORWART ============================ */
{
  id: "tw-winkel-aussen", titel: "Torwart: Winkel verkürzen bei Würfen von Außen", phase: "haupt",
  ziele: { wt: 3 }, rtk: ["Torwartspiel"],
  dauer: [8, 10, 15], spieler: [3, 20], tw: 1, flaeche: "halb", baelle: "mittel", material: ["Hütchen"], intens: 2, harz: false,
  kurz: "Der Torhüter lernt, bei Außenwürfen kurz vor den Pfosten zu treten und den Winkel zu schließen, ohne die lange Ecke freizugeben.",
  aufbau: "Werfer auf LA und RA mit Bällen, Zuspieler auf RL/RR. Hütchen markiert am Pfosten die Grundposition (ca. ein Schritt vor der Torlinie).",
  ablauf: [
    "Torhüter steht mittig. Auf Pass zum Außen verschiebt er zur kurzen Ecke und tritt einen Schritt heraus.",
    "Außen springt ein und wirft; Torhüter bleibt so lange wie möglich stehen.",
    "Wechsel der Seite nach jedem Wurf – Torhüter muss quer durchs Tor verschieben.",
    "Runde 1: angesagte Ecke, Runde 2: frei."
  ],
  coaching: ["Kurzes Bein am Pfosten, Körper zur Mitte des Feldes gedreht.", "Nicht zu früh springen – der Außen soll zuerst entscheiden.", "Arme seitlich hoch, die lange Ecke mit dem Bein schließen."],
  fehler: ["Zu weit heraus, lange Ecke offen", "Frühes Abtauchen"],
  leichter: "Würfe aus dem Stand vom Außen.",
  schwerer: "Außen darf zwischen Wurf und Pass zum Kreis wählen.",
  quelle: { art: EIGEN, ...Q.RTK_ZIELE },
  g: { f: "halb", e: [["tw",44,7],["k",43,3],["a",8,16,"LA"],["a",24,54,"RL"],["p",[[24,51],[12,22]]],["l",[[50,6],[44,7]]],["w",[[14,16],[53,2]]]] }
},
{
  id: "tw-rueckraum", titel: "Torwart: Sprungwürfe aus dem Rückraum lesen", phase: "haupt",
  ziele: { wt: 3, ia: 1 }, rtk: ["Torwartspiel"],
  dauer: [8, 10, 15], spieler: [4, 20], tw: 1, flaeche: "halb", baelle: "viel", material: [], intens: 2, harz: false,
  kurz: "Torhüter und Werfer im Duell: Der Torhüter achtet auf Wurfarm, Schulter und Absprung und entscheidet spät. Die Werfer üben dabei Wurfvariabilität.",
  aufbau: "Werfer in zwei Reihen auf RL und RR, jeder mit Ball. Passiver Verteidiger mit hochgestreckten Armen auf 8 m (Block).",
  ablauf: [
    "Werfer laufen an, springen über die 9-m-Linie und werfen über oder neben dem Block.",
    "Torhüter steht in der Wurflinie (zwischen Ball und Tormitte) und reagiert.",
    "Block deckt eine Ecke ab – Torhüter übernimmt die andere (Absprache vorher).",
    "Wertung: Paraden gegen Tore, nach 10 Würfen Torhüterwechsel."
  ],
  coaching: ["Torhüter: Stellung zur Wurfhand, nicht zur Körpermitte des Werfers.", "Gewicht auf den Fußballen, keine Schritte während des Wurfs.", "Werfer: Ziel erst in der Luft wählen."],
  fehler: ["Torhüter weicht nach hinten aus", "Block und Torhüter decken dieselbe Ecke"],
  leichter: "Würfe aus dem Stand, ohne Block.",
  schwerer: "Block entscheidet frei, Torhüter muss nach dem Block lesen.",
  quelle: { art: EIGEN, ...Q.RTK_ZIELE },
  g: { f: "halb", e: [["tw",44,7],["d",36,42,"B"],["a",26,58,"RL"],["a",74,58,"RR"],["l",[[26,55],[32,47]]],["w",[[33,45],[55,3]]]] }
},
{
  id: "tw-gegenstoss", titel: "Torwart: Gegenstoß einleiten (Abwurf nach Parade)", phase: "haupt",
  ziele: { wt: 3, te: 2 }, rtk: ["Torwartspiel", "Tempospielangriff/-abwehr"],
  dauer: [8, 10, 12], spieler: [4, 20], tw: 1, flaeche: "ganz", baelle: "mittel", material: ["Hütchen"], intens: 2, harz: false,
  kurz: "Nach Parade oder gehaltenem Ball spielt der Torhüter sofort den langen oder kurzen Pass zum startenden Außen. Torhüter sind die ersten Spielmacher des Tempospiels.",
  aufbau: "Werfer auf 9 m, zwei Läufer an den Seitenlinien auf Höhe der Freiwurflinie. Zielzonen mit Hütchen an der Mittellinie.",
  ablauf: [
    "Werfer wirft halbhoch auf den Torhüter (haltbar).",
    "Torhüter hält, nimmt den Ball auf und passt sofort zum startenden Läufer.",
    "Kurzer Pass, wenn der Läufer gedeckt wird; langer Pass in die Zielzone, wenn frei.",
    "Läufer schließt am anderen Tor ab oder legt den Ball in der Zielzone ab."
  ],
  coaching: ["Erst schauen, dann werfen – kein blinder langer Pass.", "Pass vor den Läufer in den freien Raum.", "Schneller Abwurf vor Weite."],
  fehler: ["Torhüter hält den Ball zu lange", "Bogenlampe ohne Tempo"],
  leichter: "Ohne vorherigen Wurf, Torhüter startet mit Ball.",
  schwerer: "Ein Verteidiger versucht den langen Pass abzufangen.",
  quelle: { art: EIGEN, ...Q.RTK_ZIELE },
  g: { f: "ganz", e: [["tw",50,5],["a",50,48,"W"],["a",8,40,""],["a",92,40,""],["k",10,100],["k",90,100],["w",[[50,45],[50,9]]],["p",[[52,8],[90,92]]],["l",[[92,44],[92,96]]]] }
},
{
  id: "tw-beweglichkeit", nurTW: true, titel: "Torwart: Beweglichkeit und Sprungkraft", phase: "haupt",
  ziele: { wt: 2, at: 3 }, rtk: ["Torwartspiel", "Motorik/Athletik"],
  dauer: [8, 10, 12], spieler: [1, 4], tw: 1, flaeche: "drittel", baelle: "wenig", material: ["Hütchen", "Softbälle"], intens: 2, harz: false,
  kurz: "Torwartspezifische Athletik: Beweglichkeit in Hüfte und Leiste, explosive Seitwärtssprünge. Die RTK nennt den Ausgleich von Größennachteilen durch Beweglichkeit und Sprungkraft.",
  aufbau: "Torhüter in Torbreite zwischen zwei Hütchen, Co-Trainer oder Feldspieler mit Softbällen.",
  ablauf: [
    "Mobilisation: tiefe Hocke halten, Ausfallschritt seitlich, Hüftkreisen (je 30 s).",
    "Seitwärtssprünge über eine Linie, Landung stabil (2 × 8).",
    "Aus der Grundstellung Sprung zur Seite und Softball fangen (je Seite 6 ×).",
    "Spagat-nahe Abwehr flacher Bälle kontrolliert, ohne Schwung (je Seite 5 ×)."
  ],
  coaching: ["Beweglichkeit nie mit Schwung erzwingen.", "Landung leise und stabil.", "Qualität vor Menge – Torhüter im Wachstum schonen."],
  fehler: ["Ruckartige Dehnbewegungen", "Zu viele Sprünge ohne Pause"],
  leichter: "Ohne Ball.",
  schwerer: "Zwei Bälle direkt hintereinander.",
  quelle: { art: EIGEN, ...Q.ATK },
  g: { f: "frei", e: [["k",30,30],["k",70,30],["tw",50,30],["l",[[50,30],[34,24]]],["a",50,52,"Co"],["p",[[50,49],[36,28]]]] }
},

/* ============================ POSITIONEN ============================ */
{
  id: "pos-aussen-gegenstoss", titel: "Außen im Gegenstoß: Annahme über die Schulter", phase: "haupt",
  ziele: { te: 3, ia: 2, wt: 1 }, rtk: ["Positionsspezifisches Angriffsspiel", "Tempospielangriff/-abwehr"],
  dauer: [8, 10, 12], spieler: [4, 20], tw: 1, flaeche: "ganz", baelle: "mittel", material: [], intens: 3, harz: false,
  kurz: "Der Außen sprintet entlang der Seitenlinie und fängt einen langen Pass über die Schulter, ohne das Tempo zu verlieren. Alle spielen einmal Außen.",
  aufbau: "Reihen an beiden Seitenlinien auf Höhe der eigenen 9 m. Zuspieler (oder Torhüter) im eigenen Torraum mit Bällen.",
  ablauf: [
    "Außen startet auf Signal entlang der Seitenlinie.",
    "Zuspieler passt lang in den Lauf, Annahme über die Schulter im vollen Tempo.",
    "Abschluss am anderen Tor oder Ablage auf Zielfläche.",
    "Seitenwechsel nach jedem Durchgang."
  ],
  coaching: ["Blick zurück zum Ball, Lauf geht weiter geradeaus.", "Hände als Korb vor der Brust, Ball nicht abfangen, sondern mitnehmen.", "Zuspieler: Ball vor den Läufer, nie hinter ihn."],
  fehler: ["Läufer bremst zum Fangen", "Pass zu weit nach innen"],
  leichter: "Kürzere Pässe, halbes Tempo.",
  schwerer: "Ein Verteidiger startet verspätet hinterher.",
  quelle: { art: EIGEN, ...Q.RTK_ZIELE },
  g: { f: "ganz", e: [["tw",50,195],["tw",50,5],["a",8,150,"LA"],["l",[[8,146],[8,50]]],["p",[[50,190],[10,80]]],["w",[[10,46],[46,4]]]] }
},
{
  id: "pos-kreis-sperre", titel: "Kreisspiel: Sperre stellen, halten und abrollen", phase: "haupt",
  ziele: { ko: 2, ia: 2, at: 1 }, rtk: ["Positionsspezifisches Angriffsspiel"],
  dauer: [8, 10, 12], spieler: [4, 20], tw: 1, flaeche: "halb", baelle: "mittel", material: [], intens: 2, harz: false,
  kurz: "Technikübung für die Kreisposition: Sperre regelgerecht stellen, gegen Druck halten und zum Ball abrollen. Alle Spieler wechseln durch.",
  aufbau: "Paare am 6-m-Raum (Kreisläufer und Verteidiger), Zuspieler auf 9 m mit Bällen.",
  ablauf: [
    "Kreisläufer stellt sich seitlich an den Verteidiger: breiter Stand, Arme am Körper.",
    "Verteidiger versucht 3 Sekunden, an der Sperre vorbei zum Zuspieler zu kommen.",
    "Auf Signal rollt der Kreisläufer ab (Drehung zum Ball) und bekommt den Pass.",
    "Abschluss mit Torwurf, dann Rollentausch."
  ],
  coaching: ["Sperre steht still – Bewegung in die Sperre ist ein Stürmerfoul.", "Abrollen: Hüfte zum Ball, Hände zeigen das Ziel.", "Tiefer Schwerpunkt, Knie gebeugt."],
  fehler: ["Arme werden zum Halten benutzt", "Abrollen vom Ball weg"],
  leichter: "Verteidiger passiv.",
  schwerer: "Zuspieler entscheidet zwischen Kreisanspiel und eigenem Durchbruch.",
  quelle: { art: EIGEN, ...Q.RTK_ZIELE },
  g: { f: "halb", e: [["tw",50,5],["a",44,34,"KM"],["d",50,38,""],["a",50,56,"Z"],["l",[[44,34],[42,38],[46,40]]],["p",[[50,53],[46,42]]],["w",[[46,36],[52,5]]]] }
},
{
  id: "pos-rr-zweite-reihe", titel: "Rückraum: Wurf aus der zweiten Reihe über den Block", phase: "haupt",
  ziele: { wt: 3, ia: 2, at: 1 }, rtk: ["Positionsspezifisches Angriffsspiel", "Individuelles Angriffsspiel"],
  dauer: [8, 10, 15], spieler: [4, 20], tw: 1, flaeche: "halb", baelle: "viel", material: ["Bänke/Kästen"], intens: 2, harz: false,
  kurz: "Fernwurf aus 10–11 m gegen eine Blockhilfe. Gegen offensive Abwehrformen entstehen Lücken für den schnellen Wurf aus der zweiten Reihe.",
  aufbau: "Turnkasten oder ein Spieler mit hochgestreckten Armen als Block auf 8 m. Werfer in zwei Reihen auf 11–12 m.",
  ablauf: [
    "Anlauf mit drei Schritten, Absprung vor der 9-m-Linie, Wurf über den Block.",
    "Variante: Wurf neben dem Block (Hüftwurf) oder Schlagwurf aus dem Stand mit Stemmschritt.",
    "Jeder Werfer 8 Würfe, Wurfziel vorher ansagen.",
    "Steigerung: Pass vom Nachbarn, Wurf ohne Prellen."
  ],
  coaching: ["Ellbogen über Schulterhöhe, Wurfarm lang.", "Absprung nach oben, nicht nach vorn.", "Fernwürfe dosieren – Schulter im Wachstum schonen (Würfe zählen)."],
  fehler: ["Wurfarm seitlich tief", "Zu viele Würfe mit voller Kraft"],
  leichter: "Ohne Block, aus 9 m.",
  schwerer: "Block bewegt sich seitlich, Werfer muss reagieren.",
  quelle: { art: EIGEN, ...Q.RTK_IA },
  g: { f: "halb", e: [["tw",50,5],["m",44,38,12,4,"Block"],["a",40,64,""],["a",62,64,""],["l",[[40,61],[44,52]]],["w",[[45,50],[56,3]]]] }
},
{
  id: "pos-halb-nahtstelle", titel: "Halbposition: Stoßen zur Nahtstelle und Pass zum Außen", phase: "haupt",
  ziele: { ko: 3, ia: 2 }, rtk: ["Positionsspezifisches Angriffsspiel", "Kooperatives Angriffsspiel"],
  dauer: [10, 12, 15], spieler: [6, 20], tw: 1, flaeche: "halb", baelle: "mittel", material: [], intens: 2, harz: false,
  kurz: "Rückraum Halb und Außen gegen zwei Verteidiger: Der Halbe stößt in die Lücke zwischen Halb- und Außenverteidiger und bindet beide – dann Wurf oder Pass zum freien Außen.",
  aufbau: "RL und LA gegen zwei Verteidiger (Halb, Außen). Zuspieler auf RM. Gegenseite parallel.",
  ablauf: [
    "RM passt zum RL, der in die Nahtstelle stößt.",
    "Tritt der Außenverteidiger heraus: Pass zum LA, der aus dem Winkel wirft.",
    "Bleibt er außen: RL wirft oder bricht durch.",
    "Seitenwechsel nach 5 Aktionen."
  ],
  coaching: ["Nahtstelle = Lücke zwischen zwei Verteidigern – dort ist die Zuständigkeit unklar.", "Außen bleibt breit und tief, bis der Pass kommt.", "Pass mit dem Sprung, nicht im Stand."],
  fehler: ["Stoßen auf den Verteidiger statt in die Lücke", "Außen läuft zu früh nach innen"],
  leichter: "Verteidiger entscheiden auf Ansage.",
  schwerer: "Kreisläufer als dritte Option.",
  quelle: { art: EIGEN, ...Q.RTK_ZIELE },
  g: { f: "halb", e: [["tw",50,5],["a",50,62,"RM"],["a",24,56,"RL"],["a",6,16,"LA"],["d",28,42,""],["d",14,26,""],["p",[[47,61],[27,57]]],["l",[[24,53],[22,40]]],["p",[[22,40],[9,20]]]] }
},
{
  id: "pos-rm-spielmacher", titel: "Rückraum Mitte: Spielaufbau, Tempo und Auslösen", phase: "haupt",
  ziele: { ma: 2, ko: 2, ia: 1 }, rtk: ["Positionsspezifisches Angriffsspiel", "Kollektives Angriffsspiel"],
  dauer: [10, 12, 15], spieler: [7, 20], tw: 1, flaeche: "halb", baelle: "wenig", material: ["Leibchen"], intens: 2, harz: false,
  kurz: "Der Mittelspieler lernt, das Spiel zu lesen: Ball laufen lassen, Tempo verändern und auf ein Zeichen eine Aktion auslösen. Alle übernehmen einmal die Rolle.",
  aufbau: "Sechs Angreifer gegen fünf passive Verteidiger (offensive Formation). RM trägt ein Leibchen in anderer Farbe.",
  ablauf: [
    "Ball läuft einmal durch alle Positionen, RM gibt den Rhythmus vor (langsam/schnell).",
    "RM ruft eine Aktion: „Kreuzen“, „Einläufer“ oder „Stoßen“ – die Mannschaft setzt sie um.",
    "Verteidiger werden nach 3 Minuten halbaktiv.",
    "Alle 4 Angriffe neuer Mittelspieler."
  ],
  coaching: ["Mittelspieler schaut, bevor er den Ball bekommt.", "Laut und eindeutig ansagen.", "Tempowechsel ist selbst eine Waffe."],
  fehler: ["Mittelspieler prellt im Stand", "Ansage zu spät"],
  leichter: "Verteidiger passiv, festgelegte Reihenfolge.",
  schwerer: "Verteidiger aktiv, Ansage per Handzeichen statt Zuruf.",
  quelle: { art: EIGEN, ...Q.RTK_GT },
  g: { f: "halb", e: [["tw",50,5],["a",8,14,"LA"],["a",22,56,"RL"],["a",50,62,"RM"],["a",78,56,"RR"],["a",92,14,"RA"],["a",50,36,"KM"],["d",30,46,""],["d",50,48,""],["d",70,46,""],["d",22,30,""],["d",78,30,""],["t",50,80,"RM sagt die Aktion an"]] }
},

/* ===================== ABWEHR 2:4 UND MANNDECKUNG ===================== */
{
  id: "ab24-grundform", titel: "2:4-Abwehr: Grundformation und Verschieben", phase: "haupt",
  ziele: { ma: 3, iv: 2 }, rtk: ["Kollektives Abwehrspiel"],
  dauer: [15, 20, 25], spieler: [12, 20], tw: 1, flaeche: "halb", baelle: "wenig", material: ["Hütchen"], intens: 2, harz: false,
  kurz: "Zwei vorgezogene Halbverteidiger stören die Rückraumspieler außen, vier Verteidiger sichern hinten. In der C-Jugend zulässige Zweilinien-Abwehr.",
  aufbau: "Zwei Verteidiger auf ca. 9 m vor RL und RR, vier am 6-m-Raum. Sechs Angreifer.",
  ablauf: [
    "Langsames Passen: Vordere zwei attackieren ihren Rückraumspieler, wenn er den Ball hat, und ziehen sich beim Pass nach innen zurück.",
    "Hintere vier verschieben ballorientiert, der Kreisläufer wird übergeben.",
    "Der RM ist die Lücke der 2:4: Die beiden vorderen sichern ihn abwechselnd, hinten tritt der Mittelverteidiger heraus.",
    "Spieltempo, dann 6-gegen-6 mit Wertung (Ballgewinn = 1 Punkt)."
  ],
  coaching: ["Vorne: Rückraum außen nicht ins Spiel kommen lassen.", "Absprache zum RM klar regeln (wer geht?).", "Hinten mutig bis 8 m heraustreten – keine 6:0-Abwehr."],
  fehler: ["Vordere bleiben bei ihrem Mann, RM hat freie Bahn", "Hintere Reihe steht auf der Linie"],
  leichter: "Ohne Kreisläufer.",
  schwerer: "Angriff mit Kreuzen RM–RL.",
  quelle: { art: EIGEN, ...Q.BHV },
  g: { f: "halb", e: [["tw",50,5],["d",30,46,""],["d",70,46,""],["d",14,24,""],["d",38,32,""],["d",62,32,""],["d",86,24,""],["a",22,58,"RL"],["a",50,64,"RM"],["a",78,58,"RR"],["a",8,14,"LA"],["a",92,14,"RA"],["a",50,38,"KM"]] }
},
{
  id: "ab24-halbverteidiger", titel: "2:4: Vorgezogene Halbverteidiger gegen Rückraum außen", phase: "haupt",
  ziele: { iv: 3, ko: 2 }, rtk: ["Kooperatives Abwehrspiel", "Individuelles Abwehrspiel"],
  dauer: [10, 12, 15], spieler: [6, 20], tw: 1, flaeche: "halb", baelle: "wenig", material: ["Leibchen"], intens: 3, harz: false,
  kurz: "Kleingruppe: vorgezogener Halbverteidiger und Außenverteidiger gegen RL, RM und LA. Ziel: RL vom Ball fernhalten und Pässe nach außen abfangen.",
  aufbau: "Angreifer RL, RM, LA. Verteidiger: vorgezogen vor RL (ca. 9 m), Außenverteidiger am 6-m-Raum links.",
  ablauf: [
    "Angriff spielt frei 3-gegen-2, Ziel Torwurf.",
    "Vorgezogener stellt den Passweg zum RL zu (Körper zwischen Ball und RL).",
    "Bekommt RL trotzdem den Ball: frontal attackieren, Außenverteidiger sichert die Innenseite.",
    "Ballgewinn = Punkt, danach Rollentausch."
  ],
  coaching: ["Seitlich zum Gegenspieler stehen, Blick auf Ball und Mann.", "Passweg zustellen heißt: im Laufweg des Passes stehen.", "Außenverteidiger spricht: „Hinten ist sicher!“."],
  fehler: ["Vorgezogener steht frontal und sieht den Ball nicht", "Außenverteidiger klebt an seiner Linie"],
  leichter: "RM darf nur zum RL passen.",
  schwerer: "Zusätzlicher Kreisläufer.",
  quelle: { art: EIGEN, ...Q.RTK_ZIELE },
  g: { f: "halb", e: [["tw",50,5],["a",50,62,"RM"],["a",22,54,"RL"],["a",6,16,"LA"],["d",30,48,""],["d",14,26,""],["p",[[47,61],[26,54]]],["l",[[30,48],[34,54]]]] }
},
{
  id: "md-grundprinzipien", titel: "Manndeckung als Abwehr: Zuordnung, Abstand, Blick", phase: "haupt",
  ziele: { iv: 3, at: 2, ma: 1 }, rtk: ["Individuelles Abwehrspiel", "Kollektives Abwehrspiel"],
  dauer: [10, 12, 15], spieler: [6, 20], tw: 0, flaeche: "halb", baelle: "wenig", material: ["Leibchen"], intens: 3, harz: false,
  kurz: "Grundlagen der Manndeckung der ganzen Mannschaft (in der C-Jugend erlaubt): jeder hat seinen Gegenspieler, sieht aber immer auch den Ball.",
  aufbau: "Halbe Halle, 4-gegen-4 oder 5-gegen-5. Feste Zuordnung der Gegenspieler vor dem Start.",
  ablauf: [
    "Angreifer passen sich den Ball zu (Parteiball, kein Torwurf), Abwehr deckt Mann.",
    "Regel 1: Abstand zum Gegner hängt von der Entfernung zum Ball ab (nah am Ball = eng).",
    "Regel 2: Immer zwischen Gegner und Tor, Blick auf Ball und Gegner (Dreieck).",
    "Nach 2 Minuten Wechsel; dann mit Torwurf auf ein Tor."
  ],
  coaching: ["„Ball und Mann sehen“ – Kopf nicht nur zum Ball drehen.", "Am Ball eng, weg vom Ball einen Schritt Richtung Tor als Hilfe.", "Rufen, wenn der eigene Mann wegläuft."],
  fehler: ["Rücken zum Ball", "Zu großer Abstand am Ballbesitzer"],
  leichter: "Angreifer dürfen nur gehen.",
  schwerer: "Angreifer dürfen sperren.",
  quelle: { art: EIGEN, ...Q.BHV },
  g: { f: "halb", e: [["a",20,40,""],["d",22,34,""],["a",45,62,""],["d",46,55,""],["a",72,50,""],["d",68,44,""],["a",86,24,""],["d",82,20,""],["p",[[45,59],[70,50]]]] }
},
{
  id: "md-gegen-sperre", titel: "Manndeckung gegen Sperren: durchgleiten oder übernehmen", phase: "haupt",
  ziele: { iv: 3, ko: 3 }, rtk: ["Kooperatives Abwehrspiel"],
  dauer: [10, 12, 15], spieler: [6, 20], tw: 1, flaeche: "halb", baelle: "wenig", material: ["Leibchen"], intens: 3, harz: false,
  kurz: "Gegen Manndeckung sperren die Gegner. Die Verteidiger lernen, eng an der Sperre vorbeizugleiten oder auf Zuruf die Gegenspieler zu tauschen.",
  aufbau: "2-gegen-2 im Rückraum mit Zuspieler, ein Torhüter. Angreifer stellen Sperren ohne Ball.",
  ablauf: [
    "Angreifer A sperrt den Verteidiger von B.",
    "Variante 1: Verteidiger gleitet zwischen Sperre und Gegner durch (über die Sperre).",
    "Variante 2: Verteidiger rufen „Tausch!“ und übernehmen den jeweils anderen.",
    "Dann frei: Verteidiger entscheiden selbst. Ballgewinn = Punkt."
  ],
  coaching: ["Der Verteidiger des Sperrenden warnt: „Sperre links!“.", "Durchgleiten: eng am eigenen Gegner bleiben, Schulter voran.", "Tausch nur mit lautem Zuruf."],
  fehler: ["Verteidiger läuft in die Sperre", "Stiller Tausch – beide laufen zum selben Gegner"],
  leichter: "Sperren nur auf Ansage.",
  schwerer: "3-gegen-3 mit freier Sperrwahl.",
  quelle: { art: EIGEN, ...Q.RTK_ZIELE },
  g: { f: "halb", e: [["tw",50,5],["a",50,66,"Z"],["a",30,52,"A"],["d",32,46,""],["a",56,50,"B"],["d",56,44,""],["l",[[30,52],[50,46]]],["l",[[56,44],[52,40],[44,36]]]] }
},
{
  id: "md-ganzfeld", titel: "Manndeckung über das ganze Feld nach eigenem Torwurf", phase: "haupt",
  ziele: { iv: 3, te: 2, at: 3 }, rtk: ["Kollektives Abwehrspiel", "Tempospielangriff/-abwehr"],
  dauer: [10, 12, 15], spieler: [10, 20], tw: 2, flaeche: "ganz", baelle: "wenig", material: ["Leibchen"], intens: 3, harz: false,
  kurz: "Nach eigenem Torwurf wird der Gegner sofort im ganzen Feld aufgenommen. Ziel: Ballgewinn schon im gegnerischen Spielaufbau. Sehr intensiv – kurze Durchgänge.",
  aufbau: "Ganze Halle, 5-gegen-5 oder 6-gegen-6, je ein Torhüter. Zuordnung vorher festlegen.",
  ablauf: [
    "Team A greift an und wirft.",
    "Sofort nach dem Wurf: Team A nimmt die Gegenspieler im ganzen Feld auf.",
    "Team B muss den Ball über die Mittellinie bringen; gelingt das, spielt B normal auf das Tor.",
    "Ballgewinn in der gegnerischen Hälfte = 2 Punkte. Durchgänge von 3 Minuten, 2 Minuten Pause."
  ],
  coaching: ["Nächsten Gegner suchen, nicht den eigenen von vorhin.", "Passwege zum Torhüter-Abwurf zustellen.", "Belastung steuern: Wer nicht mehr kann, wird gewechselt."],
  fehler: ["Ein Verteidiger fehlt, weil er sich nach dem Wurf beschwert", "Zu lange Belastungsphasen"],
  leichter: "Manndeckung erst ab der Mittellinie.",
  schwerer: "Torhüter-Abwurf nur kurz erlaubt.",
  quelle: { art: EIGEN, ...Q.BHV },
  g: { f: "ganz", e: [["tw",50,195],["tw",50,5],["a",20,170,""],["d",22,162,""],["a",80,170,""],["d",78,162,""],["a",50,150,""],["d",50,142,""],["p",[[50,192],[80,172]]],["l",[[78,162],[80,168]]]] }
},

/* ============================ ATHLETIK (ATK) ============================ */
{
  id: "ath-kraft-koerper", titel: "Kraftzirkel mit dem eigenen Körpergewicht", phase: "haupt",
  ziele: { at: 3 }, rtk: ["Motorik/Athletik"],
  dauer: [10, 12, 15], spieler: [2, 24], tw: 0, flaeche: "drittel", baelle: "wenig", material: [], intens: 2, harz: false,
  kurz: "Altersgerechtes Krafttraining ohne Zusatzgewichte: saubere Technik in Grundbewegungen. Das DHB-Athletikkonzept betont: Inhalte nach Bewegungskompetenz, nicht nach Alter.",
  aufbau: "Sechs Stationen im Kreis, Paare. 30 Sekunden Belastung, 30 Sekunden Pause und Wechsel.",
  ablauf: [
    "Kniebeuge (Füße hüftbreit, Fersen bleiben am Boden).",
    "Ausfallschritt im Wechsel, Knie über dem Fuß.",
    "Liegestütz (auch auf den Knien), Körper gerade.",
    "Rudern am Partner: Partner hält die Hände, Spieler zieht sich schräg hoch.",
    "Unterarmstütz mit Schulterantippen.",
    "Hüftheben einbeinig. – 2 Runden."
  ],
  coaching: ["Partner kontrolliert die Technik, nicht die Anzahl.", "Lieber leichtere Variante sauber als schwere schlecht.", "Bei Wachstumsschmerzen (Knie, Ferse) Station auslassen."],
  fehler: ["Hohlkreuz bei Liegestütz", "Knie fallen nach innen"],
  leichter: "20 Sekunden Belastung.",
  schwerer: "Langsames Absenken (3 Sekunden).",
  quelle: { art: EIGEN, ...Q.ATK },
  g: { f: "frei", e: [["t",20,15,"Kniebeuge"],["t",50,15,"Ausfallschritt"],["t",80,15,"Liegestütz"],["t",20,45,"Rudern"],["t",50,45,"Stütz"],["t",80,45,"Hüftheben"]] }
},
{
  id: "ath-zweikampf", titel: "Zweikampfkraft: Partner- und Rangelspiele", phase: "haupt",
  ziele: { at: 3, iv: 1 }, rtk: ["Motorik/Athletik", "Individuelles Abwehrspiel"],
  dauer: [8, 10, 12], spieler: [2, 24], tw: 0, flaeche: "drittel", baelle: "wenig", material: [], intens: 2, harz: false,
  kurz: "Spielerische Kraft für den Körperkontakt im Handball: schieben, ziehen, Gleichgewicht halten – fair und mit klaren Regeln. Jugendliche lieben das.",
  aufbau: "Paare ähnlicher Größe und Kraft, genügend Abstand zwischen den Paaren.",
  ablauf: [
    "Schulterschieben: Hände auf den Schultern, wer schiebt den anderen über die Linie (10 s).",
    "Balldrücken: Beide halten einen Ball, wer entreißt ihn (ohne Drehen).",
    "Einbeiniger Handschlag-Kampf: Wer verliert zuerst das Gleichgewicht?",
    "Rücken an Rücken aufstehen, ohne die Hände zu benutzen.",
    "Jeweils 3 Durchgänge, Partnerwechsel."
  ],
  coaching: ["Fairness ist Regel Nummer 1 – kein Reißen, kein Treten.", "Körperspannung vor Kraft.", "Größen- und Entwicklungsunterschiede bei der Paarbildung beachten."],
  fehler: ["Ungleiche Paare", "Unkontrollierte Drehbewegungen"],
  leichter: "Kürzere Durchgänge.",
  schwerer: "Gegen zwei Partner nacheinander.",
  quelle: { art: EIGEN, ...Q.ATK },
  g: { f: "frei", e: [["a",42,30,""],["d",58,30,""],["t",50,48,"Schieben · Ziehen · Gleichgewicht"]] }
},
{
  id: "ath-mobilitaet", titel: "Mobilitätsroutine: Hüfte, Brustwirbelsäule, Sprunggelenk", phase: "aus",
  ziele: { at: 2 }, rtk: ["Motorik/Athletik"],
  dauer: [5, 8, 10], spieler: [2, 24], tw: 0, flaeche: "drittel", baelle: "wenig", material: [], intens: 1, harz: false,
  kurz: "Ruhige Beweglichkeitsübungen für die Stellen, die im Wachstum oft steif werden. Als Ausklang oder als Teil des Aufwärmens.",
  aufbau: "Alle im Kreis, jeder auf einer Fläche von 2 × 2 m.",
  ablauf: [
    "Tiefe Hocke halten, Ellbogen drücken die Knie nach außen (30 s).",
    "Weltbeste Dehnung: Ausfallschritt, Hand innen am Boden, Oberkörper aufdrehen (je Seite 5 ×).",
    "Vierfüßlerstand: Arm unter dem Körper durch und nach oben öffnen (je Seite 6 ×).",
    "Sprunggelenk: Knie über die Zehen schieben, Ferse bleibt am Boden (je Seite 10 ×)."
  ],
  coaching: ["Ruhig atmen, nichts erzwingen.", "Bewegen statt lange halten.", "Gute Gelegenheit für ein kurzes Gespräch in der Gruppe."],
  fehler: ["Federn in der Endposition"],
  leichter: "Kleinere Bewegungsamplitude.",
  schwerer: "Hocke mit Ball über dem Kopf.",
  quelle: { art: EIGEN, ...Q.ATK },
  g: { f: "frei", e: [["t",50,30,"Hocke · Ausfallschritt · Vierfüßler · Sprunggelenk"]] }
},
{
  id: "ath-fangspiele", titel: "Schnelligkeit spielerisch: Fang- und Staffelspiele", phase: "auf",
  ziele: { at: 3, te: 1 }, rtk: ["Motorik/Athletik"],
  dauer: [6, 8, 10], spieler: [6, 24], tw: 0, flaeche: "halb", baelle: "wenig", material: ["Hütchen", "Leibchen"], intens: 3, harz: false,
  kurz: "Kurze, intensive Laufspiele mit Richtungswechseln. Schnelligkeit wird so frisch und motivierend trainiert – ideal zu Beginn.",
  aufbau: "Halbe Halle, Hütchen als Grenzen. Drei Fänger mit Leibchen.",
  ablauf: [
    "Kettenfangen: Gefangene fassen sich an und fangen gemeinsam weiter (2 Minuten).",
    "Linienfangen: Alle dürfen nur auf den Hallenlinien laufen.",
    "Staffel: 4 Teams, Sprint um ein Hütchen mit Richtungswechsel, Ball übergeben.",
    "Zwischen den Spielen 30 Sekunden Pause."
  ],
  coaching: ["Kurze, explosive Antritte.", "Saubere Richtungswechsel (Knie über dem Fuß).", "Spaß darf laut sein."],
  fehler: ["Zu lange Spiele – dann wird es Ausdauer"],
  leichter: "Weniger Fänger.",
  schwerer: "Fänger mit Ball, Abschlagen nur mit Ball in der Hand.",
  quelle: { art: EIGEN, ...Q.ATK },
  g: { f: "frei", e: [["d",30,20,"F"],["d",60,40,"F"],["a",20,40,""],["a",45,15,""],["a",70,20,""],["a",80,45,""],["l",[[30,20],[42,18]]]] }
},

/* ============================ PERSÖNLICHKEIT ============================ */
{
  id: "pe-kapitaene", titel: "Spieler leiten das Aufwärmen", phase: "auf",
  ziele: { at: 1, ko: 1 }, rtk: ["Spielerpersönlichkeiten entwickeln"],
  dauer: [8, 10, 12], spieler: [6, 24], tw: 0, flaeche: "halb", baelle: "mittel", material: ["Hütchen"], intens: 1, harz: false,
  kurz: "Zwei Spieler übernehmen im Wechsel das Aufwärmen nach einer Vorgabe (Laufschule, Passen, Prävention). Fördert Verantwortung und Kommunikation.",
  aufbau: "Die beiden Verantwortlichen bekommen vor dem Training eine Karte mit drei Bausteinen und Zeitvorgabe.",
  ablauf: [
    "Leiter erklären kurz, was gemacht wird, und zeigen vor.",
    "Sie achten auf saubere Ausführung und geben Rückmeldung.",
    "Trainer greift nur ein, wenn es unsicher wird.",
    "Kurzes Feedback an die Leiter danach: Was war gut, was nächstes Mal anders?"
  ],
  coaching: ["Alle kommen dran – nicht nur die Lautesten.", "Erst Erfolg ermöglichen (einfache Vorgaben), dann steigern.", "Loben für Klarheit, nicht für Lautstärke."],
  fehler: ["Trainer übernimmt sofort wieder"],
  leichter: "Ein vorgegebener Ablauf zum Ablesen.",
  schwerer: "Leiter planen das Aufwärmen selbst.",
  quelle: { art: EIGEN, ...Q.RTK_ZIELE },
  g: { f: "frei", e: [["a",50,15,"K"],["a",30,40,""],["a",45,40,""],["a",60,40,""],["a",75,40,""],["t",50,55,"Spieler leiten"]] }
},
{
  id: "pe-spieler-coachen", titel: "Spieler coachen Spieler (Beobachter-Rolle)", phase: "haupt",
  ziele: { ia: 2, iv: 1 }, rtk: ["Spielerpersönlichkeiten entwickeln", "Individuelles Angriffsspiel"],
  dauer: [10, 12, 15], spieler: [6, 21], tw: 1, flaeche: "halb", baelle: "mittel", material: [], intens: 2, harz: false,
  kurz: "Dreiergruppen: Angreifer, Verteidiger und Beobachter. Der Beobachter achtet auf einen vorher festgelegten Coaching-Punkt und gibt nach jeder Aktion einen Satz Rückmeldung.",
  aufbau: "1-gegen-1 im Korridor (oder eine andere Grundübung), pro Korridor eine Dreiergruppe.",
  ablauf: [
    "Trainer nennt den Beobachtungspunkt, z. B. „Tempowechsel vor der Täuschung?“.",
    "Angreifer und Verteidiger spielen 1-gegen-1, Beobachter schaut zu.",
    "Nach jeder Aktion: ein Satz Rückmeldung („Gut war …“, „Probier mal …“).",
    "Rollenwechsel nach 3 Aktionen."
  ],
  coaching: ["Rückmeldung freundlich und konkret – ein Punkt, nicht fünf.", "Beobachten schult das Spielverständnis des Beobachters.", "Trainer coacht die Coaches."],
  fehler: ["Rückmeldung wird zur Kritik", "Beobachter schaut nicht hin"],
  leichter: "Beobachter bekommt eine Karte mit Ja/Nein-Fragen.",
  schwerer: "Beobachter entscheidet, welcher Punkt beobachtet wird.",
  quelle: { art: EIGEN, ...Q.RTK_ZIELE },
  g: { f: "halb", e: [["tw",50,5],["a",50,62,"A"],["d",50,46,"V"],["a",76,58,"B"],["t",76,68,"beobachtet"],["l",[[50,59],[44,50],[52,38]]]] }
},
{
  id: "pe-auszeit", titel: "Auszeit-Training: Spieler finden die Lösung", phase: "spiel",
  ziele: { ma: 2, ko: 1 }, rtk: ["Spielerpersönlichkeiten entwickeln", "Kollektives Angriffsspiel"],
  dauer: [12, 15, 20], spieler: [10, 20], tw: 1, flaeche: "halb", baelle: "wenig", material: ["Leibchen"], intens: 2, harz: false,
  kurz: "Spielform mit inszenierten Problemen: Der Trainer gibt einer Abwehr eine geheime Aufgabe. Das Angriffsteam bekommt eine 60-Sekunden-Auszeit und muss selbst eine Lösung finden.",
  aufbau: "6-gegen-6 auf ein Tor. Abwehrteam bekommt eine geheime Vorgabe (z. B. Manndeckung gegen den RM, 1:5 mit sehr offensivem Vorgezogenen).",
  ablauf: [
    "Angriff spielt 3 Angriffe gegen die veränderte Abwehr.",
    "Auszeit 60 Sekunden: Spieler beraten ohne Trainer, Kapitän fasst die Lösung zusammen.",
    "3 weitere Angriffe mit der eigenen Lösung.",
    "Kurze Besprechung: Was habt ihr gesehen, was hat geholfen? Dann Rollentausch."
  ],
  coaching: ["Trainer hält sich in der Auszeit bewusst raus.", "Jede Lösung würdigen, auch wenn sie nicht klappt.", "Bereitet auf echte Spielsituationen vor."],
  fehler: ["Trainer verrät die Lösung"],
  leichter: "Trainer gibt einen Hinweis.",
  schwerer: "Abwehr wechselt die Vorgabe nach der Auszeit.",
  quelle: { art: EIGEN, ...Q.RTK_ZIELE },
  g: { f: "halb", e: [["tw",50,5],["a",22,58,""],["a",50,64,""],["a",78,58,""],["d",30,46,""],["d",50,48,""],["d",70,46,""],["t",50,88,"60 s Auszeit ohne Trainer"]] }
},
{
  id: "pe-ziele", titel: "Persönliche Ziele für den Lernblock", phase: "aus",
  ziele: {}, rtk: ["Spielerpersönlichkeiten entwickeln", "Leistungsdiagnostische Begleitung"],
  dauer: [5, 8, 10], spieler: [2, 24], tw: 0, flaeche: "drittel", baelle: "wenig", material: [], intens: 1, harz: false,
  kurz: "Zu Beginn eines Lernblocks formuliert jeder Spieler ein Technikziel und ein Verhaltensziel. Am Ende des Blocks wird gemeinsam geprüft. Die RTK fordert individuelle Entwicklungsziele.",
  aufbau: "Kleine Karten oder Handy-Notiz, Gespräch in Zweiergruppen, Trainer geht herum.",
  ablauf: [
    "Trainer stellt das Blockthema vor (z. B. „Angriff gegen Manndeckung“).",
    "Jeder schreibt ein Technikziel („Ich löse mich mit Tempowechsel“) und ein Verhaltensziel („Ich rufe, wenn ich frei bin“).",
    "Partner liest vor, Trainer ergänzt kurz.",
    "Am Ende des Blocks: Selbsteinschätzung auf einer Skala von 1–5."
  ],
  coaching: ["Ziele beobachtbar formulieren.", "Klein und erreichbar.", "Die Karten bleiben beim Spieler – Datenschutz."],
  fehler: ["Ergebnisziele („Wir werden Meister“)"],
  leichter: "Trainer gibt drei Ziele zur Auswahl.",
  schwerer: "Spieler leiten selbst einen Übungsvorschlag ab.",
  quelle: { art: EIGEN, ...Q.RTK_ZIELE },
  g: { f: "frei", e: [["t",50,22,"1 Technikziel"],["t",50,40,"1 Verhaltensziel"]] }
}
,
{
  id: "md-sinkend", titel: "Sinkende Manndeckung: auf Ballhöhe zurücksinken und helfen", phase: "haupt",
  ziele: { iv: 3, ko: 2, ma: 1 }, rtk: ["Individuelles Abwehrspiel", "Kooperatives Abwehrspiel"],
  dauer: [10, 12, 15], spieler: [8, 20], tw: 1, flaeche: "halb", baelle: "wenig", material: ["Leibchen"], intens: 2, harz: false,
  kurz: "Jeder hat seinen Gegenspieler, sinkt aber ohne Ball auf Ballhöhe zurück – höchstens bis zur Freiwurflinie. So werden die Räume enger und Helfen wird möglich. Brücke von der Manndeckung zur 1:5.",
  aufbau: "4-gegen-4 oder 5-gegen-5 auf ein Tor, feste Zuordnung. Freiwurflinie als Grenze: Tiefer als 9 m sinkt niemand.",
  ablauf: [
    "Angreifer passen im Rückraum, zunächst ohne Torabschluss.",
    "Der Verteidiger am Ball steht eng bei seinem Gegenspieler; alle anderen sinken auf Ballhöhe zurück und bleiben zwischen Gegenspieler und Tor.",
    "Kein Verteidiger steht vor dem Ball. Bei Pass tritt der neue Ballverteidiger heraus, die anderen sinken.",
    "Dann frei mit Torabschluss: Bricht ein Angreifer durch, hilft der nächste gesunkene Verteidiger.",
    "Ballgewinn = Punkt, nach 4 Angriffen Wechsel."
  ],
  coaching: ["Ball und Gegenspieler sehen – seitlich stehen, nicht frontal.", "Sinken heißt einen bis zwei Schritte Richtung Tor, nicht bis an den Kreis.", "Helfen und sofort zurück zum eigenen Gegenspieler."],
  fehler: ["Alle sinken bis auf 6 m (dann wird es eine verbotene defensive Abwehr)", "Verteidiger verliert seinen Gegenspieler aus dem Blick"],
  leichter: "Angreifer passen im Stand.",
  schwerer: "Angreifer spielen mit Einläufern und Kreuzen.",
  quelle: { art: EIGEN, ...Q.HVNB },
  g: { f: "halb", e: [["tw",50,5],["a",22,58,""],["a",50,64,""],["a",78,58,""],["a",8,16,""],["d",24,52,""],["d",50,50,""],["d",72,48,""],["d",16,24,""],["l",[[50,52],[50,48]]],["l",[[74,50],[70,46]]],["b",24,60],["t",50,88,"ohne Ball: auf Ballhöhe sinken"]] }
}
];


/* ===================== THEMEN UND METHODIKREIHEN =====================
 * Ein Thema bündelt Übungen in vier Stufen:
 *  1 = Vorübung (ohne/mit passivem Gegner), 2 = Übung mit Gegner (Kleingruppe),
 *  3 = Komplexübung (spielnah), 4 = Spielform mit Sonderregel.
 * Pro Stufe mehrere Übungen möglich (der Planer wählt nach Rahmenbedingungen).
 * „regel“ wird bei der Spielform als Sonderregel in den Plan geschrieben.
 */
window.THEMEN = [
  { id: "kreuzen", titel: "Kreuzen und Weiterspielen", bereich: "Angriff",
    kurz: "Kreuzbewegungen im Rückraum als Mittel, die offensive Abwehr in Entscheidungsnot zu bringen – und danach weiterspielen.",
    ziele: { ko: 4, ma: 2, ia: 1 },
    regel: "Tor nach Kreuzen oder direkt nach dem Weiterspielen aus dem Kreuzen zählt doppelt.",
    stufen: { 1: ["mr-kreuzen-laufwege"], 2: ["ko-kreuzen"], 3: ["mr-kreuzen-3g3"], 4: ["sp-themaspiel-kreuzen", "sp-themenspiel"] } },
  { id: "offensiv", titel: "Angriff gegen offensive Abwehr (3:3, 1:5)", bereich: "Angriff",
    kurz: "Tiefe statt Breite: tief starten, in Lücken stoßen, Räume hinter der vorderen Abwehrreihe nutzen. In der C-Jugend decken die Gegner offensiv (Pflicht).",
    ziele: { ma: 3, ko: 3, ia: 1 },
    regel: "Tor nach einem Anspiel hinter die vordere Abwehrreihe (Kreis, Einläufer, Außen in der Tiefe) zählt doppelt.",
    stufen: { 1: ["mr-stossen-luecke"], 2: ["ko-2g1-parallel", "ko-uebergang"], 3: ["ma-angriff-offensiv", "mr-kreuzen-3g3", "ko-3g3-seite"], 4: ["sp-themenspiel", "sp-6g6-aufgabe"] } },
  { id: "manndeckung", titel: "Angriff gegen Manndeckung", bereich: "Angriff",
    kurz: "Freilaufen mit Tempo- und Richtungswechsel, Sperren ohne Ball, Räume für das 1-gegen-1 schaffen.",
    ziele: { ia: 3, ko: 3, at: 1 },
    regel: "Abwehr spielt Manndeckung. Tor nach Sperre oder nach gewonnenem 1-gegen-1 zählt doppelt.",
    stufen: { 1: ["mr-mann-freilaufen"], 2: ["mr-mann-sperre"], 3: ["mr-mann-4g4"], 4: ["sp-themenspiel", "sp-2x3g3"] } },
  { id: "eins-gegen-eins", titel: "1-gegen-1 im Angriff: Täuschen und Durchbrechen", bereich: "Angriff",
    kurz: "Kernziel des Grundlagentrainings: positionsübergreifend ein großes Repertoire an Täuschungen und Durchbrüchen.",
    ziele: { ia: 4, wt: 1, at: 1 },
    regel: "Tor nach erfolgreichem Durchbruch (Gegenspieler ausgespielt) zählt doppelt.",
    stufen: { 1: ["ia-tauschung-serie", "prae-finten"], 2: ["ia-1g1-korridor", "kf-1g1-matte"], 3: ["ia-wurffinte", "iv-1g1-raum"], 4: ["sp-themenspiel", "sp-4p1"] } },
  { id: "kreis", titel: "Zusammenspiel mit dem Kreis", bereich: "Angriff",
    kurz: "Sperren, Absetzen und Kreisanspiel – jeder Spieler lernt die Kreisposition kennen.",
    ziele: { ko: 3, ia: 1, wt: 1 },
    regel: "Tor durch den Kreisläufer oder nach einer Sperre des Kreisläufers zählt doppelt.",
    stufen: { 1: ["ia-kreis"], 2: ["ko-sperre-absetzen"], 3: ["mr-kreis-3g3"], 4: ["sp-themenspiel"] } },
  { id: "abwehr33", titel: "Balleroberung in der 3:3-Abwehr", bereich: "Abwehr",
    kurz: "Heraustreten, Passwege zustellen, Helfen und Übergeben – und nach Ballgewinn sofort umschalten.",
    ziele: { iv: 3, ma: 3, ko: 2, te: 1 },
    regel: "Abwehr spielt 3:3. Ballgewinn der Abwehr zählt 1 Punkt, Tor nach Ballgewinn im direkten Gegenstoß 2 Punkte.",
    stufen: { 1: ["iv-heraustreten", "iv-grundstellung"], 2: ["iv-passwege", "mr-abw-kreuzen", "ko-helfen-sichern", "kf-abwehr-linie"], 3: ["ma-33-grundform", "ko-3g3-seite"], 4: ["sp-themenspiel", "sp-6g6-aufgabe"] } },
  { id: "abwehr15", titel: "1:5-Abwehr: vorgezogen stören, hinten mutig heraustreten", bereich: "Abwehr",
    kurz: "Die erste Raumdeckung laut RTK. Der Vorgezogene stört den Spielaufbau, die hintere Reihe tritt ballorientiert heraus.",
    ziele: { iv: 3, ma: 3, ko: 1 },
    regel: "Abwehr spielt 1:5. Ballgewinn durch den Vorgezogenen zählt 2 Punkte, jeder andere Ballgewinn 1 Punkt.",
    stufen: { 1: ["iv-grundstellung", "iv-heraustreten"], 2: ["iv-kreisverteidigung", "ko-helfen-sichern", "md-sinkend", "kf-abwehr-linie"], 3: ["ma-15-grundform", "ko-3g3-seite"], 4: ["sp-themenspiel"] } },
  { id: "gegenstoss", titel: "Tempospiel: 1. und 2. Welle", bereich: "Umschalten",
    kurz: "Nach Ballgewinn oder Torwurf in Kleingruppen mit Kurzpässen schnell abschließen; schnelles Zurücklaufen gehört dazu.",
    ziele: { te: 4, ko: 2, at: 2 },
    regel: "Tor innerhalb von 8 Sekunden nach Ballgewinn zählt doppelt; Abwehr muss nach eigenem Torwurf sofort zurücklaufen.",
    stufen: { 1: ["mr-gegenstoss-passfolge"], 2: ["te-endlos"], 3: ["te-gegenstoss-32", "te-rueckzug"], 4: ["sp-6g6-aufgabe", "sp-2x3g3", "sp-endzone", "kf-3g3-matten"] } },
  { id: "abwehr24", titel: "2:4-Abwehr: Rückraum außen aus dem Spiel nehmen", bereich: "Abwehr",
    kurz: "Zwei vorgezogene Halbverteidiger stören die Rückraumspieler außen, vier sichern hinten. Erlaubte Zweilinien-Abwehr; wichtig ist die Absprache gegen den Mittelspieler.",
    ziele: { iv: 3, ma: 3, ko: 2 },
    regel: "Abwehr spielt 2:4. Ballgewinn durch einen vorgezogenen Verteidiger zählt 2 Punkte, jeder andere Ballgewinn 1 Punkt.",
    stufen: { 1: ["iv-heraustreten", "iv-grundstellung"], 2: ["ab24-halbverteidiger", "ko-helfen-sichern"], 3: ["ab24-grundform", "ko-3g3-seite"], 4: ["sp-themenspiel"] } },
  { id: "abwehrmann", titel: "Manndeckung als eigene Abwehr", bereich: "Abwehr",
    kurz: "Manndeckung der ganzen Mannschaft: Zuordnung, Ball und Mann sehen, gegen Sperren bestehen und auf Wunsch über das ganze Feld pressen.",
    ziele: { iv: 4, ko: 2, at: 2 },
    regel: "Abwehr spielt Manndeckung. Ballgewinn zählt 1 Punkt, Ballgewinn in der gegnerischen Hälfte 2 Punkte.",
    stufen: { 1: ["md-grundprinzipien", "iv-grundstellung"], 2: ["md-gegen-sperre", "md-sinkend", "iv-1g1-raum"], 3: ["md-ganzfeld", "mr-mann-4g4"], 4: ["sp-themenspiel", "sp-2x3g3"] } },
  { id: "positionsangriff", titel: "Positionsangriff: Breite, Tiefe, Positionen", bereich: "Angriff",
    kurz: "Strukturierter Angriff mit klaren Räumen; jeder lernt die Aufgaben auf Halb, Außen, Kreis und Mitte.",
    ziele: { ma: 3, ko: 3, ia: 1 },
    regel: "Tor nach Zusammenspiel von mindestens drei Positionen oder nach Positionswechsel zählt doppelt.",
    stufen: { 1: ["pos-halb-nahtstelle", "pos-kreis-sperre"], 2: ["pos-rm-spielmacher", "mr-kreis-3g3"], 3: ["ma-positionsangriff", "ko-3g3-seite"], 4: ["sp-themenspiel", "pe-auszeit"] } }
];
