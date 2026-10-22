// Reine Prüflogik: liest scene.js, index.html und sound.json als Text und
// meldet Verstöße gegen die Regeln aus .claude/skills/was-waere-wenn/SKILL.md
// bzw. – bei Videos mit Sprecher (scene.js importiert ./words.js) – aus
// .claude/skills/gedankenexperimente/SKILL.md.

export type Level = 'fehler' | 'hinweis'
export type Finding = { level: Level; text: string }

export type Sources = {
  id: string
  scene: string | null
  index: string | null
  sound: string | null
  // true: sound.wav ist älter als sound.json; null: unbekannt
  isWavStale: boolean | null
  // Nur Gedankenexperimente: words.js (Sprecher-Zeiten) und ob voice.wav älter als sprecher.json ist
  words?: string | null
  isVoiceStale?: boolean | null
}

type Line = { t0: number; t1: number; text: string }
type Word = { w: string; t0: number; t1: number }
export type Narration = { duration: number; lines: Line[]; words: Word[] }

// words.js: "export default {…};" → Objekt
export const narration = (words: string): Narration | null => {
  const m = /export\s+default\s+(\{[\s\S]*\})\s*;?\s*$/.exec(words)
  if (!m?.[1]) return null
  try {
    return JSON.parse(m[1]) as Narration
  } catch {
    return null
  }
}

export const isNarrated = (scene: string): boolean => /from\s+["']\.\/words\.js["']/.test(scene)

export type Subtitle = { start: number; end: number; text: string }

// "npx -y hyperframes@0.8.154 render -o …" oder "npm run render"
export const isRenderCommand = (command: string): boolean =>
  /\bhyperframes(@[\w.-]+)?\s+render\b/.test(command) || /\bnpm\s+run\s+render\b/.test(command)

// Die Video-ID steht im Befehl (videos/<id>) oder im Arbeitsordner.
export const findVideoId = (command: string, cwd: string): string | null => {
  // "tiktok-videos/hyperframes" ist kein Video: vor "videos/" darf kein Buchstabe oder Bindestrich stehen
  const inCommand = /(?<![\w-])videos\/([a-z0-9][a-z0-9-]*)/i.exec(command)
  if (inCommand?.[1]) return inCommand[1]
  const inCwd = /\/videos\/([a-z0-9][a-z0-9-]*)\/?$/i.exec(cwd)
  return inCwd?.[1] ?? null
}

// Inhalt der eckigen Klammern nach `key: [` (oder `const KEY = [`).
export const block = (text: string, key: RegExp): string | null => {
  const m = key.exec(text)
  if (!m) return null
  let depth = 0
  const from = text.indexOf('[', m.index + m[0].length - 1)
  if (from < 0) return null
  for (let i = from; i < text.length; i++) {
    const c = text[i]
    if (c === '[') depth++
    else if (c === ']' && --depth === 0) return text.slice(from + 1, i)
  }
  return null
}

const strings = (text: string): string[] =>
  [...text.matchAll(/"((?:[^"\\]|\\.)*)"/g)].map(m => m[1] ?? '')

export const subtitles = (scene: string): Subtitle[] => {
  const body = block(scene, /subtitles:\s*\[/)
  if (body === null) return []
  return [...body.matchAll(/start:\s*([\d.]+)\s*,\s*end:\s*([\d.]+)\s*,\s*text:\s*"((?:[^"\\]|\\.)*)"/g)].map(m => ({
    start: Number(m[1]),
    end: Number(m[2]),
    text: m[3] ?? '',
  }))
}

export const endcardLines = (scene: string): string[] | null => {
  const at = scene.search(/endcard:\s*\{/)
  if (at < 0) return null
  const body = block(scene.slice(at), /lines:\s*\[/)
  return body === null ? null : strings(body)
}

// Orte der Reihe nach, aus `const SCENES = [{ name, set? }, …]`.
export const sceneSets = (scene: string): string[] => {
  const body = block(scene, /const\s+SCENES\s*=\s*\[/)
  if (body === null) return []
  return [...body.matchAll(/\{\s*name:\s*"([^"]+)"(?:\s*,\s*set:\s*"([^"]+)")?/g)].map(m => m[2] ?? m[1] ?? '')
}

// Ein Ort, der nach einem anderen Ort noch einmal vorkommt.
export const repeatedSets = (sets: readonly string[]): string[] => {
  const seen = new Set<string>()
  const again = new Set<string>()
  sets.forEach((set, i) => {
    if (i > 0 && sets[i - 1] === set) return
    if (seen.has(set)) again.add(set)
    seen.add(set)
  })
  return [...again]
}

export const compositionDuration = (index: string): number | null => {
  const m = /data-composition-id="[^"]+"[^>]*?data-duration="([\d.]+)"/.exec(index)
  return m ? Number(m[1]) : null
}

const FORBIDDEN = /卐|卍|hakenkreuz|swastika|ss-rune|ᛋᛋ|sieg heil|heil hitler|reichskriegsflagge/i

const fmt = (n: number): string => String(n).replace('.', ',')

// Regeln der Nische „Gedankenexperimente“ (Sprecher, Ein-Wort-Untertitel, Shots statt Orte)
export const checkNarrated = (s: Sources & { scene: string }): Finding[] => {
  const out: Finding[] = []
  const fehler = (text: string) => out.push({ level: 'fehler', text })
  const hinweis = (text: string) => out.push({ level: 'hinweis', text })

  if (s.index === null) fehler('index.html fehlt.')
  const duration = s.index === null ? null : compositionDuration(s.index)
  if (s.index !== null && duration === null) fehler('index.html: data-duration der Komposition nicht gefunden.')
  const sceneDuration = /const\s+DURATION\s*=\s*([\d.]+)/.exec(s.scene)
  if (duration !== null && sceneDuration && Number(sceneDuration[1]) !== duration) {
    fehler(`scene.js DURATION = ${sceneDuration[1]}, index.html data-duration = ${fmt(duration)}.`)
  }
  if (duration !== null && (duration < 55 || duration > 95)) hinweis(`Länge ${fmt(duration)} s – Regel: 60–90 s.`)

  // Sprecher
  const n = s.words ? narration(s.words) : null
  if (!s.words) fehler('words.js fehlt – tools/sprecher.py ausführen.')
  else if (!n) fehler('words.js ist nicht lesbar.')
  if (s.isVoiceStale === true) fehler('audio/voice.wav/words.js sind älter als sprecher.json – tools/sprecher.py neu ausführen.')
  if (n) {
    if (duration !== null && n.duration > duration + 0.05) fehler(`Sprecher (${fmt(n.duration)} s) ist länger als das Video (${fmt(duration)} s).`)
    const first = n.lines[0]
    if (first && first.t1 > 7.5) hinweis(`Hook-Satz endet erst bei ${fmt(first.t1)} s – Regel: These in den ersten ~7 s.`)
    const rate = n.words.length / Math.max(1, n.duration)
    if (rate < 2.2 || rate > 3.2) hinweis(`Sprechtempo ${rate.toFixed(2)} Wörter/s – Referenz ≈ 2,7.`)
    const long = n.words.filter(w => w.w.length > 18)
    if (long.length) hinweis(`Sehr lange Untertitel-Wörter: ${long.map(w => w.w).join(', ')}.`)
    if (duration !== null) {
      const shots = (s.scene.match(/\{\s*at:\s*/g) ?? []).length
      if (shots && duration / shots > 5.5) hinweis(`${shots} Shots in ${fmt(duration)} s (Ø ${(duration / shots).toFixed(1)} s) – Regel: alle 3–5 s ein neues Bild.`)
      if (!shots) hinweis('Keine Shots ({ at: … }) gefunden.')
    }
  }

  // Ton
  if (s.sound === null) fehler('audio/sound.json fehlt – jedes Video braucht Sounddesign.')
  else {
    let sound: { duration?: number; cues?: { type?: string; at?: number }[] } | null = null
    try {
      sound = JSON.parse(s.sound)
    } catch {
      fehler('audio/sound.json ist kein gültiges JSON.')
    }
    if (sound) {
      if (duration !== null && sound.duration !== duration) fehler(`sound.json duration = ${sound.duration ?? '–'} s, Video = ${fmt(duration)} s.`)
      const cues = sound.cues ?? []
      if (!cues.some(c => c.type === 'voice')) fehler('Ton: keine Sprecherspur (type "voice").')
      if (!cues.some(c => c.type === 'pad' || c.type === 'drone')) hinweis('Ton: kein Musikbett (pad/drone) unter der Stimme.')
      if (!cues.some(c => c.type === 'whoosh')) hinweis('Ton: keine Whooshes an den Schnitten.')
    }
  }
  if (s.isWavStale === true) fehler('audio/sound.wav ist älter als sound.json – tools/sounddesign.py neu ausführen.')

  const bad = FORBIDDEN.exec(s.scene)
  if (bad) fehler(`Verbotener Begriff/Symbol in scene.js: „${bad[0]}“.`)
  return out
}

export const check = (s: Sources): Finding[] => {
  if (s.scene !== null && isNarrated(s.scene)) return checkNarrated({ ...s, scene: s.scene })
  const out: Finding[] = []
  const fehler = (text: string) => out.push({ level: 'fehler', text })
  const hinweis = (text: string) => out.push({ level: 'hinweis', text })

  if (s.scene === null) {
    fehler('scene.js fehlt.')
    return out
  }
  if (s.index === null) fehler('index.html fehlt.')

  // Länge
  const duration = s.index === null ? null : compositionDuration(s.index)
  if (s.index !== null && duration === null) fehler('index.html: data-duration der Komposition nicht gefunden.')
  if (duration !== null && (duration < 60 || duration > 80)) {
    hinweis(`Länge ${fmt(duration)} s – Regel: 60–80 s (Standard 75 s), damit die Story drei Akte hat.`)
  }
  const sceneDuration = /const\s+DURATION\s*=\s*([\d.]+)/.exec(s.scene)
  if (duration !== null && sceneDuration && Number(sceneDuration[1]) !== duration) {
    fehler(`scene.js DURATION = ${sceneDuration[1]}, index.html data-duration = ${fmt(duration)}.`)
  }

  // Ton
  if (s.sound === null) {
    fehler('audio/sound.json fehlt – jedes Video braucht Sounddesign.')
  } else {
    let sound: { duration?: number; cues?: { type?: string; at?: number; dur?: number }[] } | null = null
    try {
      sound = JSON.parse(s.sound)
    } catch {
      fehler('audio/sound.json ist kein gültiges JSON.')
    }
    if (sound) {
      if (duration !== null && sound.duration !== duration) {
        fehler(`sound.json duration = ${sound.duration ?? '–'} s, Video = ${fmt(duration)} s.`)
      }
      const cues = sound.cues ?? []
      if (!cues.some(c => c.type === 'ambience')) hinweis('Ton: keine Orts-Atmo (type "ambience").')
      if (!cues.some(c => c.type === 'impact' || c.type === 'drop')) hinweis('Ton: kein Einschlag (impact/drop) für den Höhepunkt.')
      const late = cues.filter(c => duration !== null && (c.at ?? 0) >= duration)
      if (late.length) hinweis(`Ton: ${late.length} Cue(s) starten nach dem Videoende.`)
    }
  }
  if (s.isWavStale === true) fehler('audio/sound.wav ist älter als sound.json – tools/sounddesign.py neu ausführen.')

  // Titel
  const title = /title:\s*\{\s*text:\s*"([^"]+)"/.exec(s.scene)?.[1]
  if (!title) hinweis('Kein Titel gefunden.')
  else if (!/^Was wäre,? wenn/i.test(title) || !title.trim().endsWith('?')) {
    hinweis(`Titel „${title}“ – Regel: „Was wäre, wenn …?“.`)
  }

  // Untertitel
  const subs = subtitles(s.scene)
  if (subs.length === 0) fehler('Keine Untertitel gefunden.')
  else if (duration !== null && duration >= 60 && (subs.length < 14 || subs.length > 18)) {
    hinweis(`${subs.length} Untertitel – Regel bei ${fmt(duration)} s: 14–18.`)
  }
  subs.forEach((sub, i) => {
    const next = subs[i + 1]
    if (sub.end <= sub.start) fehler(`Untertitel ${i + 1} „${sub.text}“ endet vor seinem Start.`)
    if (next && next.start < sub.end) fehler(`Untertitel ${i + 1} und ${i + 2} überlappen (${fmt(sub.end)} s > ${fmt(next.start)} s).`)
    if (sub.text.length > 60) hinweis(`Untertitel ${i + 1} ist ${sub.text.length} Zeichen lang (max. ~60).`)
  })
  const hasEarlyNumber = /\d/.test(title ?? '') || subs.some(sub => sub.start <= 8 && /\d/.test(sub.text))
  if (subs.length && !hasEarlyNumber) {
    hinweis('Keine echte Zahl in den ersten 8 Sekunden (Hook-Regel).')
  }

  // Countdown und Höhepunkt
  if (!/countdown\(/.test(s.scene)) hinweis('Kein Countdown (countdown(…)) – er soll bis zum Höhepunkt laufen.')
  if (!/"HIER"/.test(s.scene)) hinweis('Kein „HIER“ im HUD – die letzte Messgröße läuft auf dich zu und endet mit HIER.')

  // Endkarte
  const lines = endcardLines(s.scene)
  if (lines === null) fehler('Keine Endkarte (endcard.lines).')
  else {
    if (!lines.some(line => line.includes('?'))) hinweis('Endkarte ohne Frage an die Zuschauer.')
    if (!lines.some(line => /\d/.test(line))) hinweis('Endkarte ohne echten Fakt mit Zahl.')
  }

  // Orte
  const again = repeatedSets(sceneSets(s.scene))
  if (again.length) fehler(`Ort wiederholt sich: ${again.join(', ')} – jeder Ort genau einmal.`)

  // Symbole
  const bad = FORBIDDEN.exec(s.scene)
  if (bad) fehler(`Verbotener Begriff/Symbol in scene.js: „${bad[0]}“.`)

  return out
}

export const format = (id: string, findings: readonly Finding[]): string => {
  if (findings.length === 0) return `Regel-Wächter: ${id} hält alle Regeln ein.`
  const lines = findings.map(f => `${f.level === 'fehler' ? '✖' : '•'} ${f.text}`)
  const errors = findings.filter(f => f.level === 'fehler').length
  return [`Regel-Wächter für videos/${id}: ${errors} Fehler, ${findings.length - errors} Hinweise`, ...lines].join('\n')
}
