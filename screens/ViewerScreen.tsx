import { useEffect, useState } from 'react'
import { View, Text, StyleSheet } from 'react-native'
import Pdf from 'react-native-pdf-jsi'
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native'

import { RootStackParamList } from '../App'
import { usePdfStore } from '../store/pdfStore'
import { useThemeStore } from '../store/themeStore'
import { colors } from '../constants/theme'
import ScreenWrapper from '../components/ScreenWrapper/ScreenWrapper'

type ViewerRouteProp = RouteProp<RootStackParamList, 'Viewer'>

const ViewerScreen = () => {
    const route = useRoute<ViewerRouteProp>()
    const navigation = useNavigation()
    const { pdfs, updateLastOpened } = usePdfStore()
    const { isDark } = useThemeStore()
    const theme = isDark ? colors.dark : colors.light

    const pdf = pdfs.find((p) => p.id === route.params.pdfId)

    const [currentPage, setCurrentPage] = useState(1)
    const [totalPages, setTotalPages] = useState(0)

    useEffect(() => {
        if (!pdf) navigation.goBack()
    }, [pdf])

    if (!pdf) return null

    return (
        <ScreenWrapper>
            <Pdf
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
                onPageChanged={(page) => setCurrentPage(page)}
            />
            {totalPages > 0 && (
                <View style={[styles.pageIndicator, { backgroundColor: theme.surface }]}>
                    <Text style={[styles.pageText, { color: theme.textMuted }]}>
                        {currentPage} / {totalPages}
                    </Text>
                </View>
            )}
        </ScreenWrapper>
    )
}

const styles = StyleSheet.create({
    pdf: {
        flex: 1,
    },
    pageIndicator: {
        position: 'absolute',
        bottom: 24,
        alignSelf: 'center',
        paddingHorizontal: 16,
        paddingVertical: 6,
        borderRadius: 20,
        opacity: 0.9,
    },
    pageText: {
        fontSize: 13,
        fontWeight: '600',
    },
})

export default ViewerScreen
