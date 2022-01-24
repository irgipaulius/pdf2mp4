import { fromPath } from "pdf2pic";
import _ from "lodash";

export async function rasterizePDF(
  filePath: string,
  destinationPath,
  width,
  height,
  numPages: number
) {
  const hash = (+new Date()).toString(36);

  const storeAsImage = fromPath(filePath, {
    density: 96, // https://stackoverflow.com/a/42510645
    saveFilename: hash,
    savePath: destinationPath,
    format: "png",
    height,
    width,
  });

  const pageNumbers = [...Array(numPages).keys()].map((a) => a + 1);
  const chunks = _.chunk(pageNumbers, 5); // https://github.com/yakovmeister/pdf2image/issues/54

  // pdf2pic uses ImageMagic, which uses multithreading by itself.
  // using worker threads here won't give any benefit, Promise.all is just as fast.
  await Promise.all(chunks.map((chunk) => storeAsImage.bulk!(chunk)));

  return hash;
}
