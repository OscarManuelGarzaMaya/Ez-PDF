import { memo, useMemo, type RefObject } from 'react'
import { StyleSheet } from 'react-native'
import Pdf from 'react-native-pdf-jsi'

type Props = {
	pdfRef: RefObject<any>
	pdfId: string
	uri: string
	password: string
	highlightRects: { page: number; rect: string }[]
	onLoadComplete: (numberOfPages: number) => void
	onPageChanged: (page: number) => void
	onPageSingleTap: () => void
	onError: (error: unknown) => void
}

// Memoized so the native PdfView only receives prop updates when its inputs actually change,
// not on every ViewerScreen re-render. Callers must pass stable callbacks and a memoized
// highlightRects array, otherwise memo has nothing to skip.
const PdfPane = ({ pdfRef, pdfId, uri, password, highlightRects, onLoadComplete, onPageChanged, onPageSingleTap, onError }: Props) => {
	const source = useMemo(() => ({ uri }), [uri])

	return (
		<Pdf
			ref={pdfRef}
			pdfId={pdfId}
			source={source}
			password={password}
			onError={onError}
			style={styles.pdf}
			fitPolicy={0}
			scale={1}
			minScale={0.5}
			maxScale={5}
			spacing={8}
			enableAntialiasing
			enableDoubleTapZoom
			highlightRects={highlightRects}
			onLoadComplete={onLoadComplete}
			onPageChanged={onPageChanged}
			onPageSingleTap={onPageSingleTap}
		/>
	)
}

const styles = StyleSheet.create({
	pdf: {
		flex: 1,
	},
})

export default memo(PdfPane)
