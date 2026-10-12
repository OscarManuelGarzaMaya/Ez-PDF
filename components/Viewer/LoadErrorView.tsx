import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { useTranslation } from 'react-i18next'
import { colors } from '../../constants/theme'
import { viewerStyles } from './viewerStyles'

type Props = {
	isDark: boolean
	onGoBack: () => void
}

const LoadErrorView = ({ isDark, onGoBack }: Props) => {
	const theme = isDark ? colors.dark : colors.light
	const { t } = useTranslation()

	return (
		<View style={[styles.container, { backgroundColor: theme.background }]}>
			<Text style={viewerStyles.stateIcon}>⚠️</Text>
			<Text style={[viewerStyles.stateTitle, { color: theme.text }]}>{t('viewer.loadErrorTitle')}</Text>
			<Text style={[viewerStyles.stateMessage, { color: theme.textMuted }]}>{t('viewer.loadErrorMessage')}</Text>
			<TouchableOpacity
				style={[viewerStyles.primaryButton, styles.button, { backgroundColor: colors.accent.violet }]}
				onPress={onGoBack}
			>
				<Text style={viewerStyles.primaryButtonText}>{t('viewer.goBack')}</Text>
			</TouchableOpacity>
		</View>
	)
}

const styles = StyleSheet.create({
	container: {
		...StyleSheet.absoluteFillObject,
		alignItems: 'center',
		justifyContent: 'center',
		paddingHorizontal: 32,
		gap: 10,
		zIndex: 60,
	},
	button: {
		marginTop: 12,
		paddingHorizontal: 32,
	},
})

export default LoadErrorView
