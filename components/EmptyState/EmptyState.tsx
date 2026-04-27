import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { colors } from '../../constants/theme'

type Props = {
	isDark: boolean
	onImport: () => void
}

const EmptyState = ({ isDark, onImport }: Props) => {
	const theme = isDark ? colors.dark : colors.light

	return (
		<View style={styles.container}>
			<Text style={styles.icon}>📄</Text>
			<Text style={[styles.title, { color: theme.text }]}>No hay PDFs aún</Text>
			<Text style={[styles.description, { color: theme.textMuted }]}>Importa tu primer archivo para empezar</Text>
			<TouchableOpacity
				style={styles.button}
				onPress={onImport}
			>
				<Text style={styles.buttonText}>+ Importar PDF</Text>
			</TouchableOpacity>
		</View>
	)
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center',
		gap: 12,
		paddingHorizontal: 40,
	},
	icon: {
		fontSize: 64,
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
		marginTop: 8,
		backgroundColor: '#00C9B1',
		paddingHorizontal: 24,
		paddingVertical: 12,
		borderRadius: 12,
	},
	buttonText: {
		color: '#fff',
		fontWeight: 'bold',
		fontSize: 16,
	},
})

export default EmptyState
