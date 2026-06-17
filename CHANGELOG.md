# Beat The Bot — Changelog & Ops Notes

## 2026-06-17 — pre-Refuel overhaul (commit 5bde5c7)

### Gameplay & content
- **Categories: 5 packs → 4.** Now Seller Objections (10), Buyer Objections (7),
  Lead Conversion (6), FSBO & Expired (7). Defined in `src/data/gamePacks.js`,
  generated from the canonical library at
  `~/Documents/Claude/Projects/Beat the Bot (1)/beat-the-bot-objection-library.json` (v3.1).
- **All 30 objections elaborated.** Each round now carries both:
  - `short` — a quick reel hook shown while the roulette spins, and
  - `objection` — the full, in-character spoken objection Rex/the challenger voice reads.
- **Objection roulette.** Flow is now: tap category → Rex announces the category
  (`REX_INTRO`) → slot reel spins and lands on the chosen objection (`ROULETTE`) →
  objection read (`OBJECTION`). The reel is visual only — the round is already
  chosen in `handleSelectPack`. Component: `RouletteReel` in `src/App.jsx`.
- **Winner picks next battlefield.** In `endRound`, the round's top scorer is placed
  first in `currentPlayerOrder`, so they pick the next category and lead off. Category
  screen reads "🏆 {name} WON — PICK YOUR BATTLEFIELD". Ties → whoever answered first.
- **Rex host fixes (`src/hooks/useScoring.js`):** announces BOTH player names in the
  intro (leads with them so neither is clipped); names the NEXT contestant on handoff
  (`getRexHandoffQuip(prev, next)`); `REX_PACK_INTROS` rewritten for the 4 categories.

### Scoring — moved server-side (security + reliability)
- New Vercel serverless function `api/score.js` calls Claude. The Anthropic key lives
  ONLY in the `ANTHROPIC_API_KEY` env var (server-side) — never shipped to the browser.
- `src/hooks/useScoring.js` → `scoreResponse()` now POSTs to `/api/score`.
- `public/config.js` no longer contains the Anthropic key (ElevenLabs voice key remains,
  still client-side).
- `vercel.json` rewrite excludes `/api` so the function isn't swallowed by the SPA rewrite.
- Rubric tightened to spread scores (anchored 1–10 bands; benchmark = 9–10; short answers
  cap ~3–4). Optional `SCORING_MODEL` env overrides the model (default
  `claude-sonnet-4-20250514`).
- Failure is now explicit: if scoring can't be reached the card shows
  "Not Scored / Technical Timeout" (score 0) instead of a misleading fake 5.

## Deploy / ops

**Deploy:** push to `main` (GitHub→Vercel auto-build) or `vercel --prod` from this folder.

**Set / rotate the scoring key:**
1. Create a funded key at console.anthropic.com.
2. Vercel → Project → Settings → Environment Variables → `ANTHROPIC_API_KEY`
   (Production, mark Sensitive). No quotes/spaces.
3. **Redeploy** — env changes only apply to new deployments.

**Verify scoring is live:**
```
curl -s https://beat-the-bot-2.vercel.app/api/score \
  -H "content-type: application/json" \
  -d '{"playerName":"Test","persona":"Optimistic Seller","objection":"list high","objective":"Prevent overpricing","benchmark":"price to today","playerResponse":"I get wanting to start high, but the first two weeks draw the most buyers, so let us price to today and create competition.","packName":"Seller Objections"}'
```
JSON with a real `score` = working. `Anthropic 401` = bad key. `Server is missing ANTHROPIC_API_KEY` = not set on Production / not redeployed.

**Local note:** `npm run dev` (Vite) does NOT run `/api/score`, so scoring always falls
back locally. Use `vercel dev` (with `ANTHROPIC_API_KEY` in `.env.local`) or test on the
live URL.

## Open items before the event
- [ ] **Scoring key blocker:** the current `ANTHROPIC_API_KEY` returns 401 — replace with
      a valid, funded key and redeploy.
- [ ] **`PLAYER_COUNT`** in `src/App.jsx` is `2` for testing — bump to the real roster.
- [ ] Decide 3 vs 4 rounds (currently hardwired to 4; ends when `nextRound >= 4`).
- [ ] Cap/restrict the ElevenLabs key in its dashboard (still client-side); proxy post-event.
- [ ] Full practice game on the event laptop — real scores + clean stage-mic → laptop audio.
