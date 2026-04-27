import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { PDF } from '../../store/pdfStore'
import { colors } from '../../constants/theme'

type Props = {
	isDark: boolean
	pdf: PDF
	onPress: (pdf: PDF) => void
}

const ICON_COLORS = [
	'#00C9B1',
	'#A78BFA',
	'#60A5FA',
	'#F87171',
	'#FB923C',
	'#34D399',
]

const getIconColor = (id: string) => {
	const index = id.charCodeAt(0) % ICON_COLORS.length
	return ICON_COLORS[index]
}

const formatDate = (timestamp: number) => {
	return new Date(timestamp).toLocaleDateString('es-MX', {
		day: '2-digit',
		month: 'short',
		year: 'numeric',
	})
}

const PDFListItem = ({ isDark, pdf, onPress }: Props) => {
	const theme = isDark ? colors.dark : colors.light
	const iconColor = getIconColor(pdf.id)

	return (
		<TouchableOpacity
			style={[styles.container, { borderBottomColor: theme.border }]}
			onPress={() => onPress(pdf)}
		>
			<View style={[styles.icon, { backgroundColor: iconColor }]}>
				<Text style={styles.iconText}>PDF</Text>
			</View>
			<View style={styles.info}>
				<Text
					style={[styles.name, { color: theme.text }]}
					numberOfLines={1}
				>
					{pdf.name}
				</Text>
				<Text style={[styles.meta, { color: theme.textMuted }]}>
					{(pdf.size / 1024).toFixed(1)} KB
					{pdf.pages > 0 ? ` · ${pdf.pages} págs` : ''}
					{' · '}
					{formatDate(pdf.lastOpened)}
				</Text>
			</View>
		</TouchableOpacity>
	)
}

const styles = StyleSheet.create({
	container: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingHorizontal: 20,
		paddingVertical: 14,
		gap: 14,
		borderBottomWidth: 1,
	},
	icon: {
		width: 44,
		height: 44,
		borderRadius: 10,
		alignItems: 'center',
		justifyContent: 'center',
	},
	iconText: {
		color: '#fff',
		fontWeight: 'bold',
		fontSize: 12,
		textAlign: 'center',
		textAlignVertical: 'center',
	},
	info: {
		flex: 1,
		gap: 4,
	},
	name: {
		fontSize: 15,
		fontWeight: '600',
	},
	meta: {
		fontSize: 12,
	},
})

export default PDFListItem
