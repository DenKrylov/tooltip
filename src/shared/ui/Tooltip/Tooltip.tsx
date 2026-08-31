import type { FocusEventHandler, MouseEventHandler, ReactNode } from 'react'
import { useCallback, useId, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

import { useTheme } from '@/shared/ui/theme'

import { TooltipPosition } from './TooltipPosition'
import type { TooltipPosition as TooltipPositionType } from './TooltipPosition'
import styles from './Tooltip.module.css'

type TooltipCoords = {
  left: number
  top: number
}

export type TooltipProps = {
  content: ReactNode
  children: ReactNode
  position?: TooltipPositionType
  offset?: number
}

const VIEWPORT_PADDING = 8

export const Tooltip = ({
  children,
  content,
  position = TooltipPosition.Top,
  offset = 12,
}: TooltipProps) => {
  const [isVisible, setIsVisible] = useState(false)
  const [coords, setCoords] = useState<TooltipCoords | null>(null)
  const triggerRef = useRef<HTMLSpanElement | null>(null)
  const tooltipRef = useRef<HTMLDivElement | null>(null)

  const tooltipId = useId()
  const { theme } = useTheme()

  const tooltipRoot = useMemo(() => {
    if (typeof document === 'undefined') {
      return null
    }

    return document.getElementById('tooltip-root')
  }, [])

  const calculatePosition = useCallback(() => {
    const triggerEl = triggerRef.current
    const tooltipEl = tooltipRef.current

    if (!triggerEl || !tooltipEl) {
      return
    }

    const triggerRect = triggerEl.getBoundingClientRect()
    const tooltipRect = tooltipEl.getBoundingClientRect()

    let top = triggerRect.top
    let left = triggerRect.left

    switch (position) {
      case TooltipPosition.Top:
        top = triggerRect.top - tooltipRect.height - offset
        left = triggerRect.left + (triggerRect.width - tooltipRect.width) / 2
        break

      case TooltipPosition.Bottom:
        top = triggerRect.bottom + offset
        left = triggerRect.left + (triggerRect.width - tooltipRect.width) / 2
        break

      case TooltipPosition.Left:
        top = triggerRect.top + (triggerRect.height - tooltipRect.height) / 2
        left = triggerRect.left - tooltipRect.width - offset
        break

      case TooltipPosition.Right:
        top = triggerRect.top + (triggerRect.height - tooltipRect.height) / 2
        left = triggerRect.right + offset
        break

      default:
        break
    }

    const maxLeft = window.innerWidth - tooltipRect.width - VIEWPORT_PADDING
    const maxTop = window.innerHeight - tooltipRect.height - VIEWPORT_PADDING

    const clampedLeft = Math.min(Math.max(left, VIEWPORT_PADDING), Math.max(maxLeft, VIEWPORT_PADDING))
    const clampedTop = Math.min(Math.max(top, VIEWPORT_PADDING), Math.max(maxTop, VIEWPORT_PADDING))

    setCoords({
      left: Math.round(clampedLeft),
      top: Math.round(clampedTop),
    })
  }, [offset, position])

  useLayoutEffect(() => {
    if (!isVisible) {
      return
    }

    calculatePosition()
  }, [calculatePosition, content, isVisible, position])

  useLayoutEffect(() => {
    if (!isVisible) {
      return
    }

    const handleWindowUpdate = () => {
      calculatePosition()
    }

    window.addEventListener('scroll', handleWindowUpdate, true)
    window.addEventListener('resize', handleWindowUpdate)

    return () => {
      window.removeEventListener('scroll', handleWindowUpdate, true)
      window.removeEventListener('resize', handleWindowUpdate)
    }
  }, [calculatePosition, isVisible])

  const handleMouseEnter: MouseEventHandler<HTMLSpanElement> = () => {
    setIsVisible(true)
  }

  const handleMouseLeave: MouseEventHandler<HTMLSpanElement> = () => {
    setIsVisible(false)
    setCoords(null)
  }

  const handleFocus: FocusEventHandler<HTMLSpanElement> = () => {
    setIsVisible(true)
  }

  const handleBlur: FocusEventHandler<HTMLSpanElement> = () => {
    setIsVisible(false)
    setCoords(null)
  }

  if (!tooltipRoot) {
    return <span className={styles.trigger} ref={triggerRef}>{children}</span>
  }

  return (
    <>
      <span
        className={styles.trigger}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        aria-describedby={isVisible ? tooltipId : undefined}
        ref={triggerRef}
      >
        {children}
      </span>

      {isVisible && createPortal(
        <div
          className={styles.tooltip}
          ref={tooltipRef}
          style={{
            left: coords?.left ?? -9999,
            top: coords?.top ?? -9999,
            opacity: coords ? 1 : 0,
          }}
        >
          <div
            className={styles.tooltipContent}
            data-theme={theme}
            id={tooltipId}
            role="tooltip"
          >
            {content}
          </div>
        </div>,
        tooltipRoot,
      )}
    </>
  )
}
