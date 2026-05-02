import { useEffect, useRef, useState } from 'react'
import { Text, StyleSheet, TouchableOpacity, Animated } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

// Libraries
import Pdf from 'react-native-pdf-jsi'

// Navigation
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native'

import { RootStackParamList } from '../App'

// Stores
import { usePdfStore } from '../store/pdfStore'
import { useThemeStore } from '../store/themeStore'

// Constants
import { colors } from '../constants/theme'

// Components
import ScreenWrapper from '../components/ScreenWrapper/ScreenWrapper'

type ViewerRouteProp = RouteProp<RootStackParamList, 'Viewer'>

const BAR_HEIGHT = 56

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

	const pdfRef = useRef<any>(null)
	const barsAnim = useRef(new Animated.Value(1)).current
	const isNavigatingByButton = useRef(false)
	const isInitialLoad = useRef(true)

	useEffect(() => {
		if (!pdf) navigation.goBack()
	}, [pdf])

	if (!pdf) return null

	const showBars = () => {
		setBarsVisible(true)
		Animated.timing(barsAnim, {
			toValue: 1,
			duration: 200,
			useNativeDriver: true,
		}).start()
	}

	const hideBars = () => {
		Animated.timing(barsAnim, {
			toValue: 0,
			duration: 200,
			useNativeDriver: true,
		}).start(() => setBarsVisible(false))
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

	return (
		<ScreenWrapper>
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

				<Text style={[styles.pageCount, { color: theme.textMuted }]}>
					{currentPage}/{totalPages}
				</Text>
			</Animated.View>

			<Pdf
				ref={pdfRef}
				source={{ uri: pdf.uri }}
				style={styles.pdf}
				fitPolicy={0}
				spacing={8}
				enableAntialiasing
				enableDoubleTapZoom
				onLoadComplete={(numberOfPages) => {
					setTotalPages(numberOfPages)
					updateLastOpened(pdf.id)
				}}
				onPageChanged={handlePageChanged}
				onPageSingleTap={toggleBars}
			/>

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
					<Text style={[styles.navIcon, { color: currentPage <= 1 ? theme.textMuted : theme.text }]}>‹ Anterior</Text>
				</TouchableOpacity>

				<Text style={[styles.pageIndicator, { color: theme.textMuted }]}>
					{currentPage} de {totalPages}
				</Text>

				<TouchableOpacity
					onPress={handleNextPage}
					disabled={currentPage >= totalPages}
					style={styles.navButton}
				>
					<Text style={[styles.navIcon, { color: currentPage >= totalPages ? theme.textMuted : theme.text }]}>Siguiente ›</Text>
				</TouchableOpacity>
			</Animated.View>
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
})

export default ViewerScreen
