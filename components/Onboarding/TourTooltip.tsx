import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import type { TooltipProps } from 'rn-tourguide'

import { useThemeStore } from '../../store/themeStore'
import { colors } from '../../constants/theme'

const TourTooltip = ({ isLastStep, handleNext, handleStop, currentStep, labels }: TooltipProps) => {
	const { isDark } = useThemeStore()
	const theme = isDark ? colors.dark : colors.light
	const insets = useSafeAreaInsets()

	return (
		<View style={[styles.container, { backgroundColor: theme.surface }]}>
			<Text style={[styles.text, { color: theme.text }]}>{currentStep?.text}</Text>
			<View style={styles.actions}>
				{!isLastStep && (
					<TouchableOpacity onPress={handleStop} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
						<Text style={[styles.skip, { color: theme.textMuted }]}>{labels?.skip ?? 'Skip'}</Text>
					</TouchableOpacity>
				)}
				<TouchableOpacity
					onPress={isLastStep ? handleStop : handleNext}
					style={[styles.nextBtn, { backgroundColor: colors.accent.teal }]}
					activeOpacity={0.85}
				>
					<Text style={styles.nextText}>
						{isLastStep ? (labels?.finish ?? 'Got it') : (labels?.next ?? 'Next')}
					</Text>
				</TouchableOpacity>
			</View>
		</View>
	)
}

const styles = StyleSheet.create({
	container: {
		borderRadius: 14,
		padding: 16,
		width: 260,
		elevation: 8,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.2,
		shadowRadius: 8,
	},
	text: {
		fontSize: 14,
		lineHeight: 21,
		marginBottom: 14,
	},
	actions: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'flex-end',
		gap: 12,
	},
	skip: {
		fontSize: 13,
		fontWeight: '500',
	},
	nextBtn: {
		paddingVertical: 8,
		paddingHorizontal: 16,
		borderRadius: 8,
	},
	nextText: {
		color: '#fff',
		fontSize: 13,
		fontWeight: '700',
	},
})

export default TourTooltip
