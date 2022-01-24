const fs = require("fs");
const path = require("path");

const getPdfInfo = require("./services/getPdfInfo");
const rasterizePDF = require("./services/rasterizePDF");

async function generateMP4(filename) {
  const filePath = path.resolve(__dirname, filename);
  const generatedPath = path.resolve(__dirname, "generated");

  if (!fs.existsSync(generatedPath)) {
    fs.mkdirSync(generatedPath);
  }

  let dataBuffer = fs.readFileSync(filePath);

  const pdfInfo = await getPdfInfo(dataBuffer);
  const numPages = pdfInfo.numPages;
  const finalHeight = 1080;
  const finalWidth = (finalHeight / pdfInfo.height) * pdfInfo.width;

  console.time("rasterization");
  const generatedFilenameHash = await rasterizePDF(
    filePath,
    generatedPath,
    finalWidth,
    finalHeight,
    numPages
  );
  console.timeEnd("rasterization");

  return {
    filePath,
    generatedFilenameHash,
    numPages,
  };
}

module.exports = generateMP4;
