import { useRef } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, Alert, Animated, PanResponder } from 'react-native'
import { useTranslation } from 'react-i18next'
import Svg, { Path } from 'react-native-svg'
import { PDF } from '../../store/pdfStore'
import { colors, ICON_COLORS } from '../../constants/theme'

const DELETE_WIDTH = 80
const SWIPE_THRESHOLD = 40

type Props = {
	isDark: boolean
	pdf: PDF
	onPress: (pdf: PDF) => void
	onDelete: (pdf: PDF) => void
}

const formatDate = (timestamp: number, locale: string) => {
	return new Date(timestamp).toLocaleDateString(locale, {
		day: '2-digit',
		month: 'short',
		year: 'numeric',
	})
}

const PDFListItem = ({ isDark, pdf, onPress, onDelete }: Props) => {
	const theme = isDark ? colors.dark : colors.light
	const iconColor = ICON_COLORS[pdf.colorIndex ?? pdf.id.charCodeAt(0) % ICON_COLORS.length]
	const { t, i18n } = useTranslation()

	const translateX = useRef(new Animated.Value(0)).current
	const isOpen = useRef(false)

	const snapOpen = () => {
		isOpen.current = true
		Animated.spring(translateX, { toValue: -DELETE_WIDTH, useNativeDriver: true, overshootClamping: true }).start()
	}

	const snapClose = () => {
		isOpen.current = false
		Animated.spring(translateX, { toValue: 0, useNativeDriver: true, overshootClamping: true }).start()
	}

	const panResponder = useRef(
		PanResponder.create({
			onMoveShouldSetPanResponder: (_, { dx, dy }) =>
				Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 8,
			onPanResponderMove: (_, { dx }) => {
				const base = isOpen.current ? -DELETE_WIDTH : 0
				const next = Math.min(0, Math.max(-DELETE_WIDTH, base + dx))
				translateX.setValue(next)
			},
			onPanResponderRelease: (_, { dx }) => {
				const base = isOpen.current ? -DELETE_WIDTH : 0
				if (base + dx < -SWIPE_THRESHOLD) snapOpen()
				else snapClose()
			},
		})
	).current

	const handlePress = () => {
		if (isOpen.current) { snapClose(); return }
		onPress(pdf)
	}

	const handleLongPress = () => {
		if (isOpen.current) { snapClose(); return }
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

	const handleDelete = () => {
		snapClose()
		onDelete(pdf)
	}

	return (
		<View style={styles.wrapper}>
			<TouchableOpacity
				style={[styles.deleteBackground, { backgroundColor: colors.accent.red }]}
				onPress={handleDelete}
			>
				<Svg
					width={20}
					height={20}
					viewBox="0 0 24 24"
					fill="none"
				>
					<Path
						d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"
						stroke="#fff"
						strokeWidth={2}
						strokeLinecap="round"
						strokeLinejoin="round"
					/>
				</Svg>
				<Text style={styles.deleteActionText}>{t('common.delete')}</Text>
			</TouchableOpacity>

			<Animated.View
				style={[styles.container, { backgroundColor: theme.background, borderBottomColor: theme.border, transform: [{ translateX }] }]}
				{...panResponder.panHandlers}
			>
				<TouchableOpacity
					style={styles.inner}
					onPress={handlePress}
					onLongPress={handleLongPress}
					activeOpacity={0.7}
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
							{formatDate(pdf.lastOpened, i18n.language)}
						</Text>
					</View>
				</TouchableOpacity>
			</Animated.View>
		</View>
	)
}

const styles = StyleSheet.create({
	wrapper: {
		overflow: 'hidden',
	},
	deleteBackground: {
		position: 'absolute',
		right: 0,
		top: 0,
		bottom: 0,
		width: DELETE_WIDTH,
		alignItems: 'center',
		justifyContent: 'center',
		gap: 4,
	},
	deleteActionText: {
		color: '#fff',
		fontSize: 11,
		fontWeight: '600',
	},
	container: {
		borderBottomWidth: 1,
	},
	inner: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingHorizontal: 20,
		paddingVertical: 14,
		gap: 14,
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
