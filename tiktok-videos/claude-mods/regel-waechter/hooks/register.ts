import type { EngineInterface, Register } from 'claude-code'

import { check, findVideoId, format, isRenderCommand } from './rules'
import type { Sources } from './rules'

const HF = 'tiktok-videos/hyperframes'

const readOr = ($: EngineInterface, path: string): Promise<string | null> =>
  $.fs.read(path).then(text => (typeof text === 'string' ? text : null), () => null)

const mtime = ($: EngineInterface, path: string): Promise<number | null> =>
  $.fs.stat(path).then(stat => stat.mtimeMs, () => null)

export const load = async ($: EngineInterface, id: string): Promise<Sources> => {
  const dir = `${await $.session.root()}/${HF}/videos/${id}`
  const [scene, index, sound, json, wav] = await Promise.all([
    readOr($, `${dir}/scene.js`),
    readOr($, `${dir}/index.html`),
    readOr($, `${dir}/audio/sound.json`),
    mtime($, `${dir}/audio/sound.json`),
    mtime($, `${dir}/audio/sound.wav`),
  ])
  const isWavStale = json === null ? null : wav === null ? true : wav < json
  return { id, scene, index, sound, isWavStale }
}

export const register: Register = on => {
  // Ein Render, der wegen Fehlern gestoppt wurde, läuft beim zweiten Versuch durch.
  const warned = new Set<string>()

  on('session.start', async ($, e, next) => {
    await $.command.register({
      name: 'regeln',
      description: 'Prüft videos/<id> gegen die Was-wäre-wenn-Regeln (ohne ID: alle)',
    })
    return next(e)
  })

  on('command.run', { command: 'regeln' }, async ($, e) => {
    const asked = e.args.trim()
    const ids = asked
      ? [asked]
      : (await $.fs.list(`${await $.session.root()}/${HF}/videos`).catch(() => []))
          .filter(entry => entry.kind === 'dir')
          .map(entry => entry.name)
          .sort()
    if (ids.length === 0) return { text: 'Keine Videos unter videos/ gefunden.' }
    const reports = await Promise.all(ids.map(async id => format(id, check(await load($, id)))))
    return { text: reports.join('\n\n') }
  })

  on('tool.call', { tool: 'Bash' }, async ($, e, next) => {
    if (!isRenderCommand(e.command)) return next(e)
    const id = findVideoId(e.command, '') ?? findVideoId('', await $.session.cwd())
    if (id === null) return next(e)

    const sources = await load($, id)
    // Kein Videoordner (z. B. pgrep/grep-Muster, die "hyperframes render" nur erwähnen): nichts prüfen
    if (sources.scene === null && sources.index === null) return next(e)
    const findings = check(sources)
    const report = format(id, findings)
    const errors = findings.filter(f => f.level === 'fehler').length

    if (errors > 0 && !warned.has(id)) {
      warned.add(id)
      $.ui.toast(`Regel-Wächter: ${errors} Fehler in ${id}, Render gestoppt`)
      return { deny: `${report}\n\nBitte beheben. Wer trotzdem rendern will, führt denselben Befehl noch einmal aus.` }
    }
    warned.delete(id)
    if (findings.length > 0) $.ui.toast(`Regel-Wächter: ${findings.length} Hinweise zu ${id}`)

    const ran = await next(e)
    if (findings.length === 0 || ran.deny !== undefined) return ran
    return { ...ran, context: [...(ran.context ?? []), report] }
  }).catch(($, e, next) => next(e))
}
