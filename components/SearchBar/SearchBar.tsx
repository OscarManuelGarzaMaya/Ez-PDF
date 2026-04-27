import { View, TextInput, StyleSheet } from 'react-native'
import { colors } from '../../constants/theme'

type Props = {
	isDark: boolean
	value: string
	onChangeText: (text: string) => void
}

const SearchBar = ({ isDark, value, onChangeText }: Props) => {
	const theme = isDark ? colors.dark : colors.light

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
			<TextInput
				style={[styles.input, { color: theme.text }]}
				placeholder="Buscar"
				placeholderTextColor={theme.text}
				value={value}
				onChangeText={onChangeText}
				autoFocus={false}
			/>
		</View>
	)
}

const styles = StyleSheet.create({
	container: {
		marginHorizontal: 20,
		marginVertical: 10,
		borderRadius: 12,
		borderWidth: 1,
		paddingHorizontal: 16,
		paddingVertical: 10,
	},
	input: {
		fontSize: 16,
	},
})

export default SearchBar
