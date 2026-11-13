# Trainingshalle – Trainingsplaner

Web-App für ein Trainerteam im Jugendbereich. Sie läuft im Browser auf Android-Handy und -Tablet, lässt sich auf den Startbildschirm legen und funktioniert danach **auch ohne Internet in der Halle**.

## Funktionen

- **Planer:** Hier stellst du die Rahmenbedingungen ein: Trainingszeit, Spielerzahl, Torhüter, Hallenfläche, Bälle, Haftmittel, Material und den Abstand zum nächsten Spiel. Die Schwerpunkte setzt du im Spinnendiagramm.
- **Plan:** Der Planer erstellt automatisch Aufwärmen, Prävention, Hauptteil, Spielform und Ausklang.
  - Pro Baustein kannst du die Dauer ändern, die Reihenfolge verschieben, eine Alternative wählen oder den Text für diesen Plan anpassen.
  - Export als Druck/PDF, als Text zum Teilen oder als HTML-Datei mit Grafiken.
- **Übungen:** Bibliothek mit Grafik, Ablauf, Coaching-Punkten, Fehlerbildern, Variationen und Quelle; dazu der Button „Änderung vorschlagen“, der ein Issue öffnet.
- **Taktik:** Taktiktafel mit Spielern, Ball, Laufwegen, Pässen und Würfen.
  - Schritte anlegen, abspielen und als Szenen speichern.
  - Jeden Schritt als Bild teilen.
- **Regeln & Mehr:** Spielregeln, Leitlinien, Einstellungen und Backup.

## Veröffentlichen (GitHub Pages)

1. Repository anlegen, z. B. `trainingshalle`.
2. Alle Dateien dieses Ordners hochladen, inklusive des Ordners `.github`.
3. Unter **Settings → Pages** die Quelle „Deploy from a branch“, den Branch `main` und den Ordner `/ (root)` wählen.
4. Nach ein bis zwei Minuten ist die App unter `https://<name>.github.io/trainingshalle/` erreichbar.
5. Am Handy in Chrome öffnen, dann **⋮ → Zum Startbildschirm hinzufügen**.
6. In der App unter **Regeln & Mehr** das Repository eintragen (`<name>/trainingshalle`).

Die Seite ist für Suchmaschinen auf `noindex` gesetzt.

**Nach Änderungen:** In `sw.js` die Zeile `VERSION` hochzählen, damit die Geräte die neue Fassung laden.

## Übungen pflegen

Alle Übungen stehen in `uebungen.js`. Oben in der Datei ist jedes Feld erklärt. Bestehende `id`s bitte nicht ändern, weil gespeicherte Pläne auf sie verweisen. Die Beschreibungen sind eigene Formulierungen; die Quellen nennen die fachliche Grundlage.

## Datenschutz

Alle Daten bleiben im Browser des jeweiligen Geräts. Es gibt keinen Server und kein Tracking, und es werden keine Spielerdaten gespeichert.
