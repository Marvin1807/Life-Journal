import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register } from 'claude-code'

import type { VideoRow } from '../types'
import { HF, OUTPUT, USAGE, cells, date, nextStep, parse, remuxArgs, renderScript, row, table } from './pipeline'

const PANE = 'video-pipeline'
const videos = atom({ plugin: 'video-pipeline', key: 'videos' } as const, [])
const busy = atom({ plugin: 'video-pipeline', key: 'busy' } as const, null)
const lastMessage = atom({ plugin: 'video-pipeline', key: 'lastMessage' } as const, null)

const mtime = ($: EngineInterface, path: string): Promise<number | null> =>
  $.fs.stat(path).then(s => s.mtimeMs, () => null)

const readOr = ($: EngineInterface, path: string): Promise<string> =>
  $.fs.read(path).then(text => (typeof text === 'string' ? text : ''), () => '')

const posted = async ($: EngineInterface): Promise<string[]> => {
  const value = await $.store.get('posted')
  return Array.isArray(value) ? value.filter((v): v is string => typeof v === 'string') : []
}

const paths = async ($: EngineInterface) => {
  const root = await $.session.root()
  return { hf: `${root}/${HF}`, output: `${root}/${OUTPUT}` }
}

export const scan = async ($: EngineInterface): Promise<VideoRow[]> => {
  const { hf, output } = await paths($)
  const [entries, outputs, done] = await Promise.all([
    $.fs.list(`${hf}/videos`).catch(() => []),
    $.fs.list(output).catch(() => []),
    posted($),
  ])
  const ids = entries.filter(e => e.kind === 'dir').map(e => e.name).sort()
  return Promise.all(
    ids.map(async id => {
      const dir = `${hf}/videos/${id}`
      const [meta, index, scene, sceneT, indexT, soundJson, soundWav, render] = await Promise.all([
        readOr($, `${dir}/meta.json`),
        readOr($, `${dir}/index.html`),
        readOr($, `${dir}/scene.js`),
        mtime($, `${dir}/scene.js`),
        mtime($, `${dir}/index.html`),
        mtime($, `${dir}/audio/sound.json`),
        mtime($, `${dir}/audio/sound.wav`),
        mtime($, `${hf}/renders/${id}.mp4`),
      ])
      const mine = outputs.filter(o => o.name.startsWith(id) && o.name.endsWith('.mp4')).map(o => o.mtimeMs)
      const duration = /data-composition-id="[^"]+"[^>]*?data-duration="([\d.]+)"/.exec(index)?.[1]
      return row({
        id,
        name: /"name"\s*:\s*"([^"]+)"/.exec(meta)?.[1] ?? id,
        seconds: duration === undefined ? null : Number(duration),
        subtitles: [...scene.matchAll(/start:\s*[\d.]+\s*,\s*end:\s*[\d.]+\s*,\s*text:/g)].length,
        scene: sceneT,
        index: indexT,
        soundJson,
        soundWav,
        render,
        output: mine.length ? Math.max(...mine) : null,
        isPosted: done.includes(id),
      })
    }),
  )
}

const refresh = async ($: EngineInterface): Promise<VideoRow[]> => {
  const list = await scan($)
  const old = await read($, videos)
  if (JSON.stringify(old) !== JSON.stringify(list)) await update($, videos, () => list)
  return list
}

const sh = ($: EngineInterface, argv: string[], cwd?: string, timeoutMs = 600000) =>
  $.process.run(argv, { cwd, timeoutMs })

const ton = async ($: EngineInterface, id: string): Promise<string> => {
  const { hf, output } = await paths($)
  const json = `videos/${id}/audio/sound.json`
  const wav = `videos/${id}/audio/sound.wav`
  const built = await sh($, ['python3', 'tools/sounddesign.py', json, wav], hf)
  if (built.exitCode !== 0) return `Sounddesign fehlgeschlagen:\n${built.stderr.slice(-800)}`

  const done: string[] = []
  for (const video of [`${hf}/renders/${id}.mp4`, `${output}/${id}.mp4`]) {
    if ((await mtime($, video)) === null) continue
    const tmp = video.replace(/\.mp4$/, '.ton.mp4')
    const mixed = await sh($, remuxArgs(video, `${hf}/${wav}`, tmp))
    if (mixed.exitCode !== 0) return `Ton gebaut, aber Mischen in ${video} fehlgeschlagen:\n${mixed.stderr.slice(-500)}`
    await sh($, ['mv', '-f', tmp, video])
    done.push(video.split('/').slice(-2).join('/'))
  }
  return done.length
    ? `Ton für ${id} neu gebaut und eingemischt in: ${done.join(', ')}.`
    : `Ton für ${id} neu gebaut (${wav}). Noch kein gerendertes MP4 zum Einmischen.`
}

const rendern = async ($: EngineInterface, id: string, isForced: boolean): Promise<string> => {
  const { hf, output } = await paths($)
  if ((await mtime($, `${hf}/videos/${id}/index.html`)) === null) return `videos/${id} gibt es nicht.`
  const running = await sh($, ['pgrep', '-f', `render -o ../../renders/${id}.mp4`], undefined, 5000)
  if (running.exitCode === 0) return `${id} wird schon gerendert.`

  if (!isForced) {
    const report = await $.command.run({ command: 'regeln', args: id }).then(r => r.text ?? '', () => '')
    if (report.includes('✖')) return `${report}\n\nRender nicht gestartet. Fehler beheben oder: /videos rendern ${id} trotzdem`
  }

  const log = `${hf}/renders/${id}.log`
  const script = renderScript(hf, output, id)
  const started = await sh($, ['sh', '-c', `mkdir -p "${output}" && nohup setsid sh -c '${script}' > "${log}" 2>&1 &`], hf, 10000)
  if (started.exitCode !== 0) return `Render konnte nicht starten:\n${started.stderr}`
  return `Render von ${id} läuft im Hintergrund (Log: ${HF}/renders/${id}.log). Danach liegt das komprimierte Video in ${OUTPUT}/${id}.mp4.`
}

const markPosted = async ($: EngineInterface, id: string, isPosted: boolean): Promise<string> => {
  const list = (await posted($)).filter(v => v !== id)
  await $.store.set('posted', isPosted ? [...list, id] : list)
  return isPosted ? `${id} ist als gepostet markiert.` : `${id} ist nicht mehr als gepostet markiert.`
}

const neu = async ($: EngineInterface, id: string, template: string | null): Promise<string> => {
  const { hf } = await paths($)
  const made = await sh($, ['bash', 'tools/neues-video.sh', id, ...(template === null ? [] : [template])], hf, 30000)
  return (made.stdout + made.stderr).trim()
}

// Eine Aktion nach der anderen; das Ergebnis landet im Panel und als Toast.
const act = async ($: EngineInterface, label: string, work: () => Promise<string>): Promise<string> => {
  if ((await read($, busy)) !== null) return 'Es läuft schon eine Aktion, bitte kurz warten.'
  await update($, busy, () => label)
  try {
    const message = await work()
    await update($, lastMessage, () => message)
    $.ui.toast(message.split('\n')[0] ?? message)
    return message
  } finally {
    await update($, busy, () => null)
    await refresh($)
  }
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    await $.command.register({
      name: 'videos',
      description: 'Video-Pipeline: Liste aller Videos; ton/rendern/gepostet/neu <id>',
    })
    $.clock.every(20000, () => void refresh($))
    return next(e)
  })

  on('command.run', { command: 'videos' }, async ($, e) => {
    const cmd = parse(e.args)
    switch (cmd.kind) {
      case 'fehler':
        return { text: cmd.text }
      case 'liste': {
        const list = await refresh($)
        await $.ui.open({ id: PANE, title: 'Videos' })
        return { text: `${table(list)}\n\n${USAGE}` }
      }
      case 'ton':
        return { text: await act($, `Ton für ${cmd.id}`, () => ton($, cmd.id)) }
      case 'rendern':
        return { text: await act($, `Render ${cmd.id} starten`, () => rendern($, cmd.id, cmd.isForced)) }
      case 'gepostet':
      case 'nicht-gepostet':
        return { text: await act($, 'Markieren', () => markPosted($, cmd.id, cmd.kind === 'gepostet')) }
      case 'neu':
        return { text: await act($, `Neues Video ${cmd.id}`, () => neu($, cmd.id, cmd.template)) }
    }
  })

  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e) => {
    const { Box, Button, Text } = $.ui.resolve(e)
    const list = await read($, videos)
    const working = await read($, busy)
    const message = await read($, lastMessage)

    return (
      <Box flexDirection="column">
        <Box key="top">
          <Text weight="bold">{list.length} Videos </Text>
          <Button key="refresh" label="Aktualisieren" onPress={() => void refresh($)} />
        </Box>
        {list.map(v => (
          <Box key={`v-${v.id}`} flexDirection="column" marginTop={1}>
            <Text>
              <Text weight="bold">{v.id}</Text>
              <Text dimColor>
                {' '}· {v.seconds ?? '?'} s · {date(v.changedAt)}
              </Text>
            </Text>
            <Text>{cells(v)}</Text>
            <Text dimColor>→ {nextStep(v)}</Text>
            <Box key={`a-${v.id}`}>
              <Button key={`ton-${v.id}`} label="Ton neu" onPress={() => void act($, `Ton für ${v.id}`, () => ton($, v.id))} />
              <Text> </Text>
              <Button
                key={`render-${v.id}`}
                label="Rendern"
                onPress={() => void act($, `Render ${v.id} starten`, () => rendern($, v.id, false))}
              />
              <Text> </Text>
              <Button
                key={`post-${v.id}`}
                label={v.isPosted ? 'Nicht gepostet' : 'Gepostet'}
                onPress={() => void act($, 'Markieren', () => markPosted($, v.id, !v.isPosted))}
              />
            </Box>
          </Box>
        ))}
        {working !== null && <Text key="busy" color="claude">… {working}</Text>}
        {working === null && message !== null && <Text key="msg" dimColor>{message}</Text>}
        <Text key="legend" dimColor>✓ aktuell  ~ veraltet  · fehlt</Text>
      </Box>
    )
  })
}
