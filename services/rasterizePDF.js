const { fromPath } = require("pdf2pic");
const _ = require("lodash");

async function rasterizePDF(
  filePath,
  destinationPath,
  width,
  height,
  numPages
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

  await Promise.all(
    chunks.map(
      // pdf2pic uses ImageMagic, which uses multithreading by itself.
      // using worker threads here won't give any benefit.
      (chunk) => storeAsImage.bulk(chunk)
    )
  );

  return hash;
}

module.exports = rasterizePDF;
