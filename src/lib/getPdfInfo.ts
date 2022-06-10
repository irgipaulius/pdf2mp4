import { getDocument } from "pdfjs-dist";

/** returns size and number of pages of the pdf (buffer) */
export async function getPdfFormatInfo(dataBuffer: Buffer): Promise<{
  numPages: number;
  width: number;
  height: number;
}> {
  const pdfDocument = await getDocument({ data: dataBuffer }).promise;
  // here I am sampling a page N/2 from the PDF, because sometimes book
  // pdfs can have first and last cover pages different aspect ratio
  const page = await pdfDocument.getPage(Math.round(pdfDocument.numPages / 2));
  const viewport = page.getViewport({ scale: 1 });

  return {
    numPages: pdfDocument.numPages,
    width: Math.floor(viewport.width),
    height: Math.floor(viewport.height),
  };
}
