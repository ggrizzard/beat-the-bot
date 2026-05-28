import { useEffect, useRef } from 'react'
import s from './Result.module.css'

const CIRC = 2 * Math.PI * 54

function scoreColor(score) {
  if (score >= 8) return '#a8ff3e'
  if (score >= 6) return '#00d4ff'
  if (score >= 4) return '#ff6b35'
  return '#ff3e3e'
}

export default function Result({ pack, round, result, onRetry, onNextRound, onSwitchPack }) {
  const arcRef = useRef(null)
  const color = scoreColor(result.score)
  const hasNext = pack.rounds.find((r) => r.round === round.round + 1)

  useEffect(() => {
    const dash = (result.score / 10) * CIRC
    setTimeout(() => {
      if (arcRef.current) {
        arcRef.current.style.strokeDasharray = `${dash} ${CIRC - dash}`
        arcRef.current.style.stroke = color
        arcRef.current.style.filter = `drop-shadow(0 0 8px ${color})`
      }
    }, 150)
  }, [result.score, color])

  return (
    <div className={s.root}>
      <div className={s.inner}>
        <div className={s.completeLabel} style={{ color: pack.color }}>
          ROUND {round.round} COMPLETE
        </div>

        <svg width="130" height="130" viewBox="0 0 130 130">
          <circle cx="65" cy="65" r="54" fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="10" />
          <circle
            ref={arcRef}
            cx="65" cy="65" r="54"
            fill="none"
            stroke="#333"
            strokeWidth="10"
            strokeDasharray={`0 ${CIRC}`}
            strokeDashoffset={CIRC * 0.25}
            strokeLinecap="round"
            style={{ transition: 'stroke-dasharray 1s cubic-bezier(.4,0,.2,1), stroke 0.3s' }}
          />
          <text x="65" y="60" textAnchor="middle" fill="white" fontSize="28" fontWeight="800" fontFamily="DM Mono, monospace">
            {result.score}
          </text>
          <text x="65" y="78" textAnchor="middle" fill="rgba(255,255,255,0.45)" fontSize="11" fontFamily="DM Sans, sans-serif">
            /10
          </text>
        </svg>

        <div className={s.scoreLabel} style={{ color }}>{result.scoreLabel}</div>

        <div className={s.cards}>
          <div className={s.card}>
            <div className={s.cardTag} style={{ color: '#a8ff3e' }}>✓ WHAT WORKED</div>
            <p className={s.cardText}>{result.whatWorked}</p>
          </div>
          <div className={s.card}>
            <div className={s.cardTag} style={{ color: '#ff6b35' }}>↑ IMPROVE</div>
            <p className={s.cardText}>{result.improve}</p>
          </div>
          <div className={s.card} style={{ borderColor: `${pack.color}40` }}>
            <div className={s.cardTag} style={{ color: pack.color }}>💡 COACHING TIP</div>
            <p className={s.cardText}>{result.coachingTip}</p>
          </div>
        </div>

        {result.transcript && result.transcript !== '[Response recorded — scored on delivery]' && (
          <details className={s.transcript}>
            <summary>Your transcript</summary>
            <p>"{result.transcript}"</p>
          </details>
        )}

        <div className={s.actions}>
          <button
            className={s.btn}
            style={{ background: pack.color, color: '#0a0a0f' }}
            onClick={onRetry}
          >
            Retry Round
          </button>
          {hasNext && (
            <button
              className={s.btn}
              style={{ background: 'transparent', border: `1px solid ${pack.color}`, color: 'white' }}
              onClick={onNextRound}
            >
              Next Round →
            </button>
          )}
          <button
            className={s.btn}
            style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.7)' }}
            onClick={onSwitchPack}
          >
            Switch Pack
          </button>
        </div>
      </div>
    </div>
  )
}
