/* eslint-disable @next/next/no-img-element */
import * as React from 'react'
import { StatusProps } from './shared'

import Countdown, { zeroPad } from 'react-countdown'

const countDownRenderer = ({ minutes, seconds, completed }) => {
  if (completed) {
    // Render a complete state
    return <div className="text-6xl font-semibold animate-pulse">Giveaway closed!</div>
  } else {
    // Render a countdown
    return (
      <div className="text-6xl font-semibold animate-pulse" style={{ marginTop: '0.5em' }}>
        {zeroPad(minutes, 2)} : {zeroPad(seconds, 2)}
      </div>
    )
  }
}

const StableCountdown = React.memo(function StableCountdown({ value }: { value: number }) {
  return <Countdown renderer={countDownRenderer} date={value} />
})

export default function CustomStatus({ status, title, goalTs, body, imageUrl }: StatusProps) {
  return (
    <div
      className={`flex flex-col justify-center items-center bg-transparent relative fill-mode-both text-white font-bold text-center ${
        status ? (status === 'start' ? 'animate-in fade-in' : '') : 'animate-out fade-out'
      }`}
    >
      {imageUrl ? <img src={imageUrl} className="h-56" /> : null}
      <div style={{ position: 'relative', top: '-14vh', left: '3.25vw' }}>
        <div className="text-6xl font-semibold my-3">{title || ''}</div>
      </div>
      <div
        style={{
          position: 'relative',
          top: '-8vh',
          left: '1.6vw',
          maxWidth: '45vw',
          minHeight: '50vh',
          overflow: 'auto',
        }}
      >
        <div className="text-5xl font-semibold">{body || ''}</div>
        <StableCountdown value={Number(goalTs ?? 0)} />
      </div>
    </div>
  )
}
