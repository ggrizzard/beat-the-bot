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
      playerName = "",
      objection = "",
      persona = "",
      objective = "",
      benchmark = "",
      playerResponse = "",
      packName = "",
    } = body;

    const userPrompt = `
GAME PACK: ${packName}
PERSONA: ${persona}
OBJECTION: "${objection}"
OBJECTIVE: ${objective}
BENCHMARK RESPONSE: "${benchmark}"
PLAYER NAME: ${playerName}
PLAYER RESPONSE: "${playerResponse}"

Score ${playerName}'s response. Grade the three dimensions (objective/tone/language), compute the weighted overall, then roast first (theatrical Rex voice) and coach second (specific and genuine). Return only valid JSON.`;

    const apiRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: process.env.SCORING_MODEL || "claude-sonnet-4-6",
        max_tokens: 1000,
        system: REX_SYSTEM_PROMPT,
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
