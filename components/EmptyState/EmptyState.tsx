import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { useTranslation } from 'react-i18next'
import { colors } from '../../constants/theme'

type Props = {
	isDark: boolean
	onImport: () => void
}

const EmptyState = ({ isDark, onImport }: Props) => {
	const theme = isDark ? colors.dark : colors.light
	const { t } = useTranslation()

	return (
		<View style={styles.container}>
			<View style={styles.iconWrapper}>
				<View style={[styles.iconBox, { backgroundColor: colors.accent.teal }]}>
					<Text style={styles.iconText}>PDF</Text>
				</View>
				<View style={[styles.iconBoxSmall, { backgroundColor: colors.accent.violet }]}>
					<Text style={styles.iconTextSmall}>PDF</Text>
				</View>
				<View style={[styles.iconBoxSmall, { backgroundColor: colors.accent.blue }]}>
					<Text style={styles.iconTextSmall}>PDF</Text>
				</View>
			</View>

			<View style={styles.copy}>
				<Text style={[styles.title, { color: theme.text }]}>{t('emptyState.title')}</Text>
				<Text style={[styles.description, { color: theme.textMuted }]}>
					{t('emptyState.description')}
				</Text>
			</View>

			<TouchableOpacity
				style={[styles.button, { backgroundColor: colors.accent.teal }]}
				onPress={onImport}
				activeOpacity={0.85}
			>
				<Text style={styles.buttonText}>{t('emptyState.cta')}</Text>
			</TouchableOpacity>
		</View>
	)
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center',
		paddingHorizontal: 40,
		gap: 32,
	},
	iconWrapper: {
		flexDirection: 'row',
		alignItems: 'flex-end',
		gap: 10,
	},
	iconBox: {
		width: 72,
		height: 88,
		borderRadius: 14,
		alignItems: 'center',
		justifyContent: 'center',
	},
	iconText: {
		color: '#fff',
		fontWeight: 'bold',
		fontSize: 18,
	},
	iconBoxSmall: {
		width: 48,
		height: 60,
		borderRadius: 10,
		alignItems: 'center',
		justifyContent: 'center',
		marginBottom: 4,
	},
	iconTextSmall: {
		color: '#fff',
		fontWeight: 'bold',
		fontSize: 12,
	},
	copy: {
		alignItems: 'center',
		gap: 10,
	},
	title: {
		fontSize: 22,
		fontWeight: 'bold',
		textAlign: 'center',
	},
	description: {
		fontSize: 15,
		textAlign: 'center',
		lineHeight: 22,
	},
	button: {
		paddingHorizontal: 32,
		paddingVertical: 14,
		borderRadius: 14,
	},
	buttonText: {
		color: '#fff',
		fontWeight: 'bold',
		fontSize: 16,
	},
})

export default EmptyState
