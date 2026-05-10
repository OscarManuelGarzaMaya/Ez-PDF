import { useEffect, useRef } from 'react'
import { useColorScheme } from 'react-native'
import { StatusBar } from 'expo-status-bar'

// Navigation
import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { SafeAreaProvider } from 'react-native-safe-area-context'

// Theme & colors
import { useThemeStore } from './store/themeStore'
import { colors } from './constants/theme'

// Screens
import HomeScreen from './screens/HomeScreen'
import ViewerScreen from './screens/ViewerScreen'

// Session
import { useDeviceStore } from './store/deviceStore'
import { initSession } from './services/session'

export type RootStackParamList = {
	Home: undefined
	Viewer: { pdfId: string }
}

const Stack = createNativeStackNavigator<RootStackParamList>()

export default function App() {
	const colorScheme = useColorScheme()
	const { isDark, _hasHydrated: themeHydrated, syncWithSystem } = useThemeStore()
	const theme = isDark ? colors.dark : colors.light
	const { deviceId, _hasHydrated } = useDeviceStore()
	const didInitialSync = useRef(false)

	useEffect(() => {
		if (!themeHydrated) return
		const isInitialSync = !didInitialSync.current
		didInitialSync.current = true
		syncWithSystem(colorScheme === 'dark', isInitialSync)
	}, [themeHydrated, colorScheme])

	useEffect(() => {
		if (_hasHydrated) initSession(deviceId)
	}, [_hasHydrated])

	return (
		<SafeAreaProvider>
			<StatusBar
				style={isDark ? 'light' : 'dark'}
				backgroundColor={theme.surface}
			/>
			<NavigationContainer>
				<Stack.Navigator
					initialRouteName="Home"
					screenOptions={{ headerShown: false }}
				>
					<Stack.Screen
						name="Home"
						component={HomeScreen}
					/>
					<Stack.Screen
						name="Viewer"
						component={ViewerScreen}
					/>
				</Stack.Navigator>
			</NavigationContainer>
		</SafeAreaProvider>
	)
}
