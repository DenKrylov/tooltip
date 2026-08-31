import type { MouseEvent as ReactMouseEvent, ReactNode } from 'react'
import { useEffect, useMemo, useRef } from 'react'
import { createPortal } from 'react-dom'

import { useTheme } from '@/shared/ui/theme'

import styles from './ConfirmDialog.module.css'

export type ConfirmDialogProps = {
  open: boolean
  title: ReactNode
  description?: ReactNode
  confirmText?: ReactNode
  cancelText?: ReactNode
  onConfirm: () => void
  onCancel: () => void
}

export const ConfirmDialog = ({
  cancelText = 'Отмена',
  confirmText = 'Подтвердить',
  description,
  onCancel,
  onConfirm,
  open,
  title,
}: ConfirmDialogProps) => {
  const overlayRef = useRef<HTMLDivElement | null>(null)
  const confirmButtonRef = useRef<HTMLButtonElement | null>(null)
  const { theme } = useTheme()

  const dialogRoot = useMemo(() => {
    if (typeof document === 'undefined') {
      return null
    }

    return document.getElementById('dialog-root')
  }, [])

  useEffect(() => {
    if (!open) {
      return
    }

    const previouslyFocusedElement = document.activeElement as HTMLElement | null
    const button = confirmButtonRef.current

    button?.focus({ preventScroll: true })

    return () => {
      previouslyFocusedElement?.focus?.({ preventScroll: true })
    }
  }, [open])

  useEffect(() => {
    if (!open) {
      return
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onCancel()
      }
    }

    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [onCancel, open])

  if (!open || !dialogRoot) {
    return null
  }

  const handleBackdropClick = (event: ReactMouseEvent<HTMLDivElement>) => {
    if (event.target === overlayRef.current) {
      onCancel()
    }
  }

  return createPortal(
    <div
      aria-hidden={!open}
      className={styles.backdrop}
      onClick={handleBackdropClick}
      ref={overlayRef}
    >
      <div
        aria-modal="true"
        className={styles.dialog}
        data-theme={theme}
        role="dialog"
      >
        <h2 className={styles.title}>{title}</h2>
        {Boolean(description) && <p className={styles.description}>{description}</p>}
        <div className={styles.actions}>
          <button
            className={styles.cancelButton}
            onClick={onCancel}
            type="button"
          >
            {cancelText}
          </button>
          <button
            className={styles.confirmButton}
            onClick={onConfirm}
            ref={confirmButtonRef}
            type="button"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>,
    dialogRoot,
  )
}
