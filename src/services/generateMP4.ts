import fs from "fs";
import path from "path";

import { getPdfInfo } from "./getPdfInfo";
import { rasterizePDF } from "./rasterizePDF";
import { renderVideo } from "./renderVideo";

export async function generateMP4(filename) {
  const projectRootPath = path.resolve(__dirname, "../", "../");
  const filePath = path.resolve(projectRootPath, filename);
  const generatedPath = path.resolve(projectRootPath, "generated");

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

  console.time("rendering");
  await renderVideo(); // todo
  console.timeEnd("rendering");

  return {
    filePath,
    generatedFilenameHash,
    numPages,
  };
}
