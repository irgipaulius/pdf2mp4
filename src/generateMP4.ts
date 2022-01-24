import fs from "fs";
import path from "path";

import { getPdfInfo } from "./services/getPdfInfo";
import { rasterizePDF } from "./services/rasterizePDF";

export async function generateMP4(filename) {
  const filePath = path.resolve(__dirname, "../", filename);
  const generatedPath = path.resolve(__dirname, "../", "generated");

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
