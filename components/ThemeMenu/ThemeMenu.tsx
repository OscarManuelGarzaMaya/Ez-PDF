import { Dispatch, SetStateAction, useState } from 'react'
import { View, Text, TouchableOpacity, Pressable, StyleSheet, Modal } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useTranslation } from 'react-i18next'
import { colors } from '../../constants/theme'
import { useThemeStore } from '../../store/themeStore'

type Props = {
	isDark: boolean
	barHeight?: number
	setShowTour: Dispatch<SetStateAction<boolean>>
}

const ThemeMenu = ({ isDark, barHeight = 56, setShowTour }: Props) => {
	const [open, setOpen] = useState(false)
	const { toggleTheme } = useThemeStore()
	const { top } = useSafeAreaInsets()
	const theme = isDark ? colors.dark : colors.light
	const { t } = useTranslation()

	return (
		<>
			<TouchableOpacity
				onPress={() => setOpen(true)}
				style={styles.button}
				hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
			>
				<Text style={[styles.dotsIcon, { color: theme.text }]}>⋮</Text>
			</TouchableOpacity>

			<Modal
				visible={open}
				transparent
				animationType="none"
				onRequestClose={() => setOpen(false)}
			>
				<Pressable
					style={styles.backdrop}
					onPress={() => setOpen(false)}
				>
					<View style={[styles.dropdown, { backgroundColor: theme.surface, top: top + barHeight }]}>
						<TouchableOpacity
							style={styles.item}
							onPress={() => {
								toggleTheme()
								setOpen(false)
							}}
						>
							<Text style={[styles.itemText, { color: theme.text }]}>{isDark ? t('themeMenu.lightMode') : t('themeMenu.darkMode')}</Text>
						</TouchableOpacity>
						<TouchableOpacity
							style={styles.item}
							onPress={() => {
								setShowTour(true)
								setOpen(false)
							}}
						>
							<Text style={[styles.itemText, { color: theme.text }]}>{t('themeMenu.tutorial')}</Text>
						</TouchableOpacity>
					</View>
				</Pressable>
			</Modal>
		</>
	)
}

const styles = StyleSheet.create({
	button: {
		width: 36,
		height: 36,
		alignItems: 'center',
		justifyContent: 'center',
	},
	dotsIcon: {
		fontSize: 22,
		letterSpacing: -2,
	},
	backdrop: {
		flex: 1,
	},
	dropdown: {
		position: 'absolute',
		right: 4,
		borderRadius: 10,
		paddingVertical: 4,
		minWidth: 160,
		elevation: 16,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.2,
		shadowRadius: 8,
	},
	item: {
		paddingHorizontal: 16,
		paddingVertical: 12,
	},
	itemText: {
		fontSize: 15,
	},
})

export default ThemeMenu
