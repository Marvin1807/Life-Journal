export type Subtitle = { start: number; end: number; text: string }

export type Job = {
  pid: number
  id: string
  startedAt: number
  videoSeconds: number
  rate: number
  out: string | null
  subs: Subtitle[]
}

export type Finished = { id: string; isOk: boolean; seconds: number; videoSeconds: number; out: string | null; at: number }

declare module 'claude-code' {
  interface PluginState {
    'render-monitor': { jobs: Job[]; finished: Finished | null; now: number; isHidden: boolean }
  }
}
