import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { useTranslation } from 'react-i18next'

import { useThemeStore } from '../../store/themeStore'
import { colors } from '../../constants/theme'

const FAB_BOTTOM = 64
const FAB_SIZE = 56
const CARD_WIDTH = 240

type Props = { visible: boolean; onDismiss: () => void }

const HomeTourModal = ({ visible, onDismiss }: Props) => {
	const { isDark } = useThemeStore()
	const theme = isDark ? colors.dark : colors.light
	const { t } = useTranslation()

	if (!visible) return null

	return (
		<Modal visible transparent animationType="fade" statusBarTranslucent>
			<View style={styles.overlay}>
				<View style={[styles.card, { backgroundColor: theme.surface, bottom: FAB_BOTTOM + FAB_SIZE + 16, right: 12 }]}>
					<Text style={[styles.text, { color: theme.text }]}>
						{t('onboarding.homeStep1')}
					</Text>
					<View style={styles.actions}>
						<TouchableOpacity
							onPress={onDismiss}
							style={[styles.nextBtn, { backgroundColor: colors.accent.teal }]}
							activeOpacity={0.85}
						>
							<Text style={styles.nextText}>{t('onboarding.gotIt')}</Text>
						</TouchableOpacity>
					</View>
					<View style={[styles.arrowDown, { borderTopColor: theme.surface }]} />
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
