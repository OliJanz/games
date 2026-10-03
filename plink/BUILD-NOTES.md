# Plink! — build notes (v1, 27 Sep 2026)

Drop-four-in-a-row game for YouTube Playables. Bundle: index.html + game.js + style.css (vanilla JS, ~110 KB, no images, no dependencies). All opponents, chips and timings live in the CONFIG object at the top of game.js.

## Name and look
- Name: **Plink!** (the sound a chip makes). "4 gewinnt" / "Connect 4" are Hasbro trademarks, so neither the name nor the original look is used: violet board, candy-coloured chips with patterns, no blue grid with red/yellow discs.
- Worth a quick trademark/store search for "Plink" before publishing (not done here).

## Modes
- **Opponent ladder** vs computer: 10 characters, each unlocks the next. Beating one unlocks their chip.
- **Pass & Play**: two players, one device, running score for the session.
- Loser starts the next game (both modes). First game against a new opponent: you start.
- Leaving a started ladder game counts as a loss (confirm sheet). Closing the app mid-game resumes it next launch.

## Opponents (CONFIG.opponents[].ai)
| # | Name | Search | Notes |
|---|------|--------|-------|
| 1 | Pip | depth 0 | 50% random moves, sees own win 50%, blocks 15% |
| 2 | Taffy | depth 0 | 25% random, win 85%, block 45% |
| 3 | Gumbo | depth 1 | 10% random, block 70% |
| 4 | Fizz | depth 2 | 5% random, block 90% |
| 5 | Marbles | depth 3 | small noise |
| 6 | Captain Crumb | depth 4 | |
| 7 | Madame Mochi | depth 5 | |
| 8 | Zapp | depth 6 | |
| 9 | Duchess Dot | depth 8 | |
| 10 | The Plinkmaster | 450 ms iterative deepening (reaches depth 13–16) | no noise |

- Engine: negamax + alpha-beta + transposition table. Levels 1–9 answer in under 50 ms on desktop.
- Sim (bot vs bot, 40 games per pair): each level beats the one below 55–85% of the time (level 7 vs 6 is close, with many draws). A depth-7 bot playing for the human beat levels 1–9 and lost to the Plinkmaster.

## Chips (19 collectible)
- Start: Cherry, Mint. One per beaten opponent (10). Milestones: Sweetheart (3-win streak), Galaxy (5-win streak), Donut (10 wins), Rainbow (50 wins), Lucky (win using ≤ 5 chips), Tie-Dye (any draw), Duo (5 Pass & Play games).
- Chips with the same colour family can't face each other: the computer switches to a fallback chip, and Player 2 is swapped automatically.

## Playables integration
- firstFrameReady on the splash, then loadData, gameReady once the home screen is interactive.
- Cloud save via saveData (well under the 64 KiB limit) after every move and result; outside Playables it uses localStorage.
- Pause/resume only via onPause/onResume inside Playables (Page Visibility is used only outside, per the integration requirements). Pause freezes the computer's move timers, drop animations, sounds and input.
- Audio follows isAudioEnabled / onAudioEnabledChange.
- If cloud load fails 3 times, saving is disabled for that session so an existing save is never overwritten.
- Leaderboard: built but off (`CONFIG.leaderboard.enabled = false`); it would send total wins, which matches the save.

## Dev
- `const DEV = true` at the top of game.js adds Reset / Unlock all buttons in Stats and a console handle `PLINK` (e.g. `PLINK.startGame('ai', 9)`, `PLINK.aiMove(PLINK.game().b, 1, { depth: 7 })`). Keep false for release.
- Keyboard: ← → to aim, 1–7 to drop, Esc to go back.
