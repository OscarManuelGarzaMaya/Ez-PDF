import { useEffect, useRef } from 'react'
import { useColorScheme } from 'react-native'
import { StatusBar } from 'expo-status-bar'
import * as SplashScreen from 'expo-splash-screen'
import * as FileSystem from 'expo-file-system/legacy'

SplashScreen.preventAutoHideAsync()

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
import { usePdfStore } from './store/pdfStore'

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
	const { pdfs, pruneDeleted } = usePdfStore()
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

	useEffect(() => {
		if (!_hasHydrated) return
		const pruneStaleFiles = async () => {
			const checks = await Promise.all(
				pdfs.map(async (p) => {
					const info = await FileSystem.getInfoAsync(p.uri)
					return info.exists ? null : p.id
				})
			)
			const stale = checks.filter((id): id is string => id !== null)
			if (stale.length > 0) pruneDeleted(stale)
		}
		pruneStaleFiles()
	}, [_hasHydrated])

	useEffect(() => {
		if (_hasHydrated && themeHydrated) {
			setTimeout(() => SplashScreen.hideAsync(), 1000)
		}
	}, [_hasHydrated, themeHydrated])

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
