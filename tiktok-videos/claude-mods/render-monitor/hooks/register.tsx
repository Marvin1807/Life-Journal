import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register } from 'claude-code'

import type { Finished, Job } from '../types'
import {
  DEFAULT_RATE,
  bar,
  clock,
  compositionDuration,
  nextRate,
  outputArg,
  parseRenders,
  progress,
  resolvePath,
  subtitleAt,
  subtitles,
} from './progress'

const jobs = atom({ plugin: 'render-monitor', key: 'jobs' } as const, [])
const finished = atom({ plugin: 'render-monitor', key: 'finished' } as const, null)
const now = atom({ plugin: 'render-monitor', key: 'now' } as const, 0)
const isHidden = atom({ plugin: 'render-monitor', key: 'isHidden' } as const, false)

const POLL_MS = 3000
const SHOW_DONE_MS = 20 * 60 * 1000

const run = async ($: EngineInterface, argv: string[]): Promise<string> =>
  $.process.run(argv, { timeoutMs: 5000 }).then(r => r.stdout, () => '')

const readOr = ($: EngineInterface, path: string): Promise<string> =>
  $.fs.read(path).then(text => (typeof text === 'string' ? text : ''), () => '')

const storedRate = async ($: EngineInterface): Promise<number> => {
  const value = Number(await $.store.get('rate'))
  return Number.isFinite(value) && value > 0 ? value : DEFAULT_RATE
}

// Was zu einem laufenden Render-Prozess gehört: Ordner, Länge, Untertitel, Startzeit.
const describe = async ($: EngineInterface, pid: number, args: string, at: number): Promise<Job> => {
  const cwd = (await run($, ['readlink', `/proc/${pid}/cwd`])).trim()
  const elapsed = Number((await run($, ['ps', '-o', 'etimes=', '-p', String(pid)])).trim()) || 0
  const [index, scene, meta] = await Promise.all([
    readOr($, `${cwd}/index.html`),
    readOr($, `${cwd}/scene.js`),
    readOr($, `${cwd}/meta.json`),
  ])
  const metaId = /"id"\s*:\s*"([^"]+)"/.exec(meta)?.[1]
  const out = outputArg(args)
  return {
    pid,
    id: metaId ?? (cwd.split('/').pop() || `pid ${pid}`),
    startedAt: at - elapsed * 1000,
    videoSeconds: compositionDuration(index) ?? 30,
    rate: await storedRate($),
    out: out === null ? null : resolvePath(cwd, out),
    subs: subtitles(scene),
  }
}

const finish = async ($: EngineInterface, job: Job, at: number) => {
  const mtime = job.out === null ? null : await $.fs.stat(job.out).then(s => s.mtimeMs, () => null)
  const isOk = mtime !== null && mtime >= job.startedAt
  const seconds = (at - job.startedAt) / 1000
  if (isOk) await $.store.set('rate', nextRate(await storedRate($), seconds / job.videoSeconds))

  const done: Finished = { id: job.id, isOk, seconds, videoSeconds: job.videoSeconds, out: job.out, at }
  await update($, finished, () => done)
  await update($, isHidden, () => false)
  $.ui.toast(
    isOk
      ? `Render fertig: ${job.id} (${job.videoSeconds} s Video) in ${clock(seconds)} min`
      : `Render von ${job.id} beendet, aber keine neue Datei gefunden`,
  )
}

let isPolling = false

export const poll = async ($: EngineInterface) => {
  if (isPolling) return
  isPolling = true
  try {
    const at = await $.clock.now()
    const found = parseRenders(await run($, ['pgrep', '-af', 'hyperframes']))
    const known = await read($, jobs)
    const kept = known.filter(job => found.some(f => f.pid === job.pid))
    const added = await Promise.all(
      found.filter(f => !known.some(job => job.pid === f.pid)).map(f => describe($, f.pid, f.args, at)),
    )
    for (const job of known) if (!kept.includes(job)) await finish($, job, at)
    if (added.length > 0 || kept.length !== known.length) await update($, jobs, () => [...kept, ...added])
    if (kept.length + added.length > 0) await update($, now, () => at)
  } finally {
    isPolling = false
  }
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    const started = await next(e)
    void poll($)
    $.clock.every(POLL_MS, () => void poll($))
    return started
  })

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    if (e.props.hasSurvey) return next(e)
    const list = await read($, jobs)
    const done = await read($, finished)
    const at = await read($, now)
    const showDone = done !== null && !(await read($, isHidden)) && at - done.at < SHOW_DONE_MS
    if (list.length === 0 && !showDone) return next(e)

    const { Box, Button, Text } = $.ui.resolve(e)
    return (
      <Box flexDirection="column">
        {list.map(job => {
          const elapsed = Math.max(0, (at - job.startedAt) / 1000)
          const p = progress(elapsed, job.videoSeconds, job.rate)
          const line = subtitleAt(job.subs, p.videoAt)
          return (
            <Box key={`job-${job.pid}`} flexDirection="column">
              <Text>
                <Text color="claude">Rendert {job.id}</Text> {bar(p.fraction)} {Math.round(p.fraction * 100)} % ·{' '}
                {clock(elapsed)} von ~{clock(p.expectedS)} ·{' '}
                {p.remainingS > 0 ? `noch ~${Math.ceil(p.remainingS / 60)} min` : 'gleich fertig (Ton wird gemischt)'}
              </Text>
              <Text dimColor>
                {'  '}Stelle ≈ {clock(p.videoAt)} von {clock(job.videoSeconds)}
                {line === null ? '' : ` · „${line}“`}
              </Text>
            </Box>
          )
        })}
        {showDone && done !== null && (
          <Box key="done">
            <Text color={done.isOk ? 'success' : 'warning'}>
              {done.isOk
                ? `✓ ${done.out?.split('/').pop() ?? done.id} fertig · ${done.videoSeconds} s Video in ${clock(done.seconds)} min `
                : `! ${done.id}: Render beendet ohne neue Datei `}
            </Text>
            <Button key="hide" label="Ausblenden" onPress={() => update($, isHidden, () => true)} />
          </Box>
        )}
      </Box>
    )
  })
}
