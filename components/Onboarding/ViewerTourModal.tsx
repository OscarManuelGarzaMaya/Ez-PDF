import { useState, useEffect } from 'react'
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useTranslation } from 'react-i18next'

import { useThemeStore } from '../../store/themeStore'
import { useOnboardingStore } from '../../store/onboardingStore'
import { colors } from '../../constants/theme'

const BAR_HEIGHT = 56
const FAB_SIZE = 56

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

	// Step 0: below the top bar (bookmark button area)
	// Step 1: above the FAB (teal action button)
	const cardPosition =
		step === 0
			? { top: insets.top + BAR_HEIGHT + 12, right: 12 }
			: { bottom: insets.bottom + BAR_HEIGHT + FAB_SIZE + 20, right: 12 }

	return (
		<Modal visible transparent animationType="fade" statusBarTranslucent>
			<View style={styles.overlay}>
				<View style={[styles.card, { backgroundColor: theme.surface }, cardPosition]}>
					{step === 0 && (
						<View style={[styles.arrowUp, { borderBottomColor: theme.surface }]} />
					)}

					<Text style={[styles.text, { color: theme.text }]}>
						{t(step === 0 ? 'onboarding.viewerStep1' : 'onboarding.viewerStep2')}
					</Text>

					<View style={styles.actions}>
						{!isLast && (
							<TouchableOpacity
								onPress={markViewerSeen}
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

					{step === 1 && (
						<View style={[styles.arrowDown, { borderTopColor: theme.surface }]} />
					)}
				</View>
			</View>
		</Modal>
	)
}

const CARD_WIDTH = 240

const styles = StyleSheet.create({
	overlay: {
		flex: 1,
		backgroundColor: 'rgba(0,0,0,0.65)',
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
