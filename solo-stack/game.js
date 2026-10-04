/*! Solo Stack — patience card game (Klondike rules). Built for YouTube Playables. Vanilla JS, no dependencies. */
(function () {
  'use strict';

  /* Development builds only: true adds a console handle (window.SOLO) and dev buttons in Statistics. Keep false for release. */
  const DEV = false;
  /* Language used outside YouTube when the setting is "Automatic" (inside YouTube the SDK decides). */
  const PREVIEW_LANG = 'en';

  /* =====================================================================
     CONFIG — designs, unlocks and timings. Edit numbers and text, not code.
     ===================================================================== */
  const CONFIG = {
    saveVersion: 1,
    saveDebounceMs: 900,
    undoSaved: 30,       // undo steps kept in the cloud save (unlimited while playing)
    recentAvoid: 40,     // a random deal never repeats one of your last 40 deals in that mode
    autoStepMs: 120,     // pace of automatic foundation moves
    finishStepMs: 85,    // pace of auto-finish
    hintMs: 1800,        // how long a hint stays highlighted
    dealStaggerMs: 22,
    leaderboard: { enabled: false }, // would send the best score via sendScore

    /* unlock types: start · wins n · daily n (dailies completed) · dstreak n (best daily streak)
       fast s (win in under s seconds) · streak n (win n in a row) · wins3 n (wins in Draw 3) */
    backs: [
      { id: 'lattice', name: { en: 'Classic Blue', de: 'Klassisch Blau' }, unlock: { type: 'start' } },
      { id: 'ruby', name: { en: 'Ruby', de: 'Rubin' }, unlock: { type: 'start' } },
      { id: 'pine', name: { en: 'Pine', de: 'Tanne' }, unlock: { type: 'wins', n: 1 } },
      { id: 'dune', name: { en: 'Dune', de: 'Düne' }, unlock: { type: 'wins', n: 3 } },
      { id: 'night', name: { en: 'Starry Night', de: 'Sternennacht' }, unlock: { type: 'wins', n: 5 }, emblem: 'moon' },
      { id: 'ember', name: { en: 'Ember', de: 'Glut' }, unlock: { type: 'streak', n: 3 }, emblem: 'flame' },
      { id: 'honey', name: { en: 'Honey', de: 'Honig' }, unlock: { type: 'daily', n: 3 }, emblem: 'hex' },
      { id: 'tide', name: { en: 'Tide', de: 'Gezeiten' }, unlock: { type: 'wins', n: 10 } },
      { id: 'flash', name: { en: 'Lightning', de: 'Blitz' }, unlock: { type: 'fast', n: 180 }, emblem: 'bolt' },
      { id: 'trio', name: { en: 'Trio', de: 'Trio' }, unlock: { type: 'wins3', n: 5 } },
      { id: 'royal', name: { en: 'Royal', de: 'Royal' }, unlock: { type: 'wins', n: 25 }, emblem: 'crown' },
      { id: 'gold', name: { en: 'Gold', de: 'Gold' }, unlock: { type: 'wins', n: 50 }, emblem: 'star' },
    ],
    tables: [
      { id: 'felt', name: { en: 'Classic Green', de: 'Klassisch Grün' }, unlock: { type: 'start' } },
      { id: 'ocean', name: { en: 'Deep Blue', de: 'Tiefblau' }, unlock: { type: 'wins', n: 2 } },
      { id: 'wine', name: { en: 'Bordeaux', de: 'Bordeaux' }, unlock: { type: 'wins', n: 8 } },
      { id: 'slate', name: { en: 'Slate', de: 'Schiefer' }, unlock: { type: 'dstreak', n: 3 } },
      { id: 'walnut', name: { en: 'Walnut', de: 'Nussbaum' }, unlock: { type: 'wins', n: 20 } },
      { id: 'aurora', name: { en: 'Aurora', de: 'Polarlicht' }, unlock: { type: 'wins', n: 40 } },
    ],
  };

  /* =====================================================================
     Text — English is required by YouTube; German is the second language.
     ===================================================================== */
  const STR = {
    en: {
      score: 'Score', time: 'Time', moves: 'Moves',
      new: 'New', daily: 'Daily', hint: 'Hint', undo: 'Undo', menu: 'Menu',
      draw1: 'Draw 1', draw3: 'Draw 3', dealNo: 'Deal #{n}', dailyDeal: 'Daily · {date}',
      finish: 'Auto-finish',
      newGame: 'New game', stats: 'Statistics', designs: 'Designs', settings: 'Settings', howTo: 'How to play', close: 'Close',
      giveUpTitle: 'Start a new game?', giveUpBody: 'The current game will count as not won.', giveUpYes: 'New game', keepPlaying: 'Keep playing',
      stuckTitle: 'No more moves', stuckBody: 'Undo a few moves or start a new game. Every deal in Solo Stack can be won.', stuckUndo: 'Undo', stuckNew: 'New game', stuckKeep: 'Keep looking',
      won: 'You win!', wonDaily: 'Daily complete!', timeBonus: 'Time bonus', total: 'Score',
      bestTime: 'Best time', bestScore: 'Best score', fewestMoves: 'Fewest moves', newBest: 'New best',
      played: 'Played', wins: 'Won', winRate: 'Win rate', streak: 'Current streak', bestStreak: 'Best streak',
      dailyTitle: 'Daily challenge', dailyIntro: 'One deal per day, the same for everyone. Every daily can be won.',
      dailyDone: 'Done today', dailyOpen: 'Not played yet today', dailyStreak: 'Daily streak', dailyBest: 'Best daily streak', dailyTotal: 'Dailies completed',
      days: '{n} days', day1: '1 day', play: 'Play', resume: 'Resume', playAgain: 'Play again', dailyMode: 'Mode for today',
      backs: 'Card backs', tables: 'Tables', inUse: 'In use', newBadge: 'NEW',
      u_start: 'Starter design', u_wins: 'Win {n} games', u_wins1: 'Win a game', u_daily: 'Complete {n} dailies', u_dstreak: '{n}-day daily streak',
      u_fast: 'Win in under {m} minutes', u_streak: 'Win {n} in a row', u_wins3: 'Win {n} games in Draw 3',
      newDesign: 'New design unlocked', toDesigns: 'See designs',
      drawMode: 'Draw mode', drawModeNote: 'Applies to the next game', autoFound: 'Auto-move safe cards', autoFoundNote: 'Aces, twos and cards nothing else needs go up by themselves',
      left: 'Left-handed layout', leftNote: 'Stock on the right', sound: 'Sound effects', language: 'Language', langAuto: 'Automatic',
      welcome: 'Welcome back', welcomeSub: 'Your game is right where you left it',
      tipFirst: 'Tap a card to move it, or drag it', drawTip: 'Draw from the stock',
      overall: 'All games', today: 'Today',
      rules: [
        ['Goal', 'Move all 52 cards to the four piles at the top, one pile per suit, from ace up to king.'],
        ['Columns', 'Build down in alternating colours: a red 7 goes on a black 8. You can move a whole sorted run at once. Only a king (or a run starting with a king) can go into an empty column.'],
        ['Stock', 'Tap the stock to draw 1 or 3 cards. When it runs out, tap again to turn the cards over. You can go through it as often as you like.'],
        ['Tips', 'Tap a card and it jumps to the best spot. Turning over face-down cards is usually the best move. Every deal can be won.'],
        ['Scoring', 'Card to a top pile +10 · card from the stock to a column +5 · turning a card over +5 · card back down from a top pile −15 · turning the stock over −100 (Draw 1) or −20 after the third time (Draw 3) · a fast win earns a time bonus.'],
      ],
    },
    de: {
      score: 'Punkte', time: 'Zeit', moves: 'Züge',
      new: 'Neu', daily: 'Täglich', hint: 'Tipp', undo: 'Zurück', menu: 'Menü',
      draw1: 'Ziehe 1', draw3: 'Ziehe 3', dealNo: 'Spiel #{n}', dailyDeal: 'Tagesaufgabe · {date}',
      finish: 'Fertigstellen',
      newGame: 'Neues Spiel', stats: 'Statistik', designs: 'Designs', settings: 'Einstellungen', howTo: 'Spielregeln', close: 'Schließen',
      giveUpTitle: 'Neues Spiel starten?', giveUpBody: 'Das laufende Spiel zählt dann als nicht gewonnen.', giveUpYes: 'Neues Spiel', keepPlaying: 'Weiterspielen',
      stuckTitle: 'Keine Züge mehr', stuckBody: 'Mach ein paar Züge rückgängig oder starte neu. Jedes Spiel in Solo Stack ist lösbar.', stuckUndo: 'Rückgängig', stuckNew: 'Neues Spiel', stuckKeep: 'Weitersuchen',
      won: 'Gewonnen!', wonDaily: 'Tagesaufgabe geschafft!', timeBonus: 'Zeitbonus', total: 'Punkte',
      bestTime: 'Bestzeit', bestScore: 'Höchste Punktzahl', fewestMoves: 'Wenigste Züge', newBest: 'Neuer Rekord',
      played: 'Gespielt', wins: 'Gewonnen', winRate: 'Siegquote', streak: 'Aktuelle Serie', bestStreak: 'Beste Serie',
      dailyTitle: 'Tagesaufgabe', dailyIntro: 'Jeden Tag eine Mischung, für alle gleich. Jede Tagesaufgabe ist lösbar.',
      dailyDone: 'Heute geschafft', dailyOpen: 'Heute noch offen', dailyStreak: 'Tagesserie', dailyBest: 'Beste Tagesserie', dailyTotal: 'Tagesaufgaben geschafft',
      days: '{n} Tage', day1: '1 Tag', play: 'Spielen', resume: 'Fortsetzen', playAgain: 'Nochmal spielen', dailyMode: 'Modus für heute',
      backs: 'Kartenrücken', tables: 'Tische', inUse: 'Aktiv', newBadge: 'NEU',
      u_start: 'Start-Design', u_wins: 'Gewinne {n} Spiele', u_wins1: 'Gewinne ein Spiel', u_daily: 'Schaffe {n} Tagesaufgaben', u_dstreak: '{n} Tage Tagesserie',
      u_fast: 'Gewinne in unter {m} Minuten', u_streak: 'Gewinne {n}-mal in Folge', u_wins3: 'Gewinne {n} Spiele mit Ziehe 3',
      newDesign: 'Neues Design freigeschaltet', toDesigns: 'Zu den Designs',
      drawMode: 'Ziehmodus', drawModeNote: 'Gilt ab dem nächsten Spiel', autoFound: 'Sichere Karten automatisch ablegen', autoFoundNote: 'Asse, Zweien und Karten, die nicht mehr gebraucht werden, wandern von selbst nach oben',
      left: 'Linkshänder-Layout', leftNote: 'Nachziehstapel rechts', sound: 'Soundeffekte', language: 'Sprache', langAuto: 'Automatisch',
      welcome: 'Willkommen zurück', welcomeSub: 'Dein Spiel ist genau da, wo du aufgehört hast',
      tipFirst: 'Tippe eine Karte an, um sie zu legen, oder zieh sie', drawTip: 'Zieh vom Stapel',
      overall: 'Alle Spiele', today: 'Heute',
      rules: [
        ['Ziel', 'Lege alle 52 Karten auf die vier Ablagestapel oben, einen pro Farbe, vom Ass bis zum König.'],
        ['Spalten', 'Baue abwärts in wechselnden Farben: Eine rote 7 kommt auf eine schwarze 8. Sortierte Reihen kannst du komplett verschieben. In eine leere Spalte passt nur ein König oder eine Reihe, die mit einem König beginnt.'],
        ['Stapel', 'Tippe auf den Stapel, um 1 oder 3 Karten zu ziehen. Ist er leer, tippe erneut, um die Karten umzudrehen. Das geht beliebig oft.'],
        ['Tipps', 'Tippe eine Karte an, und sie springt an die beste Stelle. Verdeckte Karten aufzudecken ist meist der beste Zug. Jedes Spiel ist lösbar.'],
        ['Punkte', 'Karte auf die Ablage +10 · Karte vom Stapel in eine Spalte +5 · Karte aufdecken +5 · Karte von der Ablage zurück −15 · Stapel umdrehen −100 (Ziehe 1) bzw. −20 ab dem vierten Mal (Ziehe 3) · ein schneller Sieg bringt einen Zeitbonus.'],
      ],
    },
  };
  const RANKS = { en: ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'], de: ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'B', 'D', 'K'] };

  /* =====================================================================
     Rules core — Klondike patience. Pure functions, no DOM.
     Shared by the game and by tools/solver.js (which checks deals).
     Card id 0–51: suit = id / 13 (0 spades, 1 hearts, 2 diamonds, 3 clubs), rank = id % 13 + 1 (1 ace … 13 king).
     ===================================================================== */
  const Rules = (function () {
    const suitOf = (c) => (c / 13) | 0;
    const rankOf = (c) => (c % 13) + 1;
    const isRed = (c) => { const s = (c / 13) | 0; return s === 1 || s === 2; };
    const SCORE = { toFound: 10, wasteToTab: 5, flip: 5, foundToTab: -15, recycle1: -100, recycle3: -20, free3: 3 };

    function mulberry32(a) {
      return function () {
        a = (a + 0x6D2B79F5) | 0;
        let t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
      };
    }

    /* A deal is fully determined by its seed. Stock top = last array element. */
    function deal(seed, draw) {
      const deck = [];
      for (let i = 0; i < 52; i++) deck.push(i);
      const r = mulberry32(((seed >>> 0) ^ 0x9e3779b9) | 0);
      for (let i = 51; i > 0; i--) {
        const j = Math.floor(r() * (i + 1));
        const t = deck[i]; deck[i] = deck[j]; deck[j] = t;
      }
      const tab = [[], [], [], [], [], [], []];
      let k = 0;
      for (let row = 0; row < 7; row++) for (let col = row; col < 7; col++) tab[col].push(deck[k++]);
      return {
        seed: seed >>> 0, draw: draw === 3 ? 3 : 1,
        tab, down: [0, 1, 2, 3, 4, 5, 6], found: [0, 0, 0, 0],
        stock: deck.slice(k), waste: [],
        score: 0, moves: 0, recycles: 0,
      };
    }

    function clone(s) {
      return {
        seed: s.seed, draw: s.draw, tab: s.tab.map((c) => c.slice()), down: s.down.slice(), found: s.found.slice(),
        stock: s.stock.slice(), waste: s.waste.slice(), score: s.score, moves: s.moves, recycles: s.recycles,
      };
    }

    const top = (arr) => arr[arr.length - 1];
    // Can a run whose bottom card is `card` go onto column `col`?
    function canTab(s, card, col) {
      const t = s.tab[col];
      if (!t.length) return rankOf(card) === 13;
      const c = t[t.length - 1];
      return rankOf(c) === rankOf(card) + 1 && isRed(c) !== isRed(card);
    }
    const canFound = (s, card) => s.found[suitOf(card)] === rankOf(card) - 1;
    const foundTop = (s, suit) => (s.found[suit] ? suit * 13 + s.found[suit] - 1 : -1);
    const isWon = (s) => s.found[0] + s.found[1] + s.found[2] + s.found[3] === 52;

    /* Moves: { f: 'w' | 't' | 'f', i: source column or suit, n: cards (tableau runs), to: 't' | 'f', j: target column }.
       `legal` checks a move against the current state. */
    function movingCard(s, m) {
      if (m.f === 'w') return s.waste.length ? top(s.waste) : -1;
      if (m.f === 'f') return foundTop(s, m.i);
      const t = s.tab[m.i];
      if (!t || m.n < 1 || m.n > t.length - s.down[m.i]) return -1;
      return t[t.length - m.n];
    }
    function legal(s, m) {
      const c = movingCard(s, m);
      if (c < 0) return false;
      if (m.to === 'f') return (m.f === 'w' || (m.f === 't' && m.n === 1)) && canFound(s, c);
      if (m.to === 't') return m.j >= 0 && m.j < 7 && !(m.f === 't' && m.i === m.j) && canTab(s, c, m.j);
      return false;
    }
    // Applies a legal move. Returns { cards, flip } where flip is the column whose new top card turned face up (or -1).
    function apply(s, m) {
      let cards;
      if (m.f === 'w') cards = [s.waste.pop()];
      else if (m.f === 'f') { cards = [foundTop(s, m.i)]; s.found[m.i]--; }
      else cards = s.tab[m.i].splice(s.tab[m.i].length - m.n, m.n);
      let pts = 0;
      if (m.to === 'f') { s.found[suitOf(cards[0])]++; pts += SCORE.toFound; }
      else {
        for (const c of cards) s.tab[m.j].push(c);
        if (m.f === 'w') pts += SCORE.wasteToTab;
        else if (m.f === 'f') pts += SCORE.foundToTab;
      }
      let flip = -1;
      if (m.f === 't') {
        const t = s.tab[m.i];
        if (!t.length) s.down[m.i] = 0;
        else if (s.down[m.i] >= t.length) { s.down[m.i] = t.length - 1; flip = m.i; pts += SCORE.flip; }
      }
      s.score = Math.max(0, s.score + pts);
      s.moves++;
      return { cards, flip };
    }
    // Tap on the stock: draw 1 or 3, or turn the waste over when the stock is empty.
    function drawStep(s) {
      if (!s.stock.length) {
        if (!s.waste.length) return null;
        s.stock = s.waste.reverse();
        s.waste = [];
        s.recycles++;
        const pen = s.draw === 1 ? SCORE.recycle1 : (s.recycles > SCORE.free3 ? SCORE.recycle3 : 0);
        s.score = Math.max(0, s.score + pen);
        s.moves++;
        return { recycle: true, cards: s.stock.slice() };
      }
      const n = Math.min(s.draw, s.stock.length);
      const cards = [];
      for (let i = 0; i < n; i++) { const c = s.stock.pop(); s.waste.push(c); cards.push(c); }
      s.moves++;
      return { recycle: false, cards };
    }
    const timeBonus = (secs) => (secs >= 30 ? Math.floor(700000 / secs) : 0);

    /* Talon as one list in draw order: T = waste (oldest first) + stock (next draw first); p = cards already drawn.
       With unlimited redeals, which talon cards can become the waste top without playing anything else? */
    function talon(s) { return { T: s.waste.concat(s.stock.slice().reverse()), p: s.waste.length }; }
    function reachable(len, p, k) {
      const out = [];
      if (!len) return out;
      if (k === 1) { for (let i = 0; i < len; i++) out.push(i); return out; }
      const seen = new Uint8Array(len);
      const add = (i) => { if (!seen[i]) { seen[i] = 1; out.push(i); } };
      if (p > 0) add(p - 1);
      for (let q = p + k; ; q += k) { add(Math.min(q, len) - 1); if (q >= len) break; }
      for (let q = k; ; q += k) { add(Math.min(q, len) - 1); if (q >= len) break; }
      return out;
    }

    // A card that no other card could still need as a landing spot.
    function safeToFound(s, c) {
      const r = rankOf(c);
      if (r <= 2) return true;
      const red = isRed(c);
      const a = red ? s.found[0] : s.found[1], b = red ? s.found[3] : s.found[2];
      return Math.min(a, b) >= r - 1;
    }
    // Next automatic foundation move (tableau tops and waste top), or null.
    function nextSafeMove(s) {
      if (s.waste.length) { const c = top(s.waste); if (canFound(s, c) && safeToFound(s, c)) return { f: 'w', to: 'f' }; }
      for (let i = 0; i < 7; i++) {
        const t = s.tab[i];
        if (t.length > s.down[i]) { const c = top(t); if (canFound(s, c) && safeToFound(s, c)) return { f: 't', i, n: 1, to: 'f' }; }
      }
      return null;
    }

    /* Hints — only uses what the player can see. Returns moves ranked by usefulness (highest first).
       Pointless shuffles (moving a full run between columns without revealing anything) are left out. */
    function hints(s) {
      const out = [];
      const add = (m, p, kind) => out.push({ m, p, kind });
      const kingWaiting = () => {
        if (s.waste.length && rankOf(top(s.waste)) === 13) return true;
        const { T, p } = talon(s);
        for (const i of reachable(T.length, p, s.draw)) if (rankOf(T[i]) === 13) return true;
        for (let i = 0; i < 7; i++) if (s.down[i] > 0 && s.tab[i].length > s.down[i] && rankOf(s.tab[i][s.down[i]]) === 13) return true;
        return false;
      };
      let kingCheck = null;
      for (let i = 0; i < 7; i++) {
        const t = s.tab[i], d = s.down[i], up = t.length - d;
        if (!up) continue;
        const c = top(t);
        if (canFound(s, c)) add({ f: 't', i, n: 1, to: 'f' }, up === 1 && d > 0 ? 95 : 70, 'found');
        for (let n = up; n >= 1; n--) {
          const base = t[t.length - n];
          const whole = n === up;
          for (let j = 0; j < 7; j++) {
            if (j === i || !canTab(s, base, j)) continue;
            const empty = !s.tab[j].length;
            if (whole) {
              if (d > 0) add({ f: 't', i, n, to: 't', j }, empty ? 80 : 88 + Math.min(d, 6), 'reveal');
              else if (!empty && rankOf(base) !== 13) {
                if (kingCheck === null) kingCheck = kingWaiting();
                if (kingCheck) add({ f: 't', i, n, to: 't', j }, 40, 'clear');
              }
            } else if (!empty) {
              const exposed = t[t.length - n - 1];
              if (canFound(s, exposed)) add({ f: 't', i, n, to: 't', j }, 50, 'partial');
            }
            if (empty) break; // one empty target is enough
          }
        }
      }
      if (s.waste.length) {
        const c = top(s.waste);
        if (canFound(s, c)) add({ f: 'w', to: 'f' }, 75, 'found');
        for (let j = 0; j < 7; j++) {
          if (!canTab(s, c, j)) continue;
          add({ f: 'w', to: 't', j }, s.tab[j].length ? 60 : 58, 'waste');
          if (!s.tab[j].length) break;
        }
      }
      out.sort((a, b) => b.p - a.p);
      // Would drawing help? Some talon card that is not the waste top can be played somewhere.
      let drawHelps = false;
      if (s.stock.length || s.waste.length) {
        const { T, p } = talon(s);
        for (const idx of reachable(T.length, p, s.draw)) {
          if (idx === p - 1) continue; // the current waste top is covered above
          const c = T[idx];
          if (canFound(s, c)) { drawHelps = true; break; }
          for (let j = 0; j < 7; j++) if (canTab(s, c, j)) { drawHelps = true; break; }
          if (drawHelps) break;
        }
      }
      return { moves: out, drawHelps };
    }

    /* Auto-finish: when every tableau card is face up, plays everything to the foundations.
       Returns the action list ({ m } or { draw: true }) or null if it can't finish. */
    function finishPlan(s0) {
      for (let i = 0; i < 7; i++) if (s0.down[i] > 0) return null;
      const s = clone(s0), plan = [];
      let idle = 0;
      for (let guard = 0; guard < 2000 && !isWon(s); guard++) {
        let best = null, bestRank = 99;
        if (s.waste.length) { const c = top(s.waste); if (canFound(s, c)) { best = { f: 'w', to: 'f' }; bestRank = rankOf(c); } }
        for (let i = 0; i < 7; i++) {
          if (!s.tab[i].length) continue;
          const c = top(s.tab[i]);
          if (canFound(s, c) && rankOf(c) < bestRank) { best = { f: 't', i, n: 1, to: 'f' }; bestRank = rankOf(c); }
        }
        if (best) { apply(s, best); plan.push({ m: best }); idle = 0; continue; }
        if (!s.stock.length && !s.waste.length) return null;
        if (++idle > Math.ceil((s.stock.length + s.waste.length) / s.draw) + 2) return null;
        drawStep(s);
        plan.push({ draw: true });
      }
      return isWon(s) ? plan : null;
    }

    /* Compact text form (saves and undo). Cards are single letters A–Z a–z. */
    const ALPHA = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
    const enc = (arr) => arr.map((c) => ALPHA[c]).join('');
    function encode(s) {
      return [s.seed, s.draw, s.tab.map((t, i) => s.down[i].toString(36) + enc(t)).join('.'),
        s.found.map((n) => n.toString(14)).join(''), enc(s.stock), enc(s.waste), s.score, s.moves, s.recycles].join('~');
    }
    function decode(str) { // null for anything that is not a consistent position
      if (typeof str !== 'string' || str.length > 400) return null;
      const p = str.split('~');
      if (p.length !== 9) return null;
      const dec = (x) => { const a = []; for (const ch of x) { const v = ALPHA.indexOf(ch); if (v < 0) return null; a.push(v); } return a; };
      const num = (x) => (/^\d{1,9}$/.test(x) ? Number(x) : -1);
      const seed = num(p[0]), draw = num(p[1]), score = num(p[6]), moves = num(p[7]), rec = num(p[8]);
      if (seed < 0 || (draw !== 1 && draw !== 3) || score < 0 || moves < 0 || rec < 0) return null;
      const cols = p[2].split('.');
      if (cols.length !== 7 || !/^[0-9a-d]{4}$/.test(p[3])) return null;
      const s = { seed, draw, tab: [], down: [], found: [], stock: dec(p[4]), waste: dec(p[5]), score, moves, recycles: rec };
      if (!s.stock || !s.waste) return null;
      for (const col of cols) {
        if (!col.length) return null;
        const d = parseInt(col[0], 36), cards = dec(col.slice(1));
        if (!cards || !(d >= 0) || d > Math.max(0, cards.length - 1) || (cards.length && d > cards.length - 1)) return null;
        for (let k = d + 1; k < cards.length; k++) {
          const a = cards[k - 1], b = cards[k];
          if (rankOf(a) !== rankOf(b) + 1 || isRed(a) === isRed(b)) return null;
        }
        s.tab.push(cards); s.down.push(cards.length ? d : 0);
      }
      for (const ch of p[3]) s.found.push(parseInt(ch, 14));
      const seen = new Uint8Array(52);
      const mark = (c) => { if (seen[c]) return false; seen[c] = 1; return true; };
      for (let su = 0; su < 4; su++) for (let r = 0; r < s.found[su]; r++) if (!mark(su * 13 + r)) return null;
      for (const arr of s.tab.concat([s.stock, s.waste])) for (const c of arr) if (!mark(c)) return null;
      for (let c = 0; c < 52; c++) if (!seen[c]) return null;
      return s;
    }

    return {
      suitOf, rankOf, isRed, SCORE, deal, clone, canTab, canFound, foundTop, isWon, legal, apply, drawStep, timeBonus,
      talon, reachable, safeToFound, nextSafeMove, hints, finishPlan, encode, decode, mulberry32,
    };
  })();

  /* =====================================================================
     Winnable deals — produced by tools/gen-deals.js. Every deal on these lists was solved by the
     checker and the solution replayed through the rules above, so each one can be won.
     ===================================================================== */
  const DEAL_DATA = {"1":{"count":6000,"bits":"v3/H/fd6/r73+tMR1//3/tmNv++fvbfv7K/99///Xnvetfu//9O/v9/tv3/vn4nev/uPd+zP86r97c2+v//9t1273ff//vOWf//b79fv81/vXuR/7Pq7V7s3ff/+//v+dv/d8RvjqP//erfn///vk2etj+33lv8r/d9bv6P3//peN90/7d3/8Z7h936+/Uo9p/f/vQ/51//q9+9vTv/78vf+9/1v/Xv/7Xa/+b7ZN/nb+atPz/+//+9tPtfLjf3r/9zX5/9/9a7/3qt/cvb/3cf/8fG//e/f/9uvn/m//vt7P997++fv/f0+c/+9H9vu/38/+L3+ffbZdr7f/9r995d/U3rH2vdLT3/nf/H9vcv/Z//13FO1/bf7f+/z/93P/6+Lv/59ruaU1Y/99ntvQc//+//X3+9Wa/u/+P/z2//7//+/8Gfy9f0+//5v0/j1t/7/f73+f/521/2z7v+/U738/7V+Rv+1fff3s7/78pa1z/a2Vz5/+/f21+t7b/f//vF+vf/v/V/2b/d+yP0v+a36v9vsnZy9t//P93pfe/9Xa4z811wf/5dv//79d+v6+fbfz/2N+6c55/61m/M/sedffv//z1O/f/N+1//5/rP2uzv33z3rfi907P2/o3/5d/f7f/p/2vf51n0f87/u/29swd//H37W5/29+t7269u77v/f/7130v/Md33V3H/P59//cfH8X3/7v9s6km/l//7urt+fRZvh+N5/3+/fv/f2jv6r7en//s//X9W73+/1O+Puj9v6/Gv/fPfbf321/93/uVXe32xLWv47be6+q/63/79/56+3Y97pyvPffM/5v5+Xf7//+9/+vXf/7je5lv9b9f/n/Zb/u79bb9p/f78+8ndf/v+uvl72779//7WP5/PXv8vT799+n9dN3bU+v/p9qM8d95b0/sp9b+79+zr/8292tvbmr7/czPvXfvv2E/Hf/d/vUyXr/7/7/771vov6x9y/d3lJ8/7N+e+8"},"3":{"count":6000,"bits":"r39HveZ69vfX6rAB9933HgkJL+8f37fvzLmV5//63nvcs2kvb8K9v53srn9lgvxctNKtd6zPoar9LYgeL/e9t727z+af+vKV9urR7cfvI9nu3vl3qPK/4u81fNN67tvkd+eteRvA5Laffjfq2u5l1HelDX/dltN//19JpyO3P/BfN58cqPXe5Q7xpnmu/c49J2Zu9I/V+27KFfduTr778pXdv/3v19u/bbb/uTDxdfGYy6tLy/+7p89Nl9buT9BP31m3z/1b9a7XXA/edlf/3ff/8PG//E6H8+qPxLi+fvt6O897ebZl/MW3c/+9npnuvDc/tb3+fbzZcp/1+xLw97R6x1jF2vdeb1JxfkX5mWv/Zty93lOE3L9rfe3yr9/K/A2Iv+51r+RE3a951PvrUY9uu7/byyVGa8ud4L733r9fb3adMUfi8Hwt9vk/0/H5l/br/ab+Xp1k0N1z6rX/0q3cPYG2Zt67W+f3cP/a/hY1Q3e2Vz5/d/Oyhes6LuBf/tlMvttv7UteV/d+S30rX6X63JHG3bytB+/e9HsNW/lXabA+93wf/49lYmz4Nev45dNfx1u9+4c5ow61sra/s+dbfvd8x1O1d7Aw6//7fHKyK7PWnX/3bz80rV+XIV/IV+bzf39/2mfwEFna//+2++7swdv7l3nUvv//0d+H/sr3jfnV66E30v/odglYzOuP5dWPcbd0H2/669ouEm/Fd/7uJvOfxKtx6nJ+Xy/br3fOom+b7eO//sVtydW7ye3lOkPvioPd/Gv3//eDfz23893vuxneWwxIWpLbaXy2qfqf/oMz4a23Y/zo2PJffM/pvy6Df3X/uE/6vXf/6jfZ9u9b9frn/Cn+pjtDJ1A/eY+/8jdaeK+Ou170bbNff7eej/PX7/OZjp9+nddEF418//5xuMsa/pb03MqUbu2fezh/o352turer+Vdb3PWfvv2k9n//pf7e2G7z7f7556zuhqSV/0PcqlL8/eJ+Zq8"}};
  const Deals = (function () {
    const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
    function bytes(str) {
      const out = [];
      let buf = 0, bits = 0;
      for (const ch of str) {
        const v = B64.indexOf(ch);
        if (v < 0) continue; // '=' padding
        buf = (buf << 6) | v; bits += 6;
        if (bits >= 8) { bits -= 8; out.push((buf >> bits) & 255); }
      }
      return out;
    }
    const cache = {};
    function list(draw) {
      const k = draw === 3 ? 3 : 1;
      if (cache[k]) return cache[k];
      const d = DEAL_DATA[k], b = bytes(d.bits), out = [];
      for (let i = 0; i < d.count; i++) if (b[i >> 3] & (1 << (i & 7))) out.push(i + 1);
      cache[k] = out;
      return out;
    }
    function random(draw, avoid) {
      const L = list(draw);
      let s = L[0];
      for (let t = 0; t < 40; t++) {
        s = L[Math.floor(Math.random() * L.length)];
        if (!avoid || avoid.indexOf(s) < 0) break;
      }
      return s;
    }
    function hash(str) {
      let h = 0x811c9dc5;
      for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
      return h >>> 0;
    }
    function daily(date, draw) { const L = list(draw); return L[hash('solo-stack|' + date + '|' + draw) % L.length]; }
    function isWinnable(seed, draw) {
      const L = list(draw);
      let lo = 0, hi = L.length - 1;
      while (lo <= hi) { const mid = (lo + hi) >> 1; if (L[mid] === seed) return true; if (L[mid] < seed) lo = mid + 1; else hi = mid - 1; }
      return false;
    }
    return { list, random, daily, isWinnable };
  })();

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { Rules, Deals, CONFIG, STR, RANKS };
  }
  if (typeof document === 'undefined') return; // Node (tests): stop here.

  /* =====================================================================
     YouTube Playables SDK wrapper (falls back to localStorage outside Playables)
     ===================================================================== */
  const SDK = (function () {
    const yt = typeof ytgame !== 'undefined' ? ytgame : null; // eslint-disable-line no-undef
    const inYT = !!(yt && yt.IN_PLAYABLES_ENV);
    const KEY = 'solo-stack-save';
    const safe = (fn) => { try { return fn(); } catch (e) { return undefined; } };
    const api = {
      inYT,
      cloudSaveOk: true,
      firstFrameReady() { if (inYT) safe(() => yt.game.firstFrameReady()); },
      gameReady() { if (inYT) safe(() => yt.game.gameReady()); },
      load() {
        if (inYT) return Promise.resolve().then(() => yt.game.loadData());
        try { return Promise.resolve(window.localStorage.getItem(KEY) || ''); } catch (e) { return Promise.resolve(''); }
      },
      save(str) {
        if (inYT) {
          if (!api.cloudSaveOk) return Promise.resolve();
          return Promise.resolve().then(() => yt.game.saveData(str)).catch(() => api.warn());
        }
        try { window.localStorage.setItem(KEY, str); } catch (e) { /* storage blocked */ }
        return Promise.resolve();
      },
      language() { // BCP-47 tag from YouTube, or null outside Playables
        if (!inYT) return Promise.resolve(null);
        return Promise.resolve().then(() => yt.system.getLanguage()).catch(() => null);
      },
      onPause(cb) { if (inYT) safe(() => yt.system.onPause(cb)); },
      onResume(cb) { if (inYT) safe(() => yt.system.onResume(cb)); },
      audioEnabled() { return inYT ? safe(() => yt.system.isAudioEnabled()) !== false : true; },
      onAudioChange(cb) { if (inYT) safe(() => yt.system.onAudioEnabledChange(cb)); },
      sendScore(v) { if (inYT) Promise.resolve().then(() => yt.engagement.sendScore({ value: v })).catch(() => {}); },
      warn() { if (inYT) safe(() => yt.health.logWarning()); },
      error() { if (inYT) safe(() => yt.health.logError()); },
    };
    return api;
  })();

  /* =====================================================================
     Sound — short synthesised effects via Web Audio. Plays only when YouTube audio and the in-game switch are on.
     ===================================================================== */
  const Sound = {
    ctx: null, master: null, ytOn: true, userOn: true, suspended: false,
    get enabled() { return this.ytOn && this.userOn; },
    init() {
      if (this.ctx || !this.enabled) return;
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      try {
        this.ctx = new AC();
        this.master = this.ctx.createGain();
        this.master.gain.value = 0.5;
        this.master.connect(this.ctx.destination);
      } catch (e) { this.ctx = null; }
    },
    unlock() {
      if (!this.enabled || this.suspended) return;
      this.init();
      if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume().catch(() => {});
    },
    refresh() {
      if (!this.ctx) return;
      if (this.enabled && !this.suspended) this.ctx.resume().catch(() => {});
      else this.ctx.suspend().catch(() => {});
    },
    pause() { this.suspended = true; this.refresh(); },
    resume() { this.suspended = false; this.refresh(); },
    tone(freq, at, dur, type, vol, slideTo) {
      const c = this.ctx, t0 = c.currentTime + at;
      const o = c.createOscillator(), g = c.createGain();
      o.type = type || 'sine';
      o.frequency.setValueAtTime(freq, t0);
      if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(vol || 0.08, t0 + 0.006);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      o.connect(g); g.connect(this.master);
      o.start(t0); o.stop(t0 + dur + 0.03);
    },
    play(name, arg) {
      if (!this.enabled || this.suspended || !this.ctx || this.ctx.state !== 'running') return;
      const T = (f, a, d, ty, v, s) => this.tone(f, a, d, ty, v, s);
      switch (name) {
        case 'place': T(240, 0, 0.06, 'triangle', 0.09, 150); T(1400, 0, 0.02, 'sine', 0.015); break;
        case 'flip': T(700, 0, 0.05, 'sine', 0.035, 1100); break;
        case 'draw': T(480, 0, 0.05, 'triangle', 0.05, 380); break;
        case 'deal': T(900, 0, 0.025, 'sine', 0.012, 700); break;
        case 'found': { const f = 440 * Math.pow(2, ((arg || 1) - 1) / 12); T(f, 0, 0.14, 'sine', 0.06); T(f * 2, 0.01, 0.08, 'sine', 0.02); break; }
        case 'recycle': T(260, 0, 0.2, 'triangle', 0.05, 620); break;
        case 'tick': T(620, 0, 0.04, 'sine', 0.04); break;
        case 'nope': T(180, 0, 0.09, 'square', 0.025, 150); break;
        case 'hint': T(880, 0, 0.08, 'sine', 0.035); T(1175, 0.07, 0.1, 'sine', 0.03); break;
        case 'win': [523, 659, 784, 1047, 1319, 1568].forEach((f, k) => T(f, k * 0.085, 0.22, 'triangle', 0.06)); break;
        case 'unlock': [988, 1175, 1480, 1976].forEach((f, k) => T(f, 0.1 + k * 0.07, 0.16, 'sine', 0.045)); break;
      }
    },
  };

  /* =====================================================================
     Art — suits, emblems and icons as inline SVG
     ===================================================================== */
  const circ = (cx, cy, r) => 'M' + (cx - r) + ' ' + cy + 'a' + r + ' ' + r + ' 0 1 0 ' + 2 * r + ' 0a' + r + ' ' + r + ' 0 1 0 ' + -2 * r + ' 0z';
  const SUIT_D = [
    'M50 5C62 25 95 40 95 62c0 14-10 22-22 22-9 0-15-4-19-10 1 10 4 17 12 22H34c8-5 11-12 12-22-4 6-10 10-19 10C15 84 5 76 5 62 5 40 38 25 50 5z',
    'M50 90C21 68 5 52 5 32 5 17 16 7 29 7c10 0 17 6 21 14 4-8 11-14 21-14 13 0 24 10 24 25 0 20-16 36-45 58z',
    'M50 4l38 46-38 46-38-46z',
    [circ(50, 29, 20), circ(27, 58, 20), circ(73, 58, 20), 'M42 40h16v26H42z', 'M46 60c0 16-4 26-12 34h32c-8-8-12-18-12-34z'].join('|'),
  ];
  const suitPaths = (su) => SUIT_D[su].split('|').map((d) => '<path d="' + d + '"/>').join(''); // club = separate shapes (no holes where they overlap)
  const suitSvg = (su, cls) => '<svg class="' + (cls || 'su') + '" viewBox="0 0 100 100" aria-hidden="true">' + suitPaths(su) + '</svg>';
  const EMBLEMS = {
    moon: '<path d="M62 18a34 34 0 1 0 20 50A28 28 0 0 1 62 18z"/><circle cx="76" cy="30" r="3"/><circle cx="84" cy="46" r="2"/>',
    flame: '<path d="M50 8c4 18 26 28 26 52a26 26 0 0 1-52 0c0-12 6-20 12-26 0 10 4 16 10 18-4-16 2-32 4-44z"/>',
    hex: '<path d="M50 10l34 20v40L50 90 16 70V30z" fill="none" stroke-width="8" stroke="currentColor"/><path d="M50 34l14 8v16l-14 8-14-8V42z"/>',
    bolt: '<path d="M58 6L22 56h22l-6 38 40-54H54z"/>',
    crown: '<path d="M14 70l-4-42 22 18 18-28 18 28 22-18-4 42z"/><rect x="14" y="76" width="72" height="10" rx="4"/>',
    star: '<path d="M50 6l12 30 32 2-25 20 9 32-28-18-28 18 9-32L6 38l32-2z"/>',
  };
  const svgI = (inner, extra) => '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"' + (extra || '') + '>' + inner + '</svg>';
  const STROKE = ' fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"';
  const ICONS = {
    menu: svgI('<path d="M4 7h16M4 12h16M4 17h16"/>', STROKE),
    new: svgI('<rect x="6" y="3.5" width="12" height="17" rx="2.5"/><path d="M12 8.5v7M8.5 12h7"/>', STROKE),
    daily: svgI('<rect x="3.5" y="5" width="17" height="15" rx="3"/><path d="M3.5 10h17M8 3v4M16 3v4"/><path d="M9 14.5l2 2 4-4"/>', STROKE),
    hint: svgI('<path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-4 10.5c.8.8 1.3 1.8 1.4 3h5.2c.1-1.2.6-2.2 1.4-3A6 6 0 0 0 12 3z"/>', STROKE),
    undo: svgI('<path d="M9 7L4.5 11.5 9 16"/><path d="M5 11.5h9a5.5 5.5 0 0 1 0 11h-2"/>', STROKE),
    close: svgI('<path d="M6 6l12 12M18 6L6 18"/>', STROKE),
    check: svgI('<path d="M5 12.5l4.5 4.5L19 7.5"/>', ' fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"'),
    lock: svgI('<rect x="5" y="11" width="14" height="10" rx="2.5" fill="currentColor"/><path d="M8 11V8a4 4 0 0 1 8 0v3" fill="none" stroke="currentColor" stroke-width="2.4"/>'),
    stats: svgI('<path d="M5 20v-7M12 20V5M19 20v-10"/>', STROKE),
    designs: svgI('<rect x="3" y="5" width="10" height="14" rx="2"/><rect x="11" y="3" width="10" height="14" rx="2" transform="rotate(12 16 10)"/>', STROKE),
    settings: svgI('<circle cx="12" cy="12" r="3"/><path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M5.3 18.7l2.1-2.1M16.6 7.4l2.1-2.1"/>', STROKE),
    rules: svgI('<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5z"/><path d="M4 20.5A2.5 2.5 0 0 0 6.5 23H20v-5"/>', STROKE),
    chevron: svgI('<path d="M9 5l7 7-7 7"/>', STROKE),
    recycle: svgI('<path d="M20 12a8 8 0 1 1-2.3-5.7"/><path d="M20 4v5h-5"/>', STROKE),
  };
  const LOGO = '<svg viewBox="0 0 64 64" aria-hidden="true"><rect x="9" y="14" width="28" height="40" rx="5" transform="rotate(-12 23 34)" fill="#2f5fb3" stroke="#fff" stroke-width="2.5"/>' +
    '<g transform="rotate(9 39 30)"><rect x="25" y="10" width="28" height="40" rx="5" fill="#fdfdfb" stroke="#cfd5cf" stroke-width="1"/><path transform="translate(30.5 21.5) scale(.17)" d="' + SUIT_D[0] + '" fill="#1b2230"/></g></svg>';

  /* =====================================================================
     Runtime state
     ===================================================================== */
  let S = null; // saved state
  let G = null; // the game on the table
  const RT = {
    paused: false, pauseReasons: new Set(), saveTimer: 0, lang: 'en', sdkLang: null, lastScore: -1,
    layout: null, pos: new Array(52), loc: new Array(52), cardEls: [], drag: null, hint: null, winAnim: null, sheet: null,
  };
  const now = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());

  // Timeouts that freeze while the game is paused (auto moves, auto-finish, result sheet).
  const Timers = {
    list: new Set(),
    later(fn, ms) {
      const t = { fn, due: ms, id: 0, start: 0 };
      this.list.add(t);
      if (!RT.paused) this.arm(t);
      return t;
    },
    arm(t) {
      t.start = now();
      t.id = setTimeout(() => { this.list.delete(t); t.fn(); }, Math.max(0, t.due));
    },
    cancel(t) { if (t && this.list.has(t)) { clearTimeout(t.id); this.list.delete(t); } },
    clear() { for (const t of this.list) clearTimeout(t.id); this.list.clear(); },
    pause() { const n = now(); for (const t of this.list) { clearTimeout(t.id); t.due -= n - t.start; } },
    resume() { for (const t of this.list) this.arm(t); },
  };

  /* =====================================================================
     Helpers — DOM, text, dates
     ===================================================================== */
  const $ = (id) => document.getElementById(id);
  const UI = {};
  function h(tag, cls, html) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  }
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  function t(key, vars) {
    let s = (STR[RT.lang] && STR[RT.lang][key]) != null ? STR[RT.lang][key] : STR.en[key];
    if (s == null) return key;
    if (vars) for (const k in vars) s = s.split('{' + k + '}').join(vars[k]);
    return s;
  }
  const nm = (item) => item.name[RT.lang] || item.name.en;
  const pad2 = (n) => (n < 10 ? '0' : '') + n;
  function dateKey(d) { d = d || new Date(); return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate()); }
  function shiftDay(key, delta) { const p = key.split('-').map(Number); return dateKey(new Date(p[0], p[1] - 1, p[2] + delta)); }
  function fmtDate(key, long) {
    const p = key.split('-').map(Number), d = new Date(p[0], p[1] - 1, p[2]);
    try {
      return new Intl.DateTimeFormat(RT.lang === 'de' ? 'de-DE' : 'en-US', long ? { weekday: 'long', day: 'numeric', month: 'long' } : { day: 'numeric', month: 'short' }).format(d);
    } catch (e) { return RT.lang === 'de' ? p[2] + '.' + p[1] + '.' : p[1] + '/' + p[2]; }
  }
  function fmtTime(secs) {
    secs = Math.max(0, Math.floor(secs));
    const m = Math.floor(secs / 60), s = secs % 60;
    return m >= 60 ? Math.floor(m / 60) + ':' + pad2(m % 60) + ':' + pad2(s) : m + ':' + pad2(s);
  }
  const fmtNum = (n) => { try { return n.toLocaleString(RT.lang === 'de' ? 'de-DE' : 'en-US'); } catch (e) { return String(n); } };
  function toast(text, sub) {
    const el = h('div', 'toast');
    el.textContent = text;
    if (sub) { const s = h('small'); s.textContent = sub; el.appendChild(s); }
    UI.toasts.appendChild(el);
    setTimeout(() => el.remove(), 3000);
    while (UI.toasts.children.length > 2) UI.toasts.firstChild.remove();
  }

  /* =====================================================================
     Progress — stats, daily, unlocks (pure functions on S)
     ===================================================================== */
  const BACK = {}, TABLE = {};
  CONFIG.backs.forEach((b) => { BACK[b.id] = b; });
  CONFIG.tables.forEach((b) => { TABLE[b.id] = b; });
  const newStats = () => ({ p: 0, w: 0, s: 0, b: 0, t: 0, sc: 0, m: 0 });
  function newState() {
    return {
      set: { draw: 1, auto: true, left: false, sound: true, lang: 'auto' },
      back: 'lattice', table: 'felt',
      own: { b: CONFIG.backs.filter((b) => b.unlock.type === 'start').map((b) => b.id), t: CONFIG.tables.filter((b) => b.unlock.type === 'start').map((b) => b.id) },
      fresh: [],
      st: { 1: newStats(), 3: newStats() },
      daily: { n: 0, s: 0, b: 0, last: '', h: [] },
      fast: 0,
      recent: { 1: [], 3: [] },
      tipShown: false,
      cur: null,
    };
  }
  const totalWins = (s) => s.st[1].w + s.st[3].w;
  function meets(s, u) {
    switch (u.type) {
      case 'start': return true;
      case 'wins': return totalWins(s) >= u.n;
      case 'daily': return s.daily.n >= u.n;
      case 'dstreak': return s.daily.b >= u.n;
      case 'fast': return s.fast > 0 && s.fast < u.n;
      case 'streak': return Math.max(s.st[1].b, s.st[3].b) >= u.n;
      case 'wins3': return s.st[3].w >= u.n;
    }
    return false;
  }
  function unlockText(u) {
    switch (u.type) {
      case 'start': return t('u_start');
      case 'wins': return u.n === 1 ? t('u_wins1') : t('u_wins', { n: u.n });
      case 'daily': return t('u_daily', { n: u.n });
      case 'dstreak': return t('u_dstreak', { n: u.n });
      case 'fast': return t('u_fast', { m: Math.round(u.n / 60) });
      case 'streak': return t('u_streak', { n: u.n });
      case 'wins3': return t('u_wins3', { n: u.n });
    }
    return '';
  }
  function refreshUnlocks(s) {
    const added = [];
    CONFIG.backs.forEach((b) => { if (s.own.b.indexOf(b.id) < 0 && meets(s, b.unlock)) { s.own.b.push(b.id); s.fresh.push('b:' + b.id); added.push({ kind: 'b', item: b }); } });
    CONFIG.tables.forEach((b) => { if (s.own.t.indexOf(b.id) < 0 && meets(s, b.unlock)) { s.own.t.push(b.id); s.fresh.push('t:' + b.id); added.push({ kind: 't', item: b }); } });
    return added;
  }
  const dailyStreakNow = (s) => (s.daily.last === dateKey() || s.daily.last === shiftDay(dateKey(), -1) ? s.daily.s : 0);
  const dailyDoneToday = (s) => s.daily.last === dateKey();

  /* =====================================================================
     Layout — the table fits any aspect ratio. Cards are 1 : 1.4.
     ===================================================================== */
  const FOUND_ORDER = [0, 1, 3, 2]; // spades, hearts, clubs, diamonds (colours alternate)
  function computeLayout() {
    const W = UI.stage.clientWidth, H = UI.stage.clientHeight;
    const narrow = W < 520;
    const pad = narrow ? 4 : Math.max(6, Math.min(16, Math.round(W * 0.015)));
    const gapR = narrow ? 0.075 : 0.12; // phones in portrait: tighter gaps, bigger cards
    const cwW = (W - 2 * pad) / (7 + 6 * gapR);
    const cwH = (H - 2 * pad) / (3.55 * 1.4);
    const cw = Math.max(26, Math.floor(Math.min(cwW, cwH, 132)));
    const ch = Math.round(cw * 1.4);
    const gap = Math.floor(cw * gapR);
    const total = 7 * cw + 6 * gap;
    const x0 = Math.round((W - total) / 2);
    const L = { W, H, pad, cw, ch, gap, x0, topY: pad, tabY: pad + ch + Math.max(8, Math.round(cw * 0.22)), left: !!(S && S.set.left) };
    L.colX = (i) => x0 + i * (cw + gap);
    L.stockX = L.colX(L.left ? 6 : 0);
    L.wasteX = L.colX(L.left ? 5 : 1);
    L.fanDir = L.left ? -1 : 1;
    L.foundX = (q) => L.colX((L.left ? 0 : 3) + q);
    RT.layout = L;
    UI.table.style.setProperty('--cw', cw + 'px');
    UI.table.style.setProperty('--ch', ch + 'px');
    return L;
  }
  function columnOffsets(L, col, d) {
    const n = col.length;
    let dO = Math.round(L.ch * 0.11), uO = Math.round(L.ch * 0.3);
    if (n < 2) return { dO, uO };
    const avail = L.H - L.pad - L.tabY - L.ch;
    const nd = Math.min(d, n - 1), nu = n - 1 - nd;
    if (nd * dO + nu * uO > avail) {
      dO = Math.max(3, Math.round(L.ch * 0.06));
      if (nd * dO + nu * uO > avail && nu > 0) uO = Math.max(Math.round(L.ch * 0.14), Math.floor((avail - nd * dO) / nu));
    }
    return { dO, uO };
  }
  // Card positions (x, y, z, face up) and where each card lives (loc: pile + index).
  function computePositions() {
    const s = G.s, L = RT.layout, P = RT.pos, LOC = RT.loc;
    s.stock.forEach((c, i) => {
      const lift = Math.floor(i / 8) * Math.max(1, Math.round(L.cw * 0.012));
      P[c] = { x: L.stockX - lift, y: L.topY - lift, z: 10 + i, up: false };
      LOC[c] = { p: 's', i };
    });
    const n = s.waste.length, fan = s.draw === 3 ? Math.min(3, n) : 1, step = Math.round(L.cw * 0.24);
    s.waste.forEach((c, i) => {
      const k = i - (n - fan);
      P[c] = { x: L.wasteX + (k > 0 ? k * step * L.fanDir : 0), y: L.topY, z: 100 + i, up: true };
      LOC[c] = { p: 'w', i };
    });
    for (let q = 0; q < 4; q++) {
      const su = FOUND_ORDER[q];
      for (let r = 0; r < s.found[su]; r++) {
        const c = su * 13 + r;
        P[c] = { x: L.foundX(q), y: L.topY, z: 200 + r, up: true };
        LOC[c] = { p: 'f', i: su, idx: r };
      }
    }
    for (let i = 0; i < 7; i++) {
      const col = s.tab[i], d = s.down[i], off = columnOffsets(L, col, d);
      let y = L.tabY;
      col.forEach((c, idx) => {
        P[c] = { x: L.colX(i), y, z: 300 + idx, up: idx >= d };
        LOC[c] = { p: 't', i, idx };
        y += idx < d ? off.dO : off.uO;
      });
    }
  }

  /* =====================================================================
     Cards and slots
     ===================================================================== */
  function faceHtml(c) {
    const su = Rules.suitOf(c), r = Rules.rankOf(c), label = RANKS[RT.lang === 'de' ? 'de' : 'en'][r - 1];
    let center;
    if (r === 1) center = '<span class="pc ace">' + suitSvg(su) + '</span>';
    else if (r > 10) center = '<span class="pc court"><b>' + label + '</b>' + suitSvg(su) + '</span>';
    else center = '<span class="pc">' + suitSvg(su) + '</span>';
    return '<span class="ix' + (label.length > 1 ? ' two' : '') + '">' + label + '</span><span class="sx">' + suitSvg(su) + '</span>' + center;
  }
  function backHtml() {
    const b = BACK[S.back] || BACK.lattice;
    return b.emblem ? '<i class="emb"><svg viewBox="0 0 100 100" aria-hidden="true">' + EMBLEMS[b.emblem] + '</svg></i>' : '';
  }
  function buildCards() {
    UI.cards.innerHTML = '';
    RT.cardEls = [];
    for (let c = 0; c < 52; c++) {
      const el = h('div', 'card ' + (Rules.isRed(c) ? 'red' : 'blk'));
      el.dataset.id = c;
      el.innerHTML = '<div class="cin"><div class="face">' + faceHtml(c) + '</div><div class="back bk-' + S.back + '">' + backHtml() + '</div></div>';
      el._x = null; el._y = null; el._z = null; el._up = null;
      UI.cards.appendChild(el);
      RT.cardEls.push(el);
    }
  }
  function refreshFaces() { RT.cardEls.forEach((el, c) => { el.querySelector('.face').innerHTML = faceHtml(c); }); }
  function refreshBacks() {
    const html = backHtml();
    RT.cardEls.forEach((el) => { const b = el.querySelector('.back'); b.className = 'back bk-' + S.back; b.innerHTML = html; });
  }
  function buildSlots() {
    let html = '<div class="slot stock" id="stockSlot">' + ICONS.recycle + '</div><div class="slot waste"></div>';
    for (let q = 0; q < 4; q++) html += '<div class="slot found ' + (FOUND_ORDER[q] === 1 || FOUND_ORDER[q] === 2 ? 'red' : 'blk') + '" data-q="' + q + '">' + suitSvg(FOUND_ORDER[q]) + '</div>';
    for (let i = 0; i < 7; i++) html += '<div class="slot col" data-col="' + i + '"><span>K</span></div>';
    html += '<div class="count" id="stockCount"></div>';
    UI.slots.innerHTML = html;
    UI.stockSlot = $('stockSlot');
    UI.stockCount = $('stockCount');
  }
  function placeSlots() {
    const L = RT.layout;
    const put = (el, x, y) => { el.style.transform = 'translate3d(' + x + 'px,' + y + 'px,0)'; };
    put(UI.stockSlot, L.stockX, L.topY);
    put(UI.slots.querySelector('.waste'), L.wasteX, L.topY);
    UI.slots.querySelectorAll('.found').forEach((el) => put(el, L.foundX(+el.dataset.q), L.topY));
    UI.slots.querySelectorAll('.col').forEach((el) => put(el, L.colX(+el.dataset.col), L.tabY));
    const n = G ? G.s.stock.length : 0;
    UI.stockCount.textContent = n;
    UI.stockCount.hidden = !n;
    put(UI.stockCount, L.stockX + L.cw - Math.round(L.cw * 0.3), L.topY + L.ch - Math.round(L.cw * 0.22));
    UI.stockSlot.classList.toggle('empty', !!G && !G.s.stock.length && !G.s.waste.length);
    UI.stockSlot.classList.toggle('ready', !!G && !G.s.stock.length && G.s.waste.length > 0); // tap to turn the waste over
  }

  // Moves every card to where the state says it belongs. `instant` skips the transition.
  function render(instant) {
    if (!G || !RT.layout) return;
    computePositions();
    const drag = RT.drag && RT.drag.moved ? RT.drag.ids : null;
    if (instant) UI.cards.classList.add('noanim');
    for (let c = 0; c < 52; c++) {
      if (drag && drag.indexOf(c) >= 0) continue;
      const el = RT.cardEls[c], p = RT.pos[c];
      if (!p) continue;
      if (el._up !== p.up) { el.classList.toggle('up', p.up); el._up = p.up; }
      const moved = el._x !== p.x || el._y !== p.y;
      const flying = moved && !instant && el._x !== null;
      el._z = p.z;
      if (flying) { // fly above everything, then settle into the pile
        el.style.zIndex = 2000 + p.z;
        clearTimeout(el._zt);
        el._zt = setTimeout(() => { el._zt = 0; el.style.zIndex = el._z; }, 270);
      } else if (instant || !el._zt) {
        clearTimeout(el._zt); el._zt = 0;
        el.style.zIndex = p.z;
      }
      if (moved) {
        el.style.transform = 'translate3d(' + p.x + 'px,' + p.y + 'px,0)';
        el._x = p.x; el._y = p.y;
      }
    }
    if (instant) { void UI.cards.offsetWidth; UI.cards.classList.remove('noanim'); }
    placeSlots();
    updateHud();
  }
  function relayout() {
    if (!G) return;
    const wide = window.innerWidth > window.innerHeight * 1.25 && window.innerHeight < 640;
    document.body.classList.toggle('wide', wide);
    computeLayout();
    render(true);
  }

  /* =====================================================================
     Game flow
     ===================================================================== */
  const canInput = () => !!(G && !G.over && !G.busy && !RT.paused && UI.modal.hidden);
  function startDeal(kind, draw, opts) {
    opts = opts || {};
    Timers.clear();
    stopWinAnim();
    clearHint();
    closeSheet();
    const today = dateKey();
    let seed, s, date = null;
    if (opts.resume) {
      s = opts.resume.s; kind = opts.resume.kind; date = opts.resume.date;
    } else {
      draw = draw === 3 ? 3 : 1;
      date = kind === 'daily' ? today : null;
      seed = kind === 'daily' ? Deals.daily(today, draw) : Deals.random(draw, S.recent[draw]);
      s = Rules.deal(seed, draw);
      if (kind !== 'daily') { const r = S.recent[draw]; r.push(seed); while (r.length > CONFIG.recentAvoid) r.shift(); }
    }
    G = {
      s, kind, date, over: false, busy: false, started: opts.resume ? opts.resume.started : false,
      elapsed: opts.resume ? opts.resume.elapsed : 0, undo: opts.resume ? opts.resume.undo.slice() : [], stuckKey: '',
    };
    UI.finishBtn.hidden = true;
    renderLabels();
    computeLayout();
    if (opts.resume) {
      render(true);
    } else {
      // Deal animation: everything starts on the stock, tableau cards fly out in deal order.
      const L = RT.layout;
      UI.cards.classList.add('noanim');
      RT.cardEls.forEach((el, c) => {
        el.classList.remove('up', 'hinted', 'shake', 'dragging');
        el._up = false;
        el.style.transform = 'translate3d(' + L.stockX + 'px,' + L.topY + 'px,0)';
        el.style.zIndex = 10 + c;
        el._x = L.stockX; el._y = L.topY;
      });
      void UI.cards.offsetWidth;
      UI.cards.classList.remove('noanim');
      let k = 0;
      const order = new Map();
      for (let row = 0; row < 7; row++) for (let col = row; col < 7; col++) order.set(s.tab[col][row], k++);
      RT.cardEls.forEach((el, c) => { el.style.transitionDelay = order.has(c) ? order.get(c) * CONFIG.dealStaggerMs + 'ms' : '0ms'; });
      render(false);
      G.busy = true;
      const total = k * CONFIG.dealStaggerMs + 320;
      for (let i = 0; i < k; i += 4) Timers.later(() => Sound.play('deal'), i * CONFIG.dealStaggerMs);
      Timers.later(() => {
        RT.cardEls.forEach((el) => { el.style.transitionDelay = ''; });
        if (G && !G.over) runAuto(); // aces and twos dealt face up go straight to the foundations
      }, total);
    }
    saveCur();
    if (!S.tipShown && !opts.resume) { S.tipShown = true; setTimeout(() => toast(t('tipFirst')), 900); }
  }
  function markStarted() {
    if (G.started) return;
    G.started = true;
    S.st[G.s.draw].p++;
  }
  function snapshot() {
    G.undo.push(Rules.encode(G.s));
    if (G.undo.length > 500) G.undo.shift();
    clearHint();
    UI.finishBtn.hidden = true;
  }
  function doMove(m) {
    if (!Rules.legal(G.s, m)) return false;
    snapshot();
    const card = m.f === 'w' ? G.s.waste[G.s.waste.length - 1] : m.f === 'f' ? Rules.foundTop(G.s, m.i) : G.s.tab[m.i][G.s.tab[m.i].length - m.n];
    const r = Rules.apply(G.s, m);
    markStarted();
    if (m.to === 'f') Sound.play('found', Rules.rankOf(card)); else Sound.play('place');
    if (r.flip >= 0) setTimeout(() => Sound.play('flip'), 90);
    render();
    runAuto();
    return true;
  }
  function doDraw() {
    if (!canInput()) return;
    if (!G.s.stock.length && !G.s.waste.length) { Sound.play('nope'); return; }
    snapshot();
    const r = Rules.drawStep(G.s);
    markStarted();
    Sound.play(r.recycle ? 'recycle' : 'draw');
    render();
    runAuto();
  }
  function runAuto() {
    if (S.set.auto) {
      const m = Rules.nextSafeMove(G.s);
      if (m) {
        G.busy = true;
        Timers.later(() => {
          if (!G || G.over) return;
          const card = m.f === 'w' ? G.s.waste[G.s.waste.length - 1] : G.s.tab[m.i][G.s.tab[m.i].length - 1];
          const r = Rules.apply(G.s, m);
          Sound.play('found', Rules.rankOf(card));
          if (r.flip >= 0) setTimeout(() => Sound.play('flip'), 90);
          render();
          runAuto();
        }, CONFIG.autoStepMs);
        return;
      }
    }
    G.busy = false;
    settle();
  }
  function settle() {
    updateHud();
    if (Rules.isWon(G.s)) { win(); return; }
    const plan = Rules.finishPlan(G.s);
    UI.finishBtn.hidden = !plan;
    saveCur();
    if (!plan) checkStuck();
  }
  function checkStuck() {
    const hs = Rules.hints(G.s);
    if (hs.moves.length || hs.drawHelps) return;
    const key = Rules.encode(G.s);
    if (G.stuckKey === key) return;
    G.stuckKey = key;
    Timers.later(() => { if (G && !G.over && G.stuckKey === key && UI.modal.hidden) openStuck(); }, 450);
  }
  function undo() {
    if (!canInput()) { if (G && G.busy) return; Sound.play('nope'); return; }
    if (!G.undo.length) { Sound.play('nope'); return; }
    const s = Rules.decode(G.undo.pop());
    if (!s) return;
    G.s = s;
    G.stuckKey = '';
    clearHint();
    Sound.play('tick');
    render();
    const plan = Rules.finishPlan(G.s);
    UI.finishBtn.hidden = !plan;
    saveCur();
  }
  function autoFinish() {
    if (!canInput()) return;
    const plan = Rules.finishPlan(G.s);
    if (!plan) { UI.finishBtn.hidden = true; return; }
    snapshot();
    G.busy = true;
    markStarted();
    let k = 0;
    const step = () => {
      if (!G || G.over) return;
      if (k >= plan.length) { G.busy = false; settle(); return; }
      const a = plan[k++];
      if (a.draw) { Rules.drawStep(G.s); Sound.play('draw'); }
      else {
        const m = a.m;
        const card = m.f === 'w' ? G.s.waste[G.s.waste.length - 1] : G.s.tab[m.i][G.s.tab[m.i].length - 1];
        Rules.apply(G.s, m);
        Sound.play('found', Rules.rankOf(card));
      }
      render();
      Timers.later(step, a.draw ? CONFIG.finishStepMs * 0.7 : CONFIG.finishStepMs);
    };
    step();
  }

  // Best destination for a tapped card: a foundation first, then a column (empty columns only for kings that free something).
  function bestMove(from) {
    const s = G.s;
    if (from.f === 'w' || (from.f === 't' && from.n === 1)) {
      const m = Object.assign({}, from, { to: 'f' });
      if (Rules.legal(s, m)) return m;
    }
    let best = null, empty = null;
    for (let j = 0; j < 7; j++) {
      if (from.f === 't' && j === from.i) continue;
      const m = Object.assign({}, from, { to: 't', j });
      if (!Rules.legal(s, m)) continue;
      if (s.tab[j].length) { if (!best) best = m; } else if (!empty) empty = m;
    }
    if (best) return best;
    if (empty) {
      if (from.f === 't' && s.down[from.i] === 0 && from.n === s.tab[from.i].length) return null; // king already at the bottom
      return empty;
    }
    return null;
  }

  /* =====================================================================
     Pointer input — tap to auto-move, drag to place
     ===================================================================== */
  function pickAt(el) {
    const c = +el.dataset.id, loc = RT.loc[c], s = G.s;
    if (!loc) return null;
    if (loc.p === 's') return { stock: true };
    if (loc.p === 'w') return loc.i === s.waste.length - 1 ? { ids: [c], from: { f: 'w' } } : null;
    if (loc.p === 'f') return loc.idx === s.found[loc.i] - 1 ? { ids: [c], from: { f: 'f', i: loc.i } } : null;
    if (loc.idx < s.down[loc.i]) return null;
    const col = s.tab[loc.i];
    return { ids: col.slice(loc.idx), from: { f: 't', i: loc.i, n: col.length - loc.idx } };
  }
  function onDown(e) {
    if (e.button > 0) return;
    if (!canInput()) return;
    const el = e.target.closest('.card');
    let pick = null;
    if (el) pick = pickAt(el);
    else if (e.target.closest('#stockSlot')) pick = { stock: true };
    if (!pick) return;
    e.preventDefault();
    RT.drag = Object.assign(pick, { x0: e.clientX, y0: e.clientY, moved: false, pid: e.pointerId, base: pick.ids ? pick.ids.map((c) => RT.pos[c]) : null });
  }
  function onMove(e) {
    const d = RT.drag;
    if (!d || e.pointerId !== d.pid || d.stock) return;
    const dx = e.clientX - d.x0, dy = e.clientY - d.y0;
    if (!d.moved) {
      if (Math.hypot(dx, dy) < 7) return;
      if (!canInput()) { RT.drag = null; return; }
      d.moved = true;
      clearHint();
      d.ids.forEach((c, k) => { const el = RT.cardEls[c]; el.classList.add('dragging'); el.style.zIndex = 5000 + k; });
    }
    d.dx = dx; d.dy = dy;
    d.ids.forEach((c, k) => {
      const p = d.base[k];
      RT.cardEls[c].style.transform = 'translate3d(' + (p.x + dx) + 'px,' + (p.y + dy) + 'px,0)';
    });
  }
  function endDrag(d) {
    if (!d.ids) return;
    d.ids.forEach((c) => { const el = RT.cardEls[c]; el.classList.remove('dragging'); el._x = NaN; }); // NaN: counts as moved, flies back on top
  }
  function onUp(e) {
    const d = RT.drag;
    if (!d || e.pointerId !== d.pid) return;
    RT.drag = null;
    if (d.stock) { if (Math.hypot(e.clientX - d.x0, e.clientY - d.y0) < 12) doDraw(); return; }
    if (!d.moved) {
      if (!canInput()) return;
      const m = bestMove(d.from);
      if (m) doMove(m);
      else { Sound.play('nope'); shake(d.ids); }
      return;
    }
    endDrag(d);
    const m = dropTarget(d);
    if (m && canInput() && doMove(m)) return;
    render();
  }
  function onCancel(e) {
    const d = RT.drag;
    if (!d || e.pointerId !== d.pid) return;
    RT.drag = null;
    endDrag(d);
    render();
  }
  function overlap(a, b) {
    const w = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x);
    const hh = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);
    return w > 0 && hh > 0 ? w * hh : 0;
  }
  function dropTarget(d) {
    const L = RT.layout, s = G.s;
    const p = d.base[0];
    const card = { x: p.x + d.dx, y: p.y + d.dy, w: L.cw, h: L.ch };
    let best = null, bestA = 0;
    for (let j = 0; j < 7; j++) {
      const m = Object.assign({}, d.from, { to: 't', j });
      if (!Rules.legal(s, m)) continue;
      const col = s.tab[j];
      const topY = col.length ? RT.pos[col[col.length - 1]].y : L.tabY;
      const r = { x: L.colX(j) - L.gap / 2, y: col.length ? topY : L.tabY, w: L.cw + L.gap, h: L.ch + (col.length ? 0 : L.ch) };
      if (col.length) { r.y = Math.max(L.tabY, topY - L.ch * 0.3); r.h = topY - r.y + L.ch * 1.4; }
      const a = overlap(card, r);
      if (a > bestA) { bestA = a; best = m; }
    }
    if (d.ids.length === 1 && d.from.f !== 'f') {
      const m = Object.assign({}, d.from, { to: 'f' });
      if (Rules.legal(s, m)) {
        const r = { x: L.foundX(0) - L.gap, y: L.topY - L.ch * 0.2, w: 4 * L.cw + 5 * L.gap, h: L.ch * 1.3 };
        const a = overlap(card, r);
        if (a > bestA) { bestA = a; best = m; }
      }
    }
    return bestA > L.cw * L.ch * 0.08 ? best : null;
  }
  function shake(ids) {
    ids.forEach((c) => {
      const el = RT.cardEls[c];
      el.classList.remove('shake'); void el.offsetWidth; el.classList.add('shake');
      setTimeout(() => el.classList.remove('shake'), 400);
    });
  }

  /* =====================================================================
     Hints
     ===================================================================== */
  function clearHint() {
    if (!RT.hint) return;
    Timers.cancel(RT.hint.timer);
    RT.hint.els.forEach((el) => el.classList.remove('hinted'));
    RT.hint = null;
  }
  function showHint() {
    if (!canInput()) return;
    clearHint();
    const hs = Rules.hints(G.s);
    const els = [];
    if (hs.moves.length) {
      const m = hs.moves[0].m, s = G.s;
      if (m.f === 'w') els.push(RT.cardEls[s.waste[s.waste.length - 1]]);
      else s.tab[m.i].slice(s.tab[m.i].length - m.n).forEach((c) => els.push(RT.cardEls[c]));
      if (m.to === 'f') {
        const card = m.f === 'w' ? s.waste[s.waste.length - 1] : s.tab[m.i][s.tab[m.i].length - 1];
        const su = Rules.suitOf(card), ft = Rules.foundTop(s, su);
        els.push(ft >= 0 ? RT.cardEls[ft] : UI.slots.querySelector('.found[data-q="' + FOUND_ORDER.indexOf(su) + '"]'));
      } else {
        const col = s.tab[m.j];
        els.push(col.length ? RT.cardEls[col[col.length - 1]] : UI.slots.querySelector('.col[data-col="' + m.j + '"]'));
      }
    } else if (hs.drawHelps) {
      const st = G.s.stock;
      els.push(st.length ? RT.cardEls[st[st.length - 1]] : UI.stockSlot);
      toast(t('drawTip'));
    } else {
      openStuck();
      return;
    }
    Sound.play('hint');
    els.forEach((el) => { el.classList.remove('hinted'); void el.offsetWidth; el.classList.add('hinted'); });
    RT.hint = { els, timer: Timers.later(clearHint, CONFIG.hintMs) };
  }

  /* =====================================================================
     Winning
     ===================================================================== */
  function win() {
    G.over = true;
    G.busy = true;
    UI.finishBtn.hidden = true;
    clearHint();
    markStarted();
    const secs = Math.max(1, Math.round(G.elapsed / 1000));
    const bonus = Rules.timeBonus(secs);
    G.s.score += bonus;
    const draw = G.s.draw, st = S.st[draw];
    const best = { time: !st.t || secs < st.t, score: G.s.score > st.sc, moves: !st.m || G.s.moves < st.m };
    st.w++; st.s++; st.b = Math.max(st.b, st.s);
    if (best.time) st.t = secs;
    if (best.score) st.sc = G.s.score;
    if (best.moves) st.m = G.s.moves;
    if (!S.fast || secs < S.fast) S.fast = secs;
    let daily = false;
    const today = dateKey();
    if (G.kind === 'daily' && G.date === today) {
      daily = true;
      if (S.daily.last !== today) {
        S.daily.s = S.daily.last === shiftDay(today, -1) ? S.daily.s + 1 : 1;
        S.daily.b = Math.max(S.daily.b, S.daily.s);
        S.daily.n++;
        S.daily.last = today;
        S.daily.h.push(today);
        while (S.daily.h.length > 14) S.daily.h.shift();
      }
    }
    const unlocks = refreshUnlocks(S);
    S.cur = null;
    UI.dailyDot.hidden = dailyDoneToday(S);
    saveNow();
    updateHud();
    Sound.play('win');
    const result = { secs, bonus, score: G.s.score, moves: G.s.moves, best, daily, unlocks, draw };
    playWinAnim(() => openWin(result));
  }
  // Cards leap off the foundations and tumble away. Tap to skip.
  function playWinAnim(done) {
    const L = RT.layout;
    const cards = [];
    for (let r = 12; r >= 0; r--) for (let q = 0; q < 4; q++) cards.push(FOUND_ORDER[q] * 13 + r);
    const items = cards.map((c, k) => {
      const p = RT.pos[c];
      return { c, el: RT.cardEls[c], x: p.x, y: p.y, vx: 0, vy: 0, rot: 0, vr: 0, t0: k * 55, live: false, gone: false };
    });
    RT.cardEls.forEach((el) => el.classList.add('free'));
    const A = { items, t: 0, last: now(), raf: 0, done, finished: false };
    RT.winAnim = A;
    const g = L.H * 2.6;
    const tick = () => {
      if (RT.winAnim !== A) return;
      const n = now();
      let dt = Math.min(0.05, (n - A.last) / 1000);
      A.last = n;
      if (RT.paused) dt = 0;
      A.t += dt * 1000;
      let alive = 0;
      for (const it of items) {
        if (it.gone) continue;
        alive++;
        if (!it.live) {
          if (A.t < it.t0) continue;
          it.live = true;
          it.vx = (Math.random() * 2 - 1) * L.W * 0.45;
          it.vy = -(0.55 + Math.random() * 0.6) * L.H;
          it.vr = (Math.random() * 2 - 1) * 360;
          it.el.style.zIndex = 6000 + items.indexOf(it);
        }
        it.vy += g * dt;
        it.x += it.vx * dt; it.y += it.vy * dt; it.rot += it.vr * dt;
        if (it.y > L.H + L.ch || it.x < -L.cw * 2 || it.x > L.W + L.cw) { it.gone = true; it.el.style.opacity = '0'; continue; }
        it.el.style.transform = 'translate3d(' + it.x.toFixed(1) + 'px,' + it.y.toFixed(1) + 'px,0) rotate(' + it.rot.toFixed(1) + 'deg)';
      }
      if (!alive || A.t > 5200) { finishWinAnim(); return; }
      A.raf = requestAnimationFrame(tick);
    };
    A.raf = requestAnimationFrame(tick);
    const c = UI.stage.getBoundingClientRect();
    confetti(c.left + c.width / 2, c.top + c.height * 0.3, 60);
  }
  function finishWinAnim() {
    const A = RT.winAnim;
    if (!A || A.finished) return;
    A.finished = true;
    cancelAnimationFrame(A.raf);
    A.done();
  }
  function stopWinAnim() {
    const A = RT.winAnim;
    RT.winAnim = null;
    if (A) cancelAnimationFrame(A.raf);
    RT.cardEls.forEach((el) => { el.classList.remove('free'); el.style.opacity = ''; el._x = null; el._y = null; });
    if (A) render(true); // cards back on the foundations, behind the result sheet
  }
  function confetti(x, y, n) {
    const colors = ['#ffd166', '#ef476f', '#06d6a0', '#4cc9f0', '#ffffff', '#f78c6b'];
    for (let k = 0; k < n; k++) {
      const d = h('i', 'confetti' + (k % 3 === 0 ? ' sq' : ''));
      const a = Math.random() * Math.PI * 2, r = 80 + Math.random() * 200;
      d.style.cssText = '--x:' + x + 'px;--y:' + y + 'px;--dx:' + (Math.cos(a) * r).toFixed(1) + 'px;--dy:' +
        (Math.sin(a) * r + 90).toFixed(1) + 'px;--rot:' + Math.round(Math.random() * 600 - 300) + 'deg;background:' + colors[k % colors.length];
      UI.fx.appendChild(d);
      setTimeout(() => d.remove(), 1600);
    }
  }

  /* =====================================================================
     HUD and labels
     ===================================================================== */
  function updateHud() {
    if (!G) return;
    UI.hudScore.textContent = fmtNum(G.s.score);
    UI.hudMoves.textContent = G.s.moves;
    UI.hudTime.textContent = fmtTime(G.elapsed / 1000);
    UI.undoBtn.disabled = !G.undo.length || G.over;
  }
  function renderLabels() {
    document.documentElement.lang = RT.lang;
    document.querySelectorAll('[data-t]').forEach((el) => { el.textContent = t(el.dataset.t); });
    UI.menuBtn.setAttribute('aria-label', t('menu'));
    UI.finishBtn.textContent = t('finish');
    if (G) {
      UI.dealName.textContent = G.kind === 'daily' ? t('dailyDeal', { date: fmtDate(G.date) }) : t('dealNo', { n: G.s.seed });
      UI.dealSub.textContent = t(G.s.draw === 3 ? 'draw3' : 'draw1');
    }
    UI.dailyDot.hidden = dailyDoneToday(S);
    UI.slots.querySelectorAll('.col span').forEach((el) => { el.textContent = RANKS[RT.lang === 'de' ? 'de' : 'en'][12]; });
  }

  /* =====================================================================
     Sheets (menu, daily, stats, designs, settings, rules, confirm, win, stuck)
     ===================================================================== */
  function openSheet(name, html, onAction, opts) {
    opts = opts || {};
    clearHint();
    RT.sheet = name;
    UI.modal.innerHTML = '<div class="sheet ' + name + '" role="dialog" aria-modal="true">' +
      (opts.noClose ? '' : '<button type="button" class="x" data-a="close" aria-label="' + esc(t('close')) + '">' + ICONS.close + '</button>') + html + '</div>';
    UI.modal.hidden = false;
    UI.modal.onclick = (e) => {
      const b = e.target.closest('[data-a]');
      if (b) { onAction(b.dataset.a, b); return; }
      if (e.target === UI.modal && !opts.noClose) { Sound.play('tick'); closeSheet(); }
    };
  }
  function closeSheet() {
    UI.modal.hidden = true;
    UI.modal.innerHTML = '';
    UI.modal.onclick = null;
    RT.sheet = null;
  }

  const seg = (name, val, opts) => '<div class="seg" role="radiogroup">' + opts.map(([v, label]) =>
    '<button type="button" role="radio" aria-checked="' + (v === val) + '" class="' + (v === val ? 'on' : '') + '" data-a="' + name + ':' + v + '">' + esc(label) + '</button>').join('') + '</div>';
  const sw = (name, on) => '<button type="button" class="switch' + (on ? ' on' : '') + '" role="switch" aria-checked="' + on + '" data-a="' + name + '"><i></i></button>';

  function openMenu() {
    if (G && G.busy && !G.over) return;
    Sound.play('tick');
    const row = (a, ico, label, sub) => '<button type="button" class="mrow" data-a="' + a + '"><span class="mico">' + ICONS[ico] + '</span><span class="mtxt"><b>' + esc(label) + '</b>' +
      (sub ? '<small>' + esc(sub) + '</small>' : '') + '</span><span class="mgo">' + ICONS.chevron + '</span></button>';
    const st = S.st[S.set.draw];
    const html = '<h2 class="brand"><span class="logo-mini">' + LOGO + '</span>Solo Stack</h2>' +
      '<div class="newbox"><div class="lbl">' + esc(t('newGame')) + '</div>' + seg('draw', S.set.draw, [[1, t('draw1')], [3, t('draw3')]]) +
      '<button type="button" class="btn primary wide" data-a="new">' + esc(t('newGame')) + '</button></div>' +
      row('daily', 'daily', t('dailyTitle'), dailyDoneToday(S) ? t('dailyDone') : t('dailyOpen')) +
      row('stats', 'stats', t('stats'), t('wins') + ': ' + totalWins(S) + (st.s > 1 ? ' · ' + t('streak') + ': ' + st.s : '')) +
      row('designs', 'designs', t('designs'), S.own.b.length + S.own.t.length + ' / ' + (CONFIG.backs.length + CONFIG.tables.length) + (S.fresh.length ? ' · ' + t('newBadge') : '')) +
      row('settings', 'settings', t('settings')) +
      row('rules', 'rules', t('howTo'));
    openSheet('menu', html, (a) => {
      if (a === 'close') { Sound.play('tick'); return closeSheet(); }
      if (a.indexOf('draw:') === 0) { S.set.draw = Number(a.split(':')[1]); scheduleSave(); Sound.play('tick'); return openMenuKeep(); }
      if (a === 'new') return requestNew('random', S.set.draw);
      Sound.play('tick');
      if (a === 'daily') openDaily();
      else if (a === 'stats') openStats();
      else if (a === 'designs') openDesigns();
      else if (a === 'settings') openSettings();
      else if (a === 'rules') openRules();
    });
  }
  function openMenuKeep() { const scroll = UI.modal.querySelector('.sheet') ? UI.modal.querySelector('.sheet').scrollTop : 0; openMenu(); const sh = UI.modal.querySelector('.sheet'); if (sh) sh.scrollTop = scroll; }

  // A started, unfinished game counts as not won if you leave it.
  function requestNew(kind, draw) {
    const resumeDaily = kind === 'daily' && G && G.kind === 'daily' && G.date === dateKey() && G.s.draw === draw && !G.over;
    if (resumeDaily) { closeSheet(); return; }
    if (G && G.started && !G.over) {
      Sound.play('tick');
      openSheet('confirm', '<h2>' + esc(t('giveUpTitle')) + '</h2><p>' + esc(t('giveUpBody')) + '</p><div class="actions">' +
        '<button type="button" class="btn" data-a="keep">' + esc(t('keepPlaying')) + '</button>' +
        '<button type="button" class="btn danger" data-a="yes">' + esc(t('giveUpYes')) + '</button></div>', (a) => {
        if (a === 'yes') { abandon(); go(); } else { Sound.play('tick'); closeSheet(); }
      }, { noClose: true });
      return;
    }
    go();
    function go() { closeSheet(); Sound.play('tick'); startDeal(kind, draw); }
  }
  function abandon() { if (G && G.started && !G.over) S.st[G.s.draw].s = 0; }

  function openDaily(pick) {
    const today = dateKey(), done = dailyDoneToday(S);
    const playingToday = G && G.kind === 'daily' && G.date === today && !G.over;
    const drawSel = pick === 1 || pick === 3 ? pick : playingToday ? G.s.draw : S.set.draw;
    const strip = [];
    for (let k = 6; k >= 0; k--) {
      const d = shiftDay(today, -k), hit = S.daily.h.indexOf(d) >= 0;
      const lab = (function () { try { return new Intl.DateTimeFormat(RT.lang === 'de' ? 'de-DE' : 'en-US', { weekday: 'narrow' }).format(new Date(d + 'T12:00:00')); } catch (e) { return d.slice(8); } })();
      strip.push('<span class="day' + (hit ? ' hit' : '') + (k === 0 ? ' now' : '') + '"><i>' + (hit ? ICONS.check : '') + '</i><small>' + esc(lab) + '</small></span>');
    }
    const streak = dailyStreakNow(S);
    const html = '<div class="dhead"><span class="dico">' + ICONS.daily + '</span><div><h2>' + esc(t('dailyTitle')) + '</h2><p class="sub">' + esc(fmtDate(today, true)) + '</p></div></div>' +
      '<p class="intro">' + esc(t('dailyIntro')) + '</p>' +
      '<div class="dstatus ' + (done ? 'done' : '') + '">' + (done ? ICONS.check : '') + esc(done ? t('dailyDone') : t('dailyOpen')) + '</div>' +
      '<div class="week">' + strip.join('') + '</div>' +
      '<div class="kv">' + kv(t('dailyStreak'), streak === 1 ? t('day1') : t('days', { n: streak })) + kv(t('dailyBest'), S.daily.b === 1 ? t('day1') : t('days', { n: S.daily.b })) +
      kv(t('dailyTotal'), S.daily.n) + '</div>' +
      '<div class="lbl">' + esc(t('dailyMode')) + '</div>' + seg('ddraw', drawSel, [[1, t('draw1')], [3, t('draw3')]]) +
      '<div class="actions"><button type="button" class="btn primary wide" data-a="play">' + esc(playingToday && G.s.draw === drawSel ? t('resume') : done ? t('playAgain') : t('play')) + '</button></div>';
    openSheet('daily', html, (a) => {
      if (a === 'close') { Sound.play('tick'); return closeSheet(); }
      if (a.indexOf('ddraw:') === 0) { Sound.play('tick'); return openDaily(Number(a.split(':')[1])); }
      if (a === 'play') requestNew('daily', drawSel);
    });
  }
  const kv = (k, v) => '<span>' + esc(k) + '</span><b>' + esc(v) + '</b>';

  function openStats() {
    const col = (d) => {
      const st = S.st[d];
      return [st.p, st.w, st.p ? Math.round(st.w / st.p * 100) + '%' : '–', st.s, st.b, st.t ? fmtTime(st.t) : '–', st.sc ? fmtNum(st.sc) : '–', st.m || '–'];
    };
    const a = col(1), b = col(3);
    const labels = [t('played'), t('wins'), t('winRate'), t('streak'), t('bestStreak'), t('bestTime'), t('bestScore'), t('fewestMoves')];
    const rows = labels.map((l, i) => '<tr><th scope="row">' + esc(l) + '</th><td>' + esc(a[i]) + '</td><td>' + esc(b[i]) + '</td></tr>').join('');
    const streak = dailyStreakNow(S);
    let dev = '';
    if (DEV) dev = '<div class="dev"><button type="button" class="btn" data-a="dev-reset">Reset save</button><button type="button" class="btn" data-a="dev-unlock">Unlock all</button><button type="button" class="btn" data-a="dev-win">Win now</button></div>';
    const html = '<h2>' + esc(t('stats')) + '</h2>' +
      '<table class="stbl"><thead><tr><th></th><th scope="col">' + esc(t('draw1')) + '</th><th scope="col">' + esc(t('draw3')) + '</th></tr></thead><tbody>' + rows + '</tbody></table>' +
      '<h3>' + esc(t('dailyTitle')) + '</h3><div class="kv">' + kv(t('dailyTotal'), S.daily.n) + kv(t('dailyStreak'), streak === 1 ? t('day1') : t('days', { n: streak })) +
      kv(t('dailyBest'), S.daily.b === 1 ? t('day1') : t('days', { n: S.daily.b })) + '</div>' + dev;
    openSheet('stats', html, (act) => {
      if (act === 'close') { Sound.play('tick'); return closeSheet(); }
      if (!DEV) return;
      if (act === 'dev-reset') { S = newState(); applyLook(); saveNow(); closeSheet(); startDeal('random', 1); }
      if (act === 'dev-unlock') { S.st[1].w = Math.max(S.st[1].w, 60); S.st[3].w = Math.max(S.st[3].w, 6); S.st[1].b = 5; S.daily.n = 5; S.daily.b = 5; S.fast = 100; refreshUnlocks(S); saveNow(); openStats(); }
      if (act === 'dev-win') { closeSheet(); devWin(); }
    });
  }

  function openDesigns() {
    const fresh = S.fresh.slice();
    const tile = (kind, item) => {
      const owned = (kind === 'b' ? S.own.b : S.own.t).indexOf(item.id) >= 0;
      const on = (kind === 'b' ? S.back : S.table) === item.id;
      const art = kind === 'b'
        ? '<span class="mini-back"><span class="back bk-' + item.id + '">' + (item.emblem ? '<i class="emb"><svg viewBox="0 0 100 100">' + EMBLEMS[item.emblem] + '</svg></i>' : '') + '</span></span>'
        : '<span class="mini-table tb-' + item.id + '"><i></i><i></i><i></i></span>';
      return '<button type="button" class="dtile' + (owned ? '' : ' locked') + (on ? ' on' : '') + '" data-a="pick:' + kind + ':' + item.id + '">' + art +
        '<b>' + esc(nm(item)) + '</b><small>' + (owned ? (on ? esc(t('inUse')) : '&nbsp;') : ICONS.lock + esc(unlockText(item.unlock))) + '</small>' +
        (fresh.indexOf(kind + ':' + item.id) >= 0 ? '<span class="new">' + esc(t('newBadge')) + '</span>' : '') + '</button>';
    };
    const html = '<h2>' + esc(t('designs')) + '</h2>' +
      '<h3>' + esc(t('backs')) + ' <small>' + S.own.b.length + ' / ' + CONFIG.backs.length + '</small></h3><div class="dgrid backs">' + CONFIG.backs.map((b) => tile('b', b)).join('') + '</div>' +
      '<h3>' + esc(t('tables')) + ' <small>' + S.own.t.length + ' / ' + CONFIG.tables.length + '</small></h3><div class="dgrid tables">' + CONFIG.tables.map((b) => tile('t', b)).join('') + '</div>';
    if (S.fresh.length) { S.fresh = []; scheduleSave(); }
    openSheet('designs', html, (a, btn) => {
      if (a === 'close') { Sound.play('tick'); return closeSheet(); }
      const [, kind, id] = a.split(':');
      const owned = (kind === 'b' ? S.own.b : S.own.t).indexOf(id) >= 0;
      const item = kind === 'b' ? BACK[id] : TABLE[id];
      if (!owned) { Sound.play('nope'); btn.classList.remove('shake'); void btn.offsetWidth; btn.classList.add('shake'); toast(unlockText(item.unlock)); return; }
      if (kind === 'b') { S.back = id; refreshBacks(); } else { S.table = id; applyLook(); }
      Sound.play('tick');
      scheduleSave();
      const sc = UI.modal.querySelector('.sheet').scrollTop;
      S.fresh = fresh.filter((f) => f !== kind + ':' + id); // keep the other NEW badges for this visit
      openDesigns();
      UI.modal.querySelector('.sheet').scrollTop = sc;
    });
  }
  function applyLook() { document.body.dataset.table = S.table; }

  function openSettings() {
    const html = '<h2>' + esc(t('settings')) + '</h2>' +
      '<div class="srow col"><div><b>' + esc(t('drawMode')) + '</b><small>' + esc(t('drawModeNote')) + '</small></div>' + seg('draw', S.set.draw, [[1, t('draw1')], [3, t('draw3')]]) + '</div>' +
      '<div class="srow"><div><b>' + esc(t('autoFound')) + '</b><small>' + esc(t('autoFoundNote')) + '</small></div>' + sw('auto', S.set.auto) + '</div>' +
      '<div class="srow"><div><b>' + esc(t('left')) + '</b><small>' + esc(t('leftNote')) + '</small></div>' + sw('left', S.set.left) + '</div>' +
      '<div class="srow"><div><b>' + esc(t('sound')) + '</b></div>' + sw('sound', S.set.sound) + '</div>' +
      '<div class="srow col"><div><b>' + esc(t('language')) + '</b></div>' + seg('lang', S.set.lang, [['auto', t('langAuto')], ['en', 'English'], ['de', 'Deutsch']]) + '</div>';
    openSheet('settings', html, (a) => {
      if (a === 'close') { Sound.play('tick'); return closeSheet(); }
      const [k, v] = a.split(':');
      if (k === 'draw') S.set.draw = Number(v);
      else if (k === 'auto') { S.set.auto = !S.set.auto; }
      else if (k === 'left') { S.set.left = !S.set.left; computeLayout(); render(); }
      else if (k === 'sound') { S.set.sound = !S.set.sound; Sound.userOn = S.set.sound; Sound.refresh(); if (S.set.sound) Sound.unlock(); }
      else if (k === 'lang') { S.set.lang = v; applyLang(); }
      Sound.play('tick');
      scheduleSave();
      const sc = UI.modal.querySelector('.sheet').scrollTop;
      openSettings();
      UI.modal.querySelector('.sheet').scrollTop = sc;
    });
  }
  function openRules() {
    const html = '<h2>' + esc(t('howTo')) + '</h2>' + t('rules').map(([hd, p]) => '<h3>' + esc(hd) + '</h3><p>' + esc(p) + '</p>').join('');
    openSheet('rules', html, (a) => { if (a === 'close') { Sound.play('tick'); closeSheet(); } });
  }
  function openStuck() {
    Sound.play('nope');
    const html = '<h2>' + esc(t('stuckTitle')) + '</h2><p>' + esc(t('stuckBody')) + '</p><div class="actions">' +
      '<button type="button" class="btn primary" data-a="undo">' + esc(t('stuckUndo')) + '</button>' +
      '<button type="button" class="btn" data-a="new">' + esc(t('stuckNew')) + '</button>' +
      '<button type="button" class="btn ghost" data-a="close">' + esc(t('stuckKeep')) + '</button></div>';
    openSheet('stuck', html, (a) => {
      if (a === 'undo') { closeSheet(); undo(); }
      else if (a === 'new') { abandon(); closeSheet(); startDeal('random', S.set.draw); }
      else { Sound.play('tick'); closeSheet(); }
    }, { noClose: true });
  }
  function openWin(r) {
    stopWinAnim();
    const rows = [
      [t('time'), fmtTime(r.secs), r.best.time],
      [t('moves'), r.moves, r.best.moves],
      [t('timeBonus'), '+' + fmtNum(r.bonus), false],
      [t('total'), fmtNum(r.score), r.best.score],
    ];
    let rewards = '';
    for (const u of r.unlocks) {
      const art = u.kind === 'b'
        ? '<span class="mini-back sm"><span class="back bk-' + u.item.id + '">' + (u.item.emblem ? '<i class="emb"><svg viewBox="0 0 100 100">' + EMBLEMS[u.item.emblem] + '</svg></i>' : '') + '</span></span>'
        : '<span class="mini-table sm tb-' + u.item.id + '"></span>';
      rewards += '<div class="reward">' + art + '<span><small>' + esc(t('newDesign')) + '</small><b>' + esc(nm(u.item)) + '</b></span></div>';
    }
    const html = '<div class="trophy" aria-hidden="true">' + suitSvg(1) + suitSvg(0) + suitSvg(2) + suitSvg(3) + '</div>' +
      '<h2>' + esc(r.daily ? t('wonDaily') : t('won')) + '</h2><p class="sub">' + esc(G.kind === 'daily' ? t('dailyDeal', { date: fmtDate(G.date) }) : t('dealNo', { n: G.s.seed })) + ' · ' + esc(t(r.draw === 3 ? 'draw3' : 'draw1')) + '</p>' +
      '<div class="res">' + rows.map(([k, v, b]) => '<span>' + esc(k) + '</span><b>' + esc(v) + (b ? '<em>' + esc(t('newBest')) + '</em>' : '') + '</b>').join('') + '</div>' +
      (rewards ? '<div class="rewards">' + rewards + '</div>' : '') +
      '<div class="actions"><button type="button" class="btn primary" data-a="new">' + esc(t('newGame')) + '</button>' +
      (!dailyDoneToday(S) ? '<button type="button" class="btn" data-a="daily">' + esc(t('dailyTitle')) + '</button>' : '') +
      (r.unlocks.length ? '<button type="button" class="btn" data-a="designs">' + esc(t('toDesigns')) + '</button>' : '<button type="button" class="btn" data-a="stats">' + esc(t('stats')) + '</button>') + '</div>';
    openSheet('win', html, (a) => {
      Sound.play('tick');
      if (a === 'new') startDeal('random', S.set.draw);
      else if (a === 'daily') openDaily();
      else if (a === 'designs') openDesigns();
      else if (a === 'stats') openStats();
    }, { noClose: true });
    if (r.unlocks.length) Sound.play('unlock');
  }
  function devWin() {
    if (!G) return;
    const s = G.s;
    s.tab = [[], [], [], [], [], [], []]; s.down = [0, 0, 0, 0, 0, 0, 0]; s.stock = []; s.found = [13, 13, 13, 12];
    s.waste = [3 * 13 + 12];
    markStarted();
    render();
    runAuto();
    if (!S.set.auto) doMove({ f: 'w', to: 'f' });
  }

  /* =====================================================================
     Save / load (versioned JSON, validated on load)
     ===================================================================== */
  function saveCur() {
    if (!G || G.over) { if (S) S.cur = null; scheduleSave(); return; }
    S.cur = { k: G.kind === 'daily' ? 'd' : 'r', dt: G.date || undefined, s: Rules.encode(G.s), e: Math.round(G.elapsed), st: G.started ? 1 : 0, u: G.undo.slice(-CONFIG.undoSaved) };
    scheduleSave();
  }
  function serialize(s) {
    const st = (x) => [x.p, x.w, x.s, x.b, x.t, x.sc, x.m];
    return JSON.stringify({
      v: CONFIG.saveVersion,
      set: { d: s.set.draw, a: s.set.auto ? 1 : 0, l: s.set.left ? 1 : 0, snd: s.set.sound ? 1 : 0, lg: s.set.lang },
      bk: s.back, tb: s.table, ob: s.own.b, ot: s.own.t, fr: s.fresh,
      st: { 1: st(s.st[1]), 3: st(s.st[3]) },
      dl: { n: s.daily.n, s: s.daily.s, b: s.daily.b, l: s.daily.last, h: s.daily.h },
      fa: s.fast, rc: { 1: s.recent[1], 3: s.recent[3] }, tip: s.tipShown ? 1 : 0,
      cur: s.cur,
    });
  }
  function migrate(o) {
    if (!o || typeof o !== 'object' || typeof o.v !== 'number') return null;
    // When the save format changes, bump CONFIG.saveVersion and convert older saves here, one version at a time.
    return o;
  }
  function hydrate(raw) {
    const s = newState();
    if (!raw || typeof raw !== 'string') return s;
    let o;
    try { o = JSON.parse(raw); } catch (e) { SDK.warn(); return s; }
    o = migrate(o);
    if (!o) return s;
    const int = (v, d) => (typeof v === 'number' && isFinite(v) && v >= 0 ? Math.min(Math.floor(v), 1e9) : d);
    const isDate = (v) => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v);
    if (o.set && typeof o.set === 'object') {
      s.set.draw = o.set.d === 3 ? 3 : 1;
      s.set.auto = o.set.a !== 0;
      s.set.left = o.set.l === 1;
      s.set.sound = o.set.snd !== 0;
      s.set.lang = ['auto', 'en', 'de'].indexOf(o.set.lg) >= 0 ? o.set.lg : 'auto';
    }
    if (o.st && typeof o.st === 'object') {
      [1, 3].forEach((d) => {
        const a = o.st[d];
        if (!Array.isArray(a)) return;
        const x = s.st[d];
        x.p = int(a[0], 0); x.w = Math.min(int(a[1], 0), x.p); x.s = int(a[2], 0); x.b = Math.max(int(a[3], 0), x.s); x.t = int(a[4], 0); x.sc = int(a[5], 0); x.m = int(a[6], 0);
      });
    }
    if (o.dl && typeof o.dl === 'object') {
      const d = o.dl;
      s.daily.n = int(d.n, 0); s.daily.s = int(d.s, 0); s.daily.b = Math.max(int(d.b, 0), s.daily.s);
      s.daily.last = isDate(d.l) ? d.l : '';
      s.daily.h = Array.isArray(d.h) ? d.h.filter(isDate).slice(-14) : [];
    }
    s.fast = int(o.fa, 0);
    if (o.rc && typeof o.rc === 'object') [1, 3].forEach((d) => { if (Array.isArray(o.rc[d])) s.recent[d] = o.rc[d].filter((x) => int(x, 0) > 0).slice(-CONFIG.recentAvoid); });
    if (Array.isArray(o.ob)) o.ob.forEach((id) => { if (BACK[id] && s.own.b.indexOf(id) < 0) s.own.b.push(id); });
    if (Array.isArray(o.ot)) o.ot.forEach((id) => { if (TABLE[id] && s.own.t.indexOf(id) < 0) s.own.t.push(id); });
    refreshUnlocks(s);
    s.fresh = Array.isArray(o.fr) ? o.fr.filter((f) => typeof f === 'string' && f.length < 30).slice(0, 30) : [];
    if (s.own.b.indexOf(o.bk) >= 0) s.back = o.bk;
    if (s.own.t.indexOf(o.tb) >= 0) s.table = o.tb;
    s.tipShown = o.tip === 1;
    const c = o.cur;
    if (c && typeof c === 'object') {
      const st = Rules.decode(c.s);
      if (st && !Rules.isWon(st) && (c.k === 'r' || (c.k === 'd' && isDate(c.dt)))) {
        const undo = Array.isArray(c.u) ? c.u.filter((x) => typeof x === 'string' && Rules.decode(x)).slice(-CONFIG.undoSaved) : [];
        s.cur = { k: c.k, dt: c.k === 'd' ? c.dt : undefined, s: c.s, e: int(c.e, 0), st: c.st === 1 ? 1 : 0, u: undo };
      }
    }
    return s;
  }
  function saveNow() {
    if (!S) return;
    clearTimeout(RT.saveTimer);
    RT.saveTimer = 0;
    SDK.save(serialize(S));
    if (CONFIG.leaderboard.enabled) {
      const v = Math.max(S.st[1].sc, S.st[3].sc);
      if (v > RT.lastScore) { RT.lastScore = v; SDK.sendScore(v); }
    }
  }
  function scheduleSave() {
    if (RT.saveTimer) return;
    RT.saveTimer = setTimeout(saveNow, CONFIG.saveDebounceMs);
  }
  function loadWithRetry() {
    let tries = 0;
    const attempt = () => SDK.load().catch(() => {
      tries++;
      if (tries < 3) return new Promise((res) => setTimeout(res, 400 * tries)).then(attempt);
      // Cloud save unreachable: play this session without saving so an existing save is never overwritten.
      SDK.cloudSaveOk = false;
      SDK.error();
      return '';
    });
    return attempt();
  }

  /* =====================================================================
     Language, pause, clock
     ===================================================================== */
  function resolveLang() {
    if (S.set.lang === 'en' || S.set.lang === 'de') return S.set.lang;
    const tag = SDK.inYT ? RT.sdkLang : PREVIEW_LANG;
    return typeof tag === 'string' && tag.toLowerCase().indexOf('de') === 0 ? 'de' : 'en';
  }
  function applyLang() {
    const lang = resolveLang();
    if (lang === RT.lang && UI.cards.childNodes.length) { renderLabels(); return; }
    RT.lang = lang;
    refreshFaces();
    renderLabels();
  }
  function setPaused(reason, on) {
    if (on) RT.pauseReasons.add(reason); else RT.pauseReasons.delete(reason);
    const should = RT.pauseReasons.size > 0;
    if (should === RT.paused) return;
    RT.paused = should;
    document.body.classList.toggle('paused', should);
    if (should) {
      Timers.pause();
      Sound.pause();
      if (RT.drag) { const d = RT.drag; RT.drag = null; endDrag(d); render(); }
      saveCur();
      saveNow();
    } else {
      Sound.resume();
      RT.clockLast = now();
      if (RT.winAnim) RT.winAnim.last = now();
      Timers.resume();
    }
  }
  function startClock() {
    RT.clockLast = now();
    setInterval(() => {
      const n = now(), dt = n - RT.clockLast;
      RT.clockLast = n;
      if (!G || RT.paused || G.over || !G.started || !UI.modal.hidden) return;
      const before = Math.floor(G.elapsed / 1000);
      G.elapsed += Math.min(dt, 2000);
      if (Math.floor(G.elapsed / 1000) !== before) UI.hudTime.textContent = fmtTime(G.elapsed / 1000);
    }, 250);
  }

  /* =====================================================================
     UI wiring and boot
     ===================================================================== */
  function buildUI() {
    Object.assign(UI, {
      app: $('app'), stage: $('stage'), table: $('table'), slots: $('slots'), cards: $('cards'), finishBtn: $('finishBtn'),
      hudScore: $('hudScore'), hudTime: $('hudTime'), hudMoves: $('hudMoves'), dealName: $('dealName'), dealSub: $('dealSub'),
      menuBtn: $('menuBtn'), fx: $('fx'), modal: $('modal'), toasts: $('toasts'), bar: $('bar'),
    });
    UI.menuBtn.innerHTML = ICONS.menu;
    UI.bar.querySelectorAll('[data-ico]').forEach((n) => { n.innerHTML = ICONS[n.dataset.ico]; });
    UI.undoBtn = UI.bar.querySelector('[data-act="undo"]');
    UI.dailyDot = UI.bar.querySelector('[data-act="daily"] .dot');
    buildSlots();
    buildCards();
    applyLook();

    UI.menuBtn.addEventListener('click', () => { if (G && G.busy && !G.over) return; openMenu(); });
    UI.bar.addEventListener('click', (e) => {
      const b = e.target.closest('[data-act]');
      if (!b) return;
      const act = b.dataset.act;
      if (act === 'undo') undo();
      else if (act === 'hint') showHint();
      else if (act === 'new') { if (G && G.busy && !G.over) return; requestNew('random', S.set.draw); }
      else if (act === 'daily') { if (G && G.busy && !G.over) return; Sound.play('tick'); openDaily(); }
    });
    UI.finishBtn.addEventListener('click', autoFinish);
    UI.table.addEventListener('pointerdown', onDown);
    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onCancel);
    UI.stage.addEventListener('click', () => { if (RT.winAnim && !RT.winAnim.finished) finishWinAnim(); });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') { if (!UI.modal.hidden && RT.sheet !== 'win' && RT.sheet !== 'confirm' && RT.sheet !== 'stuck') closeSheet(); else if (UI.modal.hidden) openMenu(); return; }
      if (!UI.modal.hidden || !G) return;
      const k = e.key.toLowerCase();
      if ((e.ctrlKey || e.metaKey) && k === 'z') { e.preventDefault(); undo(); }
      else if (k === 'z' || k === 'u') undo();
      else if (k === ' ' || k === 'd') { e.preventDefault(); doDraw(); }
      else if (k === 'h') showHint();
      else if (k === 'n') requestNew('random', S.set.draw);
      else if (k === 'f' && !UI.finishBtn.hidden) autoFinish();
    });
    document.addEventListener('pointerdown', () => Sound.unlock(), true);
    document.addEventListener('contextmenu', (e) => e.preventDefault());
    window.addEventListener('resize', relayout);
    if (window.ResizeObserver) new ResizeObserver(relayout).observe(UI.stage);
  }

  function boot() {
    const splash = $('splash'), fill = $('loadfill');
    Sound.ytOn = SDK.audioEnabled();
    SDK.onAudioChange((on) => { Sound.ytOn = !!on; Sound.refresh(); });
    SDK.onPause(() => setPaused('youtube', true));
    SDK.onResume(() => setPaused('youtube', false));
    // Inside Playables, pausing comes from onPause/onResume only (no Page Visibility API there).
    if (!SDK.inYT) document.addEventListener('visibilitychange', () => setPaused('hidden', document.hidden));
    window.addEventListener('error', () => SDK.error());

    new Promise((res) => requestAnimationFrame(() => {
      SDK.firstFrameReady(); // splash is on screen
      fill.style.width = '45%';
      res();
    }))
      .then(() => Promise.all([loadWithRetry(), SDK.language()]))
      .then(([raw, lang]) => { RT.sdkLang = lang; S = hydrate(raw); })
      .catch(() => { S = S || newState(); })
      .then(() => {
        Sound.userOn = S.set.sound;
        RT.lang = resolveLang();
        buildUI();
        renderLabels();
        fill.style.width = '100%';
        setTimeout(() => {
          UI.app.hidden = false;
          splash.classList.add('out');
          relayoutOnly();
          const cur = S.cur;
          let resumed = false;
          if (cur) {
            const st = Rules.decode(cur.s);
            if (st) {
              startDeal(cur.k === 'd' ? 'daily' : 'random', st.draw, { resume: { s: st, kind: cur.k === 'd' ? 'daily' : 'random', date: cur.dt || null, started: !!cur.st, elapsed: cur.e, undo: cur.u } });
              resumed = true;
              if (cur.st) toast(t('welcome'), t('welcomeSub'));
              settle();
            }
          }
          if (!resumed) startDeal('random', S.set.draw);
          startClock();
          requestAnimationFrame(() => {
            SDK.gameReady(); // the table is interactive
            setTimeout(() => splash.remove(), 400);
          });
        }, 280);
      });
  }
  function relayoutOnly() {
    const wide = window.innerWidth > window.innerHeight * 1.25 && window.innerHeight < 640;
    document.body.classList.toggle('wide', wide);
  }

  if (DEV) { // console access for playtesting: SOLO.state(), SOLO.game(), SOLO.win()
    window.SOLO = {
      state: () => S, game: () => G, Rules, Deals, CONFIG, win: devWin, save: saveNow, setPaused, startDeal,
      setState(enc) { const st = Rules.decode(enc); if (!st || !G) return false; G.s = st; G.started = true; G.over = false; G.busy = false; G.stuckKey = ''; render(true); settle(); return true; },
    };
  }
  boot();
})();
