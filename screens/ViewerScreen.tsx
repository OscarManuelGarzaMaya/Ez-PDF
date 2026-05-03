import { useEffect, useRef, useState } from 'react'
import {
	View,
	Text,
	StyleSheet,
	TouchableOpacity,
	Pressable,
	Animated,
	PanResponder,
	TextInput,
	Keyboard,
} from 'react-native'
import Svg, { G, Path } from 'react-native-svg'
import Pdf, { searchTextDirect } from 'react-native-pdf-jsi'
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { RootStackParamList } from '../App'
import { usePdfStore } from '../store/pdfStore'
import { useThemeStore } from '../store/themeStore'
import { colors } from '../constants/theme'
import ScreenWrapper from '../components/ScreenWrapper/ScreenWrapper'

type ViewerRouteProp = RouteProp<RootStackParamList, 'Viewer'>
type SearchResult = { page: number; text: string; rect: string }

const BAR_HEIGHT = 56
const FAB_SIZE = 56
const MINI_FAB_SIZE = 44
const PDF_ID = 'ez-pdf-viewer'

const CHEVRON_PATH = 'm9.71 17.71 5.7-5.71-5.7-5.71-1.42 1.42 4.3 4.29-4.3 4.29z'

const ChevronIcon = ({ up }: { up: boolean }) => (
	<Svg width={24} height={24} viewBox="0 0 24 24">
		<G transform={up ? 'rotate(270, 12, 12)' : 'rotate(90, 12, 12)'}>
			<Path d={CHEVRON_PATH} fill="#fff" />
		</G>
	</Svg>
)

const MINI_FABS = [
	{ label: 'AI Overview', color: colors.accent.teal, icon: '✦' },
	{ label: 'Marcadores', color: colors.accent.violet, icon: '♡' },
	{ label: 'Búsqueda', color: colors.accent.blue, icon: '⊙' },
]

const ViewerScreen = () => {
	const route = useRoute<ViewerRouteProp>()
	const navigation = useNavigation()
	const insets = useSafeAreaInsets()
	const { pdfs, updateLastOpened } = usePdfStore()
	const { isDark } = useThemeStore()
	const theme = isDark ? colors.dark : colors.light

	const pdf = pdfs.find((p) => p.id === route.params.pdfId)

	const [currentPage, setCurrentPage] = useState(1)
	const [totalPages, setTotalPages] = useState(0)
	const [barsVisible, setBarsVisible] = useState(true)
	const [fabOpen, setFabOpen] = useState(false)
	const [searchOpen, setSearchOpen] = useState(false)
	const [searchQuery, setSearchQuery] = useState('')
	const [searchResults, setSearchResults] = useState<SearchResult[]>([])
	const [currentMatch, setCurrentMatch] = useState(0)
	const [keyboardHeight, setKeyboardHeight] = useState(0)

	const pdfRef = useRef<any>(null)
	const barsAnim = useRef(new Animated.Value(1)).current
	const backdropAnim = useRef(new Animated.Value(0)).current
	const searchPanelAnim = useRef(new Animated.Value(0)).current
	const miniFabAnims = useRef(MINI_FABS.map(() => new Animated.Value(0))).current
	const isNavigatingByButton = useRef(false)
	const isInitialLoad = useRef(true)
	const searchDebounce = useRef<ReturnType<typeof setTimeout> | null>(null)
	const closeSearchRef = useRef<() => void>(() => {})

	const panResponder = useRef(
		PanResponder.create({
			onMoveShouldSetPanResponder: (_, { dy, dx }) => dy > 10 && dy > Math.abs(dx),
			onPanResponderRelease: (_, { dy }) => {
				if (dy > 50) closeSearchRef.current()
			},
		})
	).current

	useEffect(() => {
		if (!pdf) navigation.goBack()
	}, [pdf])

	useEffect(() => {
		const show = Keyboard.addListener('keyboardDidShow', (e) => {
			setKeyboardHeight(e.endCoordinates.height)
		})
		const hide = Keyboard.addListener('keyboardDidHide', () => {
			setKeyboardHeight(0)
		})
		return () => {
			show.remove()
			hide.remove()
		}
	}, [])

	if (!pdf) return null

	const openSearch = () => {
		if (fabOpen) closeFab()
		setSearchOpen(true)
		Animated.spring(searchPanelAnim, {
			toValue: 1,
			useNativeDriver: true,
			tension: 100,
			friction: 10,
		}).start()
	}

	const closeSearch = () => {
		Animated.timing(searchPanelAnim, { toValue: 0, duration: 250, useNativeDriver: true }).start(
			() => {
				setSearchOpen(false)
				setSearchQuery('')
				setSearchResults([])
				setCurrentMatch(0)
			}
		)
	}

	closeSearchRef.current = closeSearch

	const performSearch = (query: string) => {
		if (searchDebounce.current) clearTimeout(searchDebounce.current)
		if (!query.trim() || totalPages === 0) {
			setSearchResults([])
			setCurrentMatch(0)
			return
		}
		searchDebounce.current = setTimeout(async () => {
			try {
				const results = await searchTextDirect(PDF_ID, query, 1, totalPages)
				setSearchResults(results as SearchResult[])
				setCurrentMatch(0)
				if (results.length > 0) pdfRef.current?.setPage(results[0].page)
			} catch {
				setSearchResults([])
			}
		}, 300)
	}

	const goToMatch = (index: number) => {
		if (searchResults.length === 0) return
		const next = (index + searchResults.length) % searchResults.length
		setCurrentMatch(next)
		pdfRef.current?.setPage(searchResults[next].page)
	}

	const miniFabHandlers = [
		() => {}, // AI Overview — Milestone 2
		() => {}, // Marcadores — Issue #9
		openSearch,
	]

	const openFab = () => {
		setFabOpen(true)
		Animated.parallel([
			Animated.timing(backdropAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
			Animated.stagger(
				60,
				[miniFabAnims[2], miniFabAnims[1], miniFabAnims[0]].map((anim) =>
					Animated.spring(anim, { toValue: 1, useNativeDriver: true, tension: 120, friction: 8 })
				)
			),
		]).start()
	}

	const closeFab = () => {
		Animated.parallel([
			Animated.timing(backdropAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
			Animated.stagger(
				40,
				miniFabAnims.map((anim) =>
					Animated.timing(anim, { toValue: 0, duration: 150, useNativeDriver: true })
				)
			),
		]).start(() => setFabOpen(false))
	}

	const toggleFab = () => (fabOpen ? closeFab() : openFab())

	const showBars = () => {
		setBarsVisible(true)
		Animated.timing(barsAnim, { toValue: 1, duration: 200, useNativeDriver: true }).start()
	}

	const hideBars = () => {
		if (fabOpen) closeFab()
		Animated.timing(barsAnim, { toValue: 0, duration: 200, useNativeDriver: true }).start(() =>
			setBarsVisible(false)
		)
	}

	const toggleBars = () => {
		if (barsVisible) hideBars()
		else showBars()
	}

	const handlePageChanged = (page: number) => {
		setCurrentPage(page)
		if (isInitialLoad.current) {
			isInitialLoad.current = false
			return
		}
		if (!isNavigatingByButton.current) hideBars()
		isNavigatingByButton.current = false
	}

	const handlePrevPage = () => {
		if (currentPage <= 1) return
		isNavigatingByButton.current = true
		pdfRef.current?.setPage(currentPage - 1)
	}

	const handleNextPage = () => {
		if (currentPage >= totalPages) return
		isNavigatingByButton.current = true
		pdfRef.current?.setPage(currentPage + 1)
	}

	const bottomBarHeight = BAR_HEIGHT + (insets.bottom || 12)
	const fabBottom = (insets.bottom || 0) + BAR_HEIGHT + 16

	return (
		<ScreenWrapper>
			{/* Top Bar */}
			<Animated.View
				pointerEvents={barsVisible ? 'auto' : 'none'}
				style={[
					styles.topBar,
					{
						backgroundColor: theme.surface,
						height: barsVisible ? BAR_HEIGHT : 0,
						opacity: barsAnim,
					},
				]}
			>
				<TouchableOpacity onPress={() => navigation.goBack()} style={styles.barButton}>
					<Text style={[styles.icon, { color: theme.text }]}>←</Text>
				</TouchableOpacity>

				<Text style={[styles.fileName, { color: theme.text }]} numberOfLines={1}>
					{pdf.name}
				</Text>

				<Text style={[styles.pageCount, { color: theme.textMuted }]}>
					{currentPage}/{totalPages}
				</Text>
			</Animated.View>

			{/* PDF */}
			<Pdf
				ref={pdfRef}
				pdfId={PDF_ID}
				source={{ uri: pdf.uri }}
				style={styles.pdf}
				fitPolicy={0}
				spacing={8}
				enableAntialiasing
				enableDoubleTapZoom
				highlightRects={searchResults.map((r) => ({ page: r.page, rect: r.rect }))}
				onLoadComplete={(numberOfPages) => {
					setTotalPages(numberOfPages)
					updateLastOpened(pdf.id)
				}}
				onPageChanged={handlePageChanged}
				onPageSingleTap={toggleBars}
			/>

			{/* Bottom Bar */}
			<Animated.View
				pointerEvents={barsVisible ? 'auto' : 'none'}
				style={[
					styles.bottomBar,
					{
						backgroundColor: theme.surface,
						height: barsVisible ? bottomBarHeight : 0,
						paddingBottom: insets.bottom || 12,
						opacity: barsAnim,
					},
				]}
			>
				<TouchableOpacity
					onPress={handlePrevPage}
					disabled={currentPage <= 1}
					style={styles.navButton}
				>
					<Text style={[styles.navIcon, { color: currentPage <= 1 ? theme.textMuted : theme.text }]}>
						‹ Anterior
					</Text>
				</TouchableOpacity>

				<Text style={[styles.pageIndicator, { color: theme.textMuted }]}>
					{currentPage} de {totalPages}
				</Text>

				<TouchableOpacity
					onPress={handleNextPage}
					disabled={currentPage >= totalPages}
					style={styles.navButton}
				>
					<Text
						style={[styles.navIcon, { color: currentPage >= totalPages ? theme.textMuted : theme.text }]}
					>
						Siguiente ›
					</Text>
				</TouchableOpacity>
			</Animated.View>

			{/* FAB Backdrop */}
			<Animated.View
				pointerEvents={fabOpen ? 'auto' : 'none'}
				style={[styles.backdrop, { opacity: backdropAnim }]}
			>
				<Pressable style={StyleSheet.absoluteFill} onPress={closeFab} />
			</Animated.View>

			{/* FAB */}
			<View style={[styles.fabContainer, { bottom: fabBottom }]}>
				<View pointerEvents={fabOpen ? 'auto' : 'none'}>
					{MINI_FABS.map(({ label, color, icon }, i) => {
						const anim = miniFabAnims[i]
						return (
							<Animated.View
								key={label}
								style={{
									opacity: anim,
									transform: [
										{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) },
									],
								}}
							>
								<TouchableOpacity style={styles.miniFabRow} onPress={miniFabHandlers[i]}>
									<View style={[styles.miniFabLabel, { backgroundColor: theme.surface }]}>
										<Text style={[styles.miniFabLabelText, { color: theme.text }]}>{label}</Text>
									</View>
									<View style={[styles.miniFab, { backgroundColor: color }]}>
										<Text style={styles.miniFabIcon}>{icon}</Text>
									</View>
								</TouchableOpacity>
							</Animated.View>
						)
					})}
				</View>

				<TouchableOpacity style={styles.fab} onPress={toggleFab} activeOpacity={1}>
					<ChevronIcon up={!fabOpen} />
				</TouchableOpacity>
			</View>

			{/* Search Panel */}
			{searchOpen && (
				<Animated.View
					style={[
						styles.searchPanel,
						{
							backgroundColor: theme.surface,
							paddingBottom: insets.bottom || 12,
							bottom: keyboardHeight,
							transform: [
								{
									translateY: searchPanelAnim.interpolate({
										inputRange: [0, 1],
										outputRange: [200, 0],
									}),
								},
							],
						},
					]}
					{...panResponder.panHandlers}
				>
					<View style={styles.searchHandle} />

					<View style={styles.searchRow}>
						<TouchableOpacity onPress={closeSearch} style={styles.searchCloseButton}>
							<Text style={[styles.searchCloseIcon, { color: theme.textMuted }]}>✕</Text>
						</TouchableOpacity>

						<TextInput
							style={[
								styles.searchInput,
								{
									color: theme.text,
									borderColor: theme.border,
									backgroundColor: theme.background,
								},
							]}
							placeholder="Buscar en el documento..."
							placeholderTextColor={theme.textMuted}
							value={searchQuery}
							onChangeText={(text) => {
								setSearchQuery(text)
								performSearch(text)
							}}
							autoFocus
							returnKeyType="search"
						/>

						{searchResults.length > 0 && (
							<Text style={[styles.searchCounter, { color: theme.textMuted }]}>
								{currentMatch + 1}/{searchResults.length}
							</Text>
						)}
					</View>

					{searchResults.length > 0 && (
						<View style={styles.searchNavRow}>
							<TouchableOpacity
								onPress={() => goToMatch(currentMatch - 1)}
								style={styles.searchNavButton}
							>
								<Text style={[styles.searchNavText, { color: theme.text }]}>← Anterior</Text>
							</TouchableOpacity>
							<TouchableOpacity
								onPress={() => goToMatch(currentMatch + 1)}
								style={styles.searchNavButton}
							>
								<Text style={[styles.searchNavText, { color: theme.text }]}>Siguiente →</Text>
							</TouchableOpacity>
						</View>
					)}
				</Animated.View>
			)}
		</ScreenWrapper>
	)
}

const styles = StyleSheet.create({
	topBar: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingHorizontal: 4,
		overflow: 'hidden',
		elevation: 4,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.15,
		shadowRadius: 4,
	},
	pdf: {
		flex: 1,
	},
	bottomBar: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		paddingHorizontal: 16,
		overflow: 'hidden',
		elevation: 4,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: -2 },
		shadowOpacity: 0.15,
		shadowRadius: 4,
	},
	barButton: {
		width: 44,
		height: 44,
		alignItems: 'center',
		justifyContent: 'center',
	},
	fileName: {
		flex: 1,
		fontSize: 15,
		fontWeight: '600',
		marginHorizontal: 4,
	},
	pageCount: {
		fontSize: 13,
		marginRight: 4,
	},
	icon: {
		fontSize: 22,
	},
	navButton: {
		paddingVertical: 8,
		paddingHorizontal: 4,
	},
	navIcon: {
		fontSize: 15,
		fontWeight: '600',
	},
	pageIndicator: {
		fontSize: 13,
	},
	backdrop: {
		...StyleSheet.absoluteFillObject,
		backgroundColor: 'rgba(0,0,0,0.35)',
		zIndex: 10,
	},
	fabContainer: {
		position: 'absolute',
		right: 20,
		alignItems: 'flex-end',
		zIndex: 20,
	},
	fab: {
		width: FAB_SIZE,
		height: FAB_SIZE,
		borderRadius: FAB_SIZE / 2,
		backgroundColor: colors.accent.teal,
		alignItems: 'center',
		justifyContent: 'center',
		marginTop: 12,
		elevation: 6,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 3 },
		shadowOpacity: 0.3,
		shadowRadius: 6,
	},
	miniFabRow: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'flex-end',
		height: MINI_FAB_SIZE,
		marginBottom: 12,
	},
	miniFabLabel: {
		paddingHorizontal: 12,
		paddingVertical: 6,
		borderRadius: 8,
		marginRight: 12,
		elevation: 3,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.2,
		shadowRadius: 3,
	},
	miniFabLabelText: {
		fontSize: 13,
		fontWeight: '600',
	},
	miniFab: {
		width: MINI_FAB_SIZE,
		height: MINI_FAB_SIZE,
		borderRadius: MINI_FAB_SIZE / 2,
		alignItems: 'center',
		justifyContent: 'center',
		elevation: 4,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.25,
		shadowRadius: 4,
	},
	miniFabIcon: {
		fontSize: 18,
		color: '#fff',
	},
	searchPanel: {
		position: 'absolute',
		left: 0,
		right: 0,
		bottom: 0,
		borderTopLeftRadius: 16,
		borderTopRightRadius: 16,
		paddingTop: 8,
		paddingHorizontal: 16,
		elevation: 12,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: -3 },
		shadowOpacity: 0.2,
		shadowRadius: 8,
		zIndex: 30,
	},
	searchHandle: {
		width: 40,
		height: 4,
		borderRadius: 2,
		backgroundColor: 'rgba(150,150,150,0.4)',
		alignSelf: 'center',
		marginBottom: 12,
	},
	searchRow: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 8,
		marginBottom: 8,
	},
	searchCloseButton: {
		width: 32,
		height: 32,
		alignItems: 'center',
		justifyContent: 'center',
	},
	searchCloseIcon: {
		fontSize: 16,
	},
	searchInput: {
		flex: 1,
		height: 40,
		borderWidth: 1,
		borderRadius: 10,
		paddingHorizontal: 12,
		fontSize: 15,
	},
	searchCounter: {
		fontSize: 13,
		minWidth: 44,
		textAlign: 'right',
	},
	searchNavRow: {
		flexDirection: 'row',
		justifyContent: 'center',
		gap: 24,
		paddingBottom: 4,
	},
	searchNavButton: {
		paddingVertical: 6,
		paddingHorizontal: 12,
	},
	searchNavText: {
		fontSize: 14,
		fontWeight: '600',
	},
})

export default ViewerScreen
