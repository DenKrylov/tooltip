import type { FC } from 'react'

import { HomePage } from '@/pages/home'

export type AppProps = Record<never, never>

export const App: FC<AppProps> = () => {
  return <HomePage />
}
