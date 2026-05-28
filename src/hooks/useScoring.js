const REX_SYSTEM_PROMPT = `You are Rex — the most theatrical, over-the-top game show host in the history of real estate training. You have the energy of a Broadway producer, the confidence of a Vegas headliner, and the coaching instincts of a championship trainer.

Your job is to score real estate agents on their objection-handling responses and deliver feedback in TWO distinct acts:

ACT ONE — THE ROAST (2-3 sentences, max):
This is your moment. Be theatrical, be sarcastic, be a little savage — but always punching UP, never cruel. Think of it like a standing ovation that suddenly turns into a pie in the face. If they did well, still find something to poke fun at. Examples of your voice:
- "Ladies and gentlemen, what you just witnessed was... technically English. I'll give you that."
- "Oh WOW. You really went for it. You really... went somewhere. I'm not sure WHERE, but you went."
- "I've seen better recoveries on the Titanic, but hey — at least you got in the lifeboat!"
- "I've had houseplants handle objections with more conviction. But you know what? The houseplant wasn't even trying."
- "That answer had the energy of a DMV waiting room on a Tuesday. Technically present. Spiritually elsewhere."
- If they did great: "STOP THE PRESSES! Someone call their mother! That was ALMOST perfect — I said ALMOST, don't get cocky!"
- If they did great: "Well WELL well! Look who decided to show UP today! I am genuinely annoyed by how good that was."

ACT TWO — THE COACHING (3-4 sentences):
Drop the theatrics. Become a sharp, genuine coach. Be specific — reference what they actually said or didn't say. Tell them exactly what landed, what was missing, and ONE concrete thing to say differently next time. Always tie back to whether they achieved the stated objective.

SCORING:
Give a score from 1-10 based on:
- Did they achieve the stated objective? (40%)
- Did they match the emotional tone — empathetic, non-confrontational, confident? (30%)
- Did they use strategic language that positions them as an expert? (30%)

RESPONSE FORMAT — return ONLY valid JSON, no markdown, no backticks:
{
  "score": <number 1-10>,
  "roast": "<Act One — theatrical roast or compliment, 2-3 sentences, Rex voice>",
  "coaching": "<Act Two — specific genuine coaching, 3-4 sentences, drop the act>",
  "scoreLine": "<One punchy dramatic line Rex delivers when revealing the score — make it match the score emotionally. Low score = dramatic tragedy. High score = over-the-top celebration. Mid score = mock deliberation.>"
}`;

// ── Per-pack Rex intro scripts ──────────────────────────────────────────────
export const REX_PACK_INTROS = {
  1: [
    `LADIES AND GENTLEMEN — welcome to the main event! Tonight's category is... CLASSIC BEAT THE BOT! The bread and butter. The meat and potatoes. The scenarios every single agent faces before their coffee gets cold. We've got buyers dodging consultations, sellers playing the neighbor comparison game, and the eternal question — WHY do I need YOU? Oh, this is going to be BEAUTIFUL. Contestants... the clock is ticking. Let the battle BEGIN!`,
  ],
  2: [
    `Oh ho ho — now we're getting into the DEEP END! Tonight's category... EXPIRED LISTINGS! These are the sellers who already tried. They already trusted someone. And it did NOT go well. They are guarded. They are skeptical. They have heard every promise in the book and watched every single one of them fail to deliver. Your job — in the next sixty seconds — is to make them believe again. No pressure. Absolutely no pressure whatsoever. Contestants... this one sorts the professionals from the pretenders. BEGIN!`,
  ],
  3: [
    `DING DING DING — we are stepping into the ring for SELLER PRICING OBJECTIONS! Zillow said WHAT? The neighbor got HOW MUCH? I want to list WHERE? Listen — these sellers have numbers in their heads, feelings in their hearts, and absolutely no interest in hearing what the market actually says. Your mission — separate the emotion from the evidence without losing the listing or your dignity. Three of the most common pricing battles in real estate... and you're going in UNARMED except for your words. Let's see what you've got. FIGHT!`,
  ],
  4: [
    `Oh this is my FAVORITE. Tonight's category — FOR SALE BY OWNER! They've got a sign in the yard. A Zillow listing with four photos and a blurry bathroom. And the unshakeable confidence of someone who once watched an HGTV flip show. They do not think they need you. They are CERTAIN they do not need you. Your job is to walk into that conviction — smile on your face — and dismantle it brick by brick without bruising the ego that built it. This... is high art. Contestants — SHOW ME what you've got!`,
  ],
  5: [
    `And we close out with BUYER OBJECTIONS — the classic I'm just looking, I don't want to sign anything, and the fan favorite — can't I just go straight to the listing agent? These buyers think representation is optional. They think you're a door opener with a license. They think the internet has made you obsolete. Today you will prove. Them. WRONG. In three rounds, three objections, and three chances to show that your value cannot be Googled. Contestants — the mic is yours. Don't waste it!`,
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
  return `LADIES AND GENTLEMEN — welcome to BEAT THE BOT, the only real estate training experience with this much drama and this little mercy! Tonight's competitors stepping into the arena are... ${names[0]}... ${names[1]}... and ${names[2]}! Three agents. Four rounds. One champion. May the sharpest tongue — and the warmest empathy — WIN! Let's get this show on the ROAD!`;
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
  const apiKey = window.__BTB_KEY__ || "";

  const userPrompt = `
GAME PACK: ${packName}
PERSONA: ${persona}
OBJECTION: "${objection}"
OBJECTIVE: ${objective}
BENCHMARK RESPONSE: "${benchmark}"
PLAYER NAME: ${playerName}
PLAYER RESPONSE: "${playerResponse}"

Score ${playerName}'s response. Remember — roast first (theatrical Rex voice), then coach (specific and genuine). Return only valid JSON.`;

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "anthropic-dangerous-direct-browser-access": "true",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1000,
        system: REX_SYSTEM_PROMPT,
        messages: [{ role: "user", content: userPrompt }],
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error("Anthropic API error:", err);
      throw new Error(`API returned ${response.status}`);
    }

    const data = await response.json();
    const text = data.content?.[0]?.text || "{}";
    const clean = text.replace(/```json|```/g, "").trim();
    return JSON.parse(clean);

  } catch (err) {
    console.error("Scoring error:", err);
    return {
      score: 5,
      roast: "Well... that happened. The judges are conferring. And conferring. They've ordered lunch. Still conferring.",
      coaching: "Lead with empathy, pivot to strategy, and always tie your response back to the objective. The benchmark shows you exactly what landing looks like — study it.",
      scoreLine: "A diplomatic FIVE — right down the middle, just like that answer.",
    };
  }
}
