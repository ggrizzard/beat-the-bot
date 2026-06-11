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

// Module-level reference to the currently playing audio — allows external skip
let _currentAudio = null;

export function stopSpeaking() {
  if (_currentAudio) {
    _currentAudio.pause();
    _currentAudio.currentTime = 0;
    _currentAudio = null;
  }
}

export async function speakText(text, voiceId, speed = 1.15) {
  const apiKey = import.meta.env.VITE_EL_KEY || window.__EL_KEY__ || "";
  if (!apiKey) { console.warn("No ElevenLabs key found in VITE_EL_KEY or window.__EL_KEY__"); return; }
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
            speed: speed,
          },
        }),
      }
    );

    if (!response.ok) throw new Error("ElevenLabs TTS failed");

    const audioBlob = await response.blob();
    const audioUrl = URL.createObjectURL(audioBlob);
    const audio = new Audio(audioUrl);
    _currentAudio = audio;

    return new Promise((resolve) => {
      audio.onended = () => {
        URL.revokeObjectURL(audioUrl);
        _currentAudio = null;
        resolve();
      };
      audio.onerror = () => {
        _currentAudio = null;
        resolve(); // resolve so game flow never hangs
      };
      audio.play();
    });
  } catch (err) {
    console.error("TTS Error:", err);
  }
}

export async function transcribeAudio(audioBlob) {
  const apiKey = import.meta.env.VITE_EL_KEY || window.__EL_KEY__ || "";

  // Try ElevenLabs first
  if (apiKey) {
    try {
      const formData = new FormData();
      // ElevenLabs expects 'file' not 'audio', and needs a proper filename with extension
      formData.append("file", audioBlob, "recording.webm");
      formData.append("model_id", "scribe_v1");

      const response = await fetch("https://api.elevenlabs.io/v1/speech-to-text", {
        method: "POST",
        headers: { "xi-api-key": apiKey },
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        const text = data.text || data.transcript || "";
        if (text.trim().length > 0) {
          console.log("ElevenLabs STT success:", text);
          return text;
        }
      } else {
        const errText = await response.text();
        console.warn("ElevenLabs STT failed:", response.status, errText);
      }
    } catch (err) {
      console.warn("ElevenLabs STT error:", err);
    }
  }

  // Fallback — browser Web Speech API via re-play trick won't work on blob,
  // so use a fresh browser recognition session instead
  console.log("Falling back to browser speech recognition...");
  return await transcribeWithBrowser(audioBlob);
}

// Browser Web Speech API fallback — re-records a short confirmation prompt
// Actually: since we have the blob, convert and use recognition directly
function transcribeWithBrowser(audioBlob) {
  return new Promise((resolve) => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      resolve("[Could not transcribe — no speech recognition available. Check ElevenLabs key in config.js]");
      return;
    }

    // Play back the audio and run speech recognition simultaneously
    const url = URL.createObjectURL(audioBlob);
    const audio = new Audio(url);
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = "en-US";

    let finalTranscript = "";

    recognition.onresult = (e) => {
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) finalTranscript += e.results[i][0].transcript + " ";
      }
    };

    recognition.onend = () => {
      URL.revokeObjectURL(url);
      resolve(finalTranscript.trim() || "[No speech detected — check microphone permissions]");
    };

    recognition.onerror = (e) => {
      console.warn("Browser STT error:", e.error);
      URL.revokeObjectURL(url);
      resolve("[Transcription failed — check microphone permissions and try again]");
    };

    audio.onended = () => recognition.stop();
    audio.onerror = () => { recognition.stop(); resolve("[Audio playback failed]"); };

    recognition.start();
    audio.play();
  });
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
