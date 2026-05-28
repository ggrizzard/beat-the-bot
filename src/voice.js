const VOICE_ID = 'EXAVITQu4vr4xnSDxMaL' // Sarah

export async function speak(text, apiKey) {
  if (apiKey) {
    try {
      const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'xi-api-key': apiKey },
        body: JSON.stringify({
          text,
          model_id: 'eleven_turbo_v2',
          voice_settings: { stability: 0.5, similarity_boost: 0.75 },
        }),
      })
      if (res.ok) {
        const blob = await res.blob()
        const url = URL.createObjectURL(blob)
        return playAudioUrl(url)
      }
    } catch (e) {
      console.warn('ElevenLabs TTS failed, falling back to browser:', e)
    }
  }
  return browserSpeak(text)
}

function playAudioUrl(url) {
  return new Promise((resolve) => {
    const audio = new Audio(url)
    audio.onended = resolve
    audio.onerror = resolve
    audio.play().catch(resolve)
  })
}

function browserSpeak(text) {
  return new Promise((resolve) => {
    if (!window.speechSynthesis) { resolve(); return }
    window.speechSynthesis.cancel()
    const utter = new SpeechSynthesisUtterance(text)
    utter.rate = 0.93
    utter.pitch = 1.05
    utter.onend = resolve
    utter.onerror = resolve
    window.speechSynthesis.speak(utter)
  })
}

export async function transcribe(audioBlob, apiKey) {
  if (!apiKey) return ''
  try {
    const fd = new FormData()
    fd.append('file', audioBlob, 'response.webm')
    fd.append('model_id', 'scribe_v1')
    const res = await fetch('https://api.elevenlabs.io/v1/speech-to-text', {
      method: 'POST',
      headers: { 'xi-api-key': apiKey },
      body: fd,
    })
    if (res.ok) {
      const data = await res.json()
      return data.text || ''
    }
  } catch (e) {
    console.warn('STT failed:', e)
  }
  return ''
}

export function startRecording(onStop) {
  return new Promise((resolve, reject) => {
    const chunks = []
    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then((stream) => {
        const mr = new MediaRecorder(stream, { mimeType: 'audio/webm' })
        mr.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data) }
        mr.onstop = () => {
          stream.getTracks().forEach((t) => t.stop())
          const blob = new Blob(chunks, { type: 'audio/webm' })
          onStop(blob)
        }
        mr.start()
        resolve(mr)
      })
      .catch(reject)
  })
}
