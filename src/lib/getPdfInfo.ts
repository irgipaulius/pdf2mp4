import { getDocument } from "pdfjs-dist";

/** returns size and resolution of the pdf. useful for estimating final size and processing time */
export async function getPdfFormatInfo(dataBuffer: Buffer): Promise<{
  numPages: number;
  width: number;
  height: number;
}> {
  const pdfDocument = await getDocument({ data: dataBuffer }).promise;
  const page = await pdfDocument.getPage(1);
  const viewport = page.getViewport({ scale: 1 });

  return {
    numPages: pdfDocument.numPages,
    width: Math.floor(viewport.width),
    height: Math.floor(viewport.height),
  };
}
