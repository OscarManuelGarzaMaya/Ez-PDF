import { View, Text, StyleSheet } from 'react-native'
import { useTranslation } from 'react-i18next'
import { colors } from '../../constants/theme'
import ThemeMenu from '../ThemeMenu/ThemeMenu'

type Props = {
	isDark: boolean
	pdfCount: number
}

const AppBar = ({ isDark, pdfCount }: Props) => {
	const theme = isDark ? colors.dark : colors.light
	const { t } = useTranslation()

	return (
		<View style={[styles.container, { backgroundColor: theme.surface }]}>
			<Text style={[styles.title, { color: theme.text }]}>{t('appBar.title')}</Text>
			<View style={styles.badge}>
				<Text style={styles.badgeText}>{pdfCount}</Text>
			</View>
			<ThemeMenu isDark={isDark} />
		</View>
	)
}

const styles = StyleSheet.create({
	container: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingHorizontal: 20,
		paddingVertical: 16,
		gap: 10,
	},
	title: {
		fontSize: 24,
		fontWeight: 'bold',
		flex: 1,
	},
	badge: {
		backgroundColor: colors.accent.teal,
		borderRadius: 12,
		paddingHorizontal: 10,
		paddingVertical: 4,
	},
	badgeText: {
		color: '#fff',
		fontSize: 14,
		fontWeight: 'bold',
	},
})

export default AppBar