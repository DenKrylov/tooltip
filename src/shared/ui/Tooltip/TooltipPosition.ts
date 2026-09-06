export const TooltipPosition = {
  Top: 'top',
  Bottom: 'bottom',
  Left: 'left',
  Right: 'right',
} as const

export type TooltipPosition = typeof TooltipPosition[keyof typeof TooltipPosition]
