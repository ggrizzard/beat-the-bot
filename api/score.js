// Vercel serverless function — scores a Beat The Bot response with Claude.
//
// The Anthropic API key lives ONLY here, read from the ANTHROPIC_API_KEY
// environment variable, and is NEVER shipped to the browser. The frontend
// POSTs the round inputs to /api/score and gets back the scored JSON.
//
// Set the key once with:  vercel env add ANTHROPIC_API_KEY production
// (or in the Vercel dashboard → Project → Settings → Environment Variables)

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

SCORING (the 40/30/30 rubric — reward good selling, keep ranks honest):
These are LIVE, spoken, off-the-cuff answers — judge them as strong improvised verbal responses, NOT polished written essays. The benchmark is a reference for what "great" looks like, not a bar almost no one clears. Do NOT withhold high marks: when an agent genuinely does the job, give them the big number. Grade THREE dimensions independently, each 1-10:
- objective: Did they move toward the stated objective (secure the consult, hold the price, earn the second chance)? (weight 40%)
- tone: Empathetic, non-confrontational, confident — did they acknowledge before redirecting? (weight 30%)
- language: Strategic, specific, expert positioning. (weight 30%)

Calibration — be GENEROUS at the top for real skill, but 9 is the CEILING:
- 9: the top score — excellent: acknowledges, reframes, educates, and closes with specificity and confidence. Reserve it for a near-perfect answer.
- 7-8: strong and complete — acknowledges, gives a real reframe with a reason, and drives toward the objective. This is the NORMAL landing spot for a solid agent answer.
- 5-6: okay — engaged and on-topic but generic, missing a clear reframe or a close.
- 3-4: weak — barely engaged, off-target, or only a sentence or two.
- 1-2: didn't engage, argued, or made it worse.

NEVER give a 10 — not as the overall score and not on any sub-dimension. 9 is the absolute maximum; nobody is perfect. A great answer should land 8-9; never cap a strong response at 7. Reserve the low end for answers that truly miss.

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

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: "Server is missing ANTHROPIC_API_KEY" });
    return;
  }

  try {
    const body =
      typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {};
    const {
      objection = "",
      persona = "",
      objective = "",
      benchmark = "",
      packName = "",
    } = body;

    // Improv banter mode — a fresh, fun Rex stall line to fill the scoring break.
    if (body.mode === "banter") {
      const names = Array.isArray(body.players) ? body.players.filter(Boolean).join(", ") : "";
      const banterSystem = `You are Rex — the over-the-top, theatrical game-show host of "Beat the Bot," a real estate objection-handling competition for ERA Grizzard agents. Improvise ONE short stall to fill time while the AI tallies the scores. 2-4 sentences, high energy, PG, genuinely funny and a little savage but never cruel. Make it FRESH every time — riff on the tension, the contestants, real estate life, the AI judges "deliberating," or a warm shout-out to ERA Grizzard and their leader Gus (don't force Gus in every time). Never reveal or hint at any score. Return ONLY the spoken line as plain text — no quotes, no JSON, no stage directions.`;
      const banterUser = `Category just played: ${packName || "real estate objections"}.${names ? ` Contestants: ${names}.` : ""} Improvise your stall line now while the scores come in.`;
      const r = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "content-type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01" },
        body: JSON.stringify({
          model: process.env.SCORING_MODEL || "claude-sonnet-4-6",
          max_tokens: 250,
          temperature: 1,
          system: banterSystem,
          messages: [{ role: "user", content: banterUser }],
        }),
      });
      if (!r.ok) {
        const detail = await r.text();
        res.status(502).json({ error: `Anthropic ${r.status}`, detail: detail.slice(0, 300) });
        return;
      }
      const d = await r.json();
      const line = (d?.content?.[0]?.text || "").trim();
      if (!line) {
        res.status(502).json({ error: "Empty banter" });
        return;
      }
      res.status(200).json({ line });
      return;
    }

    const isBatch = Array.isArray(body.responses) && body.responses.length > 0;

    let system = REX_SYSTEM_PROMPT;
    let userPrompt;
    let maxTokens;

    if (isBatch) {
      // Head-to-head: score every contestant in one pass so scores spread and
      // there is a clear winner with no ties.
      system =
        REX_SYSTEM_PROMPT +
        `\n\nCOMPETITION MODE — you are scoring MULTIPLE contestants who all answered the SAME objection, head to head. Apply the rubric to each, but this is a contest with ONE winner:\n- The overall \`score\` values MUST all be DIFFERENT integers — absolutely no ties.\n- Score on the merits FIRST (a great answer is a 9 — the ceiling, NEVER a 10 — a solid one 7-8), THEN spread so the ranking is clear. Anchor at the TOP and step down — e.g., for three answers 9/7/5, not 6/5/4. Do NOT drag everyone into the low end just to separate them; the best answer should feel like a winner.\n- Reward specificity, a real reframe, and a concrete close; mark down vague, generic, or one-line answers.\nReturn ONLY valid JSON: {"results":[ <one object per contestant, in the SAME ORDER given, each in the exact single-response format> ]}.`;
      const list = body.responses
        .map((r, i) => `CONTESTANT ${i + 1} — ${r.playerName}:\n"${r.playerResponse}"`)
        .join("\n\n");
      userPrompt = `GAME PACK: ${packName}\nPERSONA: ${persona}\nOBJECTION: "${objection}"\nOBJECTIVE: ${objective}\nBENCHMARK RESPONSE: "${benchmark}"\n\nScore every contestant below head-to-head. Distinct, spread-out scores — one clear winner, no ties.\n\n${list}\n\nReturn {"results":[ ... ]} with one object per contestant, same order.`;
      maxTokens = Math.min(4096, 500 * body.responses.length + 400);
    } else {
      const { playerName = "", playerResponse = "" } = body;
      userPrompt = `
GAME PACK: ${packName}
PERSONA: ${persona}
OBJECTION: "${objection}"
OBJECTIVE: ${objective}
BENCHMARK RESPONSE: "${benchmark}"
PLAYER NAME: ${playerName}
PLAYER RESPONSE: "${playerResponse}"

Score ${playerName}'s response. Grade the three dimensions (objective/tone/language), compute the weighted overall, then roast first (theatrical Rex voice) and coach second (specific and genuine). Return only valid JSON.`;
      maxTokens = 1000;
    }

    const apiRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: process.env.SCORING_MODEL || "claude-sonnet-4-6",
        max_tokens: maxTokens,
        system,
        messages: [{ role: "user", content: userPrompt }],
      }),
    });

    if (!apiRes.ok) {
      const detail = await apiRes.text();
      console.error("Anthropic API error:", apiRes.status, detail);
      res.status(502).json({ error: `Anthropic ${apiRes.status}`, detail: detail.slice(0, 400) });
      return;
    }

    const data = await apiRes.json();
    const text = data?.content?.[0]?.text || "";
    const clean = text.replace(/```json|```/g, "").trim();
    let parsed = null;
    try {
      parsed = JSON.parse(clean);
    } catch {
      const match = clean.match(/\{[\s\S]*\}/);
      if (match) {
        try { parsed = JSON.parse(match[0]); } catch { parsed = null; }
      }
    }
    if (!parsed) {
      console.error("Could not parse model JSON:", text.slice(0, 400));
      res.status(502).json({ error: "Model did not return valid JSON" });
      return;
    }

    res.status(200).json(parsed);
  } catch (err) {
    console.error("Scoring function error:", err);
    res.status(500).json({ error: String((err && err.message) || err) });
  }
}
