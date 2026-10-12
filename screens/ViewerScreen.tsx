import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, Pressable, Animated, Alert, BackHandler } from 'react-native'
import Svg, { G, Path } from 'react-native-svg'

// Libraries
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useTranslation } from 'react-i18next'
import * as Print from 'expo-print'

// Navigation
import { RootStackParamList } from '../App'

// Stores
import { usePdfStore } from '../store/pdfStore'
import { useThemeStore } from '../store/themeStore'
import { useBookmarkStore } from '../store/bookmarkStore'
import { useOnboardingStore } from '../store/onboardingStore'

// Hooks
import { useBottomPanel } from '../hooks/useBottomPanel'
import { useKeyboardHeight } from '../hooks/useKeyboardHeight'

// Theme & colors
import { colors } from '../constants/theme'

// Components
import ScreenWrapper from '../components/ScreenWrapper/ScreenWrapper'
import ThemeMenu from '../components/ThemeMenu/ThemeMenu'
import PdfPane from '../components/PdfPane/PdfPane'
import SearchPanel, { type HighlightRect } from '../components/Viewer/SearchPanel'
import BookmarksPanel from '../components/Viewer/BookmarksPanel'
import SummaryPanel from '../components/Viewer/SummaryPanel'
import PasswordPrompt from '../components/Viewer/PasswordPrompt'
import LoadErrorView from '../components/Viewer/LoadErrorView'
import ViewerTourModal from '../components/Onboarding/ViewerTourModal'
import { measureSpotlight, type SpotlightRect } from '../components/Onboarding/spotlight'

type ViewerRouteProp = RouteProp<RootStackParamList, 'Viewer'>
type Panel = 'search' | 'bookmarks' | 'summary'

const BAR_HEIGHT = 56
const FAB_SIZE = 56
const MINI_FAB_SIZE = 44
const PDF_ID = 'ez-pdf-viewer'
const SUMMARY_MAX_PAGES = 100

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
	const { t } = useTranslation()
	const pdfId = route.params.pdfId

	// Selectors keep this screen from re-rendering on unrelated store changes
	const pdf = usePdfStore((state) => state.pdfs.find((p) => p.id === pdfId))
	const updateLastOpened = usePdfStore((state) => state.updateLastOpened)
	const isDark = useThemeStore((state) => state.isDark)
	const addBookmark = useBookmarkStore((state) => state.addBookmark)
	const removeBookmark = useBookmarkStore((state) => state.removeBookmark)
	const hasSeenViewerTour = useOnboardingStore((state) => state.hasSeenViewerTour)
	const markViewerSeen = useOnboardingStore((state) => state.markViewerSeen)
	const onboardingHydrated = useOnboardingStore((state) => state._hasHydrated)
	const theme = isDark ? colors.dark : colors.light

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

	const [currentPage, setCurrentPage] = useState(1)
	const [totalPages, setTotalPages] = useState(0)

	const [barsVisible, setBarsVisible] = useState(true)
	const [fabOpen, setFabOpen] = useState(false)

	const panel = useBottomPanel<Panel>()
	// Height of whichever panel is open, so the FAB can sit above it
	const [panelHeight, setPanelHeight] = useState(0)
	const keyboardHeight = useKeyboardHeight()
	const [searchHighlights, setSearchHighlights] = useState<HighlightRect[]>([])

	// Kept in memory only — never persisted
	const [password, setPassword] = useState('')
	const [passwordPromptOpen, setPasswordPromptOpen] = useState(false)
	const [loadFailed, setLoadFailed] = useState(false)

	const [showTour, setShowTour] = useState(false)
	const [fabRect, setFabRect] = useState<SpotlightRect | null>(null)
	const [bookmarkRect, setBookmarkRect] = useState<SpotlightRect | null>(null)

	const currentPageIsBookmarked = useBookmarkStore((state) => (state.bookmarks[pdfId] ?? []).some((b) => b.page === currentPage))

	const fabRef = useRef<View>(null)
	const bookmarkRef = useRef<View>(null)
	const rootRef = useRef<View>(null)

	const pdfRef = useRef<any>(null)
	const isNavigatingByButton = useRef(false)
	const isInitialLoad = useRef(true)
	const isPrinting = useRef(false)

	const barsAnim = useRef(new Animated.Value(1)).current
	const backdropAnim = useRef(new Animated.Value(0)).current
	const miniFabAnims = useRef(MINI_FABS.map(() => new Animated.Value(0))).current

	useEffect(() => {
		if (!pdf) navigation.goBack()
	}, [pdf])

	useEffect(() => {
		const handler = BackHandler.addEventListener('hardwareBackPress', () => {
			if (!panel.active) return false
			panel.close()
			return true
		})
		return () => handler.remove()
	}, [panel.active, panel.close])

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

	// Stable so SearchPanel's unmount cleanup and PdfPane's memo aren't invalidated every render
	const goToPage = useCallback((page: number) => pdfRef.current?.setPage(page), [])
	const handleHighlightsChange = useCallback(
		(next: HighlightRect[]) => setSearchHighlights((prev) => (prev.length === 0 && next.length === 0 ? prev : next)),
		[],
	)

	// Latest-ref pattern: PdfPane gets callbacks whose identity never changes, so its memo holds,
	// while each call still reaches the handler from the most recent render (assigned further below).
	const pdfEvents = useRef({
		onLoadComplete: (_numberOfPages: number) => {},
		onPageChanged: (_page: number) => {},
		onPageSingleTap: () => {},
		onError: (_error: unknown) => {},
	})
	const stablePdfEvents = useMemo(
		() => ({
			onLoadComplete: (numberOfPages: number) => pdfEvents.current.onLoadComplete(numberOfPages),
			onPageChanged: (page: number) => pdfEvents.current.onPageChanged(page),
			onPageSingleTap: () => pdfEvents.current.onPageSingleTap(),
			onError: (error: unknown) => pdfEvents.current.onError(error),
		}),
		[],
	)

	if (!pdf) return null

	const isProtected = password !== ''

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

	const openPanel = (name: Panel) => {
		if (fabOpen) closeFab()
		panel.open(name)
	}

	const toggleCurrentPageBookmark = () => {
		if (currentPageIsBookmarked) removeBookmark(pdf.id, currentPage)
		else addBookmark(pdf.id, currentPage)
	}

	const goToBookmark = (page: number) => {
		isNavigatingByButton.current = true
		showBars()
		panel.dismiss()
		pdfRef.current?.setPage(page)
	}

	// Both platforms report a locked document with "Password required or incorrect password."
	const handleLoadError = (error: unknown) => {
		const message = error instanceof Error ? error.message : String(error)
		if (/password/i.test(message)) {
			setPasswordPromptOpen(true)
			return
		}
		setLoadFailed(true)
	}

	const submitPassword = (value: string) => {
		setPasswordPromptOpen(false)
		setPassword(value)
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
		if (totalPages > SUMMARY_MAX_PAGES) {
			Alert.alert(t('viewer.summaryPageLimitTitle'), t('viewer.summaryPageLimitMessage', { pages: totalPages }), [{ text: t('common.ok') }], { cancelable: true })
			return
		}
		if (fabOpen) closeFab()
		Alert.alert(
			t('viewer.summaryAlertTitle'),
			t('viewer.summaryAlertMessage'),
			[
				{ text: t('common.no'), style: 'cancel' },
				{ text: t('common.yes'), onPress: () => panel.open('summary') },
			],
			{ cancelable: true },
		)
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

	const miniFabHandlers = [handlePrint, openSummary, () => openPanel('bookmarks'), () => openPanel('search')]

	const handlePageChanged = (page: number) => {
		setCurrentPage(page)
		if (isInitialLoad.current) {
			isInitialLoad.current = false
			return
		}
		if (!isNavigatingByButton.current) hideBars()
		isNavigatingByButton.current = false
	}

	pdfEvents.current = {
		onLoadComplete: (numberOfPages) => {
			setTotalPages(numberOfPages)
			updateLastOpened(pdf.id)
		},
		onPageChanged: handlePageChanged,
		onPageSingleTap: toggleBars,
		onError: handleLoadError,
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
		if (panel.active === 'search' && keyboardHeight === 0) return panelHeight + 10
		if (panel.active === 'bookmarks') return panelHeight + 10
		return (insets.bottom || 0) + BAR_HEIGHT + 16
	})()
	const summaryOpen = panel.active === 'summary'

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

				{/* PDF — unmounted while the password prompt is open so each attempt gets a fresh
				    native view. Swapping it via `key` instead breaks page navigation on Android:
				    the library's PdfManager keeps a single global view reference that the old
				    view's drop nulls out after the new view is created. */}
				{passwordPromptOpen ? (
					<View style={styles.pdf} />
				) : (
					<PdfPane
						pdfRef={pdfRef}
						pdfId={PDF_ID}
						uri={pdf.uri}
						password={password}
						highlightRects={searchHighlights}
						{...stablePdfEvents}
					/>
				)}

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

				{panel.active === 'bookmarks' && (
					<BookmarksPanel
						isDark={isDark}
						anim={panel.anim}
						panHandlers={panel.panHandlers}
						pdfId={pdf.id}
						onClose={panel.close}
						onSelect={goToBookmark}
						onHeightChange={setPanelHeight}
					/>
				)}

				{panel.active === 'summary' && (
					<SummaryPanel
						isDark={isDark}
						anim={panel.anim}
						panHandlers={panel.panHandlers}
						pdfUri={pdf.uri}
						onClose={panel.close}
					/>
				)}

				{panel.active === 'search' && (
					<SearchPanel
						isDark={isDark}
						anim={panel.anim}
						panHandlers={panel.panHandlers}
						pdfId={PDF_ID}
						totalPages={totalPages}
						keyboardHeight={keyboardHeight}
						onClose={panel.close}
						onGoToPage={goToPage}
						onHighlightsChange={handleHighlightsChange}
						onHeightChange={setPanelHeight}
					/>
				)}

				{loadFailed && (
					<LoadErrorView
						isDark={isDark}
						onGoBack={() => navigation.goBack()}
					/>
				)}
			</ScreenWrapper>

			{passwordPromptOpen && (
				<PasswordPrompt
					isDark={isDark}
					fileName={pdf.name}
					isRetry={isProtected}
					onSubmit={submitPassword}
					onCancel={cancelPasswordPrompt}
				/>
			)}

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
})

export default ViewerScreen
