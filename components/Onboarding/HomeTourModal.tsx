import { useState, useEffect } from 'react'
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { useTranslation } from 'react-i18next'
import Svg, { Path } from 'react-native-svg'

import { useThemeStore } from '../../store/themeStore'
import { colors } from '../../constants/theme'
import { SpotlightRect, SPOTLIGHT_PADDING, spotlightPath } from './spotlight'

const CARD_WIDTH = 300
const DELETE_WIDTH = 80

type Props = { visible: boolean; fabRect: SpotlightRect | null; onDismiss: () => void }

const HomeTourModal = ({ visible, fabRect, onDismiss }: Props) => {
	const { isDark } = useThemeStore()
	const theme = isDark ? colors.dark : colors.light
	const { t } = useTranslation()
	const [step, setStep] = useState(0)
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
	const fabCx = fabRect ? fabRect.x + fabRect.width  / 2 : 0
	const fabCy = fabRect ? fabRect.y + fabRect.height / 2 : 0
	// Tighter than the default spotlight padding
	const spotlightR = fabRect ? (Math.max(fabRect.width, fabRect.height) / 2 + SPOTLIGHT_PADDING) * 0.85 : 0
	const ready = size !== null && (step !== 0 || fabRect !== null)

	const fabCardPosition = { bottom: screenH - fabCy + spotlightR + 12, right: Math.max(12, screenW - fabCx - 36) }

	const cardContent = (
		<>
			<Text style={[styles.text, { color: theme.text }]}>{t(step === 0 ? 'onboarding.homeStep1' : 'onboarding.homeStep2')}</Text>

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

			{step === 0 && <View style={[styles.arrowDown, { borderTopColor: theme.surface }]} />}
		</>
	)

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
				{/* Step 0: SVG spotlight on FAB */}
				{step === 0 && (
					<Svg
						width={screenW}
						height={screenH}
						style={StyleSheet.absoluteFill}
						pointerEvents="none"
					>
						<Path
							d={spotlightPath(screenW, screenH, fabCx, fabCy, spotlightR)}
							fill="rgba(0,0,0,0.4)"
							fillRule="evenodd"
						/>
					</Svg>
				)}

				{/* Step 1: flat dark overlay */}
				{step === 1 && (
					<View
						style={[StyleSheet.absoluteFill, styles.overlay]}
						pointerEvents="none"
					/>
				)}

				{/* Step 0: card anchored to the FAB */}
				{step === 0 && (
					<View style={[styles.card, styles.cardFloating, { backgroundColor: theme.surface }, fabCardPosition]}>
						{cardContent}
					</View>
				)}

				{/* Step 1: card + ghost items stacked in flow, so ghosts always sit below the card regardless of its height */}
				{step === 1 && (
					<View style={[styles.stepColumn, { top: screenH * 0.12 }]}>
						<View style={[styles.card, { backgroundColor: theme.surface }]}>
							{cardContent}
						</View>

						<View style={styles.ghostArea}>
							{/* Ghost list item: swipe-left result already revealed */}
							<View style={styles.ghostRow}>
								<View style={[styles.ghostListContent, { backgroundColor: theme.surface }]}>
									<View style={[styles.ghostIcon, { backgroundColor: colors.accent.violet }]} />
									<View style={styles.ghostLines}>
										<View style={[styles.ghostLine, { width: 60, backgroundColor: theme.border }]} />
										<View style={[styles.ghostLine, { width: 45, backgroundColor: theme.border, opacity: 0.5, marginTop: 6 }]} />
									</View>
								</View>
								<View style={[styles.ghostDeletePanel, { backgroundColor: colors.accent.red }]}>
									<Svg
										width={16}
										height={16}
										viewBox="0 0 24 24"
										fill="none"
									>
										<Path
											d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"
											stroke="#fff"
											strokeWidth={2}
											strokeLinecap="round"
											strokeLinejoin="round"
										/>
									</Svg>
									<Text style={styles.ghostDeleteText}>{t('common.delete')}</Text>
								</View>
							</View>

							{/* Ghost carousel card: ✕ visible in corner */}
							<View style={[styles.ghostCard, { backgroundColor: theme.surface }]}>
								<Text style={styles.ghostCardX}>✕</Text>
								<View style={[styles.ghostCardIcon, { backgroundColor: colors.accent.teal }]}>
									<Text style={styles.ghostCardIconText}>PDF</Text>
								</View>
								<View style={[styles.ghostLine, { width: 72, backgroundColor: theme.border, marginTop: 8 }]} />
								<View style={[styles.ghostLine, { width: 50, backgroundColor: theme.border, opacity: 0.5, marginTop: 5 }]} />
							</View>
						</View>
					</View>
				)}
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
	overlay: {
		backgroundColor: 'rgba(0,0,0,0.72)',
	},
	card: {
		width: CARD_WIDTH,
		maxWidth: '100%',
		borderRadius: 14,
		padding: 16,
		elevation: 12,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.25,
		shadowRadius: 8,
	},
	cardFloating: {
		position: 'absolute',
		maxWidth: undefined,
	},
	stepColumn: {
		position: 'absolute',
		left: 20,
		right: 20,
		alignItems: 'center',
		gap: 24,
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

	// Ghost placeholders
	ghostArea: {
		alignSelf: 'stretch',
		flexDirection: 'row',
		alignItems: 'center',
		gap: 12,
		opacity: 0.92,
	},
	ghostRow: {
		flex: 1,
		flexDirection: 'row',
		borderRadius: 12,
		overflow: 'hidden',
		height: 68,
		marginTop: 10,
	},
	ghostListContent: {
		flex: 1,
		flexDirection: 'row',
		alignItems: 'center',
		paddingHorizontal: 14,
		gap: 12,
	},
	ghostIcon: {
		width: 38,
		height: 38,
		borderRadius: 8,
	},
	ghostLines: {
		flex: 1,
	},
	ghostLine: {
		height: 10,
		borderRadius: 5,
	},
	ghostDeletePanel: {
		width: DELETE_WIDTH,
		alignItems: 'center',
		justifyContent: 'center',
		gap: 3,
	},
	ghostDeleteText: {
		color: '#fff',
		fontSize: 10,
		fontWeight: '600',
	},
	ghostCard: {
		width: 110,
		borderRadius: 14,
		padding: 12,
		paddingTop: 24,
	},
	ghostCardX: {
		position: 'absolute',
		top: 7,
		right: 9,
		color: colors.accent.red,
		fontSize: 12,
		fontWeight: '700',
	},
	ghostCardIcon: {
		width: 36,
		height: 36,
		borderRadius: 8,
		alignItems: 'center',
		justifyContent: 'center',
	},
	ghostCardIconText: {
		color: '#fff',
		fontSize: 9,
		fontWeight: 'bold',
	},
})

export default HomeTourModal
