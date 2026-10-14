// Reine Hilfsfunktionen des Render-Monitors.

import type { Subtitle } from '../types'

// Erfahrungswert: Sekunden Renderzeit pro Sekunde Video (75 s ≈ 28 min).
export const DEFAULT_RATE = 22

export type Found = { pid: number; args: string }

// Zeilen aus `pgrep -af hyperframes`: nur der eigentliche CLI-Prozess
// ("<pid> node …/hyperframes render …"), nicht npm exec oder sh -c.
export const parseRenders = (pgrep: string): Found[] =>
  pgrep
    .split('\n')
    .map(line => /^(\d+)\s+node\s+\S*hyperframes\S*\s+render\b(.*)$/.exec(line.trim()))
    .filter((m): m is RegExpExecArray => m !== null)
    .map(m => ({ pid: Number(m[1]), args: (m[2] ?? '').trim() }))

export const outputArg = (args: string): string | null => /(?:^|\s)(?:-o|--output)\s+(\S+)/.exec(args)?.[1] ?? null

// Pfad relativ zu `cwd` auflösen, `.` und `..` eingerechnet.
export const resolvePath = (cwd: string, path: string): string => {
  const parts = (path.startsWith('/') ? path : `${cwd}/${path}`).split('/')
  const out: string[] = []
  for (const part of parts) {
    if (part === '' || part === '.') continue
    if (part === '..') out.pop()
    else out.push(part)
  }
  return `/${out.join('/')}`
}

export const compositionDuration = (index: string): number | null => {
  const m = /data-composition-id="[^"]+"[^>]*?data-duration="([\d.]+)"/.exec(index)
  return m ? Number(m[1]) : null
}

export const subtitles = (scene: string): Subtitle[] =>
  [...scene.matchAll(/start:\s*([\d.]+)\s*,\s*end:\s*([\d.]+)\s*,\s*text:\s*"((?:[^"\\]|\\.)*)"/g)].map(m => ({
    start: Number(m[1]),
    end: Number(m[2]),
    text: m[3] ?? '',
  }))

export const subtitleAt = (subs: readonly Subtitle[], t: number): string | null => {
  let last: Subtitle | null = null
  for (const sub of subs) if (sub.start <= t) last = sub
  return last?.text ?? null
}

export type Progress = { fraction: number; expectedS: number; remainingS: number; videoAt: number }

export const progress = (elapsedS: number, videoS: number, rate: number): Progress => {
  const expectedS = Math.max(1, videoS * rate)
  const fraction = Math.min(0.99, Math.max(0, elapsedS / expectedS))
  return { fraction, expectedS, remainingS: Math.max(0, expectedS - elapsedS), videoAt: fraction * videoS }
}

export const clock = (seconds: number): string => {
  const s = Math.max(0, Math.round(seconds))
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

export const bar = (fraction: number, width = 20): string => {
  const full = Math.round(Math.min(1, Math.max(0, fraction)) * width)
  return '█'.repeat(full) + '░'.repeat(width - full)
}

// Gleitender Mittelwert, damit ein Ausreißer die Schätzung nicht kippt.
export const nextRate = (old: number, measured: number): number =>
  Math.round((old * 0.5 + measured * 0.5) * 10) / 10
