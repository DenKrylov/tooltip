import { useState } from 'react'

import { useConfirmDialog } from '@/shared/ui/ConfirmDialog'
import { Tooltip, TooltipPosition } from '@/shared/ui/Tooltip'
import { useTheme } from '@/shared/ui/theme'

import styles from './PortalShowcase.module.css'

const TITLE_TOOLTIP = "Портальный тултип"

export const PortalShowcase = () => {
  const { confirmDialogElement, showConfirmDialog } = useConfirmDialog()
  const { theme, toggleTheme } = useTheme()
  const [status, setStatus] = useState<string>('')

  const handleDelete = async () => {
    const confirmed = await showConfirmDialog({
      cancelText: 'Отмена',
      confirmText: 'Удалить',
      description: 'Это действие необратимо.',
      title: 'Удалить элемент?',
    })

    setStatus(confirmed ? 'Элемент удалён.' : 'Удаление отменено.')
  }

  return (
    <main className={styles.root}>
      <header className={styles.header}>
        <h1 className={styles.headline}>Portal Showcase</h1>
        <div className={styles.themeControls}>
          <span>Текущая тема: {theme === 'light' ? 'светлая' : 'тёмная'}</span>
          <button
            className={styles.themeToggle}
            onClick={toggleTheme}
            type="button"
          >
            Переключить тему
          </button>
        </div>
      </header>

      <div className={styles.content}>
        <section className={styles.card}>
          <h2 className={styles.cardTitle}>Tooltip</h2>
          <Tooltip
            content={TITLE_TOOLTIP}
            position={TooltipPosition.Top}
          >
            <button className={styles.infoButton} type="button">
              Top
            </button>
          </Tooltip>
          <Tooltip
            content={TITLE_TOOLTIP}
            position={TooltipPosition.Left}
          >
            <button className={styles.infoButton} type="button">
              Left
            </button>
          </Tooltip>
          <Tooltip
            content={TITLE_TOOLTIP}
            position={TooltipPosition.Right}
          >
            <button className={styles.infoButton} type="button">
              Right
            </button>
          </Tooltip>
          <Tooltip
            content={TITLE_TOOLTIP}
            position={TooltipPosition.Bottom}
          >
            <button className={styles.infoButton} type="button">
              Bottom
            </button>
          </Tooltip>
        </section>
        
        <section className={styles.card}>
          <h2 className={styles.cardTitle}>Confirm Dialog</h2>
          <button
            className={styles.deleteButton}
            onClick={handleDelete}
            type="button"
          >
            Удалить
          </button>
          {status && <p className={styles.status}>{status}</p>}
        </section>
      </div>

      {confirmDialogElement}
    </main>
  )
}
