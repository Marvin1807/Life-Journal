import { expect, test } from 'claude-code/testing'

import { check, findVideoId, isRenderCommand, repeatedSets, sceneSets, subtitles } from '../hooks/rules'

const subs = (n: number) =>
  Array.from({ length: n }, (_, i) => `{ start: ${i * 4 + 0.5}, end: ${i * 4 + 3.5}, text: "Satz ${i === 1 ? 'mit 12 Sekunden' : i}" },`).join('\n')

const scene = (extra = '', count = 16) => `
const DURATION = 75;
const overlay = createOverlay(el, {
  title: { text: "Was wäre, wenn die Schwerkraft 5 Sekunden ausfällt?", start: 0, end: 3.5 },
  hud: [{ value: (t) => countdown(20 - t) }, { value: () => "HIER" }],
  subtitles: [
${subs(count)}
  ],
  endcard: { start: 70.5, end: DURATION, lines: [
    "Die Erde zieht dich mit 9,81 m/s² nach unten",
    "Was soll als Nächstes ausfallen?",
  ] },
});
const SCENES = [
  { name: "platz", start: 0, end: 20 },
  { name: "flug", set: "platz", start: 20, end: 50 },
  ${extra}
];`

const index = '<div id="root" data-composition-id="x" data-start="0" data-duration="75">'
const sound = JSON.stringify({ duration: 75, cues: [{ type: 'ambience', at: 0 }, { type: 'impact', at: 63 }] })
const ok = { id: 'x', scene: scene(), index, sound, isWavStale: false }

test('a video that keeps every rule has no findings', async () => {
  expect(check(ok)).toEqual([])
})

test('a location that comes back later is an error, a continuous shot is not', async () => {
  expect(sceneSets(ok.scene)).toEqual(['platz', 'platz'])
  expect(repeatedSets(['a', 'a', 'b'])).toEqual([])
  expect(repeatedSets(['a', 'b', 'a'])).toEqual(['a'])
  const findings = check({ ...ok, scene: scene('{ name: "keller" }, { name: "x", set: "platz" },') })
  expect(findings.some(f => f.level === 'fehler' && f.text.includes('platz'))).toBe(true)
})

test('too few subtitles, a stale sound and a duration mismatch are reported', async () => {
  const findings = check({
    ...ok,
    scene: scene('', 10),
    sound: JSON.stringify({ duration: 30, cues: [] }),
    isWavStale: true,
  })
  const texts = findings.map(f => f.text).join('\n')
  expect(subtitles(scene('', 10)).length).toBe(10)
  expect(texts).toContain('10 Untertitel')
  expect(texts).toContain('sound.json duration = 30')
  expect(texts).toContain('sound.wav ist älter')
})

test('an endcard without a question is a hint', async () => {
  const findings = check({ ...ok, scene: ok.scene.replace('Was soll als Nächstes ausfallen?', 'Folge für mehr') })
  expect(findings).toEqual([{ level: 'hinweis', text: 'Endkarte ohne Frage an die Zuschauer.' }])
})

test('render commands and video ids are recognised', async () => {
  expect(isRenderCommand('npx -y hyperframes@0.8.154 render -o ../../renders/a.mp4 --quiet')).toBe(true)
  expect(isRenderCommand('npx hyperframes lint')).toBe(false)
  expect(findVideoId('cd videos/sonne-weg && npx hyperframes render', '/x')).toBe('sonne-weg')
  expect(findVideoId('npx hyperframes render', '/r/tiktok-videos/hyperframes/videos/schwerkraft-aus')).toBe('schwerkraft-aus')
  expect(findVideoId('npx hyperframes render', '/r')).toBe(null)
  expect(findVideoId('cd /h/tiktok-videos/hyperframes && npx hyperframes render', '/r')).toBe(null)
  expect(findVideoId('cd /h/tiktok-videos/hyperframes/videos/mond && npx hyperframes render', '/r')).toBe('mond')
})
