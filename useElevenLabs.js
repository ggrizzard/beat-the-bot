// Rex — game show host (intros, category announcements, roasts, round winners, champion reveal)
export const REX_VOICE_ID = "dHd5gvgSOzSfduK4CvEg";

// Coach — delivers scoring feedback and coaching tips after each response
export const COACH_VOICE_ID = "nf3HWeYdCxC9WYfyDEDE";

// Challenger voices — one per pack (delivers the objection in character)
export const CHALLENGER_VOICE_IDS = {
  1: "2tM0Teq5Piex0mNtlZnm",  // Pack 1 — Classic Beat The Bot
  2: "SOYHLrjzK2X1ezoPC6cr",  // Pack 2 — Expired Listings
  3: "K7W7zLWeGoxU9YqWoB7A",  // Pack 3 — Seller Pricing
  4: "pNInz6obpgDQGcFmaJgB",  // Pack 4 — For Sale By Owner
  5: "FGY2WhTYpPnrIDTdsKH5",  // Pack 5 — Buyer Objections
};

export async function speakText(text, voiceId) {
  const apiKey = window.__EL_KEY__ || "";
  if (!apiKey) { console.warn("No ElevenLabs key found in window.__EL_KEY__"); return; }
  try {
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream`,
      {
        method: "POST",
        headers: {
          "xi-api-key": apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text,
          model_id: "eleven_turbo_v2",
          voice_settings: {
            stability: 0.4,
            similarity_boost: 0.8,
            style: 0.6,
            use_speaker_boost: true,
          },
        }),
      }
    );

    if (!response.ok) throw new Error("ElevenLabs TTS failed");

    const audioBlob = await response.blob();
    const audioUrl = URL.createObjectURL(audioBlob);
    const audio = new Audio(audioUrl);

    return new Promise((resolve, reject) => {
      audio.onended = () => {
        URL.revokeObjectURL(audioUrl);
        resolve();
      };
      audio.onerror = reject;
      audio.play();
    });
  } catch (err) {
    console.error("TTS Error:", err);
  }
}

export async function transcribeAudio(audioBlob) {
  const apiKey = window.__EL_KEY__ || "";
  if (!apiKey) return "";
  try {
    const formData = new FormData();
    formData.append("audio", audioBlob, "response.webm");
    formData.append("model_id", "scribe_v1");

    const response = await fetch("https://api.elevenlabs.io/v1/speech-to-text", {
      method: "POST",
      headers: { "xi-api-key": apiKey },
      body: formData,
    });

    if (!response.ok) throw new Error("ElevenLabs STT failed");
    const data = await response.json();
    return data.text || "";
  } catch (err) {
    console.error("STT Error:", err);
    return "";
  }
}

export function useAudioRecorder() {
  let mediaRecorder = null;
  let audioChunks = [];

  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    audioChunks = [];
    mediaRecorder = new MediaRecorder(stream);
    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) audioChunks.push(e.data);
    };
    mediaRecorder.start();
    return mediaRecorder;
  };

  const stopRecording = () => {
    return new Promise((resolve) => {
      if (!mediaRecorder) return resolve(null);
      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunks, { type: "audio/webm" });
        resolve(blob);
      };
      mediaRecorder.stop();
      mediaRecorder.stream.getTracks().forEach((t) => t.stop());
    });
  };

  return { startRecording, stopRecording };
}
