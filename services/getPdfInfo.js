const pdfjs = require("pdfjs-dist");

async function getPdfInfo(dataBuffer) {
  const pdfDocument = await pdfjs.getDocument({ data: dataBuffer }).promise;
  const page = await pdfDocument.getPage(1);
  const viewport = page.getViewport({ scale: 1 });

  return {
    numPages: pdfDocument.numPages,
    width: Math.floor(viewport.width),
    height: Math.floor(viewport.height),
  };
}

module.exports = getPdfInfo;
