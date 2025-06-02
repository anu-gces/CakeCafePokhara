import { animate, MotionValue } from 'motion/react'
import type { RefObject } from 'react'
import type { PanInfo } from 'motion/react'

export function handleSwipeSnap(
  x: MotionValue<number>,
  snapState: RefObject<'center' | 'left' | 'right'>,
  info: PanInfo,
  snapThresholdLeft = -50,
  snapThresholdRight = 50,
  snapLeft = -70,
  snapRight = 70,
) {
  const offset = info.offset.x

  if (snapState.current === 'left' && offset > 0) {
    snapState.current = 'center'
    animate(x, 0, { type: 'spring', stiffness: 700, damping: 25 })
    return
  }
  if (snapState.current === 'right' && offset < 0) {
    snapState.current = 'center'
    animate(x, 0, { type: 'spring', stiffness: 700, damping: 25 })
    return
  }
  if (offset < snapThresholdLeft) {
    snapState.current = 'left'
    animate(x, snapLeft, { type: 'spring', stiffness: 500, damping: 30 })
  } else if (offset > snapThresholdRight) {
    snapState.current = 'right'
    animate(x, snapRight, { type: 'spring', stiffness: 500, damping: 30 })
  } else {
    snapState.current = 'center'
    animate(x, 0, { type: 'spring', stiffness: 500, damping: 30 })
  }
}
