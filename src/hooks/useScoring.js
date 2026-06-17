const REX_SYSTEM_PROMPT = `You are Rex — the most theatrical, over-the-top game show host in the history of real estate training. You have the energy of a Broadway producer, the confidence of a Vegas headliner, and the coaching instincts of a championship trainer.

Your job is to score real estate agents on their objection-handling responses and deliver feedback in TWO distinct acts:

ACT ONE — THE ROAST (ONE sentence, max — punchy, then STOP):
This is your moment, but keep it to a single zinger before the score. Be theatrical, be sarcastic, be a little savage — but always punching UP, never cruel. One line, land it, move on. Examples of your voice:
- "Ladies and gentlemen, what you just witnessed was... technically English."
- "You really went for it — I'm just not sure WHERE you went."
- "I've seen better recoveries on the Titanic, but hey, you got in the lifeboat!"
- "That answer had the energy of a DMV waiting room. Technically present, spiritually elsewhere."
- If they did great: "STOP THE PRESSES — that was ALMOST perfect, don't get cocky!"
- If they did great: "Well WELL well, look who decided to show UP today!"

ACT TWO — THE COACHING (1-2 sentences, brief):
Drop the theatrics and be a sharp coach. Reference what they actually said, and give ONE concrete thing to say differently next time, tied to the objective. Keep it short — one tip, not a lecture.

SCORING (the 40/30/30 rubric — BE DISCRIMINATING):
Judge HARD against the benchmark. The benchmark answer is a 9-10; most real answers are NOT benchmark-level. Grade THREE dimensions independently, each 1-10:
- objective: Did they ACTUALLY achieve the stated objective (secure the consult, hold the price, earn the second chance)? Merely engaging is not achieving. (weight 40%)
- tone: Empathetic, non-confrontational, confident — did they acknowledge before redirecting? (weight 30%)
- language: Strategic, specific, expert positioning — or vague and generic? (weight 30%)

Use the FULL 1-10 range and SPREAD scores. Do NOT cluster everyone at 5-7. Anchor each dimension:
- 1-2: didn't engage, argued, or made it worse
- 3-4: acknowledged but no real reframe; vague; missed the objective
- 5-6: competent — acknowledged and redirected, but generic or thin on specifics and the close
- 7-8: strong — clear acknowledge → reframe → educate, ties to the objective, asks for a next step
- 9-10: benchmark-level — specific, persuasive, lands the objective with a clean close

Reward specificity, data, and a concrete close; penalize filler, hedging, rambling, and very short answers (a one-liner caps around 3-4). Two responses should RARELY get the same overall score unless genuinely equal — differentiate them on the dimensions. Judge ONLY what the player actually said, not what they probably meant.

Then compute the overall score as the weighted average, rounded to the nearest whole number:
  score = round( objective * 0.4 + tone * 0.3 + language * 0.3 )

Map the overall score to a label:
  1-2 = "Needs Work", 3-4 = "Getting There", 5-6 = "Solid", 7-8 = "Strong", 9-10 = "Elite"

RESPONSE FORMAT — return ONLY valid JSON, no markdown, no backticks:
{
  "score": <number 1-10, the weighted overall>,
  "scoreLabel": "<Needs Work | Getting There | Solid | Strong | Elite>",
  "subscores": {
    "objective": <number 1-10>,
    "tone": <number 1-10>,
    "language": <number 1-10>
  },
  "roast": "<Act One — theatrical roast or compliment, ONE sentence, Rex voice>",
  "scoreLine": "<One punchy dramatic line Rex delivers when revealing the score — match the score emotionally. Low = dramatic tragedy. High = over-the-top celebration. Mid = mock deliberation.>",
  "coaching": "<Act Two — specific genuine coaching, 1-2 sentences, drop the act. This is the spoken beat.>",
  "whatWorked": "<1-2 sentences on what the agent did well, specific to what they said>",
  "improve": "<1 sentence on the single most important thing to fix, tied to the objective>",
  "coachingTip": "<one short, concrete line they could actually say next time>"
}`;

// ── Per-pack Rex intro scripts ──────────────────────────────────────────────
export const REX_PACK_INTROS = {
  1: [
    `SELLER OBJECTIONS! The neighbor who sold for more, the Zillow estimate, "let's list it high." Anchor them to today's market without losing the listing. Go!`,
  ],
  2: [
    `BUYER OBJECTIONS! "We'll wait for rates," "the payment's too high," "I'll just call the listing agent." Prove your value can't be Googled. Go!`,
  ],
  3: [
    `LEAD CONVERSION! "Just send me the info." "How's the market?" Turn a casual question into a consultation before the lead goes cold. Go!`,
  ],
  4: [
    `FSBO AND EXPIRED! The yard-sign do-it-yourselfer and the seller the last agent let down. Win them over and prove your worth. Go!`,
  ],
};

// ── Round winner lines ──────────────────────────────────────────────────────
export const REX_ROUND_WINNER_LINES = [
  (name, score) => `${score} points — ${name} takes the round! You pick the next battlefield.`,
  (name, score) => `Round goes to ${name} with ${score}! Your call on the next category.`,
  (name, score) => `${name}, ${score} — that's the round. Choose our next battlefield.`,
  (name, score) => `Winner's ${name} with ${score}! You're up to pick what's next.`,
];

// ── Game over champion lines ─────────────────────────────────────────────────
export const REX_CHAMPION_LINES = [
  (name, score) => `STOP EVERYTHING! Hold ALL calls! After four rounds of the most dramatic objection handling this arena has ever witnessed — your CHAMPION, with ${score} points... is ${name}! SOMEBODY get this person a trophy! Or a commission check! Either way — WELL EARNED!`,
  (name, score) => `The final scores are tallied. The dust has settled. The other contestants are reconsidering their life choices. And standing above it ALL with ${score} points — ${name}! This was not luck. This was not accident. This was CRAFT. Take a bow, Champion. You've EARNED it!`,
  (name, score) => `We came. We competed. We handled objections that would make lesser agents run for the parking lot. And when the smoke cleared — ${name} stood tall with ${score} points! The crown is yours. The bragging rights are yours. The next happy hour is definitely on you — but the GLORY is YOURS!`,
];

// ── Tiebreaker lines ─────────────────────────────────────────────────────────
export const REX_TIEBREAKER_LINES = [
  `LADIES AND GENTLEMEN — I have been doing this for a LONG time and what we have right now... is a TIE! A genuine, honest-to-goodness, nobody-blinked TIE! This next round will decide EVERYTHING. Every point. Every word. Every pause. It all matters NOW. Contestants — do NOT hold back!`,
  `A TIE?! A TIE?! After everything we've been through tonight — a TIE?! I love this competition so much right now I could cry! Next round settles it ALL — highest score takes the championship. No excuses. No do-overs. Just words, wit, and whoever wants it MORE!`,
];

// ── Helper functions ─────────────────────────────────────────────────────────
export function getRexPackIntro(packId) {
  const lines = REX_PACK_INTROS[packId];
  if (!lines) return `LADIES AND GENTLEMEN — let the battle begin!`;
  return lines[Math.floor(Math.random() * lines.length)];
}

export function getRexRoundWinner(playerName, score) {
  const line = REX_ROUND_WINNER_LINES[Math.floor(Math.random() * REX_ROUND_WINNER_LINES.length)];
  return line(playerName, score);
}

export function getRexChampion(playerName, score) {
  const line = REX_CHAMPION_LINES[Math.floor(Math.random() * REX_CHAMPION_LINES.length)];
  return line(playerName, score);
}

export function getRexTiebreaker() {
  return REX_TIEBREAKER_LINES[Math.floor(Math.random() * REX_TIEBREAKER_LINES.length)];
}

export function getRexPlayerIntro(players) {
  const names = players.map((p) => p.name);
  let nameList;
  if (names.length === 1) {
    nameList = names[0];
  } else if (names.length === 2) {
    nameList = `${names[0]}, and ${names[1]}`;
  } else {
    nameList = `${names.slice(0, -1).join(", ")}, and ${names[names.length - 1]}`;
  }
  const agentWord = names.length === 1 ? "agent" : "agents";
  return `Welcome to BEAT THE BOT — give it up for tonight's competitors: ${nameList}! ${names.length} ${agentWord}, one champion. Everyone answers blind, then we grade. Let's GO!`;
}

// ── Quick, non-evaluative handoff quips (collection phase) ───────────────────
// Played right after an agent finishes recording, before the next steps up.
// Deliberately reveals NOTHING about quality — scores are graded later, blind.
const REX_HANDOFF_QUIPS = [
  (prev, next) => `Locked in, ${prev}! ${next}, you're UP — get to that mic!`,
  (prev, next) => `Thank you, ${prev} — pass the mic! ${next}, the arena is YOURS!`,
  (prev, next) => `That's a wrap on ${prev}. ${next}, step on up — let's see what you've got!`,
  (prev, next) => `Sealed and saved, ${prev}. ${next}, you're next in the hot seat!`,
  (prev, next) => `Nice swing, ${prev}! Up next... ${next} — don't keep us waiting!`,
];

export function getRexHandoffQuip(prevName, nextName) {
  const line = REX_HANDOFF_QUIPS[Math.floor(Math.random() * REX_HANDOFF_QUIPS.length)];
  return line(prevName, nextName || "next contestant");
}

// ── Grading-phase kickoff (all responses collected, time to score) ───────────
const REX_GRADING_INTRO_LINES = [
  `Pencils down — every answer's in. Let's grade.`,
  `That's everybody. Time to see who actually brought it. Grading now!`,
  `All locked in, all blind. Let's score these one at a time.`,
];

export function getRexGradingIntro() {
  return REX_GRADING_INTRO_LINES[Math.floor(Math.random() * REX_GRADING_INTRO_LINES.length)];
}

// ── Scoring engine ───────────────────────────────────────────────────────────
export async function scoreResponse({
  playerName,
  objection,
  persona,
  objective,
  benchmark,
  playerResponse,
  packName,
}) {
  // Scoring runs through our own serverless function (/api/score), which holds
  // the Anthropic key server-side. The key is NEVER shipped to the browser.
  try {
    const response = await fetch("/api/score", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ playerName, objection, persona, objective, benchmark, playerResponse, packName }),
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      console.error("Scoring API error:", response.status, detail);
      throw new Error(`Scoring API ${response.status}`);
    }

    const result = await response.json();
    if (typeof result?.score !== "number") {
      console.error("Scoring API returned unexpected shape:", result);
      throw new Error("Bad scoring payload");
    }
    return result;

  } catch (err) {
    console.error("Scoring error:", err);
    // Clearly-flagged technical fallback so a real outage is never mistaken for
    // a genuine score. The game can still continue if this ever fires.
    return {
      score: 0,
      scoreLabel: "Not Scored",
      subscores: { objective: 0, tone: 0, language: 0 },
      roast: "TECHNICAL TIMEOUT, folks — the judges' scorecards just jammed! That's on the machine, not the contestant.",
      scoreLine: "No score this round — Rex's scoring booth hit a snag. Try that one again!",
      coaching: "Scoring is temporarily unavailable (the AI judge couldn't be reached). Check the scoring service and re-run this round — your answer was not graded.",
      whatWorked: "Not evaluated — scoring service was unreachable.",
      improve: "Not evaluated — re-run once scoring is restored.",
      coachingTip: "If this keeps happening, confirm the ANTHROPIC_API_KEY is set on the server.",
    };
  }
}

// Comparative scoring — grade an entire round's answers in ONE pass so the
// model spreads the scores and produces a clear winner (no ties). Returns an
// array of result objects in the same order as `responses`. Throws on failure
// so the caller can fall back to per-answer scoring.
export async function scoreRound({ responses, objection, persona, objective, benchmark, packName }) {
  const response = await fetch("/api/score", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ responses, objection, persona, objective, benchmark, packName }),
  });
  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`Round scoring API ${response.status} ${detail}`);
  }
  const data = await response.json();
  const results = Array.isArray(data) ? data : data?.results;
  if (!Array.isArray(results) || results.length !== responses.length) {
    throw new Error("Round scoring returned wrong shape");
  }
  if (!results.every((r) => r && typeof r.score === "number")) {
    throw new Error("Round scoring missing numeric scores");
  }
  return results;
}
