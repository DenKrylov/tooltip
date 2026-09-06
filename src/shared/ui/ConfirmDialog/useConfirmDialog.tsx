import type { ReactNode } from 'react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { ConfirmDialog } from './ConfirmDialog'

export type ConfirmDialogParams = {
  title: ReactNode
  description?: ReactNode
  confirmText?: ReactNode
  cancelText?: ReactNode
}

type ConfirmDialogState = ConfirmDialogParams | null

export const useConfirmDialog = () => {
  const [options, setOptions] = useState<ConfirmDialogState>(null)
  const resolverRef = useRef<((confirmed: boolean) => void) | null>(null)

  const closeDialog = useCallback((result: boolean) => {
    resolverRef.current?.(result)
    resolverRef.current = null
    setOptions(null)
  }, [])

  const showConfirmDialog = useCallback((params: ConfirmDialogParams) => {
    return new Promise<boolean>((resolve) => {
      if (resolverRef.current) {
        resolverRef.current(false)
        resolverRef.current = null
      }

      resolverRef.current = resolve
      setOptions(params)
    })
  }, [])

  useEffect(() => {
    return () => {
      if (resolverRef.current) {
        resolverRef.current(false)
        resolverRef.current = null
      }
    }
  }, [])

  const dialogElement = useMemo(() => {
    if (!options) {
      return null
    }

    return (
      <ConfirmDialog
        cancelText={options.cancelText}
        confirmText={options.confirmText}
        description={options.description}
        onCancel={() => closeDialog(false)}
        onConfirm={() => closeDialog(true)}
        open
        title={options.title}
      />
    )
  }, [closeDialog, options])

  return {
    confirmDialogElement: dialogElement,
    isConfirmDialogOpen: Boolean(options),
    showConfirmDialog,
  }
}
