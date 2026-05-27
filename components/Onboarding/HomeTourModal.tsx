import { useState, useEffect } from 'react'
import { Modal, View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native'
import { useTranslation } from 'react-i18next'
import Svg, { Path } from 'react-native-svg'

import { useThemeStore } from '../../store/themeStore'
import { colors } from '../../constants/theme'

const FAB_BOTTOM = 64
const FAB_SIZE = 56
const CARD_WIDTH = 240
const DELETE_WIDTH = 80
const { height: SCREEN_HEIGHT } = Dimensions.get('window')

// Card sits at 12% from top in step 2, ~130px tall → ghost area starts below
const GHOST_TOP = SCREEN_HEIGHT * 0.12 + 148

type Props = { visible: boolean; onDismiss: () => void }

const HomeTourModal = ({ visible, onDismiss }: Props) => {
	const { isDark } = useThemeStore()
	const theme = isDark ? colors.dark : colors.light
	const { t } = useTranslation()
	const [step, setStep] = useState(0)

	useEffect(() => {
		if (visible) setStep(0)
	}, [visible])

	if (!visible) return null

	const isLast = step === 1

	const handleNext = () => {
		if (isLast) onDismiss()
		else setStep(1)
	}

	const cardPosition =
		step === 0
			? { bottom: FAB_BOTTOM + FAB_SIZE + 16, right: 12 }
			: { top: SCREEN_HEIGHT * 0.12, alignSelf: 'center' as const }

	return (
		<Modal visible transparent animationType="fade" statusBarTranslucent>
			<View style={styles.overlay}>

				{/* Step 2 — ghost placeholder items */}
				{step === 1 && (
					<View style={[styles.ghostArea, { top: GHOST_TOP }]}>

						{/* Ghost list item: swipe-left result already revealed */}
						<View style={styles.ghostRow}>
							<View style={[styles.ghostListContent, { backgroundColor: theme.surface }]}>
								<View style={[styles.ghostIcon, { backgroundColor: colors.accent.violet }]} />
								<View style={styles.ghostLines}>
									<View style={[styles.ghostLine, { width: 100, backgroundColor: theme.border }]} />
									<View style={[styles.ghostLine, { width: 65, backgroundColor: theme.border, opacity: 0.5, marginTop: 6 }]} />
								</View>
							</View>
							<View style={[styles.ghostDeletePanel, { backgroundColor: colors.accent.red }]}>
								<Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
									<Path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" stroke="#fff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
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
				)}

				{/* Tooltip card */}
				<View style={[styles.card, { backgroundColor: theme.surface }, cardPosition]}>
					<Text style={[styles.text, { color: theme.text }]}>
						{t(step === 0 ? 'onboarding.homeStep1' : 'onboarding.homeStep2')}
					</Text>

					<View style={styles.actions}>
						{!isLast && (
							<TouchableOpacity
								onPress={onDismiss}
								hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
							>
								<Text style={[styles.skip, { color: theme.textMuted }]}>
									{t('onboarding.skip')}
								</Text>
							</TouchableOpacity>
						)}
						<TouchableOpacity
							onPress={handleNext}
							style={[styles.nextBtn, { backgroundColor: colors.accent.teal }]}
							activeOpacity={0.85}
						>
							<Text style={styles.nextText}>
								{isLast ? t('onboarding.gotIt') : t('onboarding.next')}
							</Text>
						</TouchableOpacity>
					</View>

					{step === 0 && (
						<View style={[styles.arrowDown, { borderTopColor: theme.surface }]} />
					)}
				</View>

			</View>
		</Modal>
	)
}

const styles = StyleSheet.create({
	overlay: {
		flex: 1,
		backgroundColor: 'rgba(0,0,0,0.72)',
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
		position: 'absolute',
		left: 20,
		right: 20,
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
