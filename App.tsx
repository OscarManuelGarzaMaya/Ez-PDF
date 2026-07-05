import './i18n'
import { useEffect, useRef, useState } from 'react'
import { useColorScheme, Linking } from 'react-native'
import { useLocales } from 'expo-localization'
import i18n, { resolveLocale } from './i18n'
import { StatusBar } from 'expo-status-bar'
import * as SplashScreen from 'expo-splash-screen'
import * as FileSystem from 'expo-file-system/legacy'

SplashScreen.preventAutoHideAsync()

// Navigation
import { NavigationContainer, createNavigationContainerRef } from '@react-navigation/native'
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
import { importFromUri } from './services/importFromIntent'

export type RootStackParamList = {
	Home: undefined
	Viewer: { pdfId: string }
}

const Stack = createNativeStackNavigator<RootStackParamList>()
export const navigationRef = createNavigationContainerRef<RootStackParamList>()

export default function App() {
	const colorScheme = useColorScheme()
	const { isDark, _hasHydrated: themeHydrated, syncWithSystem } = useThemeStore()
	const theme = isDark ? colors.dark : colors.light
	const { deviceId, _hasHydrated } = useDeviceStore()
	const { pdfs, pruneDeleted, _hasHydrated: pdfHydrated } = usePdfStore()
	const locales = useLocales()
	const didInitialSync = useRef(false)
	const [pendingUri, setPendingUri] = useState<string | null>(null)
	const pendingPdfId = useRef<string | null>(null)

	const navigateToViewer = (pdfId: string) => {
		if (navigationRef.isReady()) {
			navigationRef.navigate('Viewer', { pdfId })
		} else {
			// Nav container not mounted yet — defer until onReady fires
			pendingPdfId.current = pdfId
		}
	}

	const handleIncomingPdf = async (uri: string) => {
		const pdfId = await importFromUri(uri)
		if (!pdfId) return
		navigateToViewer(pdfId)
	}

	// Capture cold-start URI before store is hydrated
	useEffect(() => {
		Linking.getInitialURL().then((url) => {
			if (url && !url.startsWith('exp+')) setPendingUri(url)
		})

		const sub = Linking.addEventListener('url', ({ url }) => {
			if (url && !url.startsWith('exp+')) handleIncomingPdf(url)
		})

		return () => sub.remove()
	}, [])

	// Process cold-start URI once both stores are ready — using state for pendingUri
	// ensures this effect re-runs regardless of which resolves first: store hydration
	// or Linking.getInitialURL() (the latter is async and can lose the race).
	useEffect(() => {
		if (!_hasHydrated || !pdfHydrated || !pendingUri) return
		setPendingUri(null)
		handleIncomingPdf(pendingUri)
	}, [_hasHydrated, pdfHydrated, pendingUri])

	useEffect(() => {
		i18n.changeLanguage(resolveLocale(locales[0]?.languageCode))
	}, [locales])

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
			<NavigationContainer
				ref={navigationRef}
				onReady={() => {
					if (pendingPdfId.current) {
						navigationRef.navigate('Viewer', { pdfId: pendingPdfId.current })
						pendingPdfId.current = null
					}
				}}
			>
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
