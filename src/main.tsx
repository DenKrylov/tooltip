import { createRoot } from 'react-dom/client'
import { AppRoot } from '@/app'

import '@/app/styles/index.css'

createRoot(document.getElementById('root')!).render(
  <AppRoot />,
)
