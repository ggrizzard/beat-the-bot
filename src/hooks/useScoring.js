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
    `LADIES AND GENTLEMEN — tonight's category is SELLER OBJECTIONS! The neighbor who sold for more, the Zillow estimate, the "let's just list it high and see what happens." These sellers walk in with a number in their head and feelings in their heart. Your mission — anchor them to TODAY'S market without losing the listing or your dignity. Contestants, the clock is ticking. BEGIN!`,
  ],
  2: [
    `Here we GO — the category is BUYER OBJECTIONS! "We'll wait for rates to drop." "The payment's too high." "Can't I just call the listing agent myself?" These buyers think they can sit it out — or skip you entirely. In sixty seconds, prove. Them. WRONG. Show me your value cannot be Googled. FIGHT!`,
  ],
  3: [
    `Oh, this is the sneaky-hard one — LEAD CONVERSION! "Just send me the info." "So... how's the market?" The casual little question that every average agent fumbles straight into a dead end. Your job — turn idle curiosity into a consultation and a real relationship before that lead goes ice cold. Contestants, make it count. GO!`,
  ],
  4: [
    `My FAVORITE — FSBO AND EXPIRED! On one side, the do-it-yourselfer with a yard sign and the unshakeable confidence of someone who watched ONE HGTV flip. On the other, the seller the last agent already let down. Yard-sign ego meets second-chance skepticism. Walk in, win them over, prove your worth. This is high art, people. SHOW ME!`,
  ],
};

// ── Round winner lines ──────────────────────────────────────────────────────
export const REX_ROUND_WINNER_LINES = [
  (name, score) => `The scorecards are IN and the winner of this round with a ${score} is... ${name}! Step forward, CHAMPION! The next category is yours to choose — choose wisely, choose boldly, choose like someone who just won something!`,
  (name, score) => `${score} points! ${name} takes the round! And honestly? I did NOT see that coming. The comeback. The composure. The category pick is ALL YOURS — don't blow it!`,
  (name, score) => `Round goes to ${name} — ${score} on the board! Someone is FEELING themselves right now and they have EARNED it! Get up here and pick the next battlefield!`,
  (name, score) => `Ladies and gentlemen... ${name}. ${score} points. Cold. Calculated. Correct. The category selection is yours — this is your moment of POWER. Use it!`,
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
  return `LADIES AND GENTLEMEN — give it UP for tonight's competitors: ${nameList}! That's right — ${nameList}, stepping into the arena! ${names.length} ${agentWord}, one champion, and zero mercy. Welcome to BEAT THE BOT! And here's the twist — EVERYONE answers blind. No peeking, no borrowing, no going last and stealing the good lines. You all swing, THEN we grade. May the sharpest tongue — and the warmest empathy — WIN! Let's get this show on the ROAD!`;
}

// ── Quick, non-evaluative handoff quips (collection phase) ───────────────────
// Played right after an agent finishes recording, before the next steps up.
// Deliberately reveals NOTHING about quality — scores are graded later, blind.
const REX_HANDOFF_QUIPS = [
  (name) => `Locked in, ${name}! Next up!`,
  (name) => `Thank you, ${name} — pass the mic!`,
  (name) => `That's a wrap on ${name}. Who's next?`,
  (name) => `Sealed and saved, ${name}. NEXT!`,
  (name) => `Nice swing, ${name} — next contestant, GO!`,
];

export function getRexHandoffQuip(playerName) {
  const line = REX_HANDOFF_QUIPS[Math.floor(Math.random() * REX_HANDOFF_QUIPS.length)];
  return line(playerName);
}

// ── Grading-phase kickoff (all responses collected, time to score) ───────────
const REX_GRADING_INTRO_LINES = [
  `Pencils DOWN! Every answer is IN, locked, and recorded — and not a single one of you got to cheat off the agent before you. Now comes the moment of truth. One by one, we GRADE. Let the reckoning... BEGIN!`,
  `That's everybody! Responses sealed, egos intact — for now. Time to pull back the curtain and see who actually brought it. Grading starts NOW — brace yourselves!`,
  `The arena has spoken — ALL of you, blind, no advantages, no eavesdropping. Beautiful. Now I get to do my FAVORITE part. Let's grade these one at a time. Here. We. GO!`,
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
