import { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Modal } from 'react-native'
import { useTranslation } from 'react-i18next'
import { colors } from '../../constants/theme'
import { viewerStyles } from './viewerStyles'

type Props = {
	isDark: boolean
	fileName: string
	isRetry: boolean
	onSubmit: (password: string) => void
	onCancel: () => void
}

// Mounted only while prompting, so the typed password never outlives the dialog
const PasswordPrompt = ({ isDark, fileName, isRetry, onSubmit, onCancel }: Props) => {
	const theme = isDark ? colors.dark : colors.light
	const { t } = useTranslation()
	const [input, setInput] = useState('')

	const submit = () => {
		if (input) onSubmit(input)
	}

	return (
		<Modal
			visible
			transparent
			animationType="fade"
			onRequestClose={onCancel}
		>
			<View style={styles.backdrop}>
				<View style={[styles.dialog, { backgroundColor: theme.surface }]}>
					<Text style={viewerStyles.stateIcon}>🔒</Text>
					<Text style={[viewerStyles.stateTitle, { color: theme.text }]}>{t('viewer.passwordTitle')}</Text>
					<Text style={[viewerStyles.stateMessage, { color: isRetry ? colors.accent.orange : theme.textMuted }]}>
						{isRetry ? t('viewer.passwordIncorrect') : t('viewer.passwordMessage', { name: fileName })}
					</Text>
					<TextInput
						value={input}
						onChangeText={setInput}
						onSubmitEditing={submit}
						placeholder={t('viewer.passwordPlaceholder')}
						placeholderTextColor={theme.textMuted}
						secureTextEntry
						autoFocus
						autoCapitalize="none"
						autoCorrect={false}
						returnKeyType="done"
						style={[viewerStyles.input, styles.input, { color: theme.text, borderColor: theme.border }]}
					/>
					<View style={styles.actions}>
						<TouchableOpacity
							style={viewerStyles.textButton}
							onPress={onCancel}
						>
							<Text style={[viewerStyles.textButtonText, { color: theme.textMuted }]}>{t('common.cancel')}</Text>
						</TouchableOpacity>
						<TouchableOpacity
							style={viewerStyles.textButton}
							onPress={submit}
							disabled={!input}
						>
							<Text style={[viewerStyles.textButtonText, { color: input ? colors.accent.violet : theme.textMuted }]}>{t('viewer.passwordOpen')}</Text>
						</TouchableOpacity>
					</View>
				</View>
			</View>
		</Modal>
	)
}

const styles = StyleSheet.create({
	backdrop: {
		flex: 1,
		backgroundColor: 'rgba(0,0,0,0.55)',
		alignItems: 'center',
		justifyContent: 'center',
		paddingHorizontal: 24,
	},
	dialog: {
		width: '100%',
		maxWidth: 400,
		borderRadius: 16,
		paddingTop: 24,
		paddingHorizontal: 20,
		paddingBottom: 8,
		alignItems: 'center',
		gap: 10,
	},
	input: {
		flex: 0,
		alignSelf: 'stretch',
		height: 44,
		marginTop: 6,
	},
	actions: {
		flexDirection: 'row',
		alignSelf: 'flex-end',
		gap: 8,
	},
})

export default PasswordPrompt
