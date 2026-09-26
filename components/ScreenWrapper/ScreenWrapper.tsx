import { View, StyleSheet } from 'react-native'
import { useSafeArea, useSafeAreaInsets } from 'react-native-safe-area-context'
import { StatusBar } from 'expo-status-bar'
import { useThemeStore } from '../../store/themeStore'
import { colors } from '../../constants/theme'
import type { ReactNode, Ref } from 'react'

type Props = {
	children: ReactNode
	// Full-screen root; used as the reference frame for onboarding spotlights
	ref?: Ref<View>
}

const ScreenWrapper = ({ children, ref }: Props) => {
	const { isDark } = useThemeStore()
	const theme = isDark ? colors.dark : colors.light
	const insets = useSafeAreaInsets()

	return (
		<View ref={ref} style={[styles.container, { backgroundColor: theme.background }]}>
			<StatusBar style={isDark ? 'light' : 'dark'} />
			<View style={{ height: insets.top, backgroundColor: theme.surface }} />
			{children}
		</View>
	)
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
})

export default ScreenWrapper
