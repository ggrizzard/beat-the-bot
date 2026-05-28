import { useState } from 'react'
import s from './Setup.module.css'

export default function Setup({ onLaunch }) {
  const [key, setKey] = useState('')

  return (
    <div className={s.root}>
      <div className={s.card}>
        <div className={s.icon}>🎙️</div>
        <h1 className={s.title}>Beat The Bot</h1>
        <p className={s.sub}>
          AI-powered real estate objection training.<br />
          Enter your ElevenLabs API key for premium voice,<br />
          or leave blank to use browser speech (free).
        </p>
        <input
          className={s.input}
          type="password"
          placeholder="ElevenLabs API Key (optional)"
          value={key}
          onChange={(e) => setKey(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && onLaunch(key.trim())}
          autoFocus
        />
        <button className={s.btn} onClick={() => onLaunch(key.trim())}>
          Launch Game →
        </button>
        <p className={s.hint}>
          Get a free ElevenLabs key at{' '}
          <a href="https://elevenlabs.io" target="_blank" rel="noreferrer">elevenlabs.io</a>
        </p>
      </div>
    </div>
  )
}
