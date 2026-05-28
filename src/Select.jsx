import { PACKS } from './data'
import s from './Select.module.css'

export function PackSelect({ onBack, onSelect }) {
  return (
    <div className={s.page}>
      <div className={s.header}>
        <button className={s.backBtn} onClick={onBack}>← Back</button>
        <h2 className={s.pageTitle}>Choose Your Pack</h2>
      </div>
      <div className={s.packGrid}>
        {PACKS.map((pack) => (
          <div
            key={pack.id}
            className={s.packCard}
            onClick={() => onSelect(pack)}
            style={{ '--color': pack.color }}
          >
            <div className={s.packEmoji}>{pack.emoji}</div>
            <div className={s.packNum} style={{ color: pack.color }}>PACK {pack.id}</div>
            <div className={s.packName}>{pack.title}</div>
            <div className={s.packRounds}>3 rounds</div>
            <div className={s.packGlow} style={{ background: pack.color }} />
          </div>
        ))}
      </div>
    </div>
  )
}

export function RoundSelect({ pack, onBack, onSelect }) {
  return (
    <div className={s.page}>
      <div className={s.header}>
        <button className={s.backBtn} onClick={onBack}>← Back</button>
        <h2 className={s.pageTitle}>{pack.emoji} {pack.title}</h2>
      </div>
      <div className={s.roundList}>
        {pack.rounds.map((round) => (
          <div
            key={round.round}
            className={s.roundCard}
            onClick={() => onSelect(round)}
          >
            <div className={s.roundNum} style={{ color: pack.color }}>ROUND {round.round}</div>
            <div className={s.roundPersona}>🎭 {round.persona}</div>
            <div className={s.roundObjection}>"{round.objection.substring(0, 90)}..."</div>
            <div className={s.roundArrow} style={{ color: pack.color }}>▶</div>
          </div>
        ))}
      </div>
    </div>
  )
}
