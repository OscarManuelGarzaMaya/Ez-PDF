import {
	View,
	Text,
	StyleSheet,
	TouchableOpacity,
	FlatList,
} from 'react-native'

// Navigation
import { useNavigation } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { RootStackParamList } from '../App'

import { useThemeStore } from '../store/themeStore'

// Stores
import { usePdfStore } from '../store/pdfStore'

// Services
import { pickPDF } from '../services/filePicker'

type HomeNavProp = NativeStackNavigationProp<RootStackParamList, 'Home'>

const HomeScreen = () => {
	const { pdfs, addPdf, _hasHydrated } = usePdfStore()

	if (!_hasHydrated) {
		return (
			<View style={styles.container}>
				<Text style={styles.emptyText}>Cargando...</Text>
			</View>
		)
	}

	const handleFABPress = async () => {
		const pdf = await pickPDF()
		if (pdf) addPdf(pdf)
	}

	const navigation = useNavigation<HomeNavProp>()

	const { isDark, toggleTheme } = useThemeStore()

	return (
		<View style={styles.container}>
			<FlatList
				data={pdfs}
				keyExtractor={(item) => item.id}
				renderItem={({ item }) => (
					<View style={styles.pdfItem}>
						<Text style={styles.pdfName}>{item.name}</Text>
						<Text style={styles.pdfSize}>{(item.size / 1024).toFixed(1)} KB</Text>
					</View>
				)}
				ListEmptyComponent={
					<Text style={styles.emptyText}>No hay PDFs importados aún</Text>
				}
			/>
			<TouchableOpacity
				style={styles.fab}
				onPress={handleFABPress}
			>
				<Text style={styles.fabIcon}>+</Text>
			</TouchableOpacity>
		</View>
	)
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#0B0D14',
	},
	pdfItem: {
		padding: 16,
		borderBottomWidth: 1,
		borderBottomColor: '#ffffff20',
	},
	pdfName: {
		color: '#fff',
		fontSize: 16,
	},
	pdfSize: {
		color: '#ffffff70',
		fontSize: 12,
		marginTop: 4,
	},
	emptyText: {
		color: '#ffffff50',
		textAlign: 'center',
		marginTop: 60,
		fontSize: 16,
	},
	fab: {
		position: 'absolute',
		bottom: 32,
		right: 24,
		width: 56,
		height: 56,
		borderRadius: 28,
		backgroundColor: '#00C9B1',
		alignItems: 'center',
		justifyContent: 'center',
		elevation: 6,
	},
	fabIcon: {
		color: '#fff',
		fontSize: 32,
		lineHeight: 36,
	},
})

export default HomeScreen
