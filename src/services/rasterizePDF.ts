import { fromPath } from "pdf2pic";
import _ from "lodash";
import { WriteImageResponse } from "pdf2pic/dist/types/writeImageResponse";
import { Convert } from "pdf2pic/dist/types/convert";

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

export async function rasterizePDF(
  pdfPath: string,
  destinationPath: string,
  saveFilename: string,
  width: number,
  height: number,
  numPages: number
) {
  const storeAsImage = fromPath(pdfPath, {
    density: 96, // <- https://stackoverflow.com/a/42510645
    saveFilename,
    savePath: destinationPath,
    format: "png",
    height,
    width,
  });

  return storeInChunks(storeAsImage, numPages);
}
