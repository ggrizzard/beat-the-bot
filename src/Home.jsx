import s from './Home.module.css'

export default function Home({ onStart, onScoreboard, sessionCount }) {
  return (
    <div className={s.root}>
      <div className={s.badge}>🤖 REAL ESTATE TRAINING</div>
      <h1 className={s.title}>BEAT<br />THE BOT</h1>
      <p className={s.subtitle}>
        Face real objections. Respond under pressure.<br />
        Get scored by AI. Level up your game.
      </p>
      <div className={s.stats}>
        <div className={s.stat}><span className={s.statNum}>5</span><span className={s.statLabel}>PACKS</span></div>
        <div className={s.stat}><span className={s.statNum}>15</span><span className={s.statLabel}>ROUNDS</span></div>
        <div className={s.stat}><span className={s.statNum}>AI</span><span className={s.statLabel}>SCORING</span></div>
      </div>
      <button className={s.startBtn} onClick={onStart}>Start Training</button>
      {sessionCount > 0 && (
        <button className={s.ghostBtn} onClick={onScoreboard}>
          View Session Scores ({sessionCount})
        </button>
      )}
    </div>
  )
}
