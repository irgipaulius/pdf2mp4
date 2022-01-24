import { getDocument } from "pdfjs-dist";

export async function getPdfInfo(dataBuffer) {
  const pdfDocument = await getDocument({ data: dataBuffer }).promise;
  const page = await pdfDocument.getPage(1);
  const viewport = page.getViewport({ scale: 1 });

  return {
    numPages: pdfDocument.numPages,
    width: Math.floor(viewport.width),
    height: Math.floor(viewport.height),
  };
}
