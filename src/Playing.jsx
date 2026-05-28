import { useEffect, useRef, useState } from 'react'
import { speak, transcribe, startRecording } from './voice'
import { scoreResponse } from './scoring'
import s from './Playing.module.css'

export default function Playing({ pack, round, apiKey, onResult, onError }) {
  const [phase, setPhase] = useState('intro') // intro | listening | processing
  const [botStatus, setBotStatus] = useState('Preparing objection...')
  const [isBotSpeaking, setIsBotSpeaking] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const mediaRecorderRef = useRef(null)
  const waveIntervalRef = useRef(null)

  useEffect(() => {
    runRound()
    return () => {
      if (waveIntervalRef.current) clearInterval(waveIntervalRef.current)
      if (mediaRecorderRef.current?.state === 'recording') mediaRecorderRef.current.stop()
    }
  }, [])

  async function runRound() {
    setIsBotSpeaking(true)
    setBotStatus(`🎭 ${round.persona} says...`)
    await speak(`Round ${round.round}. ${round.persona} says: ${round.objection}`, apiKey)
    setIsBotSpeaking(false)
    setBotStatus('🎤 Your turn — speak your response')
    setPhase('listening')
    beginRecording()
  }

  function beginRecording() {
    setIsRecording(true)
    startWaveAnimation()
    startRecording((blob) => {
      stopWaveAnimation()
      setIsRecording(false)
      setPhase('processing')
      setBotStatus('Analyzing your response...')
      handleBlob(blob)
    })
      .then((mr) => { mediaRecorderRef.current = mr })
      .catch(() => onError('Microphone access denied. Please allow mic access and try again.'))
  }

  async function handleStop() {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop()
    }
  }

  async function handleBlob(blob) {
    setBotStatus('Transcribing...')
    let agentText = await transcribe(blob, apiKey)
    if (!agentText) agentText = '[Response recorded — scored on delivery]'

    setBotStatus('Scoring with AI...')
    const result = await scoreResponse({
      agentText,
      objection: round.objection,
      objective: round.objective,
      benchmark: round.benchmark,
    })

    setBotStatus('Delivering feedback...')
    setIsBotSpeaking(true)
    await speak(result.spokenFeedback, apiKey)
    setIsBotSpeaking(false)

    onResult({ ...result, transcript: agentText })
  }

  function startWaveAnimation() {
    waveIntervalRef.current = setInterval(() => {
      document.querySelectorAll(`.${s.waveBar}`).forEach((bar) => {
        bar.style.height = Math.random() * 32 + 6 + 'px'
      })
    }, 110)
  }

  function stopWaveAnimation() {
    clearInterval(waveIntervalRef.current)
    document.querySelectorAll(`.${s.waveBar}`).forEach((bar) => { bar.style.height = '4px' })
  }

  return (
    <div className={s.root}>
      <div className={s.packLabel} style={{ color: pack.color }}>
        {pack.emoji} {pack.title.toUpperCase()} — ROUND {round.round}
      </div>

      <div
        className={`${s.botAvatar} ${isBotSpeaking ? s.speaking : ''}`}
        style={{ '--color': pack.color }}
      >
        🤖
      </div>

      <div className={s.botStatus}>{botStatus}</div>

      {(phase === 'intro' || phase === 'listening') && (
        <div className={s.objectionBox}>
          "{round.objection}"
        </div>
      )}

      {phase === 'listening' && (
        <>
          <div className={s.waveform}>
            {Array.from({ length: 20 }).map((_, i) => (
              <div
                key={i}
                className={s.waveBar}
                style={{ background: pack.color, animationDelay: `${i * 0.05}s` }}
              />
            ))}
          </div>
          <button
            className={s.doneBtn}
            style={{ background: pack.color }}
            onClick={handleStop}
          >
            Done Responding ✓
          </button>
          <p className={s.hint}>Speak your response, then tap Done</p>
        </>
      )}

      {phase === 'processing' && (
        <div className={s.dots}>
          <span>●</span><span>●</span><span>●</span>
        </div>
      )}
    </div>
  )
}
