import fs from "fs";
import _ from "lodash";
import { fromPath } from "pdf2pic";
import { WriteImageResponse } from "pdf2pic/dist/types/writeImageResponse";
import { Convert } from "pdf2pic/dist/types/convert";

import { getPdfFormatInfo } from "..";

async function storeInChunks(
  storeAsImage: Convert,
  numPages: number
): Promise<WriteImageResponse[]> {
  const pageNumbers = [...Array(numPages).keys()].map((a) => a + 1);
  const chunks = _.chunk(pageNumbers, 5); // https://github.com/yakovmeister/pdf2image/issues/54

  // pdf2pic uses ImageMagic, which uses multi-threading by itself.
  // using worker threads here won't give any benefit, Promise.all is just as fast.
  return Promise.all(chunks.map((chunk) => storeAsImage.bulk!(chunk))).then(
    (result) => result.flat()
  );
}

/** turn pdf into a set of images. */
export async function rasterizePDF(options: {
  pdfFilePath: string;
  destinationPath: string;
  saveFilename: string;
  /** default is 1080. width is scaled according to the pdf aspect ratio */
  height?: number;
}) {
  const { pdfFilePath, destinationPath, saveFilename, height } = options;

  let dataBuffer = fs.readFileSync(pdfFilePath);
  const pdfInfo = await getPdfFormatInfo(dataBuffer);
  const numPages = pdfInfo.numPages;
  const finalHeight = height || 1080;
  const finalWidth = (finalHeight / pdfInfo.height) * pdfInfo.width;

  const storeAsImage = fromPath(pdfFilePath, {
    density: 96, // <- https://stackoverflow.com/a/42510645
    saveFilename,
    savePath: destinationPath,
    format: "png",
    height: finalHeight,
    width: finalWidth,
  });

  return storeInChunks(storeAsImage, numPages);
}
