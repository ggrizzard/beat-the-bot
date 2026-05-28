# Beat The Bot 🤖
AI-powered real estate objection handling trainer.

## How It Works
1. Bot throws a real estate objection (spoken via ElevenLabs or browser TTS)
2. Agent responds verbally via microphone
3. Claude scores the response 1–10 vs the benchmark and delivers spoken coaching

## Quick Start (Local)
```bash
npm install
npm run dev
```
Open http://localhost:5173

## Deploy to Vercel (60 seconds)
```bash
npm install -g vercel
vercel
```
Follow the prompts. Your app will be live at a URL like:
`https://beat-the-bot-yourname.vercel.app`

## Environment
No `.env` file needed — the ElevenLabs API key is entered by the user at launch.
The Anthropic API key is handled automatically by the claude.ai artifact environment.

> **Note:** For standalone deployment outside claude.ai, you'll need to add your
> Anthropic API key. Create a `.env` file:
> ```
> VITE_ANTHROPIC_API_KEY=sk-ant-...
> ```
> Then update `src/scoring.js` to use `import.meta.env.VITE_ANTHROPIC_API_KEY`
> and add the header to the fetch call.

## Game Packs
- Pack 1: Classic Game
- Pack 2: Expired Listings  
- Pack 3: Seller Pricing
- Pack 4: FSBO Objections
- Pack 5: Buyer Objections

## Tech Stack
- React 18 + Vite
- ElevenLabs (TTS + STT) — falls back to Web Speech API
- Anthropic Claude (AI scoring)
- Zero backend — pure frontend
