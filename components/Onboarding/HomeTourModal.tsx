import { useState, useEffect } from 'react'
import { Modal, View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native'
import { useTranslation } from 'react-i18next'

import { useThemeStore } from '../../store/themeStore'
import { colors } from '../../constants/theme'

const FAB_BOTTOM = 64
const FAB_SIZE = 56
const CARD_WIDTH = 240
const { height: SCREEN_HEIGHT } = Dimensions.get('window')

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

	// Step 0: card above FAB, arrow pointing down
	// Step 1: card in upper-center area, no arrow
	const cardPosition =
		step === 0
			? { bottom: FAB_BOTTOM + FAB_SIZE + 16, right: 12 }
			: { top: SCREEN_HEIGHT * 0.25, alignSelf: 'center' as const }

	return (
		<Modal visible transparent animationType="fade" statusBarTranslucent>
			<View style={styles.overlay}>
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
})

export default HomeTourModal
