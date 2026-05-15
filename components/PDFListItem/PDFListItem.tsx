import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native'
import { useTranslation } from 'react-i18next'
import { PDF } from '../../store/pdfStore'
import { colors, ICON_COLORS } from '../../constants/theme'

type Props = {
	isDark: boolean
	pdf: PDF
	onPress: (pdf: PDF) => void
	onDelete: (pdf: PDF) => void
}

const formatDate = (timestamp: number) => {
	return new Date(timestamp).toLocaleDateString('es-MX', {
		day: '2-digit',
		month: 'short',
		year: 'numeric',
	})
}

const PDFListItem = ({ isDark, pdf, onPress, onDelete }: Props) => {
	const theme = isDark ? colors.dark : colors.light
	const iconColor = ICON_COLORS[pdf.colorIndex ?? pdf.id.charCodeAt(0) % ICON_COLORS.length]
	const { t } = useTranslation()

	const handleLongPress = () => {
		Alert.alert(
			t('pdfListItem.deleteTitle'),
			t('pdfListItem.deleteMessage', { name: pdf.name }),
			[
				{ text: t('common.cancel'), style: 'cancel' },
				{ text: t('common.delete'), style: 'destructive', onPress: () => onDelete(pdf) },
			],
			{ cancelable: true }
		)
	}

	return (
		<TouchableOpacity
			style={[styles.container, { borderBottomColor: theme.border }]}
			onPress={() => onPress(pdf)}
			onLongPress={handleLongPress}
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
