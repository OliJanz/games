/*! Plink! — drop four in a row. Built for YouTube Playables. Vanilla JS, no dependencies. */
(function () {
  'use strict';

  /* Development builds only: true adds a console handle (window.PLINK) and a reset button in Stats. Keep false for release. */
  const DEV = false;

  /* =====================================================================
     CONFIG — opponents, chips, timings. Edit numbers and text, not code.
     ===================================================================== */
  const CONFIG = {
    saveVersion: 1,
    saveDebounceMs: 1200,
    thinkMs: { min: 450, max: 950 },  // how long the computer visibly "thinks" before a move
    resultDelayMs: 1000,              // winning line stays on screen this long before the result sheet
    taunt: { chance: 0.3, minGap: 3 },// chance of a quip after a computer move, at most every 3 of its moves
    startChips: ['cherry', 'mint'],   // Player 1 and Player 2 defaults
    cpuFallback: ['slate', 'mint', 'cherry'], // chips the computer uses when yours has the same colour as its own

    /* ai: depth = moves looked ahead (0 = only judges the board after its own move)
           temp = random noise added to move scores (bigger = sloppier)
           blunder = chance of a random move · win = chance it spots its own winning move
           block = chance it spots your winning threat · time = ms budget for a full-strength search
       short = optional shorter name for the game screen */
    opponents: [
      { id: 'pip', name: 'Pip', color: '#ffc93c', chip: 'sunny', tagline: 'Just learned the rules. Mostly.',
        ai: { depth: 0, temp: 40, blunder: 0.5, win: 0.5, block: 0.15 },
        lines: { hi: 'Hi! Is it my turn? It’s my turn!', win: 'I won?! I WON! How?', lose: 'Aww. Good game! Teach me that one?', draw: 'Everyone wins! Right?',
          taunts: ['Ooh, which hole is the good one?', 'Wait, where did my chip go?', 'I like this column. It’s shiny.', 'Is four a lot?'] } },
      { id: 'taffy', name: 'Taffy', color: '#ff7eb6', chip: 'taffy', tagline: 'Plays whatever looks prettiest.',
        ai: { depth: 0, temp: 25, blunder: 0.25, win: 0.85, block: 0.45 },
        lines: { hi: 'Let’s make the board pretty!', win: 'Vibes: undefeated.', lose: 'Rude. Beautiful, but rude.', draw: 'A perfectly balanced board. Adorable.',
          taunts: ['Pink goes here. Obviously.', 'Is that a trap? It’s a cute trap.', 'I pick by vibes.', 'Sparkly move, right?'] } },
      { id: 'gumbo', name: 'Gumbo', color: '#8bd346', chip: 'lime', tagline: 'Slow, sleepy and stubborn.',
        ai: { depth: 1, temp: 20, blunder: 0.1, win: 1, block: 0.7 },
        lines: { hi: 'Mmh. Hello. Take your time. I will.', win: 'Told you. Steady.', lose: 'Zzz… oh. You won. Nice.', draw: 'Nobody lost. Good nap.',
          taunts: ['Slow and steady.', 'I was sleeping. I’m awake now.', 'Hmm. Hmmmm.', 'Mmh.'] } },
      { id: 'fizz', name: 'Fizz', color: '#ff8a3d', chip: 'fizz', tagline: 'Never thinks twice.',
        ai: { depth: 2, temp: 14, blunder: 0.05, win: 1, block: 0.9 },
        lines: { hi: 'Ready? Go go go!', win: 'FIZZ-TASTIC!', lose: 'Went flat. Rematch?', draw: 'Fizzled out. Again!',
          taunts: ['Pop! Pop! Pop!', 'I don’t plan. I fizz.', 'Faster! Faster!', 'Bubbles incoming!'] } },
      { id: 'marbles', name: 'Marbles', color: '#a45ee8', chip: 'marble', tagline: 'Loves a good calculation.',
        ai: { depth: 3, temp: 9, blunder: 0.02 },
        lines: { hi: 'I calculate a 73% chance of winning.', win: 'As calculated.', lose: 'Recalculating… that wasn’t in my notes.', draw: 'A statistically boring result.',
          taunts: ['Interesting choice. Wrong, but interesting.', 'Adjusting my glasses dramatically.', 'I’ve seen this pattern before.', 'Carry the one…'] } },
      { id: 'crumb', name: 'Captain Crumb', short: 'Capt. Crumb', color: '#38b6ff', chip: 'ocean', tagline: 'Sails the seven columns.',
        ai: { depth: 4, temp: 6 },
        lines: { hi: 'Ahoy! Seven columns, one captain.', win: 'Victory on the high seas!', lose: 'Abandon ship! Well played, sailor.', draw: 'Calm waters. A fair duel.',
          taunts: ['Steady as she drops!', 'I smell a storm in column four.', 'All hands on deck!', 'Arr, a fine move.'] } },
      { id: 'mochi', name: 'Madame Mochi', short: 'Mme Mochi', color: '#f4a3c0', chip: 'mochi', tagline: 'Soft outside, ruthless inside.',
        ai: { depth: 5, temp: 4 },
        lines: { hi: 'Let’s have a gentle game. Mostly.', win: 'Sweet, isn’t it?', lose: 'Lovely. You’ve earned a mochi.', draw: 'Balanced. Like tea and cake.',
          taunts: ['So soft. So certain.', 'No rush, dear.', 'Breathe in. Drop out.', 'Oh, how sweet.'] } },
      { id: 'zapp', name: 'Zapp', color: '#14c8c8', chip: 'zap', tagline: 'Plans ahead. Way ahead.',
        ai: { depth: 6, temp: 2 },
        lines: { hi: 'SCANNING BOARD. HELLO, HUMAN.', win: 'VICTORY PROTOCOL COMPLETE.', lose: 'ERROR: HUMAN TOO STRONG.', draw: 'RESULT: TIE. REBOOTING PRIDE.',
          taunts: ['Processing your move… amusing.', 'Threat level: moderate.', 'My circuits enjoy column three.', 'BEEP. That was a good one.'] } },
      { id: 'duchess', name: 'Duchess Dot', color: '#5b3cc4', chip: 'royal', tagline: 'Has never lost. Allegedly.',
        ai: { depth: 8, temp: 1 },
        lines: { hi: 'You may begin. I shall win.', win: 'Naturally.', lose: 'Well. How… impressive.', draw: 'A draw? Acceptable. Barely.',
          taunts: ['How quaint.', 'One does not simply block the Duchess.', 'Pearls, please. This is getting good.', 'Charming. Futile, but charming.'] } },
      { id: 'master', name: 'The Plinkmaster', short: 'Plinkmaster', color: '#ffb703', chip: 'crown', tagline: 'The final boss. Has a cape.',
        ai: { time: 450, maxDepth: 20 },
        lines: { hi: 'So, you climbed the ladder. Show me.', win: 'The Master remains.', lose: 'A new Plinkmaster rises. Take the crown.', draw: 'You held the line. Impressive.',
          taunts: ['I saw that move ten turns ago.', 'Every chip falls where I want it.', 'Cape status: dramatic.', 'Interesting…'] } },
    ],

    /* tone: chips with the same tone count as "too similar" to face each other. pattern: see chipPattern(). */
    chips: [
      { id: 'cherry', name: 'Cherry', tone: 'red', base: '#ff4d6d', dark: '#c9304f', light: '#ffd1db', pattern: 'plain', unlock: { type: 'start' } },
      { id: 'mint', name: 'Mint', tone: 'green', base: '#2ed3a0', dark: '#139e77', light: '#d4fff0', pattern: 'plain', unlock: { type: 'start' } },
      { id: 'sunny', name: 'Sunny', tone: 'yellow', base: '#ffc93c', dark: '#d49c00', light: '#fff8d9', pattern: 'sun', unlock: { type: 'beat', opp: 'pip' } },
      { id: 'taffy', name: 'Taffy', tone: 'pink', base: '#ff7eb6', dark: '#d4558e', light: '#ffffff', pattern: 'pinwheel', unlock: { type: 'beat', opp: 'taffy' } },
      { id: 'lime', name: 'Lime', tone: 'green', base: '#8bd346', dark: '#5f9f23', light: '#f3ffe6', pattern: 'dots', unlock: { type: 'beat', opp: 'gumbo' } },
      { id: 'fizz', name: 'Fizz', tone: 'orange', base: '#ff8a3d', dark: '#d4611a', light: '#ffe8d6', pattern: 'bubbles', unlock: { type: 'beat', opp: 'fizz' } },
      { id: 'marble', name: 'Marble', tone: 'purple', base: '#a45ee8', dark: '#7a3bbf', light: '#f2e3ff', pattern: 'swirl', unlock: { type: 'beat', opp: 'marbles' } },
      { id: 'ocean', name: 'Ocean', tone: 'blue', base: '#38b6ff', dark: '#1688cc', light: '#e3f6ff', pattern: 'waves', unlock: { type: 'beat', opp: 'crumb' } },
      { id: 'mochi', name: 'Mochi', tone: 'white', base: '#fff4f8', dark: '#e2a9be', light: '#ffffff', pattern: 'face', unlock: { type: 'beat', opp: 'mochi' } },
      { id: 'zap', name: 'Zap', tone: 'teal', base: '#14c8c8', dark: '#089494', light: '#ffffff', pattern: 'bolt', unlock: { type: 'beat', opp: 'zapp' } },
      { id: 'royal', name: 'Royal', tone: 'purple', base: '#5b3cc4', dark: '#3d2494', light: '#ffd23f', pattern: 'star', unlock: { type: 'beat', opp: 'duchess' } },
      { id: 'crown', name: 'Crown', tone: 'yellow', base: '#ffb703', dark: '#c98700', light: '#fff5d6', pattern: 'crown', unlock: { type: 'beat', opp: 'master' } },
      { id: 'heart', name: 'Sweetheart', tone: 'pink', base: '#ff5c8a', dark: '#d1355d', light: '#ffffff', pattern: 'heart', unlock: { type: 'streak', n: 3 } },
      { id: 'donut', name: 'Donut', tone: 'brown', base: '#e8a25f', dark: '#b3702f', light: '#ff8fc1', pattern: 'donut', unlock: { type: 'wins', n: 10 } },
      { id: 'lucky', name: 'Lucky', tone: 'green', base: '#3bb273', dark: '#23884f', light: '#ecfff3', pattern: 'clover', unlock: { type: 'quick', n: 5 } },
      { id: 'duo', name: 'Duo', tone: 'multi', base: '#ff7eb6', dark: '#c4527f', light: '#2ed3a0', pattern: 'duo', unlock: { type: 'pp', n: 5 } },
      { id: 'galaxy', name: 'Galaxy', tone: 'navy', base: '#2e2a78', dark: '#19164d', light: '#ffffff', pattern: 'galaxy', unlock: { type: 'streak', n: 5 } },
      { id: 'tiedye', name: 'Tie-Dye', tone: 'multi', base: '#7b5cff', dark: '#5438d6', light: '#ffffff', pattern: 'tiedye', unlock: { type: 'draw' } },
      { id: 'rainbow', name: 'Rainbow', tone: 'multi', base: '#3a2d6b', dark: '#231947', light: '#ffffff', pattern: 'rainbow', unlock: { type: 'wins', n: 50 } },
      { id: 'slate', name: 'Slate', tone: 'grey', base: '#6b7a90', dark: '#48556a', light: '#cdd6e2', pattern: 'ring', unlock: { type: 'never' } },
    ],

    leaderboard: { enabled: false }, // send total wins via sendScore
  };

  /* =====================================================================
     Engine — 7×6 board, index = row × 7 + column, row 0 at the bottom. Pure, no DOM.
     ===================================================================== */
  const COLS = 7, ROWS = 6, CELLS = 42;
  const ORDER = [3, 2, 4, 1, 5, 0, 6];
  const WIN = 1000000;

  const WINDOWS = [];
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const at = (rr, cc) => rr * COLS + cc;
      if (c <= COLS - 4) WINDOWS.push([at(r, c), at(r, c + 1), at(r, c + 2), at(r, c + 3)]);
      if (r <= ROWS - 4) WINDOWS.push([at(r, c), at(r + 1, c), at(r + 2, c), at(r + 3, c)]);
      if (c <= COLS - 4 && r <= ROWS - 4) WINDOWS.push([at(r, c), at(r + 1, c + 1), at(r + 2, c + 2), at(r + 3, c + 3)]);
      if (c <= COLS - 4 && r >= 3) WINDOWS.push([at(r, c), at(r - 1, c + 1), at(r - 2, c + 2), at(r - 3, c + 3)]);
    }
  }
  const NW = WINDOWS.length;
  const WA = new Int8Array(NW * 4);
  WINDOWS.forEach((w, k) => w.forEach((v, j) => { WA[k * 4 + j] = v; }));
  const CELL_WIN = [];
  for (let i = 0; i < CELLS; i++) CELL_WIN.push([]);
  WINDOWS.forEach((w, k) => w.forEach((v) => CELL_WIN[v].push(k)));

  let zseed = 0x9e3779b9;
  const zrand = () => { zseed ^= zseed << 13; zseed ^= zseed >>> 17; zseed ^= zseed << 5; return zseed | 0; };
  const ZA = new Int32Array(84), ZB = new Int32Array(84);
  for (let i = 0; i < 84; i++) { ZA[i] = zrand(); ZB[i] = zrand(); }
  const now = typeof performance !== 'undefined' ? () => performance.now() : () => Date.now();

  const Board = {
    create() { return { cells: new Int8Array(CELLS), h: new Int8Array(COLS), moves: 0 }; },
    canDrop(b, c) { return c >= 0 && c < COLS && b.h[c] < ROWS; },
    drop(b, c, p) { const idx = b.h[c] * COLS + c; b.cells[idx] = p; b.h[c]++; b.moves++; return idx; },
    full(b) { return b.moves >= CELLS; },
    winLine(cells, idx) {
      const p = cells[idx];
      if (!p) return null;
      for (const k of CELL_WIN[idx]) {
        const o = k * 4;
        if (cells[WA[o]] === p && cells[WA[o + 1]] === p && cells[WA[o + 2]] === p && cells[WA[o + 3]] === p) return WINDOWS[k];
      }
      return null;
    },
    winningCols(b, p) {
      const out = [];
      for (const c of ORDER) {
        if (b.h[c] >= ROWS) continue;
        const idx = b.h[c] * COLS + c;
        b.cells[idx] = p;
        if (Board.winLine(b.cells, idx)) out.push(c);
        b.cells[idx] = 0;
      }
      return out;
    },
    encode(b) { return Array.from(b.cells).join(''); },
    decode(str) { // returns null for anything that is not a legal, unfinished position
      if (typeof str !== 'string' || str.length !== CELLS || /[^012]/.test(str)) return null;
      const b = Board.create();
      for (let c = 0; c < COLS; c++) {
        let top = false;
        for (let r = 0; r < ROWS; r++) {
          const v = +str[r * COLS + c];
          if (!v) { top = true; continue; }
          if (top) return null; // floating chip
          b.cells[r * COLS + c] = v; b.h[c]++; b.moves++;
        }
      }
      for (let i = 0; i < CELLS; i++) if (b.cells[i] && Board.winLine(b.cells, i)) return null;
      if (Board.full(b)) return null;
      return b;
    },
  };

  const SC_OWN = [0, 1, 6, 30], SC_OPP = [0, 1, 6, 34];
  function evaluate(cells, p) {
    const o = 3 - p;
    let s = 0;
    for (let k = 0; k < NW * 4; k += 4) {
      let a = 0, b = 0;
      for (let j = 0; j < 4; j++) {
        const v = cells[WA[k + j]];
        if (v === p) a++; else if (v === o) b++;
      }
      if (a && b) continue;
      if (a) s += SC_OWN[a]; else if (b) s -= SC_OPP[b];
    }
    for (let r = 0; r < ROWS; r++) {
      const v = cells[r * COLS + 3];
      if (v === p) s += 3; else if (v === o) s -= 3;
    }
    return s;
  }

  // Negamax with alpha-beta pruning and a transposition table (Zobrist hashing).
  const Search = {
    cells: null, h: null, moves: 0, z1: 0, z2: 0, tt: null, nodes: 0, deadline: 0, aborted: false, pv: -1,
    setup(b) {
      this.cells = Int8Array.from(b.cells); this.h = Int8Array.from(b.h); this.moves = b.moves;
      this.z1 = 0; this.z2 = 0;
      for (let i = 0; i < CELLS; i++) {
        const v = this.cells[i];
        if (v) { this.z1 ^= ZA[(v - 1) * CELLS + i]; this.z2 ^= ZB[(v - 1) * CELLS + i]; }
      }
      this.tt = new Map(); this.nodes = 0; this.aborted = false; this.deadline = 0; this.pv = -1;
    },
    play(c, p) {
      const idx = this.h[c] * COLS + c;
      this.cells[idx] = p; this.h[c]++; this.moves++;
      const z = (p - 1) * CELLS + idx; this.z1 ^= ZA[z]; this.z2 ^= ZB[z];
      return idx;
    },
    unplay(c) {
      this.h[c]--;
      const idx = this.h[c] * COLS + c, p = this.cells[idx];
      this.cells[idx] = 0; this.moves--;
      const z = (p - 1) * CELLS + idx; this.z1 ^= ZA[z]; this.z2 ^= ZB[z];
    },
    winsAt(idx, p) {
      const cells = this.cells, list = CELL_WIN[idx];
      for (let i = 0; i < list.length; i++) {
        const o = list[i] * 4;
        if (cells[WA[o]] === p && cells[WA[o + 1]] === p && cells[WA[o + 2]] === p && cells[WA[o + 3]] === p) return true;
      }
      return false;
    },
    canWinNow(c, p) {
      const idx = this.h[c] * COLS + c;
      this.cells[idx] = p;
      const w = this.winsAt(idx, p);
      this.cells[idx] = 0;
      return w;
    },
    negamax(depth, alpha, beta, p, ply) {
      if ((++this.nodes & 1023) === 0 && this.deadline && now() > this.deadline) this.aborted = true;
      if (this.aborted) return 0;
      if (this.moves >= CELLS) return 0;
      const h = this.h, o = 3 - p;
      for (let i = 0; i < 7; i++) { const c = ORDER[i]; if (h[c] < ROWS && this.canWinNow(c, p)) return WIN - ply - 1; }
      if (depth <= 0) return evaluate(this.cells, p);
      let forced = -1, threats = 0;
      for (let c = 0; c < COLS; c++) if (h[c] < ROWS && this.canWinNow(c, o)) { threats++; forced = c; }
      if (threats > 1) return -(WIN - ply - 2);
      const key = (this.z1 >>> 0) * 2097152 + (this.z2 >>> 11);
      const alpha0 = alpha;
      let first = -1;
      const e = this.tt.get(key);
      if (e) {
        if (e.d >= depth) {
          if (e.f === 0) return e.s;
          if (e.f === 1 && e.s > alpha) alpha = e.s;
          else if (e.f === 2 && e.s < beta) beta = e.s;
          if (alpha >= beta) return e.s;
        }
        first = e.m;
      }
      let best = -Infinity, bestM = -1;
      for (let i = -1; i < 7; i++) {
        const c = i < 0 ? first : ORDER[i];
        if (c < 0 || (i >= 0 && c === first) || h[c] >= ROWS) continue;
        if (forced >= 0 && c !== forced) continue;
        this.play(c, p);
        const s = -this.negamax(depth - 1, -beta, -alpha, o, ply + 1);
        this.unplay(c);
        if (this.aborted) return 0;
        if (s > best) { best = s; bestM = c; }
        if (s > alpha) alpha = s;
        if (alpha >= beta) break;
      }
      this.tt.set(key, { d: depth, f: best <= alpha0 ? 2 : best >= beta ? 1 : 0, s: best, m: bestM });
      return best;
    },
    rootScores(b, p, depth, skip) { // score of every legal column from p's view
      this.setup(b);
      const out = [];
      for (let c = 0; c < COLS; c++) {
        if (this.h[c] >= ROWS || (skip && skip.indexOf(c) >= 0)) continue;
        const idx = this.play(c, p);
        let s;
        if (this.winsAt(idx, p)) s = WIN;
        else if (depth <= 0) s = evaluate(this.cells, p);
        else s = -this.negamax(depth - 1, -Infinity, Infinity, 3 - p, 1);
        this.unplay(c);
        out.push({ c, s });
      }
      return out;
    },
    rootBest(depth, p) {
      let alpha = -Infinity, best = -Infinity, bestM = -1;
      const pref = this.pv;
      for (let i = -1; i < 7; i++) {
        const c = i < 0 ? pref : ORDER[i];
        if (c < 0 || (i >= 0 && c === pref) || this.h[c] >= ROWS) continue;
        const idx = this.play(c, p);
        const s = this.winsAt(idx, p) ? WIN : -this.negamax(depth - 1, -Infinity, -alpha, 3 - p, 1);
        this.unplay(c);
        if (this.aborted) return null;
        if (s > best) { best = s; bestM = c; }
        if (s > alpha) alpha = s;
      }
      return { c: bestM, s: best };
    },
    deepen(b, p, maxDepth, ms) { // iterative deepening within a time budget
      this.setup(b);
      const t0 = now();
      let result = null;
      for (let d = 1; d <= maxDepth; d++) {
        this.deadline = t0 + ms;
        const r = this.rootBest(d, p);
        if (!r) break;
        result = r; this.pv = r.c;
        if (Math.abs(r.s) > WIN - 100 || this.moves + d >= CELLS) break;
      }
      this.deadline = 0;
      return result ? result.c : ORDER.find((c) => b.h[c] < ROWS);
    },
  };

  function aiMove(b, p, lvl) {
    const legal = ORDER.filter((c) => b.h[c] < ROWS);
    if (legal.length === 1) return legal[0];
    let depth = lvl.depth || 0, skip = null;
    const wins = Board.winningCols(b, p);
    if (wins.length) {
      if (Math.random() < (lvl.win == null ? 1 : lvl.win)) return wins[0];
      depth = 0; skip = wins; // it simply did not see its own win
    }
    const threats = Board.winningCols(b, 3 - p).filter((c) => !skip || skip.indexOf(c) < 0);
    if (threats.length) {
      if (Math.random() < (lvl.block == null ? 1 : lvl.block)) return threats[0];
      depth = 0;
    }
    const pool = skip ? legal.filter((c) => skip.indexOf(c) < 0) : legal;
    if (lvl.blunder && Math.random() < lvl.blunder) {
      const weights = pool.map((c) => 4 - Math.abs(3 - c));
      let t = weights.reduce((a, v) => a + v, 0) * Math.random();
      for (let i = 0; i < pool.length; i++) { t -= weights[i]; if (t <= 0) return pool[i]; }
      return pool[pool.length - 1];
    }
    if (lvl.time && !skip && depth === (lvl.depth || 0)) return Search.deepen(b, p, lvl.maxDepth || 20, lvl.time);
    const scores = Search.rootScores(b, p, depth, skip);
    const temp = lvl.temp || 0;
    let bestC = scores[0].c, bestV = -Infinity;
    for (const { c, s } of scores) {
      const noise = Math.abs(s) > WIN - 100 ? 0 : (Math.random() * 2 - 1) * temp;
      const v = s + noise + (3 - Math.abs(3 - c)) * 0.01 + Math.random() * 0.001;
      if (v > bestV) { bestV = v; bestC = c; }
    }
    return bestC;
  }

  /* =====================================================================
     Progress rules — pure functions on the saved state (no DOM)
     ===================================================================== */
  const CHIP = {};
  CONFIG.chips.forEach((c) => { CHIP[c.id] = c; });
  const OPP_INDEX = {};
  CONFIG.opponents.forEach((o, i) => { OPP_INDEX[o.id] = i; });
  const COLLECTIBLE = CONFIG.chips.filter((c) => c.unlock.type !== 'never');

  const Core = {
    newState() {
      return {
        p1: CONFIG.startChips[0], p2: CONFIG.startChips[1],
        chips: CONFIG.startChips.slice(), fresh: [],
        rec: CONFIG.opponents.map(() => ({ w: 0, l: 0, d: 0, cpuFirst: false })),
        stats: { wins: 0, losses: 0, draws: 0, streak: 0, best: 0, fastest: 0, ppGames: 0, ppDraws: 0, dropped: 0 },
        ppFirst: 1,
        cur: null,
      };
    },
    chip(id) { return CHIP[id] || CHIP[CONFIG.startChips[0]]; },
    owns(s, id) { return s.chips.indexOf(id) >= 0; },
    oppOpen(s, i) { return i === 0 || s.rec[i - 1].w > 0; },
    beatenCount(s) { return s.rec.filter((r) => r.w > 0).length; },
    nextTarget(s) { const i = s.rec.findIndex((r) => r.w === 0); return i; },
    sameTone(a, b) {
      const A = this.chip(a), B = this.chip(b);
      return A.id === B.id || A.tone === B.tone;
    },
    cpuChip(s, i) {
      const own = CONFIG.opponents[i].chip;
      if (!this.sameTone(s.p1, own)) return own;
      for (const alt of CONFIG.cpuFallback) if (!this.sameTone(s.p1, alt)) return alt;
      return 'slate';
    },
    meets(s, u) {
      const st = s.stats;
      switch (u.type) {
        case 'start': return true;
        case 'beat': return OPP_INDEX[u.opp] != null && s.rec[OPP_INDEX[u.opp]].w > 0;
        case 'streak': return st.best >= u.n;
        case 'wins': return st.wins >= u.n;
        case 'quick': return st.fastest > 0 && st.fastest <= u.n;
        case 'draw': return st.draws + st.ppDraws >= 1;
        case 'pp': return st.ppGames >= u.n;
      }
      return false;
    },
    unlockText(u) {
      switch (u.type) {
        case 'start': return 'Starter chip';
        case 'beat': return 'Beat ' + CONFIG.opponents[OPP_INDEX[u.opp]].name;
        case 'streak': return 'Win ' + u.n + ' in a row';
        case 'wins': return 'Win ' + u.n + ' games';
        case 'quick': return 'Win using ' + u.n + ' chips or fewer';
        case 'draw': return 'Play a draw';
        case 'pp': return 'Play ' + u.n + ' Pass & Play games';
      }
      return '';
    },
    refreshUnlocks(s) {
      const added = [];
      for (const c of COLLECTIBLE) {
        if (!this.owns(s, c.id) && this.meets(s, c.unlock)) { s.chips.push(c.id); s.fresh.push(c.id); added.push(c.id); }
      }
      return added;
    },
    // result: 'win' | 'loss' | 'draw' from the player's view. myChips = chips the player dropped this game.
    finishAi(s, i, result, myChips) {
      const r = s.rec[i], st = s.stats;
      const firstWin = result === 'win' && r.w === 0;
      if (result === 'win') {
        r.w++; st.wins++; st.streak++; st.best = Math.max(st.best, st.streak);
        if (!st.fastest || myChips < st.fastest) st.fastest = myChips;
        r.cpuFirst = true; // loser starts the rematch
      } else if (result === 'loss') {
        r.l++; st.losses++; st.streak = 0; r.cpuFirst = false;
      } else {
        r.d++; st.draws++; r.cpuFirst = !r.cpuFirst;
      }
      return { unlocks: this.refreshUnlocks(s), opened: firstWin && i + 1 < CONFIG.opponents.length ? i + 1 : -1 };
    },
    finishPP(s, winner, starter) {
      s.stats.ppGames++;
      if (!winner) s.stats.ppDraws++;
      s.ppFirst = winner ? 3 - winner : 3 - starter;
      return { unlocks: this.refreshUnlocks(s), opened: -1 };
    },
    fixPair(s, changed) { // keep Player 1 and Player 2 chips visually distinct
      if (!this.sameTone(s.p1, s.p2)) return;
      const keep = changed === 1 ? s.p1 : s.p2;
      const alt = s.chips.find((id) => id !== keep && !this.sameTone(id, keep)) || (keep === 'cherry' ? 'mint' : 'cherry');
      if (changed === 1) s.p2 = alt; else s.p1 = alt;
    },
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { CONFIG, Board, Search, aiMove, evaluate, Core, WIN };
  }
  if (typeof document === 'undefined') return; // Node (tests): stop here.

  /* =====================================================================
     YouTube Playables SDK wrapper (falls back to localStorage outside Playables)
     ===================================================================== */
  const SDK = (function () {
    const yt = typeof ytgame !== 'undefined' ? ytgame : null; // eslint-disable-line no-undef
    const inYT = !!(yt && yt.IN_PLAYABLES_ENV);
    const KEY = 'plink-save';
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
     Sound — short synthesised blips via Web Audio. Follows the YouTube audio setting only.
     ===================================================================== */
  const Sound = {
    ctx: null, master: null, enabled: true, suspended: false,
    init() {
      if (this.ctx || !this.enabled) return;
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      try {
        this.ctx = new AC();
        this.master = this.ctx.createGain();
        this.master.gain.value = 0.55;
        this.master.connect(this.ctx.destination);
      } catch (e) { this.ctx = null; }
    },
    unlock() {
      if (!this.enabled || this.suspended) return;
      this.init();
      if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume().catch(() => {});
    },
    setEnabled(on) {
      this.enabled = on;
      if (!this.ctx) return;
      if (on && !this.suspended) this.ctx.resume().catch(() => {});
      else this.ctx.suspend().catch(() => {});
    },
    pause() { this.suspended = true; if (this.ctx) this.ctx.suspend().catch(() => {}); },
    resume() { this.suspended = false; if (this.ctx && this.enabled) this.ctx.resume().catch(() => {}); },
    tone(freq, at, dur, type, vol, slideTo) {
      const c = this.ctx, t0 = c.currentTime + at;
      const o = c.createOscillator(), g = c.createGain();
      o.type = type || 'sine';
      o.frequency.setValueAtTime(freq, t0);
      if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(vol || 0.08, t0 + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      o.connect(g); g.connect(this.master);
      o.start(t0); o.stop(t0 + dur + 0.03);
    },
    play(name, arg) {
      if (!this.enabled || this.suspended || !this.ctx || this.ctx.state !== 'running') return;
      const T = (f, a, d, ty, v, s) => this.tone(f, a, d, ty, v, s);
      switch (name) {
        case 'plink': { const f = 820 + (arg || 0) * 70; T(f, 0, 0.09, 'triangle', 0.09, f * 1.08); T(f * 2.01, 0, 0.05, 'sine', 0.03); break; }
        case 'tick': T(520, 0, 0.05, 'sine', 0.05); break;
        case 'start': T(523, 0, 0.09, 'triangle', 0.07); T(784, 0.08, 0.12, 'triangle', 0.07); break;
        case 'win': [523, 659, 784, 1047, 1319].forEach((f, k) => T(f, k * 0.08, 0.18, 'triangle', 0.07)); break;
        case 'lose': T(440, 0, 0.18, 'triangle', 0.06, 415); T(349, 0.18, 0.32, 'triangle', 0.06, 294); break;
        case 'draw': T(587, 0, 0.14, 'sine', 0.06); T(587, 0.16, 0.2, 'sine', 0.06); break;
        case 'unlock': [988, 1175, 1480, 1976].forEach((f, k) => T(f, 0.1 + k * 0.07, 0.16, 'sine', 0.05)); break;
        case 'nope': T(190, 0, 0.08, 'square', 0.03); break;
      }
    },
  };

  /* =====================================================================
     Art — chips and opponent avatars as inline SVG
     ===================================================================== */
  const svg = (inner, vb, cls) => '<svg viewBox="0 0 ' + (vb || 100) + ' ' + (vb || 100) + '"' + (cls ? ' class="' + cls + '"' : '') +
    ' aria-hidden="true" focusable="false">' + inner + '</svg>';
  const CX = 50, CY = 47;
  function polar(r, deg) { const a = (deg - 90) * Math.PI / 180; return [CX + r * Math.cos(a), CY + r * Math.sin(a)]; }
  const f1 = (n) => Math.round(n * 10) / 10;
  function starPath(r1, r2, n, cy) {
    let d = '';
    for (let k = 0; k < n * 2; k++) {
      const r = k % 2 ? r2 : r1, a = (k * 180 / n - 90) * Math.PI / 180;
      d += (k ? 'L' : 'M') + f1(CX + r * Math.cos(a)) + ' ' + f1((cy || CY) + r * Math.sin(a));
    }
    return d + 'Z';
  }
  function chipPattern(ch) {
    const L = ch.light;
    switch (ch.pattern) {
      case 'sun': {
        let rays = '';
        for (let k = 0; k < 8; k++) { const a = polar(17, k * 45), b = polar(25, k * 45); rays += 'M' + f1(a[0]) + ' ' + f1(a[1]) + 'L' + f1(b[0]) + ' ' + f1(b[1]); }
        return '<circle cx="50" cy="47" r="11" fill="' + L + '"/><path d="' + rays + '" stroke="' + L + '" stroke-width="4.5" stroke-linecap="round"/>';
      }
      case 'pinwheel': {
        let p = '';
        for (let k = 0; k < 4; k++) {
          const a = polar(30, k * 90), b = polar(30, k * 90 + 45);
          p += '<path d="M50 47L' + f1(a[0]) + ' ' + f1(a[1]) + 'A30 30 0 0 1 ' + f1(b[0]) + ' ' + f1(b[1]) + 'Z" fill="' + L + '" opacity=".85"/>';
        }
        return p;
      }
      case 'dots': {
        let p = '<circle cx="50" cy="47" r="5" fill="' + L + '"/>';
        for (let k = 0; k < 6; k++) { const a = polar(17, k * 60 + 30); p += '<circle cx="' + f1(a[0]) + '" cy="' + f1(a[1]) + '" r="5" fill="' + L + '"/>'; }
        return p;
      }
      case 'bubbles':
        return [[40, 38, 8], [60, 43, 5.5], [47, 58, 6.5], [63, 58, 3.5], [35, 54, 3.5]].map(([x, y, r]) =>
          '<circle cx="' + x + '" cy="' + y + '" r="' + r + '" fill="none" stroke="' + L + '" stroke-width="3"/>').join('');
      case 'swirl':
        return '<path d="M50 47a4 4 0 0 1 8 0a8 8 0 0 1-16 0a12 12 0 0 1 24 0a16 16 0 0 1-32 0a20 20 0 0 1 40 0" fill="none" stroke="' + L +
          '" stroke-width="4" stroke-linecap="round"/>';
      case 'waves':
        return [36, 47, 58].map((y) => '<path d="M30 ' + y + 'q5-6 10 0t10 0t10 0t10 0" fill="none" stroke="' + L + '" stroke-width="4" stroke-linecap="round"/>').join('');
      case 'face':
        return '<circle cx="39" cy="44" r="4" fill="#3b2a4a"/><circle cx="61" cy="44" r="4" fill="#3b2a4a"/>' +
          '<circle cx="33" cy="54" r="5.5" fill="#ff9ab8" opacity=".7"/><circle cx="67" cy="54" r="5.5" fill="#ff9ab8" opacity=".7"/>' +
          '<path d="M44 53q6 6 12 0" fill="none" stroke="#3b2a4a" stroke-width="3" stroke-linecap="round"/>';
      case 'bolt':
        return '<path d="M55 24L37 51h12l-5 20 20-29H52z" fill="' + L + '" stroke="' + L + '" stroke-width="2" stroke-linejoin="round"/>';
      case 'star':
        return '<path d="' + starPath(22, 9.5, 5) + '" fill="' + L + '" stroke="' + L + '" stroke-width="2" stroke-linejoin="round"/>';
      case 'crown':
        return '<path d="M32 56L29 36l11 9 10-14 10 14 11-9-3 20z" fill="' + L + '" stroke="' + L + '" stroke-width="2" stroke-linejoin="round"/>' +
          '<rect x="32" y="59" width="36" height="5" rx="2.5" fill="' + L + '"/>';
      case 'heart':
        return '<path d="M50 64C30 51 30 34 41 34c5 0 8 4 9 7 1-3 4-7 9-7 11 0 11 17-9 30z" fill="' + L + '"/>';
      case 'donut': {
        const spr = [[40, 33, 20, '#fff'], [59, 32, -30, '#ffe066'], [66, 46, 70, '#6ee7ff'], [61, 61, 20, '#fff'], [42, 62, -40, '#ffe066'], [32, 49, 80, '#6ee7ff']];
        return '<circle cx="50" cy="47" r="27" fill="' + L + '"/><circle cx="50" cy="47" r="9" fill="' + ch.dark + '"/>' +
          spr.map(([x, y, a, c]) => '<rect x="' + (x - 4) + '" y="' + (y - 1.5) + '" width="8" height="3" rx="1.5" fill="' + c + '" transform="rotate(' + a + ' ' + x + ' ' + y + ')"/>').join('');
      }
      case 'clover':
        return '<path d="M50 50q8 10 4 22" fill="none" stroke="' + L + '" stroke-width="3.5" stroke-linecap="round"/>' +
          [[50, 37], [40, 47], [60, 47], [50, 57]].map(([x, y], k) => k === 3 ? '' : '<circle cx="' + x + '" cy="' + y + '" r="9" fill="' + L + '"/>').join('') +
          '<circle cx="50" cy="47" r="4" fill="' + L + '"/>';
      case 'duo':
        return '<path d="M50 2A45 45 0 0 0 50 92Z" fill="' + L + '"/>';
      case 'galaxy':
        return [[36, 36, 2.2], [62, 33, 1.6], [67, 52, 2.4], [40, 60, 1.8], [31, 49, 1.3], [57, 63, 1.4], [50, 29, 1.2]].map(([x, y, r]) =>
          '<circle cx="' + x + '" cy="' + y + '" r="' + r + '" fill="#fff"/>').join('') +
          '<path d="M50 35l3 9 9 3-9 3-3 9-3-9-9-3 9-3z" fill="#ffd23f"/>';
      case 'tiedye':
        return ['#ffc93c', '#ff4d8d', '#38b6ff', '#2ed3a0'].map((c, k) => '<circle cx="50" cy="47" r="' + (32 - k * 7.5) + '" fill="' + c + '"/>').join('');
      case 'rainbow':
        return ['#ff4d6d', '#ff8a3d', '#ffc93c', '#2ed3a0', '#38b6ff'].map((c, k) => {
          const r = 25 - k * 4.8;
          return '<path d="M' + f1(50 - r) + ' 57A' + f1(r) + ' ' + f1(r) + ' 0 0 1 ' + f1(50 + r) + ' 57" fill="none" stroke="' + c + '" stroke-width="4.4"/>';
        }).join('');
      case 'ring':
        return '<circle cx="50" cy="47" r="13" fill="' + L + '" opacity=".6"/>';
    }
    return '';
  }
  const CHIP_CACHE = {};
  function chipSvg(id) {
    if (CHIP_CACHE[id]) return CHIP_CACHE[id];
    const ch = Core.chip(id);
    const html = svg('<circle cx="50" cy="50" r="49" fill="' + ch.dark + '"/><circle cx="50" cy="47" r="45" fill="' + ch.base + '"/>' +
      chipPattern(ch) +
      '<circle cx="50" cy="47" r="35.5" fill="none" stroke="' + ch.dark + '" stroke-width="3" opacity=".35"/>' +
      '<path d="M22 36a30 30 0 0 1 20-18" fill="none" stroke="#fff" stroke-width="6" stroke-linecap="round" opacity=".45"/>', 100, 'chip-svg');
    CHIP_CACHE[id] = html;
    return html;
  }
  const LOCKED_CHIP = svg('<circle cx="50" cy="50" r="49" class="lk-a"/><circle cx="50" cy="47" r="45" class="lk-b"/>' +
    '<rect x="37" y="45" width="26" height="20" rx="4" class="lk-a"/><path d="M42 45v-6a8 8 0 0 1 16 0v6" fill="none" stroke-width="5" class="lk-s"/>', 100, 'chip-svg');

  const INK = '#2a1f3d';
  const eye = (x, y, r, dx, dy) => '<circle cx="' + x + '" cy="' + y + '" r="' + r + '" fill="#fff"/><circle cx="' + (x + (dx || 0)) + '" cy="' + (y + (dy || 0.6)) +
    '" r="' + (r * 0.55) + '" fill="' + INK + '"/>';
  const AV_CACHE = {};
  function avatarSvg(i) {
    if (AV_CACHE[i]) return AV_CACHE[i];
    const o = CONFIG.opponents[i], C = o.color;
    const bg = '<circle cx="32" cy="32" r="32" fill="' + C + '" opacity=".22"/>';
    const cheeks = '<circle cx="21" cy="45" r="3.2" fill="#ff6b9a" opacity=".45"/><circle cx="43" cy="45" r="3.2" fill="#ff6b9a" opacity=".45"/>';
    const inks = 'fill="none" stroke="' + INK + '" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"';
    let art = '';
    switch (o.id) {
      case 'pip':
        art = '<path d="M32 22v-7" stroke="#2e9e5b" stroke-width="3" stroke-linecap="round"/>' +
          '<path d="M32 16q-9-7-13 1q8 4 13-1zM32 16q9-7 13 1q-8 4-13-1z" fill="#3bb273"/>' +
          '<circle cx="32" cy="39" r="18" fill="' + C + '"/>' + eye(25.5, 36, 5.2) + eye(38.5, 36, 5.2) +
          '<path d="M29 43h6l-3 4.5z" fill="#ff8a3d" stroke="#ff8a3d" stroke-width="1.5" stroke-linejoin="round"/>' + cheeks;
        break;
      case 'taffy':
        art = '<circle cx="32" cy="39" r="18" fill="' + C + '"/>' +
          '<path d="M32 21L21 14v14zM32 21l11-7v14z" fill="#ff3d7f" stroke="#ff3d7f" stroke-width="2" stroke-linejoin="round"/><circle cx="32" cy="21" r="4" fill="#ff5c93"/>' +
          eye(25.5, 37, 4.6) + eye(38.5, 37, 4.6) + '<path d="M21.5 32.5l-2-2M42.5 32.5l2-2" ' + inks + '/>' +
          '<path d="M26 45q6 5 12 0" ' + inks + '/>' + cheeks;
        break;
      case 'gumbo':
        art = '<ellipse cx="32" cy="41" rx="23" ry="17" fill="' + C + '"/>' +
          '<path d="M20 38q4.5 3 9 0M35 38q4.5 3 9 0" ' + inks + '/><path d="M20 36h9M35 36h9" stroke="' + INK + '" stroke-width="1.4" opacity=".35"/>' +
          '<path d="M28 47q4 2.5 8 0" ' + inks + '/><path d="M45 14h6l-6 6h6M52 7h4l-4 4h4" ' + inks + ' stroke-width="1.8"/>' + cheeks;
        break;
      case 'fizz':
        art = '<circle cx="18" cy="17" r="4" fill="none" stroke="' + C + '" stroke-width="2.2"/><circle cx="27" cy="9.5" r="2.8" fill="none" stroke="' + C +
          '" stroke-width="2"/><circle cx="45" cy="13" r="5" fill="none" stroke="' + C + '" stroke-width="2.2"/>' +
          '<circle cx="32" cy="39" r="18" fill="' + C + '"/>' + eye(25.5, 35, 5, 0.4, -1) + eye(38.5, 35, 5, 0.4, -1) +
          '<path d="M25.5 43h13a6.5 6.5 0 0 1-13 0z" fill="' + INK + '"/><path d="M28.5 47.5a4 3 0 0 1 7 0" fill="#ff6b9a"/>';
        break;
      case 'marbles':
        art = '<circle cx="32" cy="39" r="18" fill="' + C + '"/>' + eye(25, 37, 3.4, 0.6) + eye(39, 37, 3.4, 0.6) +
          '<circle cx="25" cy="37" r="6.2" ' + inks + '/><circle cx="39" cy="37" r="6.2" ' + inks + '/><path d="M31.2 37h1.6M18.8 36l-3-1.5M45.2 36l3-1.5" ' + inks + '/>' +
          '<path d="M27 47q6 2.5 10-2" ' + inks + '/><circle cx="52" cy="52" r="6" fill="#38b6ff"/><circle cx="50" cy="50" r="1.8" fill="#fff" opacity=".8"/>';
        break;
      case 'crumb':
        art = '<circle cx="32" cy="41" r="17" fill="' + C + '"/>' +
          '<path d="M15 28q17-18 34 0z" fill="#fff"/><rect x="13" y="27" width="38" height="4.5" rx="2.2" fill="#1e2b4a"/><circle cx="32" cy="21" r="3.2" fill="#ffc93c"/>' +
          '<circle cx="26" cy="38.5" r="2.2" fill="' + INK + '"/><circle cx="38" cy="38.5" r="2.2" fill="' + INK + '"/>' +
          '<path d="M24 46q4-4.5 8-.5 4-4 8 .5-4 3.5-8 .8-4 2.7-8-.8z" fill="#7a4a1d"/>';
        break;
      case 'mochi':
        art = '<circle cx="32" cy="17" r="6" fill="#3b2a4a"/><path d="M24 11l14 10M40 11L26 21" stroke="#c98a5a" stroke-width="1.8" stroke-linecap="round"/>' +
          '<path d="M11 47q0-24 21-24t21 24q0 8-21 8t-21-8z" fill="#fff4f8" stroke="' + C + '" stroke-width="2"/>' +
          '<path d="M22 40q3.5-3.5 7 0M35 40q3.5-3.5 7 0" ' + inks + '/><path d="M29.5 45.5q2.5 2 5 0" ' + inks + '/>' +
          '<circle cx="20" cy="45" r="3.4" fill="#ff8fb3" opacity=".6"/><circle cx="44" cy="45" r="3.4" fill="#ff8fb3" opacity=".6"/>';
        break;
      case 'zapp':
        art = '<path d="M32 22v-8" stroke="#8aa0b4" stroke-width="2.4"/><path d="M33 5l-5 7h4l-2 6 6-8h-4z" fill="#ffc93c"/>' +
          '<rect x="10.5" y="31" width="5" height="11" rx="2.5" fill="#0a9d9d"/><rect x="48.5" y="31" width="5" height="11" rx="2.5" fill="#0a9d9d"/>' +
          '<rect x="15" y="21" width="34" height="31" rx="9" fill="' + C + '"/><rect x="19.5" y="28" width="25" height="11" rx="5.5" fill="#0b3845"/>' +
          '<rect x="23" y="31.5" width="6" height="4" rx="2" fill="#7ffcff"/><rect x="35" y="31.5" width="6" height="4" rx="2" fill="#7ffcff"/>' +
          '<path d="M25 45.5h14M25 45.5v0M29.7 43.5v4M34.3 43.5v4" stroke="#0b3845" stroke-width="2" stroke-linecap="round"/>';
        break;
      case 'duchess':
        art = '<circle cx="32" cy="40" r="17" fill="' + C + '"/>' +
          '<path d="M20 25l1.5-11 5.5 6 5-8 5 8 5.5-6L44 25z" fill="#ffd23f" stroke="#ffd23f" stroke-width="1.5" stroke-linejoin="round"/>' +
          '<circle cx="32" cy="19.5" r="1.8" fill="#ff4d6d"/>' + eye(25.5, 38, 4.2, 0.4) + eye(38.5, 38, 4.2, 0.4) +
          '<path d="M21 36.3h9M34 36.3h9" stroke="' + C + '" stroke-width="3.4"/><path d="M21.5 35.5l-2-1.5M42.5 35.5l2-1.5" ' + inks + ' stroke="#fff"/>' +
          '<path d="M27.5 46q4.5 3 9 0" fill="none" stroke="#ff4d6d" stroke-width="2.6" stroke-linecap="round"/><circle cx="42" cy="44" r="1.3" fill="' + INK + '"/>' +
          [21, 26.5, 32, 37.5, 43].map((x, k) => '<circle cx="' + x + '" cy="' + (55.5 + (k === 0 || k === 4 ? -1.5 : k === 2 ? 1 : 0)) + '" r="2.3" fill="#fff"/>').join('');
        break;
      case 'master':
        art = '<path d="M9 62l6-30q17-9 34 0l6 30z" fill="#e63946"/><path d="M19 31q13 9 26 0" fill="none" stroke="#b81f2c" stroke-width="2"/>' +
          '<circle cx="32" cy="34" r="16" fill="' + C + '"/><path d="M26 18.5l6-6 6 6" fill="' + C + '"/>' +
          '<rect x="15" y="27" width="34" height="10" rx="5" fill="' + INK + '"/>' +
          '<path d="M20 32.5q4.5-3.5 8.5 0q-4.5 2.5-8.5 0zM35.5 32.5q4-3.5 8.5 0q-4 2.5-8.5 0z" fill="#fff"/>' +
          '<path d="M25 41.5q7 6.5 14 0z" fill="#fff" stroke="' + INK + '" stroke-width="2" stroke-linejoin="round"/>' +
          '<path d="' + starPathAt(32, 55, 4.2, 1.8) + '" fill="#ffd23f"/>';
        break;
    }
    const html = svg(bg + art, 64, 'av-svg');
    AV_CACHE[i] = html;
    return html;
  }
  function starPathAt(cx, cy, r1, r2) {
    let d = '';
    for (let k = 0; k < 10; k++) {
      const r = k % 2 ? r2 : r1, a = (k * 36 - 90) * Math.PI / 180;
      d += (k ? 'L' : 'M') + f1(cx + r * Math.cos(a)) + ' ' + f1(cy + r * Math.sin(a));
    }
    return d + 'Z';
  }
  const UI_ICONS = {
    play: svg('<path d="M7 5.5v13l11-6.5z" fill="currentColor"/>', 24),
    chips: svg('<circle cx="9" cy="12" r="6"/><circle cx="16" cy="12" r="6"/>', 24),
    stats: svg('<path d="M5 20v-8M12 20V4M19 20v-5"/>', 24),
    back: svg('<path d="M15 5l-7 7 7 7"/>', 24),
    lock: svg('<rect x="5" y="11" width="14" height="10" rx="2.5" fill="currentColor"/><path d="M8 11V8a4 4 0 0 1 8 0v3" fill="none" stroke="currentColor" stroke-width="2.4"/>', 24),
    check: svg('<path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/>', 24),
    arrow: svg('<path d="M9 5l7 7-7 7" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>', 24),
    crown: svg('<path d="M3 8l4.5 4L12 5l4.5 7L21 8l-2 11H5z" fill="currentColor"/>', 24),
  };
  ['chips', 'stats', 'back'].forEach((k) => {
    UI_ICONS[k] = UI_ICONS[k].replace('<svg ', '<svg fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" ');
  });

  /* =====================================================================
     Runtime state
     ===================================================================== */
  let S = null; // saved state
  let G = null; // the game on the board (not saved directly — see S.cur)
  const RT = {
    started: false, paused: false, pauseReasons: new Set(),
    tab: 'play', screen: 'home', pick: 1, saveTimer: 0, lastScore: -1, anims: new Set(),
  };

  // Timeouts that freeze while the game is paused (computer moves, result sheet).
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
    clear() { for (const t of this.list) clearTimeout(t.id); this.list.clear(); },
    pause() { const n = now(); for (const t of this.list) { clearTimeout(t.id); t.due -= n - t.start; } },
    resume() { for (const t of this.list) this.arm(t); },
  };

  /* =====================================================================
     DOM helpers and feedback
     ===================================================================== */
  const $ = (id) => document.getElementById(id);
  function h(tag, cls, html) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  }
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  function bounce(node) { node.classList.remove('bounce'); void node.offsetWidth; node.classList.add('bounce'); }
  const UI = {};
  const rand = (a, b) => a + Math.random() * (b - a);
  const pickOne = (arr) => arr[Math.floor(Math.random() * arr.length)];

  function toast(text, sub) {
    const t = h('div', 'toast');
    t.textContent = text;
    if (sub) { const s = h('small'); s.textContent = sub; t.appendChild(s); }
    UI.toasts.appendChild(t);
    setTimeout(() => t.remove(), 3200);
    while (UI.toasts.children.length > 2) UI.toasts.firstChild.remove();
  }
  function confetti(x, y, n) {
    const colors = ['#ff4d6d', '#ffc93c', '#2ed3a0', '#38b6ff', '#a45ee8', '#ff8a3d'];
    for (let k = 0; k < n; k++) {
      const d = h('i', 'confetti' + (k % 3 === 0 ? ' sq' : ''));
      const a = Math.random() * Math.PI * 2, r = 70 + Math.random() * 170;
      d.style.cssText = '--x:' + x + 'px;--y:' + y + 'px;--dx:' + (Math.cos(a) * r).toFixed(1) + 'px;--dy:' +
        (Math.sin(a) * r + 60).toFixed(1) + 'px;--rot:' + Math.round(rand(-300, 300)) + 'deg;background:' + colors[k % colors.length];
      UI.fx.appendChild(d);
      setTimeout(() => d.remove(), 1500);
    }
  }
  function centerOf(node) {
    const r = node.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  }

  /* =====================================================================
     Home — Play tab (ladder), Chips tab, Stats tab
     ===================================================================== */
  function renderTop() {
    UI.meChip.innerHTML = chipSvg(S.p1);
    UI.meName.textContent = Core.chip(S.p1).name;
    const beaten = Core.beatenCount(S);
    UI.meSub.textContent = beaten === CONFIG.opponents.length ? 'Plinkmaster' : 'Rung ' + (beaten + 1) + ' of ' + CONFIG.opponents.length;
    UI.chipDot.hidden = !S.fresh.length || RT.tab === 'chips';
  }
  function difficultyDots(i, color) {
    let d = '';
    for (let k = 0; k < CONFIG.opponents.length; k++) d += '<i' + (k <= i ? ' class="on"' : '') + '></i>';
    return '<span class="diff" style="--c:' + color + '" aria-label="Difficulty ' + (i + 1) + ' of 10">' + d + '</span>';
  }
  function renderPlay() {
    UI.ppCard.innerHTML = '<span class="pp-chips"><span class="pp-a">' + chipSvg(S.p1) + '</span><span class="pp-b">' + chipSvg(S.p2) + '</span></span>' +
      '<span class="pp-txt"><b>Pass &amp; Play</b><small>Two players, one device</small></span><span class="pp-go">' + UI_ICONS.arrow + '</span>';
    const next = Core.nextTarget(S);
    UI.ladderSub.textContent = Core.beatenCount(S) + ' / ' + CONFIG.opponents.length + ' beaten';
    UI.ladder.innerHTML = '';
    CONFIG.opponents.forEach((o, i) => {
      const r = S.rec[i], open = Core.oppOpen(S, i), beaten = r.w > 0;
      const card = h('div', 'ocard' + (open ? '' : ' locked') + (i === next ? ' next' : '') + (beaten ? ' beaten' : ''));
      card.style.setProperty('--c', o.color);
      const prize = Core.chip(o.chip);
      const games = r.w + r.l + r.d;
      let meta;
      if (!open) meta = 'Beat ' + esc(CONFIG.opponents[i - 1].name) + ' to unlock';
      else if (games) meta = r.w + 'W · ' + r.l + 'L' + (r.d ? ' · ' + r.d + 'D' : '');
      else meta = 'New challenger';
      card.innerHTML = '<div class="oav">' + avatarSvg(i) + (beaten ? '<span class="badge">' + UI_ICONS.check + '</span>' : '') + '</div>' +
        '<div class="oinfo">' + (i === next ? '<span class="tag">Next up</span>' : '') +
        '<div class="oname">' + esc(o.name) + '</div><div class="otag">' + esc(o.tagline) + '</div>' +
        '<div class="ometa">' + difficultyDots(i, o.color) + '<span>' + meta + '</span></div></div>' +
        '<div class="oside">' + (open && !beaten ? '<span class="prize" title="Prize">' + chipSvg(prize.id) + '</span>' : '') +
        '<button class="obtn" type="button"' + (open ? '' : ' disabled') + '>' + (open ? (beaten ? 'Rematch' : 'Play') : UI_ICONS.lock) + '</button></div>';
      if (open) {
        card.addEventListener('click', () => startGame('ai', i));
      } else {
        card.addEventListener('click', () => { Sound.play('nope'); bounce(card); });
      }
      UI.ladder.appendChild(card);
    });
  }
  function renderChips() {
    const total = COLLECTIBLE.length;
    UI.chipSub.textContent = S.chips.length + ' / ' + total + ' collected';
    UI.pickRow.innerHTML = [1, 2].map((p) => {
      const id = p === 1 ? S.p1 : S.p2;
      return '<button type="button" class="slot' + (RT.pick === p ? ' on' : '') + '" data-p="' + p + '">' + chipSvg(id) +
        '<span><b>Player ' + p + '</b><small>' + (p === 1 ? 'You, on the ladder' : 'Pass & Play') + '</small></span></button>';
    }).join('');
    UI.chipGrid.innerHTML = '';
    for (const c of COLLECTIBLE) {
      const owned = Core.owns(S, c.id);
      const sel = c.id === S.p1 ? 1 : c.id === S.p2 ? 2 : 0;
      const tile = h('button', 'ctile' + (owned ? '' : ' locked') + (sel === RT.pick ? ' on' : ''));
      tile.type = 'button';
      tile.innerHTML = '<span class="cimg">' + (owned ? chipSvg(c.id) : LOCKED_CHIP) + '</span>' +
        '<b>' + (owned ? esc(c.name) : '???') + '</b><small>' + (owned ? (sel ? 'Player ' + sel : '&nbsp;') : esc(Core.unlockText(c.unlock))) + '</small>' +
        (S.fresh.indexOf(c.id) >= 0 ? '<span class="new">NEW</span>' : '') + (sel ? '<span class="selno">' + sel + '</span>' : '');
      tile.addEventListener('click', () => onPickChip(c.id, tile));
      UI.chipGrid.appendChild(tile);
    }
  }
  function onPickChip(id, tile) {
    if (!Core.owns(S, id)) { Sound.play('nope'); bounce(tile); toast(Core.unlockText(Core.chip(id).unlock), 'to unlock this chip'); return; }
    if (RT.pick === 1) S.p1 = id; else S.p2 = id;
    Core.fixPair(S, RT.pick);
    Sound.play('tick');
    scheduleSave();
    renderChips();
    renderTop();
  }
  function statsRow(k, v) { return '<span>' + k + '</span><b>' + v + '</b>'; }
  function renderStats() {
    const st = S.stats, games = st.wins + st.losses + st.draws;
    const rate = games ? Math.round((st.wins / games) * 100) + '%' : '–';
    const ladder = CONFIG.opponents.map((o, i) => {
      const r = S.rec[i];
      const open = Core.oppOpen(S, i);
      return '<div class="srow' + (open ? '' : ' locked') + '" style="--c:' + o.color + '"><span class="sav">' + avatarSvg(i) + '</span><span>' + esc(o.name) +
        '</span><b>' + (open ? r.w + '–' + r.l + (r.d ? '–' + r.d : '') : '–') + '</b></div>';
    }).join('');
    let dev = '';
    if (DEV) dev = '<section class="scard"><h3>Dev tools</h3><div class="dev"><button type="button" data-dev="reset">Reset save</button>' +
      '<button type="button" data-dev="unlock">Unlock all</button></div></section>';
    UI.statsBody.innerHTML =
      '<section class="scard"><h3>Vs computer</h3><div class="kv">' +
      statsRow('Games', games) + statsRow('Wins', st.wins) + statsRow('Losses', st.losses) + statsRow('Draws', st.draws) + statsRow('Win rate', rate) +
      statsRow('Current streak', st.streak) + statsRow('Best streak', st.best) + statsRow('Fastest win', st.fastest ? st.fastest + ' chips' : '–') + '</div></section>' +
      '<section class="scard"><h3>Collection</h3><div class="kv">' + statsRow('Opponents beaten', Core.beatenCount(S) + ' / ' + CONFIG.opponents.length) +
      statsRow('Chips collected', S.chips.length + ' / ' + COLLECTIBLE.length) + statsRow('Chips dropped', st.dropped) +
      statsRow('Pass & Play games', st.ppGames) + '</div></section>' +
      '<section class="scard"><h3>Head to head</h3>' + ladder + '</section>' + dev;
  }
  function showTab(name) {
    RT.tab = name;
    ['play', 'chips', 'stats'].forEach((t) => { $('tab-' + t).hidden = t !== name; });
    UI.nav.querySelectorAll('button').forEach((b) => b.classList.toggle('on', b.dataset.tab === name));
    UI.content.scrollTop = 0;
    if (name === 'play') renderPlay();
    if (name === 'chips') {
      renderChips();
      if (S.fresh.length) { S.fresh = []; scheduleSave(); } // "NEW" badges stay until the tab is re-rendered
    }
    if (name === 'stats') renderStats();
    renderTop();
  }
  function showHome() {
    RT.screen = 'home';
    UI.game.hidden = true;
    UI.home.hidden = false;
    showTab(RT.tab);
  }

  /* =====================================================================
     Game screen
     ===================================================================== */
  // Field coordinates (units): 740 wide, 740 tall = 100 for the drop row + 640 board. Holes are 100 apart.
  const FIELD = 740, TOPROW = 100, CHIP_D = 86;
  const cellX = (c) => 70 + c * 100;
  const cellY = (r) => TOPROW + 70 + (ROWS - 1 - r) * 100; // r counts from the bottom
  const pct = (v) => (v / FIELD * 100).toFixed(4) + '%';

  function buildBoard() {
    let holes = '', rims = '', bolts = '';
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const x = cellX(c), y = cellY(r) - TOPROW;
        holes += '<circle cx="' + x + '" cy="' + y + '" r="40"/>';
        rims += '<circle cx="' + x + '" cy="' + y + '" r="41"/>';
      }
    }
    for (const [x, y] of [[20, 20], [720, 20], [20, 620], [720, 620]]) bolts += '<circle cx="' + x + '" cy="' + y + '" r="7"/>';
    UI.boardSvg.innerHTML = '<defs><mask id="plinkHoles"><rect width="740" height="640" fill="#fff"/><g fill="#000">' + holes + '</g></mask></defs>' +
      '<rect class="b-body" width="740" height="640" rx="46" mask="url(#plinkHoles)"/>' +
      '<rect class="b-top" x="6" y="6" width="728" height="628" rx="41" mask="url(#plinkHoles)"/>' +
      '<g class="b-rims">' + rims + '</g><g class="b-bolts">' + bolts + '</g><g id="winRings"></g>';
    UI.winRings = $('winRings');
    UI.cols.innerHTML = '';
    for (let c = 0; c < COLS; c++) {
      const b = h('button', 'col');
      b.type = 'button';
      b.dataset.c = c;
      b.setAttribute('aria-label', 'Drop in column ' + (c + 1));
      UI.cols.appendChild(b);
    }
  }
  const LANDSCAPE_Q = '(orientation: landscape) and (min-width: 820px) and (max-height: 620px)'; // same as style.css
  function layoutField() { // the board takes the largest square that fits; spare height goes above and below the play area
    if (RT.screen !== 'game') return;
    const gs = getComputedStyle(UI.game);
    const landscape = window.matchMedia && window.matchMedia(LANDSCAPE_Q).matches;
    let avail = UI.game.clientHeight - parseFloat(gs.paddingTop) - parseFloat(gs.paddingBottom) - UI.gTop.offsetHeight - 12;
    if (!landscape) avail -= UI.players.offsetHeight + UI.status.offsetHeight;
    const size = Math.max(160, Math.floor(Math.min(UI.stage.clientWidth, avail)));
    UI.stage.style.height = Math.max(size, landscape ? avail : size) + 'px';
    UI.field.style.width = size + 'px';
    UI.field.style.height = size + 'px';
  }
  function placeChipEl(idx, player, animate) {
    const c = idx % COLS, r = Math.floor(idx / COLS);
    const el = h('div', 'chip', chipSvg(G.chipIds[player]));
    el.style.left = pct(cellX(c) - CHIP_D / 2);
    el.style.top = pct(cellY(r) - CHIP_D / 2);
    UI.chipLayer.appendChild(el);
    G.els[idx] = el;
    if (!animate || !el.animate) return Promise.resolve();
    const fall = (cellY(r) - 50) / CHIP_D * 100; // in % of the chip's own height, from the drop row
    const bounceUp = Math.min(16, 5 + (ROWS - r) * 2);
    const dur = 230 + (ROWS - r) * 55;
    const a = el.animate([
      { transform: 'translateY(-' + fall + '%)', easing: 'cubic-bezier(.45,0,.9,.55)' },
      { transform: 'translateY(0)', offset: 0.7, easing: 'cubic-bezier(.2,.6,.4,1)' },
      { transform: 'translateY(-' + bounceUp + '%)', offset: 0.85, easing: 'cubic-bezier(.6,0,.8,.4)' },
      { transform: 'translateY(0)' },
    ], { duration: dur });
    RT.anims.add(a);
    if (RT.paused) a.pause();
    const landAt = dur * 0.7;
    return new Promise((res) => {
      let landed = false;
      const land = () => { if (!landed) { landed = true; Sound.play('plink', r); } };
      Timers.later(land, landAt);
      a.onfinish = a.oncancel = () => { RT.anims.delete(a); land(); res(); };
    });
  }
  function setGhost(col) {
    if (!G) return;
    G.hover = Math.max(0, Math.min(COLS - 1, col));
    const show = canInput();
    UI.ghost.classList.toggle('show', show);
    if (!show) { UI.cols.querySelectorAll('.col.hover').forEach((b) => b.classList.remove('hover')); return; }
    const id = G.chipIds[G.turn];
    if (UI.ghost.dataset.id !== id) { UI.ghost.innerHTML = chipSvg(id); UI.ghost.dataset.id = id; }
    UI.ghost.style.left = pct(cellX(G.hover) - CHIP_D / 2);
    UI.ghost.classList.toggle('full', !Board.canDrop(G.b, G.hover));
    UI.cols.querySelectorAll('.col').forEach((b, c) => b.classList.toggle('hover', c === G.hover));
  }
  function canInput() {
    return !!(G && !G.over && !G.busy && !RT.paused && UI.modal.hidden && (G.mode === 'pp' || G.turn === 1));
  }
  function colFromX(x) {
    const r = UI.cols.getBoundingClientRect();
    return Math.max(0, Math.min(COLS - 1, Math.floor((x - r.left) / r.width * COLS)));
  }

  function startGame(mode, opp, resume) {
    Timers.clear();
    const keepScore = G && G.mode === 'pp' && mode === 'pp' && RT.screen === 'game' ? G.score : null;
    let b = Board.create(), starter, turn;
    if (resume) {
      b = resume.b; starter = resume.starter; turn = resume.turn;
    } else {
      starter = mode === 'ai' ? (S.rec[opp].cpuFirst ? 2 : 1) : S.ppFirst;
      turn = starter;
    }
    G = {
      mode, opp, b, starter, turn, over: false, busy: false, els: {}, hover: 3, press: false,
      placed: [0, 0, 0], cpuMoves: 0, lastTaunt: -9, bubbleT: 0,
      score: resume ? resume.score : keepScore || [0, 0],
      chipIds: { 1: S.p1, 2: mode === 'ai' ? Core.cpuChip(S, opp) : S.p2 },
    };
    for (let i = 0; i < CELLS; i++) if (b.cells[i]) G.placed[b.cells[i]]++;
    UI.modal.hidden = true; UI.modal.innerHTML = '';
    UI.toasts.innerHTML = '';
    UI.chipLayer.innerHTML = '';
    UI.winRings.innerHTML = '';
    UI.field.classList.remove('over');
    for (let i = 0; i < CELLS; i++) if (b.cells[i]) placeChipEl(i, b.cells[i], false);
    RT.screen = 'game';
    UI.home.hidden = true;
    UI.game.hidden = false;
    renderPlayers();
    layoutField();
    saveCur();
    Sound.play('start');
    if (mode === 'ai' && !resume) say(CONFIG.opponents[opp].lines.hi, 3.2);
    const who = mode === 'ai' ? (turn === 1 ? 'You start' : (CONFIG.opponents[opp].short || CONFIG.opponents[opp].name) + ' starts') : 'Player ' + turn + ' starts';
    nextTurn(resume ? '' : who);
  }
  function renderPlayers() {
    const ai = G.mode === 'ai';
    const o = ai ? CONFIG.opponents[G.opp] : null;
    UI.gLabel.textContent = ai ? 'Opponent ' + (G.opp + 1) + ' of ' + CONFIG.opponents.length : 'Pass & Play';
    UI.plA.querySelector('.pl-ico').innerHTML = chipSvg(G.chipIds[1]);
    UI.plA.querySelector('b').textContent = ai ? 'You' : 'Player 1';
    UI.plA.querySelector('small').textContent = ai ? (S.stats.streak > 1 ? 'Streak ' + S.stats.streak : Core.chip(G.chipIds[1]).name) : Core.chip(G.chipIds[1]).name;
    UI.plB.style.setProperty('--c', ai ? o.color : Core.chip(G.chipIds[2]).base);
    UI.plB.querySelector('.pl-ico').innerHTML = ai ? avatarSvg(G.opp) + '<span class="pl-mini">' + chipSvg(G.chipIds[2]) + '</span>' : chipSvg(G.chipIds[2]);
    UI.plB.querySelector('.pl-ico').classList.toggle('av', ai);
    UI.plB.querySelector('b').textContent = ai ? o.short || o.name : 'Player 2';
    UI.plB.querySelector('small').textContent = ai ? 'Level ' + (G.opp + 1) : Core.chip(G.chipIds[2]).name;
    UI.plA.style.setProperty('--c', Core.chip(G.chipIds[1]).base);
    UI.score.textContent = ai ? 'vs' : G.score[0] + ' – ' + G.score[1];
    UI.score.classList.toggle('pp', !ai);
  }
  function setStatus(text, cls) {
    UI.status.textContent = text;
    UI.status.className = 'status' + (cls ? ' ' + cls : '');
  }
  function nextTurn(note) {
    if (!G || G.over) return;
    UI.plA.classList.toggle('turn', G.turn === 1);
    UI.plB.classList.toggle('turn', G.turn === 2);
    UI.plB.classList.remove('thinking');
    if (G.mode === 'ai' && G.turn === 2) {
      const o = CONFIG.opponents[G.opp];
      setStatus((note ? note + ' · ' : '') + (o.short || o.name) + ' is thinking', 'think');
      UI.plB.classList.add('thinking');
      G.busy = true;
      setGhost(G.hover);
      const delay = rand(CONFIG.thinkMs.min, CONFIG.thinkMs.max) + (G.b.moves === 0 ? 500 : 0);
      Timers.later(() => {
        if (!G || G.over) return;
        const t0 = now();
        const c = aiMove(G.b, 2, o.ai);
        const spent = now() - t0;
        Timers.later(() => { if (G && !G.over) play(c); }, Math.max(0, delay - 60 - spent));
      }, 60);
    } else {
      const label = G.mode === 'ai' ? 'Your turn' : 'Player ' + G.turn + '’s turn';
      setStatus(note ? note + ' · ' + label.toLowerCase() : label, G.mode === 'pp' ? 'p' + G.turn : '');
      G.busy = false;
      setGhost(G.hover);
    }
  }
  function humanDrop(c) {
    if (!canInput()) return;
    if (!Board.canDrop(G.b, c)) { Sound.play('nope'); bounce(UI.ghost); return; }
    play(c);
  }
  function play(c) {
    const p = G.turn;
    const idx = Board.drop(G.b, c, p);
    G.placed[p]++;
    if (G.mode === 'pp' || p === 1) S.stats.dropped++;
    G.busy = true;
    UI.plB.classList.remove('thinking');
    setGhost(G.hover);
    const line = Board.winLine(G.b.cells, idx);
    const full = !line && Board.full(G.b);
    if (!line && !full) { G.turn = 3 - p; saveCur(); }
    const game = G;
    placeChipEl(idx, p, true).then(() => {
      if (G !== game) return; // the player left or restarted during the drop
      if (line) return endGame(p, line);
      if (full) return endGame(0, null);
      if (G.mode === 'ai' && p === 2) {
        G.cpuMoves++;
        if (G.cpuMoves - G.lastTaunt >= CONFIG.taunt.minGap && Math.random() < CONFIG.taunt.chance) {
          G.lastTaunt = G.cpuMoves;
          say(pickOne(CONFIG.opponents[G.opp].lines.taunts));
        }
      }
      nextTurn();
    });
  }
  function say(text, secs) {
    const b = UI.bubble;
    b.textContent = text;
    b.classList.add('show');
    clearTimeout(G.bubbleT);
    G.bubbleT = setTimeout(() => b.classList.remove('show'), (secs || 2.8) * 1000);
  }
  function endGame(winner, line) {
    G.over = true;
    G.busy = true;
    S.cur = null;
    UI.plA.classList.remove('turn'); UI.plB.classList.remove('turn', 'thinking');
    setGhost(G.hover);
    if (line) {
      UI.field.classList.add('over');
      UI.winRings.innerHTML = line.map((idx, k) => '<circle class="win-ring" style="animation-delay:' + (k * 70) + 'ms" cx="' + cellX(idx % COLS) +
        '" cy="' + (cellY(Math.floor(idx / COLS)) - TOPROW) + '" r="43"/>').join('');
      line.forEach((idx) => { if (G.els[idx]) G.els[idx].classList.add('win'); });
    }
    let res, title, cls;
    if (G.mode === 'ai') {
      const o = CONFIG.opponents[G.opp];
      const result = winner === 1 ? 'win' : winner === 2 ? 'loss' : 'draw';
      res = Core.finishAi(S, G.opp, result, G.placed[1]);
      cls = result;
      title = result === 'win' ? 'You win!' : result === 'loss' ? (o.short || o.name) + ' wins' : 'Draw!';
      say(result === 'win' ? o.lines.lose : result === 'loss' ? o.lines.win : o.lines.draw, 4);
      setStatus(title, result);
      Sound.play(result === 'win' ? 'win' : result === 'loss' ? 'lose' : 'draw');
    } else {
      res = Core.finishPP(S, winner, G.starter);
      if (winner) G.score[winner - 1]++;
      UI.score.textContent = G.score[0] + ' – ' + G.score[1];
      cls = winner ? 'win' : 'draw';
      title = winner ? 'Player ' + winner + ' wins!' : 'Draw!';
      setStatus(title, winner ? 'p' + winner : 'draw');
      Sound.play(winner ? 'win' : 'draw');
    }
    if (cls === 'win') {
      const c = centerOf(UI.field);
      confetti(c.x, c.y - 40, 46);
    }
    saveNow();
    Timers.later(() => openResult(winner, title, cls, res), CONFIG.resultDelayMs);
  }
  function openResult(winner, title, cls, res) {
    if (!G || RT.screen !== 'game') return;
    const ai = G.mode === 'ai';
    const o = ai ? CONFIG.opponents[G.opp] : null;
    UI.bubble.classList.remove('show'); // the sheet shows the quote instead
    let art, quote = '', meta = '';
    if (ai) {
      art = '<div class="res-av" style="--c:' + o.color + '">' + avatarSvg(G.opp) + '</div>';
      const line = cls === 'win' ? o.lines.lose : cls === 'loss' ? o.lines.win : o.lines.draw;
      quote = '<p class="res-quote">“' + esc(line) + '”<small>— ' + esc(o.name) + '</small></p>';
      const r = S.rec[G.opp];
      meta = 'Record vs ' + esc(o.name) + ': ' + r.w + '–' + r.l + (r.d ? '–' + r.d : '') + (S.stats.streak > 1 ? ' · Streak ' + S.stats.streak : '');
    } else {
      art = '<div class="res-chips">' + (winner ? chipSvg(G.chipIds[winner]) : chipSvg(G.chipIds[1]) + chipSvg(G.chipIds[2])) + '</div>';
      meta = 'Score ' + G.score[0] + ' – ' + G.score[1] + ' · ' + (S.ppFirst === 1 ? 'Player 1' : 'Player 2') + ' starts next';
    }
    let rewards = '';
    for (const id of res.unlocks) {
      const ch = Core.chip(id);
      rewards += '<div class="reward"><span class="rw-chip">' + chipSvg(id) + '</span><span><small>New chip unlocked</small><b>' + esc(ch.name) + '</b></span></div>';
    }
    if (res.opened >= 0) {
      const n = CONFIG.opponents[res.opened];
      rewards += '<div class="reward opp" style="--c:' + n.color + '"><span class="rw-av">' + avatarSvg(res.opened) + '</span><span><small>New opponent</small><b>' +
        esc(n.name) + '</b></span></div>';
    }
    if (ai && cls === 'win' && G.opp === CONFIG.opponents.length - 1 && S.rec[G.opp].w === 1) {
      rewards += '<div class="reward crown"><span class="rw-av">' + UI_ICONS.crown + '</span><span><small>Ladder complete</small><b>You are the Plinkmaster!</b></span></div>';
    }
    const buttons = [];
    if (ai) {
      const nextOpp = G.opp + 1 < CONFIG.opponents.length && Core.oppOpen(S, G.opp + 1) && cls === 'win' ? G.opp + 1 : -1;
      if (nextOpp >= 0) buttons.push(['next', 'Next: ' + CONFIG.opponents[nextOpp].name, true]);
      buttons.push(['rematch', 'Rematch', nextOpp < 0]);
    } else {
      buttons.push(['again', 'Play again', true]);
    }
    buttons.push(['home', 'Home', false]);
    UI.modal.innerHTML = '<div class="sheet result ' + cls + '" role="dialog" aria-modal="true" aria-label="' + esc(title) + '">' + art +
      '<h2>' + esc(title) + '</h2>' + quote + '<div class="res-meta">' + meta + '</div>' +
      (rewards ? '<div class="rewards">' + rewards + '</div>' : '') +
      '<div class="actions">' + buttons.map(([k, label, primary]) => '<button type="button" class="btn' + (primary ? ' primary' : '') + '" data-a="' + k + '">' + esc(label) + '</button>').join('') +
      '</div></div>';
    UI.modal.hidden = false;
    if (res.unlocks.length || res.opened >= 0) Sound.play('unlock');
    UI.modal.querySelectorAll('[data-a]').forEach((b) => b.addEventListener('click', () => onResultAction(b.dataset.a)));
    renderTop();
  }
  function onResultAction(a) {
    Sound.play('tick');
    if (a === 'next') startGame('ai', G.opp + 1);
    else if (a === 'rematch') startGame('ai', G.opp);
    else if (a === 'again') startGame('pp');
    else leaveGame();
  }
  function leaveGame() {
    Timers.clear();
    for (const a of RT.anims) a.cancel();
    RT.anims.clear();
    if (G) clearTimeout(G.bubbleT);
    UI.bubble.classList.remove('show');
    UI.modal.hidden = true; UI.modal.innerHTML = '';
    G = null;
    S.cur = null;
    scheduleSave();
    showHome();
  }
  function onBack() {
    if (!G) return showHome();
    if (!UI.modal.hidden) return;
    const started = G.mode === 'ai' ? G.placed[1] > 0 : G.b.moves > 0;
    if (G.over || !started) { Sound.play('tick'); return leaveGame(); }
    const ai = G.mode === 'ai';
    const title = ai ? 'Forfeit this game?' : 'Leave this round?';
    const body = ai ? 'Leaving now counts as a loss against ' + CONFIG.opponents[G.opp].name + '.' : 'This round won’t be counted.';
    UI.modal.innerHTML = '<div class="sheet confirm" role="dialog" aria-modal="true" aria-label="' + esc(title) + '"><h2>' + esc(title) + '</h2><p>' + esc(body) + '</p>' +
      '<div class="actions"><button type="button" class="btn primary" data-a="stay">Keep playing</button><button type="button" class="btn danger" data-a="leave">' +
      (ai ? 'Forfeit' : 'Leave') + '</button></div></div>';
    UI.modal.hidden = false;
    setGhost(G.hover);
    UI.modal.querySelector('[data-a="stay"]').addEventListener('click', () => {
      UI.modal.hidden = true; UI.modal.innerHTML = '';
      setGhost(G.hover);
    });
    UI.modal.querySelector('[data-a="leave"]').addEventListener('click', () => {
      if (ai && !G.over) { Core.finishAi(S, G.opp, 'loss', G.placed[1]); }
      leaveGame();
    });
  }
  function saveCur() {
    if (!G || G.over) { S.cur = null; return; }
    S.cur = { m: G.mode === 'ai' ? 'a' : 'p', o: G.opp, b: Board.encode(G.b), s: G.starter, t: G.turn, sc: G.score.slice() };
    scheduleSave();
  }

  /* =====================================================================
     Save / load (versioned JSON, backward compatible)
     ===================================================================== */
  function serialize(s) {
    const rec = {};
    CONFIG.opponents.forEach((o, i) => { const r = s.rec[i]; rec[o.id] = [r.w, r.l, r.d, r.cpuFirst ? 1 : 0]; });
    const st = s.stats;
    return JSON.stringify({
      v: CONFIG.saveVersion, p1: s.p1, p2: s.p2, chips: s.chips, fresh: s.fresh, rec, pf: s.ppFirst,
      st: { w: st.wins, l: st.losses, d: st.draws, s: st.streak, b: st.best, f: st.fastest, pg: st.ppGames, pd: st.ppDraws, x: st.dropped },
      cur: s.cur,
    });
  }
  function migrate(o) {
    if (!o || typeof o !== 'object' || typeof o.v !== 'number') return null;
    // When the save format changes, bump CONFIG.saveVersion and convert older saves here, one version at a time:
    // if (o.v === 1) { /* convert v1 → v2 */ o.v = 2; }
    return o;
  }
  function hydrate(raw) {
    const s = Core.newState();
    if (!raw || typeof raw !== 'string') return s;
    let o;
    try { o = JSON.parse(raw); } catch (e) { SDK.warn(); return s; }
    o = migrate(o);
    if (!o) return s;
    const int = (v, d) => (typeof v === 'number' && isFinite(v) && v >= 0 ? Math.min(Math.floor(v), 1e9) : d);
    if (o.rec && typeof o.rec === 'object') {
      CONFIG.opponents.forEach((op, i) => {
        const r = o.rec[op.id];
        if (!Array.isArray(r)) return;
        s.rec[i] = { w: int(r[0], 0), l: int(r[1], 0), d: int(r[2], 0), cpuFirst: !!r[3] };
      });
    }
    if (o.st && typeof o.st === 'object') {
      const t = o.st, st = s.stats;
      st.wins = int(t.w, 0); st.losses = int(t.l, 0); st.draws = int(t.d, 0); st.streak = int(t.s, 0); st.best = Math.max(int(t.b, 0), st.streak);
      st.fastest = int(t.f, 0); st.ppGames = int(t.pg, 0); st.ppDraws = int(t.pd, 0); st.dropped = int(t.x, 0);
    }
    if (Array.isArray(o.chips)) o.chips.forEach((id) => { if (CHIP[id] && CHIP[id].unlock.type !== 'never' && !Core.owns(s, id)) s.chips.push(id); });
    if (Array.isArray(o.fresh)) s.fresh = o.fresh.filter((id) => Core.owns(s, id)).slice(0, 30);
    Core.refreshUnlocks(s);
    if (Core.owns(s, o.p1)) s.p1 = o.p1;
    if (Core.owns(s, o.p2)) s.p2 = o.p2;
    Core.fixPair(s, 1);
    s.ppFirst = o.pf === 2 ? 2 : 1;
    const c = o.cur;
    if (c && typeof c === 'object') {
      const b = Board.decode(c.b);
      const mode = c.m === 'a' ? 'ai' : c.m === 'p' ? 'pp' : null;
      const opp = int(c.o, -1);
      const starter = c.s === 2 ? 2 : 1;
      if (b && mode && (mode === 'pp' || (opp >= 0 && opp < CONFIG.opponents.length && Core.oppOpen(s, opp)))) {
        let n1 = 0, n2 = 0;
        for (let i = 0; i < CELLS; i++) { if (b.cells[i] === 1) n1++; else if (b.cells[i] === 2) n2++; }
        const ns = starter === 1 ? n1 : n2, no = starter === 1 ? n2 : n1;
        const turn = ns === no ? starter : ns === no + 1 ? 3 - starter : 0;
        if (turn) {
          const sc = Array.isArray(c.sc) ? [int(c.sc[0], 0), int(c.sc[1], 0)] : [0, 0];
          s.cur = { m: c.m, o: mode === 'ai' ? opp : null, b: c.b, s: starter, t: turn, sc };
        }
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
      const v = S.stats.wins;
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
     Pause and resume
     ===================================================================== */
  function setPaused(reason, on) {
    if (on) RT.pauseReasons.add(reason); else RT.pauseReasons.delete(reason);
    const should = RT.pauseReasons.size > 0;
    if (should === RT.paused) return;
    RT.paused = should;
    document.body.classList.toggle('paused', should);
    if (should) {
      Timers.pause();
      for (const a of RT.anims) a.pause();
      Sound.pause();
      saveNow();
    } else {
      Sound.resume();
      for (const a of RT.anims) a.play();
      Timers.resume();
    }
    if (G) setGhost(G.hover);
  }

  /* =====================================================================
     UI wiring and boot
     ===================================================================== */
  function buildUI() {
    Object.assign(UI, {
      home: $('home'), game: $('game'), content: $('content'), nav: $('nav'), meChip: $('meChip'), meName: $('meName'), meSub: $('meSub'),
      ppCard: $('ppCard'), ladder: $('ladder'), ladderSub: $('ladderSub'), chipSub: $('chipSub'), pickRow: $('pickRow'), chipGrid: $('chipGrid'),
      statsBody: $('statsBody'), gLabel: $('gLabel'), plA: $('plA'), plB: $('plB'), score: $('score'), bubble: $('bubble'), stage: $('stage'),
      gTop: $('game').querySelector('.g-top'), players: $('game').querySelector('.players'), field: $('field'), chipLayer: $('chipLayer'), ghost: $('ghost'), boardSvg: $('boardSvg'), cols: $('cols'), status: $('status'),
      fx: $('fx'), modal: $('modal'), toasts: $('toasts'),
    });
    UI.chipDot = UI.nav.querySelector('[data-tab="chips"] .dot');
    UI.nav.querySelectorAll('.nav-ico').forEach((n) => { n.innerHTML = UI_ICONS[n.dataset.ico]; });
    $('backBtn').innerHTML = UI_ICONS.back;
    buildBoard();

    UI.nav.addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) { Sound.play('tick'); showTab(b.dataset.tab); } });
    $('meBtn').addEventListener('click', () => { RT.pick = 1; showTab('chips'); });
    UI.ppCard.addEventListener('click', () => startGame('pp'));
    UI.pickRow.addEventListener('click', (e) => {
      const b = e.target.closest('[data-p]');
      if (!b) return;
      RT.pick = Number(b.dataset.p);
      Sound.play('tick');
      renderChips();
    });
    $('backBtn').addEventListener('click', onBack);

    const cols = UI.cols;
    cols.addEventListener('pointerdown', (e) => {
      if (!canInput()) return;
      e.preventDefault();
      G.press = true;
      setGhost(colFromX(e.clientX));
      try { cols.setPointerCapture(e.pointerId); } catch (err) { /* old browsers */ }
    });
    cols.addEventListener('pointermove', (e) => {
      if (!G || !canInput()) return;
      if (G.press || e.pointerType === 'mouse') setGhost(colFromX(e.clientX));
    });
    cols.addEventListener('pointerup', (e) => {
      if (!G || !G.press) return;
      G.press = false;
      humanDrop(colFromX(e.clientX));
    });
    cols.addEventListener('pointercancel', () => { if (G) G.press = false; });
    cols.addEventListener('click', (e) => { // keyboard activation only; pointer drops happen on pointerup
      if (e.detail !== 0) return;
      const b = e.target.closest('.col');
      if (b) humanDrop(Number(b.dataset.c));
    });
    cols.addEventListener('focusin', (e) => { const b = e.target.closest('.col'); if (b && G) setGhost(Number(b.dataset.c)); });
    document.addEventListener('keydown', (e) => {
      if (RT.screen !== 'game' || !G) return;
      if (e.key === 'Escape') { onBack(); return; }
      if (!canInput()) return;
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        e.preventDefault();
        setGhost(G.hover + (e.key === 'ArrowLeft' ? -1 : 1));
        const b = cols.children[G.hover];
        if (b && document.activeElement && document.activeElement.classList.contains('col')) b.focus({ preventScroll: true });
      } else if (e.key >= '1' && e.key <= '7') {
        humanDrop(Number(e.key) - 1);
      }
    });
    UI.statsBody.addEventListener('click', (e) => {
      const b = e.target.closest('[data-dev]');
      if (!b || !DEV) return;
      if (b.dataset.dev === 'reset') S = Core.newState();
      if (b.dataset.dev === 'unlock') { S.rec.forEach((r) => { r.w = Math.max(1, r.w); }); S.stats.best = Math.max(S.stats.best, 5); S.stats.wins = Math.max(S.stats.wins, 50); S.stats.fastest = 4; S.stats.ppGames = 5; S.stats.ppDraws = 1; Core.refreshUnlocks(S); }
      saveNow();
      renderStats(); renderTop();
    });
    document.addEventListener('pointerdown', () => Sound.unlock(), true);
    document.addEventListener('contextmenu', (e) => e.preventDefault());
    window.addEventListener('resize', layoutField);
    if (window.ResizeObserver) new ResizeObserver(layoutField).observe(UI.game);
  }

  function boot() {
    const splash = $('splash'), app = $('app'), fill = $('loadfill');
    Sound.enabled = SDK.audioEnabled();
    SDK.onAudioChange((on) => Sound.setEnabled(!!on));
    SDK.onPause(() => setPaused('youtube', true));
    SDK.onResume(() => setPaused('youtube', false));
    // Inside Playables, pausing must come from onPause/onResume only (no Page Visibility API).
    if (!SDK.inYT) document.addEventListener('visibilitychange', () => setPaused('hidden', document.hidden));
    window.addEventListener('error', () => SDK.error());

    new Promise((res) => requestAnimationFrame(() => {
      SDK.firstFrameReady(); // splash is on screen
      fill.style.width = '45%';
      res();
    }))
      .then(loadWithRetry)
      .then((raw) => { S = hydrate(raw); })
      .catch(() => { S = Core.newState(); })
      .then(() => {
        buildUI();
        fill.style.width = '100%';
        setTimeout(() => {
          app.hidden = false;
          splash.classList.add('out');
          const cur = S.cur;
          showHome();
          if (cur) {
            const b = Board.decode(cur.b);
            startGame(cur.m === 'a' ? 'ai' : 'pp', cur.o, { b, starter: cur.s, turn: cur.t, score: cur.sc });
            toast('Welcome back', 'Your game is right where you left it');
          }
          requestAnimationFrame(() => {
            SDK.gameReady(); // main screen is interactive
            RT.started = true;
            setTimeout(() => splash.remove(), 400);
            const st = S.stats;
            if (!cur && !st.wins && !st.losses && !st.draws && !st.ppGames) toast('Beat Pip to start climbing the ladder', 'Or grab a friend for Pass & Play');
          });
        }, 320);
      });
  }

  if (DEV) { // console access for playtesting: PLINK.state(), PLINK.startGame('ai', 9)
    window.PLINK = { state: () => S, game: () => G, Core, CONFIG, Board, aiMove, startGame, save: saveNow, setPaused };
  }
  boot();
})();
