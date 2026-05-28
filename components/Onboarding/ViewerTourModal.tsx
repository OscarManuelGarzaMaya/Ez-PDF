import { useState, useEffect } from 'react'
import { Modal, View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useTranslation } from 'react-i18next'
import Svg, { Path } from 'react-native-svg'

import { useThemeStore } from '../../store/themeStore'
import { useOnboardingStore } from '../../store/onboardingStore'
import { colors } from '../../constants/theme'

const BAR_HEIGHT = 56
const FAB_SIZE = 56
const CARD_WIDTH = 240
const BOOKMARK_OUTLINE = 'M17 3H7c-1.1 0-2 .9-2 2v16l7-3 7 3V5c0-1.1-.9-2-2-2zm0 15-5-2.18L7 18V5h10v13z'
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window')

// SVG overlay: full-screen rect with a circular hole at (cx, cy) radius r
const spotlightPath = (cx: number, cy: number, r: number) =>
	`M0,0 H${SCREEN_WIDTH} V${SCREEN_HEIGHT} H0 Z ` +
	`M${cx + r},${cy} A${r},${r} 0 1,0 ${cx - r},${cy} A${r},${r} 0 1,0 ${cx + r},${cy} Z`

type Props = { visible: boolean }

const ViewerTourModal = ({ visible }: Props) => {
	const { isDark } = useThemeStore()
	const theme = isDark ? colors.dark : colors.light
	const { markViewerSeen } = useOnboardingStore()
	const { t } = useTranslation()
	const insets = useSafeAreaInsets()
	const [step, setStep] = useState(0)

	useEffect(() => {
		if (visible) setStep(0)
	}, [visible])

	if (!visible) return null

	const isLast = step === 1

	const handleNext = () => {
		if (isLast) markViewerSeen()
		else setStep(1)
	}

	// FAB: right: 20, size: 56 → center X = SCREEN_WIDTH - 48 (device-independent)
	const fabCx = SCREEN_WIDTH - 48
	const fabCy = SCREEN_HEIGHT - (insets.bottom + BAR_HEIGHT + 16) - FAB_SIZE / 2

	const cardPosition = step === 0
		? { top: insets.top + BAR_HEIGHT + 12, right: 12 }
		: { bottom: insets.bottom + BAR_HEIGHT + FAB_SIZE + 20, right: 12 }

	return (
		<Modal
			visible
			transparent
			animationType="fade"
			statusBarTranslucent
			onRequestClose={markViewerSeen}
		>
			<View style={styles.container}>
				{/* Step 0: plain dark overlay */}
				{step === 0 && (
					<View
						style={[StyleSheet.absoluteFill, styles.overlay]}
						pointerEvents="none"
					/>
				)}

				{/* Step 1: SVG spotlight on the FAB (position is device-independent) */}
				{step === 1 && (
					<Svg
						width={SCREEN_WIDTH}
						height={SCREEN_HEIGHT}
						style={StyleSheet.absoluteFill}
						pointerEvents="none"
					>
						<Path
							d={spotlightPath(fabCx, fabCy, 36)}
							fill="rgba(0,0,0,0.72)"
							fillRule="evenodd"
						/>
					</Svg>
				)}

				{/* Tooltip card */}
				<View style={[styles.card, { backgroundColor: theme.surface }, cardPosition]}>
					{step === 0 && <View style={[styles.arrowUp, { borderBottomColor: theme.surface }]} />}

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
								onPress={markViewerSeen}
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

					{step === 1 && <View style={[styles.arrowDown, { borderTopColor: theme.surface }]} />}
				</View>
			</View>
		</Modal>
	)
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	overlay: {
		backgroundColor: 'rgba(0,0,0,0.72)',
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
