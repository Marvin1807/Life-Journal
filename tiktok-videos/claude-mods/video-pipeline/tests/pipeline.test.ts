import { expect, test } from 'claude-code/testing'

import { nextStep, parse, remuxArgs, renderScript, row } from '../hooks/pipeline'

const files = {
  id: 'schwerkraft-aus', name: 'Schwerkraft', seconds: 75, subtitles: 16,
  scene: 100, index: 100, soundJson: 110, soundWav: 120, render: 200, output: 210, isPosted: false,
}

test('a finished video waits only for posting', async () => {
  const v = row(files)
  expect([v.drehbuch, v.ton, v.render, v.fertig]).toEqual(['ok', 'ok', 'ok', 'ok'])
  expect(nextStep(v)).toBe('posten, dann /videos gepostet schwerkraft-aus')
})

test('an edit after the render marks the render and the output stale', async () => {
  const v = row({ ...files, scene: 300 })
  expect(v.render).toBe('veraltet')
  expect(nextStep(v)).toBe('/videos rendern schwerkraft-aus')
  expect(row({ ...files, soundJson: 130 }).ton).toBe('veraltet')
  expect(row({ ...files, render: null, output: null }).render).toBe('fehlt')
})

test('commands are parsed and ids that could break a shell are refused', async () => {
  expect(parse('')).toEqual({ kind: 'liste' })
  expect(parse('rendern sonne-weg trotzdem')).toEqual({ kind: 'rendern', id: 'sonne-weg', isForced: true })
  expect(parse('neu mond-weg sonne-weg')).toEqual({ kind: 'neu', id: 'mond-weg', template: 'sonne-weg' })
  expect(parse("ton x';rm -rf ~").kind).toBe('fehler')
  expect(parse('tanzen x').kind).toBe('fehler')
})

test('render and remux commands point at the right files', async () => {
  const script = renderScript('/r/hf', '/r/out', 'mond')
  expect(script).toContain('cd "/r/hf/videos/mond"')
  expect(script).toContain('render -o ../../renders/mond.mp4')
  expect(script).toContain('"/r/out/mond.mp4"')
  expect(script.includes("'")).toBe(false)
  expect(remuxArgs('a.mp4', 's.wav', 't.mp4').slice(-1)).toEqual(['t.mp4'])
})
