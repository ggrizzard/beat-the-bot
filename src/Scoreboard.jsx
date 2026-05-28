import s from './Scoreboard.module.css'

function scoreColor(score) {
  if (score >= 8) return '#a8ff3e'
  if (score >= 6) return '#00d4ff'
  if (score >= 4) return '#ff6b35'
  return '#ff3e3e'
}

export default function Scoreboard({ scores, onBack, onClear }) {
  const avg = scores.length
    ? (scores.reduce((sum, r) => sum + r.score, 0) / scores.length).toFixed(1)
    : '—'

  return (
    <div className={s.page}>
      <div className={s.header}>
        <button className={s.backBtn} onClick={onBack}>← Back</button>
        <h2 className={s.pageTitle}>Session Scores</h2>
      </div>

      <div className={s.avgWrap}>
        <div className={s.avgNum}>{avg}</div>
        <div className={s.avgLabel}>Session Average</div>
      </div>

      <div className={s.list}>
        {scores.length === 0 && (
          <p className={s.empty}>No rounds played yet. Get out there!</p>
        )}
        {scores.map((item, i) => {
          const color = scoreColor(item.score)
          return (
            <div key={i} className={s.row} style={{ borderColor: `${color}30` }}>
              <div>
                <div className={s.rowMeta}>{item.pack} · Round {item.round}</div>
                <div className={s.rowPersona}>{item.persona}</div>
              </div>
              <div className={s.rowRight}>
                <div className={s.rowScore} style={{ color }}>{item.score}</div>
                <div className={s.rowLabel} style={{ color }}>{item.label}</div>
              </div>
            </div>
          )
        })}
      </div>

      {scores.length > 0 && (
        <div className={s.clearWrap}>
          <button className={s.clearBtn} onClick={onClear}>Clear Session & Restart</button>
        </div>
      )}
    </div>
  )
}
