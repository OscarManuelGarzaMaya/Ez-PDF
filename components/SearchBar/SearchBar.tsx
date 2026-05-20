import { View, TextInput, StyleSheet } from 'react-native'
import Svg, { Path } from 'react-native-svg'
import { useTranslation } from 'react-i18next'
import { colors } from '../../constants/theme'

type Props = {
	isDark: boolean
	value: string
	onChangeText: (text: string) => void
}

const SearchBar = ({ isDark, value, onChangeText }: Props) => {
	const theme = isDark ? colors.dark : colors.light
	const { t } = useTranslation()

	return (
		<View
			style={[
				styles.container,
				{
					backgroundColor: theme.surface,
					borderColor: theme.border,
				},
			]}
		>
			<View style={styles.iconWrapper} pointerEvents="none">
				<Svg width={18} height={18} viewBox="0 0 24 24">
					<Path
						d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"
						fill={theme.textMuted}
					/>
				</Svg>
			</View>
			<TextInput
				style={[styles.input, { color: theme.text }]}
				placeholder={t('searchBar.placeholder')}
				placeholderTextColor={theme.textMuted}
				value={value}
				onChangeText={onChangeText}
				autoFocus={false}
			/>
		</View>
	)
}

const styles = StyleSheet.create({
	container: {
		flexDirection: 'row',
		alignItems: 'center',
		marginHorizontal: 20,
		marginVertical: 10,
		borderRadius: 12,
		borderWidth: 1,
		paddingHorizontal: 16,
		paddingVertical: 10,
		gap: 10,
	},
	iconWrapper: {
		justifyContent: 'center',
	},
	input: {
		flex: 1,
		fontSize: 16,
	},
})

export default SearchBar
