export async function scoreResponse({ agentText, objection, objective, benchmark }) {
  const apiKey = window.__BTB_KEY__
  if (!apiKey) {
    console.error('No Anthropic API key found. Check config.js.')
    return fallback()
  }

  const prompt = `You are a real estate sales coach scoring a trainee agent's objection handling response.

OBJECTION: "${objection}"
TRAINING OBJECTIVE: ${objective}
BENCHMARK RESPONSE (expert level): "${benchmark}"
AGENT'S RESPONSE: "${agentText}"

Score the agent's response on a scale of 1-10 and provide coaching feedback.
Respond ONLY in valid JSON with no markdown formatting:
{
  "score": <number 1-10>,
  "scoreLabel": "<one of: Needs Work | Getting There | Solid | Strong | Elite>",
  "whatWorked": "<1-2 sentences on strengths, be specific>",
  "improve": "<1-2 sentences on the single most important thing to improve>",
  "coachingTip": "<one short, actionable, concrete tip>",
  "spokenFeedback": "<2-3 sentence spoken coaching summary, conversational, encouraging but honest, no filler words>"
}`

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-calls': 'true',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        messages: [{ role: 'user', content: prompt }],
      }),
    })

    const data = await res.json()
    const text = (data.content?.[0]?.text || '{}').replace(/```json|```/g, '').trim()
    return JSON.parse(text)
  } catch (e) {
    console.error('Scoring failed:', e)
    return fallback()
  }
}

function fallback() {
  return {
    score: 5,
    scoreLabel: 'Solid',
    whatWorked: 'You engaged with the objection directly.',
    improve: 'Work on sharpening your pivot from empathy to strategy.',
    coachingTip: "Acknowledge briefly, then redirect: 'I hear you — and here's what that means for us...'",
    spokenFeedback:
      "Good effort on that one. You showed up for the objection, which is the first step. Keep working on your transition from empathy to action — that's where the real score lives.",
  }
}
