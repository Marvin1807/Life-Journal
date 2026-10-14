export type Step = 'ok' | 'veraltet' | 'fehlt'

export type VideoRow = {
  id: string
  name: string
  seconds: number | null
  changedAt: number
  drehbuch: Step
  ton: Step
  render: Step
  fertig: Step
  isPosted: boolean
}

declare module 'claude-code' {
  interface PluginState {
    'video-pipeline': { videos: VideoRow[]; busy: string | null; lastMessage: string | null }
  }
}
