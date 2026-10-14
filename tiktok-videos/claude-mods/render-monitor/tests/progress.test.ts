import { expect, test } from 'claude-code/testing'

import { bar, clock, nextRate, outputArg, parseRenders, progress, resolvePath, subtitleAt, subtitles } from '../hooks/progress'

const PGREP = `743 npm exec hyperframes@0.8.154 render -o ../../renders/a.mp4 --quiet
775 sh -c hyperframes render -o ../../renders/a.mp4 --quiet
776 node /root/.npm/_npx/240c/node_modules/.bin/hyperframes render -o ../../renders/a.mp4 --quiet
900 node /x/.bin/hyperframes lint`

test('only the CLI process of a render counts', async () => {
  expect(parseRenders(PGREP)).toEqual([{ pid: 776, args: '-o ../../renders/a.mp4 --quiet' }])
  expect(outputArg('-o ../../renders/a.mp4 --quiet')).toBe('../../renders/a.mp4')
  expect(resolvePath('/h/hf/videos/a', '../../renders/a.mp4')).toBe('/h/hf/renders/a.mp4')
})

test('progress is estimated from the render rate and never claims 100 %', async () => {
  const half = progress(825, 75, 22)
  expect(half.fraction).toBe(0.5)
  expect(half.remainingS).toBe(825)
  expect(half.videoAt).toBe(37.5)
  expect(progress(5000, 75, 22).fraction).toBe(0.99)
  expect(clock(1661)).toBe('27:41')
  expect(bar(0.5, 4)).toBe('██░░')
  expect(nextRate(22, 20)).toBe(21)
})

test('the subtitle on screen at a moment is the last one started', async () => {
  const subs = subtitles('{ start: 3.7, end: 7.8, text: "Alexanderplatz." },\n{ start: 8.0, end: 12.3, text: "In 12 Sekunden." }')
  expect(subtitleAt(subs, 1)).toBe(null)
  expect(subtitleAt(subs, 9)).toBe('In 12 Sekunden.')
})
