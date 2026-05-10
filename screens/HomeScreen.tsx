import { useState, useMemo } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native'
// Navigation
import { useNavigation } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { RootStackParamList } from '../App'

// Theme & colors
import { useThemeStore } from '../store/themeStore'
import { colors } from '../constants/theme'

// Stores
import { usePdfStore, PDF } from '../store/pdfStore'

// Services
import { pickPDF } from '../services/filePicker'

// Components
import ScreenWrapper from '../components/ScreenWrapper/ScreenWrapper'
import AppBar from '../components/AppBar/AppBar'
import SearchBar from '../components/SearchBar/SearchBar'
import RecentCarousel from '../components/RecentCarousel/RecentCarousel'
import PDFListItem from '../components/PDFListItem/PDFListItem'
import EmptyState from '../components/EmptyState/EmptyState'

type HomeNavProp = NativeStackNavigationProp<RootStackParamList, 'Home'>

const HomeScreen = () => {
	const navigation = useNavigation<HomeNavProp>()
	const { pdfs, addPdf, _hasHydrated } = usePdfStore()
	const { isDark } = useThemeStore()
	const theme = isDark ? colors.dark : colors.light

	const [searchQuery, setSearchQuery] = useState('')

	const recentPDFs = useMemo(() => {
		return [...pdfs].sort((a, b) => b.lastOpened - a.lastOpened).slice(0, 5)
	}, [pdfs])

	const filteredPDFs = useMemo(() => {
		if (!searchQuery.trim()) return pdfs

		return pdfs.filter((p) => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
	}, [pdfs, searchQuery])

	const handleFABPress = async () => {
		const pdf = await pickPDF()
		if (pdf) addPdf(pdf)
	}

	const handlePdfPress = (pdfs: PDF) => {
		navigation.navigate('Viewer', { pdfId: pdfs.id })
	}

	if (!_hasHydrated) {
		return (
			<View style={[styles.container, { backgroundColor: theme.background }]}>
				<Text style={{ color: theme.textMuted, textAlign: 'center', marginTop: 60 }}>Cargando...</Text>
			</View>
		)
	}

	return (
		<ScreenWrapper>
			<AppBar
				isDark={isDark}
				pdfCount={pdfs.length}
			/>
			<SearchBar
				isDark={isDark}
				value={searchQuery}
				onChangeText={setSearchQuery}
			/>
			{pdfs.length === 0 ? (
				<EmptyState
					isDark={isDark}
					onImport={handleFABPress}
				/>
			) : (
				<FlatList
					data={filteredPDFs}
					keyExtractor={(item) => item.id}
					ListHeaderComponent={
						recentPDFs.length > 0 ? (
							<View>
								<RecentCarousel
									isDark={isDark}
									pdfs={recentPDFs}
									onPress={handlePdfPress}
								/>
								<Text style={[styles.sectionTitle, { color: theme.text }]}>Todos</Text>
							</View>
						) : null
					}
					renderItem={({ item }) => (
						<PDFListItem
							isDark={isDark}
							pdf={item}
							onPress={handlePdfPress}
						/>
					)}
					ListEmptyComponent={<Text style={[styles.emptySearch, { color: theme.textMuted }]}>No se encontraron resultados</Text>}
				/>
			)}
			<TouchableOpacity
				style={styles.fab}
				onPress={handleFABPress}
			>
				<Text style={styles.fabIcon}>+</Text>
			</TouchableOpacity>

		</ScreenWrapper>
	)
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	statusBarBG: {
		position: 'absolute',
		top: 0,
		left: 0,
		right: 0,
	},
	sectionTitle: {
		fontSize: 18,
		fontWeight: 'bold',
		marginHorizontal: 20,
		marginTop: 20,
		marginBottom: 4,
	},
	emptySearch: {
		textAlign: 'center',
		marginTop: 40,
		fontSize: 15,
	},
	fab: {
		position: 'absolute',
		bottom: 64,
		right: 24,
		width: 56,
		height: 56,
		borderRadius: 28,
		backgroundColor: colors.accent.teal,
		alignItems: 'center',
		justifyContent: 'center',
		elevation: 6,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.3,
		shadowRadius: 4,
	},
	fabIcon: {
		color: '#fff',
		fontSize: 32,
		lineHeight: 36,
	},
})

export default HomeScreen
