import { useCallback, useRef, useState } from 'react'
import { Animated, PanResponder } from 'react-native'

const SWIPE_DISMISS_DISTANCE = 50

/**
 * Drives a set of mutually exclusive bottom panels: at most one is open at a time, and they share
 * a single slide animation (each panel interpolates `anim` with its own travel distance).
 */
export const useBottomPanel = <T extends string>() => {
	const [active, setActive] = useState<T | null>(null)
	const anim = useRef(new Animated.Value(0)).current

	const open = useCallback(
		(panel: T) => {
			anim.setValue(0)
			setActive(panel)
			Animated.spring(anim, { toValue: 1, useNativeDriver: true, tension: 100, friction: 10 }).start()
		},
		[anim],
	)

	const close = useCallback(() => {
		Animated.timing(anim, { toValue: 0, duration: 250, useNativeDriver: true }).start(({ finished }) => {
			// Interrupted when another panel opened mid-close — that panel is now active, keep it
			if (finished) setActive(null)
		})
	}, [anim])

	// Closes without the slide-out, e.g. when the panel's action already navigates elsewhere
	const dismiss = useCallback(() => {
		anim.setValue(0)
		setActive(null)
	}, [anim])

	const panHandlers = useRef(
		PanResponder.create({
			onMoveShouldSetPanResponder: (_, { dy, dx }) => dy > 10 && dy > Math.abs(dx),
			onPanResponderRelease: (_, { dy }) => {
				if (dy > SWIPE_DISMISS_DISTANCE) close()
			},
		}),
	).current.panHandlers

	return { active, anim, open, close, dismiss, panHandlers }
}
