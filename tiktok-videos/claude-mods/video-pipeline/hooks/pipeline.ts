// Reine Logik der Video-Pipeline: Status je Video und die Befehle von /videos.

import type { Step, VideoRow } from '../types'

export const HF = 'tiktok-videos/hyperframes'
export const OUTPUT = 'tiktok-videos/output'
export const HF_VERSION = '0.8.154'

// Änderungszeiten (ms) der Dateien eines Videos; null = Datei fehlt.
export type Files = {
  id: string
  name: string
  seconds: number | null
  subtitles: number
  scene: number | null
  index: number | null
  soundJson: number | null
  soundWav: number | null
  render: number | null
  output: number | null
  isPosted: boolean
}

const newer = (file: number | null, ...sources: (number | null)[]): Step =>
  file === null ? 'fehlt' : sources.some(s => s !== null && s > file) ? 'veraltet' : 'ok'

export const row = (f: Files): VideoRow => ({
  id: f.id,
  name: f.name,
  seconds: f.seconds,
  changedAt: Math.max(f.scene ?? 0, f.index ?? 0, f.soundJson ?? 0, f.render ?? 0),
  drehbuch: f.scene === null ? 'fehlt' : f.subtitles === 0 ? 'veraltet' : 'ok',
  ton: newer(f.soundWav, f.soundJson),
  render: newer(f.render, f.scene, f.index, f.soundWav),
  fertig: newer(f.output, f.render),
  isPosted: f.isPosted,
})

export const nextStep = (v: VideoRow): string => {
  if (v.drehbuch !== 'ok') return 'Drehbuch schreiben (scene.js, Untertitel)'
  if (v.ton !== 'ok') return `/videos ton ${v.id}`
  if (v.render !== 'ok') return `/videos rendern ${v.id}`
  if (v.fertig !== 'ok') return `/videos rendern ${v.id} (komprimieren fehlt)`
  if (!v.isPosted) return `posten, dann /videos gepostet ${v.id}`
  return 'fertig'
}

const MARK: Record<Step, string> = { ok: '✓', veraltet: '~', fehlt: '·' }

export const date = (ms: number): string => {
  if (ms <= 0) return '–'
  const d = new Date(ms)
  const two = (n: number) => String(n).padStart(2, '0')
  return `${two(d.getUTCDate())}.${two(d.getUTCMonth() + 1)}. ${two(d.getUTCHours())}:${two(d.getUTCMinutes())}`
}

export const cells = (v: VideoRow): string =>
  `Drehbuch ${MARK[v.drehbuch]}  Ton ${MARK[v.ton]}  gerendert ${MARK[v.render]}  fertig ${MARK[v.fertig]}  gepostet ${v.isPosted ? '✓' : '·'}`

export const table = (videos: readonly VideoRow[]): string =>
  videos.length === 0
    ? 'Keine Videos unter videos/.'
    : [
        ...videos.map(
          v =>
            `${v.id.padEnd(18)} ${String(v.seconds ?? '?').padStart(3)} s  ${date(v.changedAt).padEnd(12)}  ${cells(v)}\n${' '.repeat(19)}→ ${nextStep(v)}`,
        ),
        '',
        '✓ aktuell  ~ veraltet  · fehlt',
      ].join('\n')

export type Command =
  | { kind: 'liste' }
  | { kind: 'ton' | 'rendern' | 'gepostet' | 'nicht-gepostet'; id: string; isForced: boolean }
  | { kind: 'neu'; id: string; template: string | null }
  | { kind: 'fehler'; text: string }

const ID = /^[a-z0-9][a-z0-9-]{0,63}$/

export const USAGE = [
  '/videos                     Liste öffnen',
  '/videos ton <id>            sound.wav neu bauen und in die fertigen MP4s mischen',
  '/videos rendern <id>        im Hintergrund rendern und komprimieren (trotzdem: Regel-Fehler übergehen)',
  '/videos gepostet <id>       als gepostet markieren (nicht-gepostet <id> nimmt es zurück)',
  '/videos neu <id> [vorlage]  neuen Videoordner anlegen',
].join('\n')

export const parse = (args: string): Command => {
  const [verb = '', id = '', extra = ''] = args.trim().split(/\s+/)
  if (verb === '' || verb === 'liste') return { kind: 'liste' }
  if (!['ton', 'rendern', 'gepostet', 'nicht-gepostet', 'neu'].includes(verb)) {
    return { kind: 'fehler', text: `Unbekannt: ${verb}\n${USAGE}` }
  }
  if (!ID.test(id)) return { kind: 'fehler', text: `Bitte eine Video-ID angeben (a-z, 0-9, -).\n${USAGE}` }
  if (verb === 'neu') {
    if (extra !== '' && !ID.test(extra)) return { kind: 'fehler', text: `Ungültige Vorlage: ${extra}` }
    return { kind: 'neu', id, template: extra === '' ? null : extra }
  }
  return { kind: verb as 'ton' | 'rendern' | 'gepostet' | 'nicht-gepostet', id, isForced: extra === 'trotzdem' }
}

// Shell-Skript für den Hintergrund-Render: rendern, dann für TikTok komprimieren.
export const renderScript = (hf: string, output: string, id: string): string =>
  [
    `export HYPERFRAMES_BROWSER_PATH="$(find /opt/pw-browsers -name chrome-headless-shell -type f 2>/dev/null | head -1)"`,
    `cd "${hf}/videos/${id}"`,
    `npx -y hyperframes@${HF_VERSION} render -o ../../renders/${id}.mp4 --quiet`,
    `ffmpeg -y -loglevel error -i ../../renders/${id}.mp4 -c:v libx264 -preset slow -crf 20 -c:a aac -b:a 160k -movflags +faststart "${output}/${id}.mp4"`,
  ].join(' && ')

// Neue Tonspur in ein fertiges MP4 legen, Bild unverändert.
export const remuxArgs = (video: string, wav: string, tmp: string): string[] => [
  'ffmpeg', '-y', '-loglevel', 'error', '-i', video, '-i', wav,
  '-map', '0:v', '-map', '1:a', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-shortest', '-movflags', '+faststart', tmp,
]
