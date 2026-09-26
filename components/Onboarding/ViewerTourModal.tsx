import { useState, useEffect } from 'react'
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { useTranslation } from 'react-i18next'
import Svg, { Path } from 'react-native-svg'

import { useThemeStore } from '../../store/themeStore'
import { colors } from '../../constants/theme'
import { SpotlightRect, rectCenter, spotlightPath } from './spotlight'

const CARD_WIDTH = 240
const CARD_MARGIN = 12
const ARROW_HALF = 9
const BOOKMARK_OUTLINE = 'M17 3H7c-1.1 0-2 .9-2 2v16l7-3 7 3V5c0-1.1-.9-2-2-2zm0 15-5-2.18L7 18V5h10v13z'

type Props = {
	visible: boolean
	fabRect: SpotlightRect | null
	bookmarkRect: SpotlightRect | null
	onDismiss: () => void
}

const ViewerTourModal = ({ visible, fabRect, bookmarkRect, onDismiss }: Props) => {
	const { isDark } = useThemeStore()
	const theme = isDark ? colors.dark : colors.light
	const { t } = useTranslation()
	const [step, setStep] = useState(0)
	// Real Modal size; Dimensions.get('window') varies per device on Android (nav bar)
	const [size, setSize] = useState<{ width: number; height: number } | null>(null)

	useEffect(() => {
		if (visible) setStep(0)
	}, [visible])

	if (!visible) return null

	const isLast = step === 1

	const handleNext = () => {
		if (isLast) onDismiss()
		else setStep(1)
	}

	const screenW = size?.width ?? 0
	const screenH = size?.height ?? 0
	// Step 0 points at the bookmark button, step 1 at the FAB
	const target = step === 0 ? bookmarkRect : fabRect
	// Wait until the Modal and the current target are measured
	const ready = size !== null && target !== null
	const { cx, cy, r: baseR } = target ? rectCenter(target) : { cx: 0, cy: 0, r: 0 }
	// Tighter than the default spotlight padding
	const r = baseR * 0.9

	// Keep the card on screen, then slide the arrow so it still points at the target
	const cardRight = Math.min(Math.max(CARD_MARGIN, screenW - cx - 37), screenW - CARD_WIDTH - CARD_MARGIN)
	const arrowRight = screenW - cx - cardRight - ARROW_HALF

	const cardPosition = step === 0
		? { top: cy + r + 12, right: cardRight }
		: { bottom: screenH - cy + r + 12, right: cardRight }

	return (
		<Modal
			visible
			transparent
			animationType="fade"
			statusBarTranslucent
			onRequestClose={onDismiss}
		>
			<View
				style={styles.container}
				onLayout={(e) => setSize({ width: e.nativeEvent.layout.width, height: e.nativeEvent.layout.height })}
			>
				{!ready ? null : (
				<>
				{/* SVG spotlight on the measured target (bookmark in step 0, FAB in step 1) */}
				<Svg
					width={screenW}
					height={screenH}
					style={StyleSheet.absoluteFill}
					pointerEvents="none"
				>
					<Path
						d={spotlightPath(screenW, screenH, cx, cy, r)}
						fill="rgba(0,0,0,0.72)"
						fillRule="evenodd"
					/>
				</Svg>

				{/* Tooltip card */}
				<View style={[styles.card, { backgroundColor: theme.surface }, cardPosition]}>
					{step === 0 && <View style={[styles.arrowUp, { borderBottomColor: theme.surface, right: arrowRight }]} />}

					{step === 0 ? (
						<Text style={[styles.text, { color: theme.text, textAlign: 'auto' }]}>
							{t('onboarding.viewerStep1Tap')}{' '}
							<Svg
								width={20}
								height={20}
								viewBox="0 0 24 24"
								style={{ transform: [{ translateY: 3 }] }}
							>
								<Path
									d={BOOKMARK_OUTLINE}
									fill={colors.accent.violet}
								/>
							</Svg>{' '}
							{t('onboarding.viewerStep1')}
						</Text>
					) : (
						<Text style={[styles.text, { color: theme.text }]}>{t('onboarding.viewerStep2')}</Text>
					)}

					<View style={styles.actions}>
						{!isLast && (
							<TouchableOpacity
								onPress={onDismiss}
								hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
							>
								<Text style={[styles.skip, { color: theme.textMuted }]}>{t('onboarding.skip')}</Text>
							</TouchableOpacity>
						)}
						<TouchableOpacity
							onPress={handleNext}
							style={[styles.nextBtn, { backgroundColor: colors.accent.teal }]}
							activeOpacity={0.85}
						>
							<Text style={styles.nextText}>{isLast ? t('onboarding.gotIt') : t('onboarding.next')}</Text>
						</TouchableOpacity>
					</View>

					{step === 1 && <View style={[styles.arrowDown, { borderTopColor: theme.surface, right: arrowRight }]} />}
				</View>
				</>
				)}
			</View>
		</Modal>
	)
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	inlineText: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		display: 'flex',
		alignItems: 'center',
		marginBottom: 14,
		justifyContent: 'center',
	},
	inlineIcon: {
		marginTop: 1,
		flexWrap: 'wrap',
	},
	inlineSegment: {
		marginBottom: 0,
	},
	card: {
		position: 'absolute',
		width: CARD_WIDTH,
		borderRadius: 14,
		padding: 16,
		elevation: 12,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.25,
		shadowRadius: 8,
	},
	arrowUp: {
		position: 'absolute',
		top: -10,
		right: 28,
		width: 0,
		height: 0,
		borderLeftWidth: 9,
		borderRightWidth: 9,
		borderBottomWidth: 10,
		borderLeftColor: 'transparent',
		borderRightColor: 'transparent',
	},
	arrowDown: {
		position: 'absolute',
		bottom: -10,
		right: 28,
		width: 0,
		height: 0,
		borderLeftWidth: 9,
		borderRightWidth: 9,
		borderTopWidth: 10,
		borderLeftColor: 'transparent',
		borderRightColor: 'transparent',
	},
	text: {
		fontSize: 14,
		lineHeight: 21,
		marginBottom: 14,
	},
	actions: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'flex-end',
		gap: 12,
	},
	skip: {
		fontSize: 13,
		fontWeight: '500',
	},
	nextBtn: {
		paddingVertical: 8,
		paddingHorizontal: 16,
		borderRadius: 8,
	},
	nextText: {
		color: '#fff',
		fontSize: 13,
		fontWeight: '700',
	},
})

export default ViewerTourModal
