# Games

Meine Sammlung von HTML5-Mini-Spielen. Jedes Spiel liegt in einem eigenen Ordner.

| Spiel | Ordner | Beschreibung |
|-------|--------|--------------|
| Plink! | [`plink/`](plink/) | Vier-in-einer-Reihe mit 10 Gegnern, sammelbaren Chips und Pass & Play (YouTube Playables) |
| Solo Stack | [`solo-stack/`](solo-stack/) | Solitär-Kartenspiel (YouTube Playables) |

## Lokal starten

```
cd plink && python3 -m http.server 8000
```
Dann `http://localhost:8000` im Browser öffnen.

## Online spielen (GitHub Pages)

Nach Aktivierung von Pages: `https://olijanz.github.io/games/` (Übersicht) bzw. `https://olijanz.github.io/games/plink/` bzw. `.../solo-stack/`.

## Neues Spiel hinzufügen

Neuen Ordner anlegen (z. B. `meinspiel/` mit `index.html`) und eine Karte in der Haupt-`index.html` ergänzen.
