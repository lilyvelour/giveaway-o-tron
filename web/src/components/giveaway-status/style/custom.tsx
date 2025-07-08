/* eslint-disable @next/next/no-img-element */
import * as React from 'react'
import { StatusProps } from './shared'

export default function CustomStatus({ status, title, body, imageUrl }: StatusProps) {
  return (
    <div
      className={`flex flex-col justify-center items-center bg-transparent relative fill-mode-both text-white font-bold text-center ${
        status ? (status === 'start' ? 'animate-in fade-in' : '') : 'animate-out fade-out'
      }`}
    >
      {imageUrl ? <img src={imageUrl} className="h-56" /> : null}
      <div style={{ position: 'relative', top: '-14.4vh', left: '4vw' }}>
        <div className="text-6xl font-semibold my-3">{title}</div>
      </div>
      <div
        style={{
          position: 'relative',
          top: '-8vh',
          left: '1.6vw',
          maxWidth: '50vw',
          minHeight: '50vh',
          overflow: 'auto',
        }}
      >
        <div className="text-5xl font-semibold">{body}</div>
      </div>
    </div>
  )
}
