import { useEffect, useMemo, useRef, useState } from 'react'
import {
	View,
	Text,
	StyleSheet,
	TouchableOpacity,
	Pressable,
	Animated,
	FlatList,
	PanResponder,
	TextInput,
	Keyboard,
	Alert,
	BackHandler,
	ScrollView,
	ActivityIndicator,
	Dimensions,
	Modal,
} from 'react-native'
import Svg, { G, Path } from 'react-native-svg'

// Libraries
import Pdf, { searchTextDirect } from 'react-native-pdf-jsi'
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import * as Clipboard from 'expo-clipboard'
import { useTranslation } from 'react-i18next'
import * as Print from 'expo-print'

// Navigation
import { RootStackParamList } from '../App'

// Stores
import { usePdfStore } from '../store/pdfStore'
import { useThemeStore } from '../store/themeStore'
import { useDeviceStore } from '../store/deviceStore'
import { useBookmarkStore } from '../store/bookmarkStore'
import type { Bookmark } from '../store/bookmarkStore'

// Theme & colors
import { colors } from '../constants/theme'

// Components
import ScreenWrapper from '../components/ScreenWrapper/ScreenWrapper'
import ThemeMenu from '../components/ThemeMenu/ThemeMenu'

// Services
import { generateSummary } from '../services/summary'

import ViewerTourModal from '../components/Onboarding/ViewerTourModal'
import { measureSpotlight, type SpotlightRect } from '../components/Onboarding/spotlight'
import { useOnboardingStore } from '../store/onboardingStore'
import type { SummaryResult } from '../services/summary'

const { height: SCREEN_HEIGHT } = Dimensions.get('window')

const formatDate = (ts: number) => {
	const d = new Date(ts)
	const pad = (n: number) => String(n).padStart(2, '0')
	return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

const formatResetDate = (dateStr: string, lang: string): string => {
	const [year, month, day] = dateStr.split('-').map(Number)
	const d = new Date(year, month - 1, day)
	return d.toLocaleDateString(lang, { day: 'numeric', month: 'short' })
}

type ViewerRouteProp = RouteProp<RootStackParamList, 'Viewer'>
type SearchResult = { page: number; text: string; rect: string }

const BAR_HEIGHT = 56
const FAB_SIZE = 56
const MINI_FAB_SIZE = 44
const PDF_ID = 'ez-pdf-viewer'
const MAX_CREDITS = 5

const CHEVRON_PATH = 'm9.71 17.71 5.7-5.71-5.7-5.71-1.42 1.42 4.3 4.29-4.3 4.29z'
const BOOKMARK_FILLED = 'M17 3H7c-1.1 0-2 .9-2 2v16l7-3 7 3V5c0-1.1-.9-2-2-2z'
const BOOKMARK_OUTLINE = 'M17 3H7c-1.1 0-2 .9-2 2v16l7-3 7 3V5c0-1.1-.9-2-2-2zm0 15-5-2.18L7 18V5h10v13z'
const PRINT_PATH =
	'M19 8H5c-1.66 0-3 1.34-3 3v6h4v4h12v-4h4v-6c0-1.66-1.34-3-3-3zm-3 11H8v-5h8v5zm3-7c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm-1-9H6v4h12V3z'

const ChevronIcon = ({ up }: { up: boolean }) => (
	<Svg
		width={24}
		height={24}
		viewBox="0 0 24 24"
	>
		<G transform={up ? 'rotate(270, 12, 12)' : 'rotate(90, 12, 12)'}>
			<Path
				d={CHEVRON_PATH}
				fill="#fff"
			/>
		</G>
	</Svg>
)

const BookmarkIcon = ({ filled, color }: { filled: boolean; color: string }) => (
	<Svg
		width={22}
		height={22}
		viewBox="0 0 24 24"
	>
		<Path
			d={filled ? BOOKMARK_FILLED : BOOKMARK_OUTLINE}
			fill={color}
		/>
	</Svg>
)

const PrintIcon = ({ color }: { color: string }) => (
	<Svg
		width={22}
		height={22}
		viewBox="0 0 24 24"
	>
		<Path
			d={PRINT_PATH}
			fill={color}
		/>
	</Svg>
)

const ViewerScreen = () => {
	const route = useRoute<ViewerRouteProp>()
	const navigation = useNavigation()
	const insets = useSafeAreaInsets()
	const { pdfs, updateLastOpened } = usePdfStore()
	const { isDark } = useThemeStore()
	const { deviceId } = useDeviceStore()
	const theme = isDark ? colors.dark : colors.light
	const { t, i18n } = useTranslation()
	const { hasSeenViewerTour, markViewerSeen, _hasHydrated: onboardingHydrated } = useOnboardingStore()

	const MINI_FABS = [
		{ label: t('viewer.print'), color: colors.accent.orange, renderIcon: () => <PrintIcon color="#fff" /> },
		{ label: t('viewer.aiOverview'), color: colors.accent.teal, renderIcon: () => <Text style={styles.miniFabIcon}>✦</Text> },
		{
			label: t('viewer.bookmarks'),
			color: colors.accent.violet,
			renderIcon: () => (
				<BookmarkIcon
					filled={false}
					color="#fff"
				/>
			),
		},
		{ label: t('viewer.search'), color: colors.accent.blue, renderIcon: () => <Text style={styles.miniFabIcon}>⊙</Text> },
	]

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
	const [searchPanelHeight, setSearchPanelHeight] = useState(150)
	const [bookmarksPanelHeight, setBookmarksPanelHeight] = useState(400)
	const [summaryPanelHeight, setSummaryPanelHeight] = useState(400)

	const [bookmarksOpen, setBookmarksOpen] = useState(false)

	const [summaryOpen, setSummaryOpen] = useState(false)
	const [summaryLoading, setSummaryLoading] = useState(false)
	const [summaryResult, setSummaryResult] = useState<SummaryResult | null>(null)

	// Kept in memory only — never persisted
	const [password, setPassword] = useState('')
	const [passwordInput, setPasswordInput] = useState('')
	const [passwordPromptOpen, setPasswordPromptOpen] = useState(false)
	const [loadFailed, setLoadFailed] = useState(false)

	const [showTour, setShowTour] = useState(false)
	const [fabRect, setFabRect] = useState<SpotlightRect | null>(null)
	const [bookmarkRect, setBookmarkRect] = useState<SpotlightRect | null>(null)

	const fabRef = useRef<View>(null)
	const bookmarkRef = useRef<View>(null)
	const rootRef = useRef<View>(null)

	const pdfRef = useRef<any>(null)
	const isNavigatingByButton = useRef(false)
	const isInitialLoad = useRef(true)
	const isPrinting = useRef(false)

	const barsAnim = useRef(new Animated.Value(1)).current
	const backdropAnim = useRef(new Animated.Value(0)).current
	const searchPanelAnim = useRef(new Animated.Value(0)).current
	const bookmarksPanelAnim = useRef(new Animated.Value(0)).current
	const summaryPanelAnim = useRef(new Animated.Value(0)).current
	const miniFabAnims = useRef(MINI_FABS.map(() => new Animated.Value(0))).current

	const searchDebounce = useRef<ReturnType<typeof setTimeout> | null>(null)
	const closeSearchRef = useRef<() => void>(() => {})
	const closeBookmarksRef = useRef<() => void>(() => {})
	const closeSummaryRef = useRef<() => void>(() => {})

	const panResponder = useRef(
		PanResponder.create({
			onMoveShouldSetPanResponder: (_, { dy, dx }) => dy > 10 && dy > Math.abs(dx),
			onPanResponderRelease: (_, { dy }) => {
				if (dy > 50) closeSearchRef.current()
			},
		}),
	).current

	const bookmarksPanResponder = useRef(
		PanResponder.create({
			onMoveShouldSetPanResponder: (_, { dy, dx }) => dy > 10 && dy > Math.abs(dx),
			onPanResponderRelease: (_, { dy }) => {
				if (dy > 50) closeBookmarksRef.current()
			},
		}),
	).current

	const summaryPanResponder = useRef(
		PanResponder.create({
			onMoveShouldSetPanResponder: (_, { dy, dx }) => dy > 10 && dy > Math.abs(dx),
			onPanResponderRelease: (_, { dy }) => {
				if (dy > 50) closeSummaryRef.current()
			},
		}),
	).current

	const allBookmarks = useBookmarkStore((state) => state.bookmarks)
	const { addBookmark, removeBookmark } = useBookmarkStore()

	const pdfBookmarks = useMemo(() => (allBookmarks[route.params.pdfId] ?? []).slice().sort((a, b) => a.page - b.page), [allBookmarks, route.params.pdfId])

	const currentPageIsBookmarked = useMemo(
		() => (allBookmarks[route.params.pdfId] ?? []).some((b) => b.page === currentPage),
		[allBookmarks, route.params.pdfId, currentPage],
	)

	useEffect(() => {
		if (!pdf) navigation.goBack()
	}, [pdf])

	useEffect(() => {
		const handler = BackHandler.addEventListener('hardwareBackPress', () => {
			if (searchOpen) {
				closeSearchRef.current()
				return true
			}
			if (bookmarksOpen) {
				closeBookmarksRef.current()
				return true
			}
			if (summaryOpen) {
				closeSummaryRef.current()
				return true
			}
			return false
		})
		return () => handler.remove()
	}, [searchOpen, bookmarksOpen, summaryOpen])

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

	useEffect(() => {
		if (!onboardingHydrated || hasSeenViewerTour || totalPages === 0) return
		showBars()
		const timer = setTimeout(() => setShowTour(true), 600)
		return () => clearTimeout(timer)
	}, [onboardingHydrated, hasSeenViewerTour, totalPages])

	// Measure on open: the FAB moves with the panels, so onLayout alone would go stale
	useEffect(() => {
		if (!showTour) return
		measureSpotlight(fabRef.current, rootRef.current, setFabRect)
		measureSpotlight(bookmarkRef.current, rootRef.current, setBookmarkRect)
	}, [showTour])

	const handleTourDismiss = () => {
		setShowTour(false)
		setFabRect(null)
		setBookmarkRect(null)
		markViewerSeen()
	}

	if (!pdf) return null

	const openBookmarks = () => {
		if (fabOpen) closeFab()
		if (summaryOpen) closeSummary()
		if (searchOpen) closeSearchRef.current()
		setBookmarksOpen(true)
		Animated.spring(bookmarksPanelAnim, {
			toValue: 1,
			useNativeDriver: true,
			tension: 100,
			friction: 10,
		}).start()
	}

	const closeBookmarks = () => {
		Animated.timing(bookmarksPanelAnim, { toValue: 0, duration: 250, useNativeDriver: true }).start(() => setBookmarksOpen(false))
	}

	closeBookmarksRef.current = closeBookmarks

	const toggleCurrentPageBookmark = () => {
		if (!pdf) return
		if (currentPageIsBookmarked) {
			removeBookmark(pdf.id, currentPage)
		} else {
			addBookmark(pdf.id, currentPage)
		}
	}

	const openSearch = () => {
		if (fabOpen) closeFab()
		if (bookmarksOpen) closeBookmarks()
		if (summaryOpen) closeSummary()
		setSearchOpen(true)
		Animated.spring(searchPanelAnim, {
			toValue: 1,
			useNativeDriver: true,
			tension: 100,
			friction: 10,
		}).start()
	}

	const closeSearch = () => {
		Animated.timing(searchPanelAnim, { toValue: 0, duration: 250, useNativeDriver: true }).start(() => {
			setSearchOpen(false)
			setSearchQuery('')
			setSearchResults([])
			setCurrentMatch(0)
		})
	}

	closeSearchRef.current = closeSearch

	const isProtected = password !== ''

	// Both platforms report a locked document with "Password required or incorrect password."
	const handleLoadError = (error: unknown) => {
		const message = error instanceof Error ? error.message : String(error)
		if (/password/i.test(message)) {
			setPasswordInput('')
			setPasswordPromptOpen(true)
			return
		}
		setLoadFailed(true)
	}

	const submitPassword = () => {
		if (!passwordInput) return
		setPasswordPromptOpen(false)
		setPassword(passwordInput)
	}

	const cancelPasswordPrompt = () => {
		setPasswordPromptOpen(false)
		navigation.goBack()
	}

	const alertProtectedUnsupported = () => {
		if (fabOpen) closeFab()
		Alert.alert(t('viewer.protectedUnsupportedTitle'), t('viewer.protectedUnsupportedMessage'), [{ text: t('common.ok') }])
	}

	const openSummary = () => {
		if (isProtected) {
			alertProtectedUnsupported()
			return
		}
		if (totalPages > 100) {
			Alert.alert(t('viewer.summaryPageLimitTitle'), t('viewer.summaryPageLimitMessage', { pages: totalPages }), [{ text: t('common.ok') }], { cancelable: true })
			return
		}
		if (fabOpen) closeFab()
		Alert.alert(
			t('viewer.summaryAlertTitle'),
			t('viewer.summaryAlertMessage'),
			[
				{ text: t('common.no'), style: 'cancel' },
				{ text: t('common.yes'), onPress: handleGenerateSummary },
			],
			{ cancelable: true },
		)
	}

	const handleGenerateSummary = async () => {
		if (summaryOpen) {
			setSummaryResult(null)
			setSummaryLoading(true)
		} else {
			setSummaryOpen(true)
			setSummaryLoading(true)
			setSummaryResult(null)
			Animated.spring(summaryPanelAnim, {
				toValue: 1,
				useNativeDriver: true,
				tension: 100,
				friction: 10,
			}).start()
		}

		const result = await generateSummary(deviceId, pdf.uri)
		setSummaryResult(result)
		setSummaryLoading(false)
	}

	const closeSummary = () => {
		Animated.timing(summaryPanelAnim, { toValue: 0, duration: 250, useNativeDriver: true }).start(() => {
			setSummaryOpen(false)
			setSummaryResult(null)
			setSummaryLoading(false)
		})
	}

	closeSummaryRef.current = closeSummary

	const renderSummaryContent = () => {
		if (summaryLoading) {
			return (
				<View style={styles.summaryState}>
					<ActivityIndicator
						size="large"
						color={colors.accent.teal}
					/>
					<Text style={[styles.summaryStateMessage, { color: theme.textMuted }]}>{t('viewer.generating')}</Text>
				</View>
			)
		}

		if (!summaryResult) return null

		if (summaryResult.ok) {
			return (
				<>
					<ScrollView
						showsVerticalScrollIndicator
						style={styles.summaryScroll}
					>
						<View style={[styles.summaryBox, { borderColor: colors.accent.teal, backgroundColor: theme.background }]}>
							<Text style={[styles.summaryText, { color: theme.text }]}>{summaryResult.summary}</Text>
						</View>
					</ScrollView>

					<View style={[styles.creditSection, { borderTopColor: theme.border }]}>
						<Text style={[styles.creditLabel, { color: theme.textMuted }]}>{t('viewer.creditsUsed', { used: summaryResult.used_count, max: MAX_CREDITS })}</Text>
						<View style={[styles.progressTrack, { backgroundColor: theme.border }]}>
							<View
								style={[
									styles.progressFill,
									{
										width: `${(summaryResult.used_count / MAX_CREDITS) * 100}%`,
										backgroundColor: colors.accent.teal,
									},
								]}
							/>
						</View>
						<Text style={[styles.resetDate, { color: theme.textMuted }]}>
							{t('viewer.renewsOn', { date: formatResetDate(summaryResult.reset_date, i18n.language) })}
						</Text>
					</View>

					<TouchableOpacity
						style={[styles.copyButton, { backgroundColor: colors.accent.teal }]}
						onPress={() => Clipboard.setStringAsync((summaryResult as Extract<SummaryResult, { ok: true }>).summary)}
					>
						<Text style={styles.copyButtonText}>{t('viewer.copySummary')}</Text>
					</TouchableOpacity>
				</>
			)
		}

		if (summaryResult.limitReached) {
			return (
				<View style={styles.summaryState}>
					<Text style={styles.summaryStateIcon}>📋</Text>
					<Text style={[styles.summaryStateTitle, { color: theme.text }]}>{t('viewer.limitTitle')}</Text>
					<Text style={[styles.summaryStateMessage, { color: theme.textMuted }]}>
						{t('viewer.renewsOn', { date: formatResetDate(summaryResult.reset_date, i18n.language) })}
					</Text>
				</View>
			)
		}

		return (
			<View style={styles.summaryState}>
				<Text style={styles.summaryStateIcon}>⚠️</Text>
				<Text style={[styles.summaryStateTitle, { color: theme.text }]}>{t('viewer.errorTitle')}</Text>
				<Text style={[styles.summaryStateMessage, { color: theme.textMuted }]}>{t('viewer.errorMessage')}</Text>
			</View>
		)
	}

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
				if (results.length > 0) {
					pdfRef.current?.setPage(results[0].page)
				}
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

	const handlePrint = async () => {
		if (isProtected) {
			alertProtectedUnsupported()
			return
		}
		if (fabOpen) closeFab()
		if (isPrinting.current) return
		isPrinting.current = true

		try {
			await Print.printAsync({
				uri: pdf.uri,
				margins: {
					top: 10,
					bottom: 10,
					left: 10,
					right: 10,
				},
			})
		} catch (error) {
			Alert.alert(t('viewer.printErrorTitle'), t('viewer.printErrorMessage'))
		} finally {
			isPrinting.current = false
		}
	}

	const miniFabHandlers = [handlePrint, openSummary, openBookmarks, openSearch]

	const openFab = () => {
		setFabOpen(true)
		Animated.parallel([
			Animated.timing(backdropAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
			Animated.stagger(
				60,
				[...miniFabAnims].reverse().map((anim) => Animated.spring(anim, { toValue: 1, useNativeDriver: true, tension: 120, friction: 8 })),
			),
		]).start()
	}

	const closeFab = () => {
		Animated.parallel([
			Animated.timing(backdropAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
			Animated.stagger(
				40,
				miniFabAnims.map((anim) => Animated.timing(anim, { toValue: 0, duration: 150, useNativeDriver: true })),
			),
		]).start(() => setFabOpen(false))
	}

	const showBars = () => {
		setBarsVisible(true)
		Animated.timing(barsAnim, { toValue: 1, duration: 200, useNativeDriver: true }).start()
	}

	const hideBars = () => {
		if (fabOpen) closeFab()
		Animated.timing(barsAnim, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => setBarsVisible(false))
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
	const fabBottom = (() => {
		if (searchOpen && keyboardHeight === 0) return searchPanelHeight + 10
		if (bookmarksOpen) return bookmarksPanelHeight + 10
		return (insets.bottom || 0) + BAR_HEIGHT + 16
	})()

	return (
		<>
			<ScreenWrapper ref={rootRef}>
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
					<TouchableOpacity
						onPress={() => navigation.goBack()}
						style={styles.barButton}
					>
						<Text style={[styles.icon, { color: theme.text }]}>←</Text>
					</TouchableOpacity>

					<Text
						style={[styles.fileName, { color: theme.text }]}
						numberOfLines={1}
					>
						{pdf.name}
					</Text>

					<TouchableOpacity
						ref={bookmarkRef}
						onPress={toggleCurrentPageBookmark}
						style={styles.barButton}
					>
						<BookmarkIcon
							filled={currentPageIsBookmarked}
							color={currentPageIsBookmarked ? colors.accent.violet : theme.textMuted}
						/>
					</TouchableOpacity>

					<Text style={[styles.pageCount, { color: theme.textMuted }]}>
						{currentPage}/{totalPages}
					</Text>

					<ThemeMenu
						isDark={isDark}
						barHeight={BAR_HEIGHT}
						setShowTour={setShowTour}
					/>
				</Animated.View>

				{/* PDF */}
				<Pdf
					// Remount on each password attempt so both platforms reload the document
					key={password}
					ref={pdfRef}
					pdfId={PDF_ID}
					source={{ uri: pdf.uri }}
					password={password}
					onError={handleLoadError}
					style={styles.pdf}
					fitPolicy={0}
					scale={1}
					minScale={0.5}
					maxScale={5}
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
						<Text style={[styles.navIcon, { color: currentPage <= 1 ? theme.textMuted : theme.text }]}>{t('viewer.previous')}</Text>
					</TouchableOpacity>

					<Text style={[styles.pageIndicator, { color: theme.textMuted }]}>{t('viewer.pageOf', { current: currentPage, total: totalPages })}</Text>

					<TouchableOpacity
						onPress={handleNextPage}
						disabled={currentPage >= totalPages}
						style={styles.navButton}
					>
						<Text style={[styles.navIcon, { color: currentPage >= totalPages ? theme.textMuted : theme.text }]}>{t('viewer.next')}</Text>
					</TouchableOpacity>
				</Animated.View>

				{/* FAB Backdrop */}
				<Animated.View
					pointerEvents={fabOpen ? 'auto' : 'none'}
					style={[styles.backdrop, { opacity: backdropAnim }]}
				>
					<Pressable
						style={StyleSheet.absoluteFill}
						onPress={closeFab}
					/>
				</Animated.View>

				{/* FAB */}
				<View
					style={[styles.fabContainer, { bottom: fabBottom, opacity: summaryOpen ? 0 : 1 }]}
					pointerEvents={summaryOpen ? 'none' : 'box-none'}
				>
					<View pointerEvents={fabOpen ? 'auto' : 'none'}>
						{MINI_FABS.map(({ label, color, renderIcon }, i) => {
							const anim = miniFabAnims[i]
							return (
								<Animated.View
									key={label}
									style={{
										opacity: anim,
										transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }],
									}}
								>
									<TouchableOpacity
										style={styles.miniFabRow}
										onPress={miniFabHandlers[i]}
									>
										<View style={[styles.miniFabLabel, { backgroundColor: theme.surface }]}>
											<Text style={[styles.miniFabLabelText, { color: theme.text }]}>{label}</Text>
										</View>
										<View style={[styles.miniFab, { backgroundColor: color }]}>{renderIcon()}</View>
									</TouchableOpacity>
								</Animated.View>
							)
						})}
					</View>

					<TouchableOpacity
						ref={fabRef}
						style={styles.fab}
						onPress={() => (fabOpen ? closeFab() : openFab())}
						activeOpacity={1}
					>
						<ChevronIcon up={!fabOpen} />
					</TouchableOpacity>
				</View>

				{/* Bookmarks Panel */}
				{bookmarksOpen && (
					<Animated.View
						onLayout={(e) => setBookmarksPanelHeight(e.nativeEvent.layout.height)}
						style={[
							styles.bottomPanel,
							{
								backgroundColor: theme.surface,
								paddingBottom: insets.bottom || 12,
								transform: [
									{
										translateY: bookmarksPanelAnim.interpolate({
											inputRange: [0, 1],
											outputRange: [400, 0],
										}),
									},
								],
							},
						]}
						{...bookmarksPanResponder.panHandlers}
					>
						<View style={styles.panelHandle} />

						<View style={styles.panelHeader}>
							<Text style={[styles.panelTitle, { color: theme.text }]}>{t('viewer.bookmarksTitle')}</Text>
							<TouchableOpacity
								onPress={closeBookmarks}
								style={styles.panelCloseButton}
							>
								<Text style={[styles.panelCloseIcon, { color: theme.textMuted }]}>✕</Text>
							</TouchableOpacity>
						</View>

						{pdfBookmarks.length === 0 ? (
							<View style={styles.bookmarksEmpty}>
								<Text style={[styles.bookmarksEmptyText, { color: theme.textMuted }]}>{t('viewer.noBookmarks')}</Text>
							</View>
						) : (
							<FlatList
								data={pdfBookmarks}
								keyExtractor={(item) => `${item.page}`}
								renderItem={({ item }: { item: Bookmark }) => (
									<TouchableOpacity
										style={[styles.bookmarkItem, { borderBottomColor: theme.border }]}
										onPress={() => {
											isNavigatingByButton.current = true
											showBars()
											bookmarksPanelAnim.setValue(0)
											setBookmarksOpen(false)
											pdfRef.current?.setPage(item.page)
										}}
									>
										<View style={styles.bookmarkItemLeft}>
											<Text style={[styles.bookmarkPage, { color: colors.accent.violet }]}>{t('viewer.page', { page: item.page })}</Text>
											<Text style={[styles.bookmarkDate, { color: theme.textMuted }]}>{formatDate(item.createdAt)}</Text>
										</View>
										<TouchableOpacity
											onPress={() => removeBookmark(pdf!.id, item.page)}
											style={styles.bookmarkDeleteButton}
											hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
										>
											<Svg
												width={18}
												height={18}
												viewBox="0 0 24 24"
												fill="none"
											>
												<Path
													d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"
													stroke={colors.accent.red}
													strokeWidth={2}
													strokeLinecap="round"
													strokeLinejoin="round"
												/>
											</Svg>
										</TouchableOpacity>
									</TouchableOpacity>
								)}
							/>
						)}
					</Animated.View>
				)}

				{/* Summary Panel */}
				{summaryOpen && (
					<Animated.View
						onLayout={(e) => setSummaryPanelHeight(e.nativeEvent.layout.height)}
						style={[
							styles.bottomPanel,
							styles.summaryPanel,
							{
								backgroundColor: theme.surface,
								paddingBottom: insets.bottom || 12,
								transform: [
									{
										translateY: summaryPanelAnim.interpolate({
											inputRange: [0, 1],
											outputRange: [600, 0],
										}),
									},
								],
							},
						]}
						{...summaryPanResponder.panHandlers}
					>
						<View style={styles.panelHandle} />

						<View style={styles.panelHeader}>
							<Text style={[styles.panelTitle, { color: theme.text }]}>{t('viewer.summaryTitle')}</Text>
							<TouchableOpacity
								onPress={closeSummary}
								style={styles.panelCloseButton}
							>
								<Text style={[styles.panelCloseIcon, { color: theme.textMuted }]}>✕</Text>
							</TouchableOpacity>
						</View>

						{renderSummaryContent()}
					</Animated.View>
				)}

				{/* Search Panel */}
				{searchOpen && (
					<Animated.View
						onLayout={(e) => setSearchPanelHeight(e.nativeEvent.layout.height)}
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
						<View style={styles.panelHandle} />

						<View style={styles.searchRow}>
							<TouchableOpacity
								onPress={closeSearch}
								style={styles.panelCloseButton}
							>
								<Text style={[styles.panelCloseIcon, { color: theme.textMuted }]}>✕</Text>
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
								placeholder={t('viewer.searchPlaceholder')}
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
									<Text style={[styles.searchNavText, { color: theme.text }]}>{t('viewer.searchPrev')}</Text>
								</TouchableOpacity>
								<TouchableOpacity
									onPress={() => goToMatch(currentMatch + 1)}
									style={styles.searchNavButton}
								>
									<Text style={[styles.searchNavText, { color: theme.text }]}>{t('viewer.searchNext')}</Text>
								</TouchableOpacity>
							</View>
						)}
					</Animated.View>
				)}

				{/* Load error */}
				{loadFailed && (
					<View style={[styles.loadError, { backgroundColor: theme.background }]}>
						<Text style={styles.summaryStateIcon}>⚠️</Text>
						<Text style={[styles.summaryStateTitle, { color: theme.text }]}>{t('viewer.loadErrorTitle')}</Text>
						<Text style={[styles.summaryStateMessage, { color: theme.textMuted }]}>{t('viewer.loadErrorMessage')}</Text>
						<TouchableOpacity
							style={[styles.copyButton, styles.loadErrorButton, { backgroundColor: colors.accent.violet }]}
							onPress={() => navigation.goBack()}
						>
							<Text style={styles.copyButtonText}>{t('viewer.goBack')}</Text>
						</TouchableOpacity>
					</View>
				)}
			</ScreenWrapper>

			{/* Password prompt */}
			<Modal
				visible={passwordPromptOpen}
				transparent
				animationType="fade"
				onRequestClose={cancelPasswordPrompt}
			>
				<View style={styles.passwordBackdrop}>
					<View style={[styles.passwordDialog, { backgroundColor: theme.surface }]}>
						<Text style={styles.summaryStateIcon}>🔒</Text>
						<Text style={[styles.summaryStateTitle, { color: theme.text }]}>{t('viewer.passwordTitle')}</Text>
						<Text style={[styles.summaryStateMessage, { color: isProtected ? colors.accent.orange : theme.textMuted }]}>
							{isProtected ? t('viewer.passwordIncorrect') : t('viewer.passwordMessage', { name: pdf.name })}
						</Text>
						<TextInput
							value={passwordInput}
							onChangeText={setPasswordInput}
							onSubmitEditing={submitPassword}
							placeholder={t('viewer.passwordPlaceholder')}
							placeholderTextColor={theme.textMuted}
							secureTextEntry
							autoFocus
							autoCapitalize="none"
							autoCorrect={false}
							returnKeyType="done"
							style={[styles.searchInput, styles.passwordInput, { color: theme.text, borderColor: theme.border }]}
						/>
						<View style={styles.passwordActions}>
							<TouchableOpacity
								style={styles.searchNavButton}
								onPress={cancelPasswordPrompt}
							>
								<Text style={[styles.searchNavText, { color: theme.textMuted }]}>{t('common.cancel')}</Text>
							</TouchableOpacity>
							<TouchableOpacity
								style={styles.searchNavButton}
								onPress={submitPassword}
								disabled={!passwordInput}
							>
								<Text style={[styles.searchNavText, { color: passwordInput ? colors.accent.violet : theme.textMuted }]}>{t('viewer.passwordOpen')}</Text>
							</TouchableOpacity>
						</View>
					</View>
				</View>
			</Modal>

			<ViewerTourModal
				visible={showTour}
				fabRect={fabRect}
				bookmarkRect={bookmarkRect}
				onDismiss={handleTourDismiss}
			/>
		</>
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
		zIndex: 35,
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
	// Shared bottom panel base
	bottomPanel: {
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
	summaryPanel: {
		maxHeight: SCREEN_HEIGHT * 0.78,
	},
	panelHandle: {
		width: 40,
		height: 4,
		borderRadius: 2,
		backgroundColor: 'rgba(150,150,150,0.4)',
		alignSelf: 'center',
		marginBottom: 12,
	},
	panelHeader: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		marginBottom: 12,
	},
	panelTitle: {
		fontSize: 16,
		fontWeight: '700',
	},
	panelCloseButton: {
		width: 32,
		height: 32,
		alignItems: 'center',
		justifyContent: 'center',
	},
	panelCloseIcon: {
		fontSize: 16,
	},
	// Bookmarks
	bookmarksEmpty: {
		paddingVertical: 32,
		alignItems: 'center',
	},
	bookmarksEmptyText: {
		fontSize: 14,
		textAlign: 'center',
		lineHeight: 20,
	},
	bookmarkItem: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		paddingVertical: 14,
		borderBottomWidth: StyleSheet.hairlineWidth,
	},
	bookmarkItemLeft: {
		flex: 1,
	},
	bookmarkPage: {
		fontSize: 15,
		fontWeight: '600',
	},
	bookmarkDate: {
		fontSize: 12,
		marginTop: 2,
	},
	bookmarkDeleteButton: {
		width: 32,
		height: 32,
		alignItems: 'center',
		justifyContent: 'center',
	},
	bookmarkIcon: {
		fontSize: 20,
	},
	// Summary content
	summaryScroll: {
		flexGrow: 0,
	},
	summaryBox: {
		borderLeftWidth: 3,
		borderRadius: 4,
		padding: 14,
		marginBottom: 16,
	},
	summaryText: {
		fontSize: 14,
		lineHeight: 22,
	},
	creditSection: {
		gap: 6,
		paddingTop: 12,
		marginHorizontal: 16,
		marginBottom: 12,
		borderTopWidth: StyleSheet.hairlineWidth,
	},
	creditLabel: {
		fontSize: 13,
		fontWeight: '600',
	},
	progressTrack: {
		height: 6,
		borderRadius: 3,
		overflow: 'hidden',
	},
	progressFill: {
		height: 6,
		borderRadius: 3,
	},
	resetDate: {
		fontSize: 12,
	},
	copyButton: {
		borderRadius: 10,
		paddingVertical: 13,
		alignItems: 'center',
	},
	copyButtonText: {
		color: '#fff',
		fontSize: 15,
		fontWeight: '600',
	},
	summaryState: {
		alignItems: 'center',
		paddingVertical: 36,
		gap: 10,
	},
	summaryStateIcon: {
		fontSize: 44,
	},
	summaryStateTitle: {
		fontSize: 16,
		fontWeight: '600',
		textAlign: 'center',
	},
	summaryStateMessage: {
		fontSize: 14,
		textAlign: 'center',
	},
	// Search panel
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
	searchRow: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 8,
		marginBottom: 8,
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
	// Load error & password prompt
	loadError: {
		...StyleSheet.absoluteFillObject,
		alignItems: 'center',
		justifyContent: 'center',
		paddingHorizontal: 32,
		gap: 10,
		zIndex: 60,
	},
	loadErrorButton: {
		marginTop: 12,
		paddingHorizontal: 32,
	},
	passwordBackdrop: {
		flex: 1,
		backgroundColor: 'rgba(0,0,0,0.55)',
		alignItems: 'center',
		justifyContent: 'center',
		paddingHorizontal: 24,
	},
	passwordDialog: {
		width: '100%',
		maxWidth: 400,
		borderRadius: 16,
		paddingTop: 24,
		paddingHorizontal: 20,
		paddingBottom: 8,
		alignItems: 'center',
		gap: 10,
	},
	passwordInput: {
		flex: 0,
		alignSelf: 'stretch',
		height: 44,
		marginTop: 6,
	},
	passwordActions: {
		flexDirection: 'row',
		alignSelf: 'flex-end',
		gap: 8,
	},
})

export default ViewerScreen
