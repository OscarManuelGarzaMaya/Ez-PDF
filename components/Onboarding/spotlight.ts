import type { View } from 'react-native'
import { initialWindowMetrics } from 'react-native-safe-area-context'

// Screen coordinates, same space as a full-screen statusBarTranslucent Modal.
// measureInWindow isn't used: the Modal is a separate Android window and the offset between
// windows varies per device. Instead measure against the ScreenWrapper root, which sits inside
// App's SafeAreaView, and add that padding back to get screen coordinates.
// Uses the device's window insets, not useSafeAreaInsets(): inside the navigator that hook reports
// per-screen values (24 on Home, 0 on Viewer) that don't match App's SafeAreaView padding.
const windowInsets = initialWindowMetrics?.insets ?? { top: 0, left: 0 }
export type SpotlightRect = { x: number; y: number; width: number; height: number }

export const measureSpotlight = (
	target: View | null,
	root: View | null,
	onMeasured: (rect: SpotlightRect) => void,
) => {
	if (!target || !root) return
	target.measureLayout(root, (x, y, width, height) =>
		onMeasured({ x: x + windowInsets.left, y: y + windowInsets.top, width, height }),
	)
}

export const SPOTLIGHT_PADDING = 8

export const rectCenter = (rect: SpotlightRect) => ({
	cx: rect.x + rect.width / 2,
	cy: rect.y + rect.height / 2,
	r: Math.max(rect.width, rect.height) / 2 + SPOTLIGHT_PADDING,
})

// SVG overlay: full-size rect of (w, h) with a circular hole at (cx, cy) radius r
export const spotlightPath = (w: number, h: number, cx: number, cy: number, r: number) =>
	`M0,0 H${w} V${h} H0 Z ` + `M${cx + r},${cy} A${r},${r} 0 1,0 ${cx - r},${cy} A${r},${r} 0 1,0 ${cx + r},${cy} Z`
