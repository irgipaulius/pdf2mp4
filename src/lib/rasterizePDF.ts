import fs from "fs";
import _ from "lodash";
import { fromPath } from "pdf2pic";
import { WriteImageResponse } from "pdf2pic/dist/types/writeImageResponse";
import { Convert } from "pdf2pic/dist/types/convert";

import { getPdfFormatInfo } from "..";
import EventEmitter from "events";
import { chunkedPromiseAll } from "../utils/differentPromiseAll";
import { ProgressEmitter } from "../utils/progress";

async function storeInChunks(
  storeAsImage: Convert,
  numPages: number,
  e?: EventEmitter
): Promise<WriteImageResponse[]> {
  const unlock = process.env.PDF2MP4_UNLOCK === "true"; // go at max speed, full system utilization
  const lock = process.env.PDF2MP4_UNLOCK === "false"; // go slowly, process pages sequentially

  const maxConcurrency = lock ? 1 : unlock ? 10 : 5; // https://github.com/yakovmeister/pdf2image/issues/54

  const pageNumbers = [...Array(numPages).keys()].map((a) => a + 1);
  const chunks = _.chunk(pageNumbers, maxConcurrency);

  const raster = new ProgressEmitter(
    "progress_raster",
    `Rasterizing`,
    chunks.length,
    e
  );

  // pdf2pic uses ImageMagic, which is a multi-threaded library by default,
  // using worker threads here won't give any benefit.
  // Here I am chunking chunks because .bulk runs out of memory (explained above),
  // and Promise.all completely locks up the system.
  const result = await chunkedPromiseAll(
    chunks.map(
      (chunk) => async () =>
        storeAsImage.bulk!(chunk).then((result) => {
          raster.emitProgress();
          return result as WriteImageResponse[];
        })
    ),
    unlock ? 999 : lock ? 1 : 5
  );

  raster.closingEmit();

  return result.flat();
}

/** turn pdf into a set of images.
 * @param process.env.PDF2MP4_UNLOCK if set to 'true', it will go at max speed. If set to 'false', it will go at slowest speed. Recommended to not set it at all.
 * @param e optional event emitter to receive events throughout each stage of rasterization.
 * >@note emitted events: `progress`
 *
 * >@example
 * ```typescript
 * e.on('progress_raster', (message, progress) => {
 *  console.log(message); // Rasterizing... 69/100
 *  setProgress(progress / 100); // great to use with states in react
 * })
 *
 * await rasterizePDF(..., e);
 * ```
 */
export async function rasterizePDF(
  options: {
    pdfFilePath: string;
    destinationPath: string;
    saveFilename: string;
    /** default is 1080. width is scaled according to the pdf aspect ratio */
    height?: number;
  },
  e?: EventEmitter
) {
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

  return storeInChunks(storeAsImage, numPages, e);
}
