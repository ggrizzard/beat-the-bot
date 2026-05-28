import { useState, useRef, useEffect, useCallback } from "react";
import { GAME_PACKS } from "./data/gamePacks";
import { speakText, stopSpeaking, transcribeAudio, REX_VOICE_ID, COACH_VOICE_ID, CHALLENGER_VOICE_IDS } from "./hooks/useElevenLabs";
import { scoreResponse, getRexPackIntro, getRexPlayerIntro, getRexRoundWinner, getRexChampion, getRexTiebreaker } from "./hooks/useScoring";

const API_KEY = window.__BTB_KEY__ || "";

// ─── PHASE CONSTANTS ───────────────────────────────────────────────────────────
const PHASE = {
  SPLASH: "splash",
  SOUND_CHECK: "sound_check",
  REGISTER: "register",
  CATEGORY_SELECT: "category_select",
  REX_INTRO: "rex_intro",
  OBJECTION: "objection",
  PLAYER_HANDOFF: "player_handoff",
  PLAYER_RESPONSE: "player_response",
  SCORING: "scoring",
  SCORE_REVEAL: "score_reveal",
  ROUND_SUMMARY: "round_summary",
  GAME_OVER: "game_over",
};

// ─── UTILITY ───────────────────────────────────────────────────────────────────
function getRotatedOrder(players, roundIndex) {
  const n = players.length;
  return players.map((_, i) => players[(i + roundIndex) % n]);
}

// ─── COMPONENTS ────────────────────────────────────────────────────────────────

function Particle({ style }) {
  return <div className="particle" style={style} />;
}

function ScoreBar({ score, animated = false }) {
  const [width, setWidth] = useState(0);
  useEffect(() => {
    if (animated) {
      setTimeout(() => setWidth((score / 10) * 100), 300);
    } else {
      setWidth((score / 10) * 100);
    }
  }, [score, animated]);

  const color = score >= 8 ? "#FFD700" : score >= 6 ? "#4ECDC4" : score >= 4 ? "#F97316" : "#FF6B6B";

  return (
    <div className="score-bar-wrap">
      <div className="score-bar-track">
        <div
          className="score-bar-fill"
          style={{ width: `${width}%`, background: color, transition: animated ? "width 1.2s cubic-bezier(0.34, 1.56, 0.64, 1)" : "none" }}
        />
      </div>
      <span className="score-bar-label" style={{ color }}>{score}/10</span>
    </div>
  );
}

function PlayerCard({ player, score, isActive, isWinner, rank }) {
  const rankColors = ["#c9a84c", "#f5f0e8", "#C8102E"];
  return (
    <div className={`player-card ${isActive ? "active" : ""} ${isWinner ? "winner" : ""}`}>
      {isWinner && <div className="winner-crown">👑</div>}
      {rank !== undefined && (
        <div className="player-rank" style={{ color: rankColors[rank] || "#fff" }}>
          #{rank + 1}
        </div>
      )}
      <div className="player-avatar">{player.name.charAt(0).toUpperCase()}</div>
      <div className="player-name">{player.name}</div>
      <div className="player-total">{score} pts</div>
    </div>
  );
}

// ─── MAIN APP ──────────────────────────────────────────────────────────────────
export default function App() {
  const [phase, setPhase] = useState(PHASE.SPLASH);
  const [players, setPlayers] = useState([
    { id: 0, name: "" },
    { id: 1, name: "" },
    { id: 2, name: "" },
  ]);
  const [scores, setScores] = useState([0, 0, 0]);
  const [roundHistory, setRoundHistory] = useState([]); // [{packId, roundId, results:[{playerId,score,roast,coaching}]}]
  const [currentRound, setCurrentRound] = useState(0); // 0-3
  const [selectedPackId, setSelectedPackId] = useState(null);
  const [selectedRoundIndex, setSelectedRoundIndex] = useState(null);
  const [usedRounds, setUsedRounds] = useState(new Set());
  const [currentPlayerOrder, setCurrentPlayerOrder] = useState([]);
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [currentRoundResults, setCurrentRoundResults] = useState([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [pendingBlob, setPendingBlob] = useState(null); // blob waiting for confirm

  // ── Sound check state ──
  const [scSpeakerStatus, setScSpeakerStatus] = useState("idle"); // idle | playing | pass | fail
  const [scMicStatus, setScMicStatus] = useState("idle");         // idle | recording | transcribing | pass | fail
  const [scMicTranscript, setScMicTranscript] = useState("");
  const [scoreData, setScoreData] = useState(null);
  const [statusMsg, setStatusMsg] = useState("");
  const [winnerIndex, setWinnerIndex] = useState(null);
  const [particles, setParticles] = useState([]);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recognitionRef = useRef(null);
  const [liveTranscript, setLiveTranscript] = useState(""); // words appearing in real-time

  // Generate celebration particles
  const spawnParticles = useCallback(() => {
    const p = Array.from({ length: 30 }, (_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      animationDelay: `${Math.random() * 1.5}s`,
      background: ["#C8102E", "#c9a84c", "#0B3279", "#f5f0e8", "#e8c97a"][Math.floor(Math.random() * 5)],
      width: `${6 + Math.random() * 10}px`,
      height: `${6 + Math.random() * 10}px`,
    }));
    setParticles(p);
    setTimeout(() => setParticles([]), 3000);
  }, []);

  // ── TTS helper ──
  // voice: "rex" | "coach" | "character"
  // packId optional — pass explicitly when selectedPackId may not be set yet
  const speak = useCallback(async (text, voice = "rex", packId = null) => {
    setIsSpeaking(true);
    const resolvedPackId = packId ?? selectedPackId;
    let voiceId;
    if (voice === "coach")          voiceId = COACH_VOICE_ID;
    else if (voice === "character") voiceId = CHALLENGER_VOICE_IDS[resolvedPackId] || REX_VOICE_ID;
    else                            voiceId = REX_VOICE_ID;
    await speakText(text, voiceId);
    setIsSpeaking(false);
  }, [selectedPackId]);

  // ── Sound check handlers ──
  const handleTestSpeaker = async () => {
    setScSpeakerStatus("playing");
    await speak("Testing! Testing! One, two, three — if you can hear Rex loud and clear, your speakers are READY for the arena!", "rex");
    setScSpeakerStatus("pass");
  };

  const handleTestMicStart = async () => {
    setScMicStatus("recording");
    setScMicTranscript("");
    await startRecording();
  };

  const handleTestMicStop = async () => {
    const blob = await stopRecording();
    if (!blob) { setScMicStatus("fail"); return; }
    setScMicStatus("transcribing");
    const text = await transcribeAudio(blob);
    if (text && text.trim().length > 0) {
      setScMicTranscript(text);
      setScMicStatus("pass");
    } else {
      setScMicTranscript("");
      setScMicStatus("fail");
    }
  };

  const handleRetryMic = () => {
    setScMicStatus("idle");
    setScMicTranscript("");
  };

  // ── Skip current TTS ──
  const handleSkip = useCallback(() => {
    stopSpeaking();
    setIsSpeaking(false);
  }, []);

  // ── Recording + Live Transcription ──
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];

      // MediaRecorder — captures audio blob for ElevenLabs fallback
      const recorder = new MediaRecorder(stream);
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };
      recorder.start();
      mediaRecorderRef.current = recorder;

      // Web Speech API — live transcription shown on screen as they speak
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = "en-US";

        let finalText = "";
        recognition.onresult = (e) => {
          let interim = "";
          for (let i = e.resultIndex; i < e.results.length; i++) {
            if (e.results[i].isFinal) {
              finalText += e.results[i][0].transcript + " ";
            } else {
              interim += e.results[i][0].transcript;
            }
          }
          setLiveTranscript(finalText + interim);
        };
        recognition.onerror = (e) => console.warn("Live STT error:", e.error);
        recognition.start();
        recognitionRef.current = recognition;
      }

      setLiveTranscript("");
      setIsRecording(true);
    } catch (err) {
      setStatusMsg("Microphone access denied. Please allow mic access.");
    }
  };

  const stopRecording = () => {
    // Stop Web Speech recognition
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    return new Promise((resolve) => {
      if (!mediaRecorderRef.current) return resolve(null);
      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        resolve(blob);
      };
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach((t) => t.stop());
      setIsRecording(false);
    });
  };

  // ── GAME FLOW ──

  // Start game after registration
  const handleStartGame = async () => {
    if (players.some((p) => !p.name.trim())) {
      setStatusMsg("All three players need a name!");
      return;
    }
    setPhase(PHASE.CATEGORY_SELECT);
    setCurrentPlayerOrder(getRotatedOrder(players, 0));
    await speak(getRexPlayerIntro(players), "rex");
  };

  // Category selected
  const handleSelectPack = async (packId) => {
    const pack = GAME_PACKS.find((p) => p.id === packId);
    if (!pack) return;

    // Pick a random unused round from this pack
    const availableRounds = pack.rounds.filter((r) => !usedRounds.has(r.id));
    if (availableRounds.length === 0) {
      setStatusMsg("All rounds from this pack have been used!");
      return;
    }
    const round = availableRounds[Math.floor(Math.random() * availableRounds.length)];

    setSelectedPackId(packId);
    setSelectedRoundIndex(pack.rounds.indexOf(round));
    setCurrentRoundResults([]);
    setCurrentPlayerIndex(0);
    setUsedRounds((prev) => new Set([...prev, round.id]));

    setPhase(PHASE.REX_INTRO);
    const introText = getRexPackIntro(packId);
    await speak(introText, "rex");
    setPhase(PHASE.OBJECTION);
    await speak(round.objection, "character", packId);
    setPhase(PHASE.PLAYER_RESPONSE);
  };

  // Step 1 — stop recording, use live transcript immediately
  const handleStopRecording = async () => {
    const blob = await stopRecording();
    if (!blob) {
      setStatusMsg("Recording failed — check microphone permissions.");
      return;
    }
    setPendingBlob(blob);

    // If Web Speech gave us a live transcript, use it immediately — no waiting
    if (liveTranscript.trim().length > 0) {
      setTranscript(liveTranscript.trim());
      setStatusMsg("");
      return;
    }

    // Fallback — send blob to ElevenLabs if live transcript is empty
    setIsTranscribing(true);
    setStatusMsg("Transcribing your response...");
    const text = await transcribeAudio(blob);
    setTranscript(text || "[Nothing detected — try speaking louder or check mic]");
    setIsTranscribing(false);
    setStatusMsg("");
  };

  // Step 2 — confirmed, now score it
  const handleConfirmAndScore = async () => {
    const text = transcript;
    if (!text) return;
    setPendingBlob(null);

    const pack = GAME_PACKS.find((p) => p.id === selectedPackId);
    const round = pack.rounds[selectedRoundIndex];
    const player = currentPlayerOrder[currentPlayerIndex];

    setPhase(PHASE.SCORING);
    setStatusMsg("Rex is deliberating...");

    const result = await scoreResponse({
      playerName: player.name,
      objection: round.objection,
      persona: round.persona,
      objective: round.objective,
      benchmark: round.benchmark,
      playerResponse: text,
      packName: pack.name,
    });

    setScoreData(result);
    setPhase(PHASE.SCORE_REVEAL);

    // Rex roasts, Coach coaches
    await speak(`${result.roast} ${result.scoreLine}`, "rex");
    await speak(result.coaching, "coach");

    // Update results
    const updatedResults = [
      ...currentRoundResults,
      { playerId: player.id, playerName: player.name, score: result.score, roast: result.roast, coaching: result.coaching },
    ];
    setCurrentRoundResults(updatedResults);

    // Update cumulative scores
    setScores((prev) => {
      const next = [...prev];
      next[player.id] += result.score;
      return next;
    });

    // More players this round?
    if (currentPlayerIndex + 1 < currentPlayerOrder.length) {
      const nextPlayer = currentPlayerOrder[currentPlayerIndex + 1];
      setCurrentPlayerIndex((i) => i + 1);
      setTranscript("");
      setLiveTranscript("");
      setPhase(PHASE.PLAYER_HANDOFF);
    } else {
      await endRound(updatedResults);
    }
  };

  // Re-record — discard transcript and start over
  const handleReRecord = () => {
    setTranscript("");
    setLiveTranscript("");
    setPendingBlob(null);
    setIsTranscribing(false);
  };

  const endRound = async (results) => {
    const roundWinner = results.reduce((best, r) => (r.score > best.score ? r : best), results[0]);
    setPhase(PHASE.ROUND_SUMMARY);
    spawnParticles();

    setRoundHistory((prev) => [...prev, { packId: selectedPackId, results }]);
    const nextRound = currentRound + 1;
    setCurrentRound(nextRound);

    if (nextRound >= 4) {
      // Game over
      const maxScore = Math.max(...scores);
      const winnerIdx = scores.indexOf(maxScore);
      setWinnerIndex(winnerIdx);
      await speak(getRexChampion(players[winnerIdx].name, scores[winnerIdx]), "rex");
      setPhase(PHASE.GAME_OVER);
    } else {
      await speak(getRexRoundWinner(roundWinner.playerName, roundWinner.score), "rex");
      // Next round order rotates
      setCurrentPlayerOrder(getRotatedOrder(players, nextRound));
      setCurrentPlayerIndex(0);
    }
  };

  const handleHandoffReady = async () => {
    setPhase(PHASE.OBJECTION);
    const pack = GAME_PACKS.find((p) => p.id === selectedPackId);
    await speak(pack.rounds[selectedRoundIndex].objection, "character", selectedPackId);
    setPhase(PHASE.PLAYER_RESPONSE);
  };

  const handleContinueToNextCategory = () => {
    setPhase(PHASE.CATEGORY_SELECT);
    setScoreData(null);
    setTranscript("");
    setPendingBlob(null);
  };

  const handlePlayAgain = () => {
    setPhase(PHASE.SPLASH);
    setPlayers([{ id: 0, name: "" }, { id: 1, name: "" }, { id: 2, name: "" }]);
    setScores([0, 0, 0]);
    setRoundHistory([]);
    setCurrentRound(0);
    setSelectedPackId(null);
    setSelectedRoundIndex(null);
    setUsedRounds(new Set());
    setCurrentRoundResults([]);
    setWinnerIndex(null);
    setScoreData(null);
    setTranscript("");
  };

  // ── DERIVED ──
  const currentPack = GAME_PACKS.find((p) => p.id === selectedPackId);
  const currentRoundData = currentPack?.rounds[selectedRoundIndex];
  const activePlayer = currentPlayerOrder[currentPlayerIndex];
  const sortedPlayers = [...players].map((p, i) => ({ ...p, score: scores[i] })).sort((a, b) => b.score - a.score);

  // ── RENDER ──
  return (
    <div className="app">
      <style>{CSS}</style>

      {/* Particles */}
      {particles.map((p) => (
        <Particle key={p.id} style={{ left: p.left, animationDelay: p.animationDelay, background: p.background, width: p.width, height: p.height }} />
      ))}

      {/* ── SPLASH ── */}
      {phase === PHASE.SPLASH && (
        <div className="screen splash-screen">
          <div className="splash-bg" />
          <div className="splash-content">
            <img src="/Era_Logo_White_Transparent.png" alt="ERA Grizzard Real Estate" className="era-logo" />
            <div className="logo-wrap">
              <div className="logo-beat">BEAT</div>
              <div className="logo-the">THE</div>
              <div className="logo-bot">BOT</div>
              <div className="logo-sub">AGENT OBJECTION TRAINING CHAMPIONSHIP</div>
            </div>
            <div className="rex-intro-card">
              <div className="rex-icon">🎭</div>
              <div className="rex-name">Hosted by REX</div>
              <div className="rex-tagline">"The most theatrical host in real estate training history"</div>
            </div>
            <div className="splash-buttons">
              <button className="btn-primary" onClick={() => setPhase(PHASE.REGISTER)}>
                ENTER THE ARENA
              </button>
              <button className="btn-sound-check" onClick={() => {
                setScSpeakerStatus("idle");
                setScMicStatus("idle");
                setScMicTranscript("");
                setPhase(PHASE.SOUND_CHECK);
              }}>
                🔊 SOUND CHECK
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── SOUND CHECK ── */}
      {phase === PHASE.SOUND_CHECK && (
        <div className="screen sound-check-screen">
          <h1 className="screen-title">SOUND CHECK</h1>
          <p className="screen-sub">Test speakers and mic before the game</p>

          {/* Speaker test */}
          <div className="sc-card">
            <div className="sc-card-header">
              <div className="sc-icon">🔊</div>
              <div>
                <div className="sc-title">SPEAKER TEST</div>
                <div className="sc-desc">Rex will say a test phrase — make sure you can hear him clearly</div>
              </div>
              {scSpeakerStatus === "pass" && <div className="sc-badge pass">✓ PASS</div>}
              {scSpeakerStatus === "fail" && <div className="sc-badge fail">✗ FAIL</div>}
            </div>
            {scSpeakerStatus === "playing" && (
              <div className="sc-status playing">
                <div className="speaking-wave small"><span /><span /><span /><span /><span /></div>
                <span>Rex is speaking...</span>
              </div>
            )}
            {scSpeakerStatus === "pass" && (
              <div className="sc-status pass">✓ If you heard Rex clearly, speakers are good to go!</div>
            )}
            <div className="sc-actions">
              <button
                className="btn-sc-test"
                onClick={handleTestSpeaker}
                disabled={scSpeakerStatus === "playing" || isSpeaking}
              >
                {scSpeakerStatus === "pass" ? "🔊 TEST AGAIN" : "▶ PLAY TEST"}
              </button>
            </div>
          </div>

          {/* Mic test */}
          <div className="sc-card">
            <div className="sc-card-header">
              <div className="sc-icon">🎤</div>
              <div>
                <div className="sc-title">MICROPHONE TEST</div>
                <div className="sc-desc">Record a few words — we'll transcribe them so you can confirm the mic is working</div>
              </div>
              {scMicStatus === "pass" && <div className="sc-badge pass">✓ PASS</div>}
              {scMicStatus === "fail" && <div className="sc-badge fail">✗ FAIL</div>}
            </div>

            {scMicStatus === "recording" && (
              <div className="sc-status recording">
                <span className="recording-pulse">⏺</span> Recording — say something, then hit STOP
              </div>
            )}
            {scMicStatus === "transcribing" && (
              <div className="sc-status playing">
                <div className="transcribing-dots"><span /><span /><span /></div>
                <span>Transcribing...</span>
              </div>
            )}
            {scMicStatus === "pass" && scMicTranscript && (
              <div className="sc-transcript">
                <div className="sc-transcript-label">WE HEARD:</div>
                <div className="sc-transcript-text">"{scMicTranscript}"</div>
              </div>
            )}
            {scMicStatus === "fail" && (
              <div className="sc-status fail">✗ Nothing was picked up — check mic permissions and try again</div>
            )}

            <div className="sc-actions">
              {scMicStatus === "idle" && (
                <button className="btn-sc-test" onClick={handleTestMicStart}>
                  🎤 START RECORDING
                </button>
              )}
              {scMicStatus === "recording" && (
                <button className="btn-sc-test recording" onClick={handleTestMicStop}>
                  ⏹ STOP RECORDING
                </button>
              )}
              {(scMicStatus === "pass" || scMicStatus === "fail") && (
                <button className="btn-sc-test" onClick={handleRetryMic}>
                  🔄 TRY AGAIN
                </button>
              )}
            </div>
          </div>

          <button className="btn-primary" onClick={() => setPhase(PHASE.REGISTER)}>
            ENTER THE ARENA →
          </button>
        </div>
      )}


      {phase === PHASE.REGISTER && (
        <div className="screen register-screen">
          <h1 className="screen-title">WHO'S COMPETING TODAY?</h1>
          <p className="screen-sub">Three agents. One winner. Zero mercy.</p>
          <div className="player-inputs">
            {players.map((player, i) => (
              <div key={i} className="player-input-row">
                <div className="player-number" style={{ background: ["#C8102E", "#0B3279", "#c9a84c"][i] }}>
                  P{i + 1}
                </div>
                <input
                  className="name-input"
                  placeholder={`Player ${i + 1} name...`}
                  value={player.name}
                  onChange={(e) => {
                    const updated = [...players];
                    updated[i] = { ...updated[i], name: e.target.value };
                    setPlayers(updated);
                  }}
                  onKeyDown={(e) => e.key === "Enter" && handleStartGame()}
                />
              </div>
            ))}
          </div>
          {statusMsg && <div className="status-msg">{statusMsg}</div>}
          <button className="btn-primary" onClick={handleStartGame}>
            LET'S GO 🎯
          </button>
        </div>
      )}

      {/* ── CATEGORY SELECT ── */}
      {phase === PHASE.CATEGORY_SELECT && (
        <div className="screen category-screen">
          <div className="scoreboard-mini">
            {sortedPlayers.map((p, i) => (
              <PlayerCard key={p.id} player={p} score={p.score} rank={i} isWinner={false} />
            ))}
          </div>
          <h2 className="screen-title">
            {currentRound === 0 ? "PICK YOUR BATTLEFIELD" : `ROUND ${currentRound + 1} — ${players[currentPlayerOrder[0]?.id]?.name || ""}  PICKS`}
          </h2>
          <p className="screen-sub">Round {currentRound + 1} of 4</p>
          <div className="pack-grid">
            {GAME_PACKS.map((pack) => {
              const allUsed = pack.rounds.every((r) => usedRounds.has(r.id));
              return (
                <button
                  key={pack.id}
                  className={`pack-tile ${allUsed ? "used" : ""}`}
                  style={{ "--pack-color": pack.color }}
                  onClick={() => !allUsed && handleSelectPack(pack.id)}
                  disabled={allUsed || isSpeaking}
                >
                  <div className="pack-emoji">{pack.emoji}</div>
                  <div className="pack-tile-name">{pack.name}</div>
                  {allUsed && <div className="pack-used-badge">USED</div>}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── REX INTRO / OBJECTION ── */}
      {(phase === PHASE.REX_INTRO || phase === PHASE.OBJECTION) && (
        <div className="screen speaking-screen">
          <div className="speaking-icon">{phase === PHASE.REX_INTRO ? "🎭" : "🏠"}</div>
          <div className="speaking-label">{phase === PHASE.REX_INTRO ? "REX IS INTRODUCING..." : "THE OBJECTION..."}</div>
          {currentPack && <div className="pack-badge" style={{ background: currentPack.color }}>{currentPack.emoji} {currentPack.name}</div>}
          {currentRoundData && phase === PHASE.OBJECTION && (
            <div className="objection-bubble">
              <div className="persona-tag">"{currentRoundData.persona}"</div>
              <div className="objection-text">"{currentRoundData.objection}"</div>
            </div>
          )}
          <div className="speaking-wave">
            <span /><span /><span /><span /><span />
          </div>
          <button className="btn-skip" onClick={handleSkip}>⏭ SKIP</button>
        </div>
      )}

      {/* ── PLAYER HANDOFF ── */}
      {phase === PHASE.PLAYER_HANDOFF && activePlayer && (
        <div className="screen handoff-screen">
          <div className="handoff-thanks">
            <div className="handoff-thanks-label">GREAT EFFORT</div>
            <div className="handoff-thanks-name">{currentPlayerOrder[currentPlayerIndex - 1]?.name || ""}!</div>
            <div className="handoff-thanks-sub">Pass the mic and step aside — your score is locked in.</div>
          </div>

          <div className="handoff-divider">
            <div className="handoff-arrow">▼</div>
          </div>

          <div className="handoff-next">
            <div className="handoff-next-label">NEXT UP</div>
            <div className="handoff-next-avatar">{activePlayer.name.charAt(0).toUpperCase()}</div>
            <div className="handoff-next-name">{activePlayer.name}</div>
            <div className="handoff-next-sub">Step up to the mic — same objection, fresh start.</div>
          </div>

          <button className="btn-primary" onClick={handleHandoffReady}>
            I'M READY 🎤
          </button>
        </div>
      )}

      {/* ── PLAYER RESPONSE ── */}
      {phase === PHASE.PLAYER_RESPONSE && activePlayer && (
        <div className="screen response-screen">
          <div className="scoreboard-mini">
            {currentPlayerOrder.map((p, i) => (
              <div key={p.id} className={`mini-player ${i === currentPlayerIndex ? "current" : i < currentPlayerIndex ? "done" : ""}`}>
                <div className="mini-avatar">{p.name.charAt(0)}</div>
                <div className="mini-name">{p.name}</div>
                {i < currentPlayerIndex && <div className="mini-check">✓</div>}
                {i === currentPlayerIndex && <div className="mini-arrow">▶</div>}
              </div>
            ))}
          </div>

          <div className="pack-badge" style={{ background: currentPack?.color }}>
            {currentPack?.emoji} {currentPack?.name}
          </div>

          <div className="objection-bubble small">
            <div className="persona-tag">"{currentRoundData?.persona}"</div>
            <div className="objection-text">"{currentRoundData?.objection}"</div>
          </div>

          <div className="active-player-banner">
            <div className="active-avatar">{activePlayer.name.charAt(0)}</div>
            <div>
              <div className="active-name">{activePlayer.name}</div>
              <div className="active-prompt">Your turn — handle that objection!</div>
            </div>
          </div>

          {/* Live transcript — appears word by word while recording */}
          {isRecording && (
            <div className="transcript-box live">
              <div className="transcript-label">🎙️ LISTENING LIVE...</div>
              <div className="transcript-text">
                {liveTranscript || <span className="transcript-placeholder">Start speaking — your words will appear here...</span>}
              </div>
            </div>
          )}

          {/* Final transcript after stop — for review */}
          {(isTranscribing || (transcript && !isRecording)) && (
            <div className="transcript-box">
              <div className="transcript-label">
                {isTranscribing ? "⏳ TRANSCRIBING..." : "📝 REVIEW YOUR RESPONSE BEFORE SUBMITTING"}
              </div>
              {isTranscribing && (
                <div className="transcribing-dots"><span /><span /><span /></div>
              )}
              {transcript && !isTranscribing && (
                <div className="transcript-text">{transcript}</div>
              )}
            </div>
          )}

          <div className="mic-section">
            {/* State 1: Ready to record */}
            {!isRecording && !isTranscribing && !transcript && (
              <button className="btn-mic" onClick={startRecording} disabled={isSpeaking}>
                <span className="mic-icon">🎤</span>
                <span>START RECORDING</span>
              </button>
            )}

            {/* State 2: Currently recording */}
            {isRecording && (
              <button className="btn-mic recording" onClick={handleStopRecording}>
                <span className="mic-icon recording-pulse">⏺</span>
                <span>STOP RECORDING</span>
              </button>
            )}

            {/* State 3: Transcribing */}
            {isTranscribing && (
              <button className="btn-mic" disabled>
                <span className="mic-icon">⏳</span>
                <span>TRANSCRIBING...</span>
              </button>
            )}

            {/* State 4: Review — confirm or re-record */}
            {!isRecording && !isTranscribing && transcript && (
              <div className="review-actions">
                <button className="btn-rerecord" onClick={handleReRecord}>
                  🔄 RE-RECORD
                </button>
                <button className="btn-submit" onClick={handleConfirmAndScore}>
                  ✅ SUBMIT TO REX
                </button>
              </div>
            )}

            {statusMsg && <div className="status-msg">{statusMsg}</div>}
          </div>
        </div>
      )}

      {/* ── SCORING ── */}
      {phase === PHASE.SCORING && (
        <div className="screen scoring-screen">
          <div className="scoring-anim">
            <div className="scoring-icon">🎭</div>
            <div className="scoring-text">REX IS DELIBERATING...</div>
            <div className="scoring-dots"><span /><span /><span /></div>
          </div>
        </div>
      )}

      {/* ── SCORE REVEAL ── */}
      {phase === PHASE.SCORE_REVEAL && scoreData && activePlayer && (
        <div className="screen reveal-screen">
          <div className="reveal-player">
            <div className="reveal-avatar">{activePlayer.name.charAt(0)}</div>
            <div className="reveal-name">{activePlayer.name}</div>
          </div>

          <div className="rex-says roast">
            <div className="rex-badge">🎭 REX SAYS</div>
            <div className="rex-text">{scoreData.roast}</div>
          </div>

          <div className="score-reveal-number">
            <div className="score-line">{scoreData.scoreLine}</div>
            <ScoreBar score={scoreData.score} animated />
          </div>

          <div className="rex-says coaching">
            <div className="rex-badge coaching-badge">💡 COACHING</div>
            <div className="rex-text">{scoreData.coaching}</div>
          </div>

          {isSpeaking && (
            <>
              <div className="speaking-wave small">
                <span /><span /><span /><span /><span />
              </div>
              <button className="btn-skip" onClick={handleSkip}>⏭ SKIP</button>
            </>
          )}
        </div>
      )}

      {/* ── ROUND SUMMARY ── */}
      {phase === PHASE.ROUND_SUMMARY && (
        <div className="screen summary-screen">
          <h2 className="screen-title">ROUND {currentRound} RESULTS</h2>
          <div className="round-results">
            {currentRoundResults
              .sort((a, b) => b.score - a.score)
              .map((r, i) => (
                <div key={r.playerId} className="result-row" style={{ animationDelay: `${i * 0.15}s` }}>
                  <div className="result-rank">{["🥇", "🥈", "🥉"][i]}</div>
                  <div className="result-name">{r.playerName}</div>
                  <ScoreBar score={r.score} animated />
                </div>
              ))}
          </div>

          <div className="cumulative-scores">
            <div className="cumulative-title">TOTAL SCORES</div>
            {sortedPlayers.map((p, i) => (
              <div key={p.id} className="cumulative-row">
                <span className="cumulative-name">{p.name}</span>
                <span className="cumulative-score" style={{ color: ["#FFD700", "#C0C0C0", "#CD7F32"][i] }}>{p.score} pts</span>
              </div>
            ))}
          </div>

          {currentRound < 4 && (
            <button className="btn-primary" onClick={handleContinueToNextCategory} disabled={isSpeaking}>
              NEXT ROUND →
            </button>
          )}
        </div>
      )}

      {/* ── GAME OVER ── */}
      {phase === PHASE.GAME_OVER && winnerIndex !== null && (
        <div className="screen gameover-screen">
          <div className="champion-wrap">
            <div className="champion-crown">👑</div>
            <div className="champion-label">CHAMPION</div>
            <div className="champion-name">{players[winnerIndex].name}</div>
            <div className="champion-score">{scores[winnerIndex]} POINTS</div>
          </div>

          <div className="final-leaderboard">
            {sortedPlayers.map((p, i) => (
              <div key={p.id} className="final-row" style={{ animationDelay: `${i * 0.2}s` }}>
                <div className="final-rank" style={{ color: ["#FFD700", "#C0C0C0", "#CD7F32"][i] }}>
                  {["1ST", "2ND", "3RD"][i]}
                </div>
                <div className="final-name">{p.name}</div>
                <div className="final-score">{p.score} pts</div>
              </div>
            ))}
          </div>

          <button className="btn-primary" onClick={handlePlayAgain}>
            PLAY AGAIN 🔁
          </button>
        </div>
      )}
    </div>
  );
}

// ─── CSS ───────────────────────────────────────────────────────────────────────
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Red+Hat+Display:wght@400;700;900&family=DM+Sans:wght@300;400;500;700&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --gold: #c9a84c;
    --gold-light: #e8c97a;
    --red: #C8102E;
    --red-dark: #a00d24;
    --navy: #0B3279;
    --navy-dark: #071f4d;
    --navy-mid: #12317a;
    --cream: #f5f0e8;
    --dark: #060e1f;
    --dark2: #0a1630;
    --dark3: #0f1f42;
    --border: rgba(201,168,76,0.2);
    --text: #f5f0e8;
    --sub: rgba(245,240,232,0.55);
    --teal: #c9a84c;
    --orange: #C8102E;
  }

  html, body, #root { height: 100%; width: 100%; }

  .app {
    min-height: 100vh;
    background: var(--dark);
    background-image:
      radial-gradient(ellipse at 0% 0%, rgba(11,50,121,0.6) 0%, transparent 50%),
      radial-gradient(ellipse at 100% 100%, rgba(200,16,46,0.15) 0%, transparent 50%);
    color: var(--text);
    font-family: 'DM Sans', sans-serif;
    position: relative;
    overflow-x: hidden;
  }

  .screen {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 24px 20px;
    gap: 20px;
    animation: fadeIn 0.4s ease;
  }

  @keyframes fadeIn { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: none; } }

  /* ── SPLASH ── */
  .splash-screen { position: relative; overflow: hidden; }
  .splash-bg {
    position: absolute; inset: 0;
    background:
      radial-gradient(ellipse at 50% -10%, rgba(201,168,76,0.18) 0%, transparent 55%),
      radial-gradient(ellipse at 10% 90%, rgba(11,50,121,0.4) 0%, transparent 50%),
      radial-gradient(ellipse at 90% 80%, rgba(200,16,46,0.12) 0%, transparent 40%);
  }
  /* ERA red top bar */
  .splash-screen::before {
    content: ''; position: absolute; top: 0; left: 0; right: 0;
    height: 6px; background: var(--red); z-index: 2;
  }
  /* ERA navy bottom bar */
  .splash-screen::after {
    content: ''; position: absolute; bottom: 0; left: 0; right: 0;
    height: 6px; background: var(--navy); z-index: 2;
  }
  .splash-content { position: relative; z-index: 1; display: flex; flex-direction: column; align-items: center; gap: 24px; }
  .era-logo {
    width: clamp(220px, 50vw, 400px);
    height: auto;
    object-fit: contain;
    opacity: 0.95;
    animation: fadeIn 0.8s ease;
    filter: drop-shadow(0 4px 24px rgba(200,16,46,0.25));
  }
  .logo-wrap { text-align: center; line-height: 1; }
  .logo-beat { font-family: 'Red Hat Display', sans-serif; font-weight: 900; font-size: clamp(72px, 18vw, 150px); color: var(--cream); letter-spacing: 6px; text-shadow: 0 0 60px rgba(201,168,76,0.3); }
  .logo-the { font-family: 'DM Sans', sans-serif; font-size: clamp(14px, 3vw, 22px); letter-spacing: 14px; color: var(--gold); text-transform: uppercase; margin: -4px 0; }
  .logo-bot { font-family: 'Red Hat Display', sans-serif; font-weight: 900; font-size: clamp(72px, 18vw, 150px); color: var(--red); letter-spacing: 6px; text-shadow: 0 0 60px rgba(200,16,46,0.4); }
  .logo-sub { font-size: 11px; letter-spacing: 4px; color: var(--sub); text-transform: uppercase; margin-top: 8px; }

  .rex-intro-card {
    background: rgba(11,50,121,0.4); border: 1px solid rgba(201,168,76,0.3);
    border-radius: 16px; padding: 18px 28px; text-align: center;
    display: flex; flex-direction: column; align-items: center; gap: 6px;
    backdrop-filter: blur(8px);
  }
  .rex-icon { font-size: 36px; }
  .rex-name { font-family: 'Red Hat Display', sans-serif; font-weight: 900; font-size: 26px; letter-spacing: 3px; color: var(--gold); }
  .rex-tagline { font-size: 13px; color: var(--sub); font-style: italic; }

  /* ── BUTTONS ── */
  .btn-primary {
    background: var(--red); color: #fff; font-family: 'Red Hat Display', sans-serif;
    font-weight: 900; font-size: 18px; letter-spacing: 3px; padding: 16px 48px;
    border: none; border-radius: 8px; cursor: pointer;
    transition: transform 0.15s, box-shadow 0.15s;
    box-shadow: 0 4px 24px rgba(200,16,46,0.4);
    text-transform: uppercase;
  }
  .btn-primary:hover:not(:disabled) { transform: translateY(-2px); background: var(--red-dark); box-shadow: 0 8px 32px rgba(200,16,46,0.5); }
  .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }

  /* ── REGISTER ── */
  .screen-title { font-family: 'Red Hat Display', sans-serif; font-weight: 900; font-size: clamp(28px, 7vw, 52px); letter-spacing: 3px; text-align: center; color: var(--cream); }
  .screen-sub { color: var(--gold); font-size: 12px; letter-spacing: 3px; text-transform: uppercase; text-align: center; opacity: 0.8; }

  .player-inputs { display: flex; flex-direction: column; gap: 12px; width: 100%; max-width: 400px; }
  .player-input-row { display: flex; align-items: center; gap: 12px; }
  .player-number {
    width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center;
    font-family: 'Red Hat Display', sans-serif; font-weight: 900; font-size: 18px; color: #000; flex-shrink: 0;
  }
  .name-input {
    flex: 1; background: var(--dark3); border: 1px solid var(--border); border-radius: 10px;
    color: var(--text); font-family: 'DM Sans', sans-serif; font-size: 16px; padding: 12px 16px;
    outline: none; transition: border-color 0.2s;
  }
  .name-input:focus { border-color: var(--gold); }

  .status-msg { color: var(--red); font-size: 13px; text-align: center; }

  /* ── CATEGORY SELECT ── */
  .pack-grid {
    display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
    gap: 14px; width: 100%; max-width: 700px;
  }
  .pack-tile {
    position: relative; background: var(--dark3); border: 2px solid var(--border);
    border-radius: 16px; padding: 20px 12px; cursor: pointer; text-align: center;
    transition: transform 0.2s, border-color 0.2s, box-shadow 0.2s;
    display: flex; flex-direction: column; align-items: center; gap: 8px;
  }
  .pack-tile:hover:not(.used):not(:disabled) {
    transform: translateY(-4px);
    border-color: var(--pack-color);
    box-shadow: 0 8px 24px rgba(0,0,0,0.4), 0 0 20px rgba(from var(--pack-color) r g b / 0.3);
  }
  .pack-tile.used { opacity: 0.35; cursor: not-allowed; }
  .pack-emoji { font-size: 32px; }
  .pack-tile-name { font-family: 'Red Hat Display', sans-serif; font-weight: 900; font-size: 16px; letter-spacing: 2px; color: var(--text); }
  .pack-used-badge { font-size: 10px; letter-spacing: 2px; color: var(--sub); }

  /* ── SCOREBOARD MINI ── */
  .scoreboard-mini {
    display: flex; gap: 10px; flex-wrap: wrap; justify-content: center;
    width: 100%; max-width: 500px;
  }
  .player-card {
    position: relative; background: var(--dark3); border: 1px solid var(--border);
    border-radius: 12px; padding: 12px 16px; text-align: center;
    flex: 1; min-width: 90px; transition: border-color 0.3s;
  }
  .player-card.active { border-color: var(--gold); box-shadow: 0 0 16px rgba(255,215,0,0.3); }
  .player-card.winner { border-color: var(--gold); }
  .winner-crown { position: absolute; top: -12px; left: 50%; transform: translateX(-50%); font-size: 20px; }
  .player-rank { font-size: 11px; color: var(--sub); margin-bottom: 4px; }
  .player-avatar {
    width: 36px; height: 36px; border-radius: 50%; background: var(--dark2);
    display: flex; align-items: center; justify-content: center;
    font-family: 'Red Hat Display', sans-serif; font-weight: 900; font-size: 20px; margin: 0 auto 6px;
    border: 1px solid var(--border);
  }
  .player-name { font-size: 12px; color: var(--sub); }
  .player-total { font-family: 'Red Hat Display', sans-serif; font-weight: 900; font-size: 22px; color: var(--gold); }

  /* ── SOUND CHECK ── */
  .sound-check-screen { gap: 20px; justify-content: flex-start; padding-top: 40px; }

  .splash-buttons { display: flex; flex-direction: column; align-items: center; gap: 12px; }
  .btn-sound-check {
    background: transparent; border: 1px solid rgba(255,255,255,0.25); border-radius: 10px;
    color: rgba(255,255,255,0.6); font-family: 'DM Sans', sans-serif;
    font-size: 14px; letter-spacing: 2px; padding: 10px 28px; cursor: pointer;
    transition: all 0.2s; text-transform: uppercase;
  }
  .btn-sound-check:hover { border-color: var(--teal); color: var(--teal); background: rgba(78,205,196,0.05); }

  .sc-card {
    background: var(--dark3); border: 1px solid var(--border); border-radius: 16px;
    padding: 20px 24px; width: 100%; max-width: 520px;
    display: flex; flex-direction: column; gap: 14px;
  }
  .sc-card-header { display: flex; align-items: flex-start; gap: 14px; }
  .sc-icon { font-size: 32px; flex-shrink: 0; }
  .sc-title { font-family: 'Red Hat Display', sans-serif; font-weight: 900; font-size: 20px; letter-spacing: 3px; color: var(--text); }
  .sc-desc { font-size: 13px; color: var(--sub); line-height: 1.5; margin-top: 3px; }
  .sc-badge {
    margin-left: auto; flex-shrink: 0; font-family: 'Red Hat Display', sans-serif; font-weight: 900;
    font-size: 14px; letter-spacing: 2px; padding: 4px 12px; border-radius: 20px;
  }
  .sc-badge.pass { background: rgba(78,205,196,0.15); color: var(--teal); border: 1px solid var(--teal); }
  .sc-badge.fail { background: rgba(255,107,107,0.15); color: var(--red); border: 1px solid var(--red); }

  .sc-status {
    font-size: 13px; padding: 10px 14px; border-radius: 10px;
    display: flex; align-items: center; gap: 10px;
  }
  .sc-status.playing { background: rgba(255,215,0,0.08); color: var(--gold); }
  .sc-status.recording { background: rgba(255,107,107,0.08); color: var(--red); font-weight: 600; }
  .sc-status.pass { background: rgba(78,205,196,0.08); color: var(--teal); }
  .sc-status.fail { background: rgba(255,107,107,0.08); color: var(--red); }

  .sc-transcript {
    background: var(--dark2); border: 1px solid var(--border); border-radius: 10px;
    padding: 12px 16px; border-left: 3px solid var(--teal);
  }
  .sc-transcript-label { font-size: 10px; letter-spacing: 3px; color: var(--teal); margin-bottom: 6px; font-weight: 700; }
  .sc-transcript-text { font-size: 15px; color: var(--text); line-height: 1.5; font-style: italic; }

  .sc-actions { display: flex; gap: 10px; }
  .btn-sc-test {
    background: var(--dark2); border: 1px solid var(--border); border-radius: 10px;
    color: var(--text); font-family: 'Red Hat Display', sans-serif; font-weight: 900; font-size: 15px;
    letter-spacing: 2px; padding: 12px 24px; cursor: pointer; transition: all 0.2s;
  }
  .btn-sc-test:hover:not(:disabled) { border-color: var(--gold); color: var(--gold); background: rgba(255,215,0,0.05); }
  .btn-sc-test:disabled { opacity: 0.4; cursor: not-allowed; }
  .btn-sc-test.recording { border-color: var(--red); color: var(--red); animation: pulse-border 1s infinite; }

  /* ── PLAYER HANDOFF ── */
  .handoff-screen { gap: 28px; }
  .handoff-thanks {
    text-align: center; background: var(--dark3);
    border: 1px solid var(--border); border-radius: 20px;
    padding: 28px 40px; width: 100%; max-width: 460px;
    border-top: 3px solid var(--teal);
  }
  .handoff-thanks-label { font-size: 11px; letter-spacing: 4px; color: var(--teal); text-transform: uppercase; margin-bottom: 8px; }
  .handoff-thanks-name { font-family: 'Red Hat Display', sans-serif; font-weight: 900; font-size: clamp(36px, 9vw, 64px); color: var(--text); letter-spacing: 3px; }
  .handoff-thanks-sub { font-size: 13px; color: var(--sub); margin-top: 8px; }
  .handoff-divider { display: flex; align-items: center; justify-content: center; }
  .handoff-arrow { font-size: 24px; color: var(--sub); animation: bounce 1s infinite; }
  .handoff-next {
    text-align: center; background: rgba(255,215,0,0.05);
    border: 2px solid var(--gold); border-radius: 20px;
    padding: 28px 40px; width: 100%; max-width: 460px;
  }
  .handoff-next-label { font-size: 11px; letter-spacing: 4px; color: var(--gold); text-transform: uppercase; margin-bottom: 12px; }
  .handoff-next-avatar {
    width: 72px; height: 72px; border-radius: 50%; background: var(--gold);
    display: flex; align-items: center; justify-content: center;
    font-family: 'Red Hat Display', sans-serif; font-weight: 900; font-size: 40px; color: #000;
    margin: 0 auto 12px;
  }
  .handoff-next-name { font-family: 'Red Hat Display', sans-serif; font-weight: 900; font-size: clamp(36px, 9vw, 64px); color: var(--gold); letter-spacing: 3px; }
  .handoff-next-sub { font-size: 13px; color: var(--sub); margin-top: 8px; }

  /* ── LIVE TRANSCRIPT ── */
  .transcript-box.live { border-left-color: var(--red); animation: pulse-border 2s infinite; }
  .transcript-placeholder { color: var(--sub); font-style: italic; font-size: 14px; }

  /* ── SKIP BUTTON ── */
  .btn-skip {
    background: transparent;
    border: 1px solid rgba(255,255,255,0.2);
    border-radius: 20px;
    color: rgba(255,255,255,0.4);
    font-family: 'DM Sans', sans-serif;
    font-size: 12px;
    letter-spacing: 2px;
    padding: 8px 20px;
    cursor: pointer;
    transition: all 0.2s;
    text-transform: uppercase;
  }
  .btn-skip:hover {
    border-color: rgba(255,255,255,0.5);
    color: rgba(255,255,255,0.8);
    background: rgba(255,255,255,0.05);
  }

  /* ── SPEAKING ── */
  .speaking-screen { gap: 24px; }
  .speaking-icon { font-size: 64px; animation: bounce 1s infinite; }
  @keyframes bounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
  .speaking-label { font-family: 'Red Hat Display', sans-serif; font-weight: 900; font-size: 20px; letter-spacing: 4px; color: var(--sub); }
  .pack-badge {
    padding: 6px 16px; border-radius: 20px; font-size: 13px; font-weight: 600;
    color: #000; letter-spacing: 1px;
  }
  .objection-bubble {
    background: var(--dark3); border: 1px solid var(--border); border-radius: 16px;
    padding: 20px 24px; max-width: 560px; width: 100%;
  }
  .persona-tag { font-size: 12px; color: var(--sub); letter-spacing: 1px; margin-bottom: 10px; }
  .objection-text { font-size: 18px; line-height: 1.5; color: var(--text); font-style: italic; }
  .objection-bubble.small .objection-text { font-size: 15px; }

  .speaking-wave {
    display: flex; gap: 5px; align-items: center; justify-content: center;
    height: 32px;
  }
  .speaking-wave span {
    display: block; width: 5px; background: var(--gold); border-radius: 3px;
    animation: wave 1s ease-in-out infinite;
  }  .speaking-wave span:nth-child(1){height:8px;animation-delay:0s}
  .speaking-wave span:nth-child(2){height:20px;animation-delay:0.1s}
  .speaking-wave span:nth-child(3){height:32px;animation-delay:0.2s}
  .speaking-wave span:nth-child(4){height:20px;animation-delay:0.3s}
  .speaking-wave span:nth-child(5){height:8px;animation-delay:0.4s}
  .speaking-wave.small span { background: var(--teal); }
  @keyframes wave { 0%,100%{transform:scaleY(0.4)} 50%{transform:scaleY(1)} }

  /* ── RESPONSE ── */
  .response-screen { justify-content: flex-start; padding-top: 32px; }

  .mini-player {
    display: flex; align-items: center; gap: 8px; padding: 8px 12px;
    border-radius: 10px; border: 1px solid var(--border); flex: 1; min-width: 80px;
    transition: all 0.2s;
  }
  .mini-player.current { border-color: var(--gold); background: rgba(255,215,0,0.05); }
  .mini-player.done { opacity: 0.5; }
  .mini-avatar {
    width: 28px; height: 28px; border-radius: 50%; background: var(--dark2);
    display: flex; align-items: center; justify-content: center;
    font-family: 'Red Hat Display', sans-serif; font-weight: 900; font-size: 16px;
  }
  .mini-name { font-size: 12px; flex: 1; }
  .mini-check { color: var(--teal); font-size: 14px; }
  .mini-arrow { color: var(--gold); font-size: 12px; }

  .active-player-banner {
    display: flex; align-items: center; gap: 14px;
    background: rgba(255,215,0,0.05); border: 1px solid rgba(255,215,0,0.3);
    border-radius: 14px; padding: 14px 20px; width: 100%; max-width: 480px;
  }
  .active-avatar {
    width: 48px; height: 48px; border-radius: 50%; background: var(--gold);
    display: flex; align-items: center; justify-content: center;
    font-family: 'Red Hat Display', sans-serif; font-weight: 900; font-size: 26px; color: #000; flex-shrink: 0;
  }
  .active-name { font-family: 'Red Hat Display', sans-serif; font-weight: 900; font-size: 24px; letter-spacing: 2px; }
  .active-prompt { font-size: 13px; color: var(--sub); }

  .transcript-box {
    background: var(--dark3); border: 1px solid var(--border); border-radius: 12px;
    padding: 14px 18px; width: 100%; max-width: 480px;
    border-left: 3px solid var(--teal);
  }
  .transcript-label { font-size: 11px; letter-spacing: 2px; color: var(--teal); margin-bottom: 8px; font-weight: 700; }
  .transcript-text { font-size: 15px; line-height: 1.6; color: var(--text); }

  .transcribing-dots { display: flex; gap: 6px; padding: 8px 0; }
  .transcribing-dots span {
    width: 8px; height: 8px; border-radius: 50%; background: var(--teal);
    animation: dot-pulse 1.2s infinite;
  }
  .transcribing-dots span:nth-child(2){animation-delay:0.2s}
  .transcribing-dots span:nth-child(3){animation-delay:0.4s}

  .review-actions {
    display: flex; gap: 12px; align-items: center; justify-content: center;
    flex-wrap: wrap;
  }
  .btn-rerecord {
    background: transparent; border: 2px solid var(--red); border-radius: 40px;
    color: var(--red); padding: 14px 28px; cursor: pointer;
    font-family: 'Red Hat Display', sans-serif; font-weight: 900; font-size: 16px; letter-spacing: 2px;
    transition: all 0.2s;
  }
  .btn-rerecord:hover { background: rgba(255,107,107,0.1); }

  .btn-submit {
    background: var(--red); border: none; border-radius: 8px;
    color: #fff; padding: 14px 32px; cursor: pointer;
    font-family: 'Red Hat Display', sans-serif; font-weight: 900; font-size: 16px; letter-spacing: 2px;
    transition: all 0.2s; box-shadow: 0 4px 20px rgba(200,16,46,0.35);
    text-transform: uppercase;
  }
  .btn-submit:hover { transform: translateY(-2px); background: var(--red-dark); box-shadow: 0 8px 28px rgba(200,16,46,0.5); }

  .mic-section { display: flex; flex-direction: column; align-items: center; gap: 12px; width: 100%; }
  .btn-mic {
    display: flex; align-items: center; gap: 12px;
    background: var(--dark3); border: 2px solid var(--gold); border-radius: 60px;
    color: var(--text); padding: 16px 36px; cursor: pointer;
    font-family: 'Red Hat Display', sans-serif; font-weight: 900; font-size: 16px; letter-spacing: 3px;
    transition: all 0.2s; box-shadow: 0 0 20px rgba(201,168,76,0.15);
    text-transform: uppercase;
  }
  .btn-mic:hover:not(:disabled) { background: rgba(201,168,76,0.08); box-shadow: 0 0 30px rgba(201,168,76,0.3); }
  .btn-mic.recording { border-color: var(--red); box-shadow: 0 0 30px rgba(200,16,46,0.4); animation: pulse-border 1s infinite; }
  .mic-icon { font-size: 22px; }
  .recording-pulse { animation: rec-pulse 0.8s infinite; }
  @keyframes pulse-border { 0%,100%{box-shadow:0 0 20px rgba(255,107,107,0.3)} 50%{box-shadow:0 0 40px rgba(255,107,107,0.7)} }
  @keyframes rec-pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }

  /* ── SCORING ── */
  .scoring-anim { display: flex; flex-direction: column; align-items: center; gap: 20px; }
  .scoring-icon { font-size: 80px; animation: spin 2s linear infinite; }
  @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
  .scoring-text { font-family: 'Red Hat Display', sans-serif; font-weight: 900; font-size: 28px; letter-spacing: 4px; color: var(--gold); }
  .scoring-dots { display: flex; gap: 8px; }
  .scoring-dots span {
    width: 10px; height: 10px; border-radius: 50%; background: var(--gold);
    animation: dot-pulse 1.2s infinite;
  }
  .scoring-dots span:nth-child(2){animation-delay:0.2s}
  .scoring-dots span:nth-child(3){animation-delay:0.4s}
  @keyframes dot-pulse { 0%,80%,100%{transform:scale(0.6);opacity:0.3} 40%{transform:scale(1);opacity:1} }

  /* ── SCORE REVEAL ── */
  .reveal-screen { gap: 18px; }
  .reveal-player { display: flex; align-items: center; gap: 12px; }
  .reveal-avatar {
    width: 56px; height: 56px; border-radius: 50%; background: var(--gold);
    display: flex; align-items: center; justify-content: center;
    font-family: 'Red Hat Display', sans-serif; font-weight: 900; font-size: 30px; color: #000;
  }
  .reveal-name { font-family: 'Red Hat Display', sans-serif; font-weight: 900; font-size: 32px; letter-spacing: 3px; }

  .rex-says {
    background: var(--dark3); border-radius: 16px; padding: 18px 22px;
    max-width: 540px; width: 100%; border-left: 4px solid var(--red);
  }
  .rex-says.coaching { border-left-color: var(--teal); }
  .rex-badge {
    font-size: 11px; letter-spacing: 3px; color: var(--red); text-transform: uppercase;
    margin-bottom: 8px; font-weight: 700;
  }
  .coaching-badge { color: var(--teal); }
  .rex-text { font-size: 15px; line-height: 1.6; }

  .score-reveal-number { text-align: center; width: 100%; max-width: 400px; }
  .score-line { font-family: 'Red Hat Display', sans-serif; font-weight: 900; font-size: 26px; letter-spacing: 3px; color: var(--gold); margin-bottom: 12px; }

  .score-bar-wrap { display: flex; align-items: center; gap: 12px; }
  .score-bar-track { flex: 1; height: 12px; background: var(--dark3); border-radius: 6px; overflow: hidden; }
  .score-bar-fill { height: 100%; border-radius: 6px; }
  .score-bar-label { font-family: 'Red Hat Display', sans-serif; font-weight: 900; font-size: 22px; min-width: 52px; text-align: right; }

  /* ── ROUND SUMMARY ── */
  .round-results { display: flex; flex-direction: column; gap: 12px; width: 100%; max-width: 480px; }
  .result-row {
    display: flex; align-items: center; gap: 14px;
    background: var(--dark3); border-radius: 12px; padding: 14px 18px;
    animation: slideIn 0.4s ease both;
  }
  @keyframes slideIn { from{opacity:0;transform:translateX(-20px)} to{opacity:1;transform:none} }
  .result-rank { font-size: 24px; }
  .result-name { font-family: 'Red Hat Display', sans-serif; font-weight: 900; font-size: 20px; min-width: 100px; }

  .cumulative-scores {
    background: var(--dark3); border-radius: 14px; padding: 18px 22px;
    width: 100%; max-width: 480px; border: 1px solid var(--border);
  }
  .cumulative-title { font-family: 'Red Hat Display', sans-serif; font-weight: 900; font-size: 18px; letter-spacing: 3px; color: var(--sub); margin-bottom: 12px; }
  .cumulative-row { display: flex; justify-content: space-between; align-items: center; padding: 6px 0; border-bottom: 1px solid var(--border); }
  .cumulative-row:last-child { border-bottom: none; }
  .cumulative-name { font-size: 15px; }
  .cumulative-score { font-family: 'Red Hat Display', sans-serif; font-weight: 900; font-size: 24px; }

  /* ── GAME OVER ── */
  .gameover-screen { background: radial-gradient(ellipse at 50% 30%, rgba(201,168,76,0.1) 0%, transparent 60%), radial-gradient(ellipse at 20% 80%, rgba(200,16,46,0.1) 0%, transparent 40%); }
  .champion-wrap { text-align: center; margin-bottom: 12px; }
  .champion-crown { font-size: 64px; animation: bounce 1s infinite; }
  .champion-label { font-size: 13px; letter-spacing: 6px; color: var(--sub); text-transform: uppercase; margin: 8px 0; }
  .champion-name { font-family: 'Red Hat Display', sans-serif; font-weight: 900; font-size: clamp(48px, 12vw, 96px); color: var(--gold); letter-spacing: 4px; text-shadow: 0 0 40px rgba(255,215,0,0.6); }
  .champion-score { font-family: 'Red Hat Display', sans-serif; font-weight: 900; font-size: 28px; color: var(--teal); letter-spacing: 3px; }

  .final-leaderboard { display: flex; flex-direction: column; gap: 10px; width: 100%; max-width: 400px; }
  .final-row {
    display: flex; align-items: center; gap: 14px;
    background: var(--dark3); border-radius: 12px; padding: 14px 20px;
    animation: slideIn 0.4s ease both;
  }
  .final-rank { font-family: 'Red Hat Display', sans-serif; font-weight: 900; font-size: 18px; min-width: 40px; }
  .final-name { flex: 1; font-size: 16px; font-weight: 500; }
  .final-score { font-family: 'Red Hat Display', sans-serif; font-weight: 900; font-size: 24px; color: var(--gold); }

  /* ── PARTICLES ── */
  .particle {
    position: fixed; top: -20px; border-radius: 3px;
    animation: fall 2.5s ease-in forwards;
    z-index: 999; pointer-events: none;
  }
  @keyframes fall {
    0%{transform:translateY(0) rotate(0deg);opacity:1}
    100%{transform:translateY(100vh) rotate(720deg);opacity:0}
  }
`;
