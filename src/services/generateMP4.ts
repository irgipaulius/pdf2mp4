import fs from "fs";
import path from "path";

import { getPdfInfo } from "./getPdfInfo";
import { rasterizePDF } from "./rasterizePDF";
import { renderVideo } from "./renderVideo";

export interface ConversionOptions {
  filename: string;
  secondsPerFrame?: number;
  framesPerSecond?: number;
  /** @default is `pdf2mp4/generated/video/*.mp4`. Last directory created if missing */
  outputPath?: string;
}

export async function generateMP4(filename, options: ConversionOptions) {
  const projectRootPath = path.resolve(__dirname, "../", "../");
  const pdfFilePath = path.resolve(projectRootPath, filename);
  const generatedPath = path.resolve(projectRootPath, "generated", "temp");
  const videoPath =
    options.outputPath || path.resolve(projectRootPath, "generated", "video");

  const fps = calculateFps(options);

  [videoPath, generatedPath].forEach(
    (path) => !fs.existsSync(path) && fs.mkdirSync(path)
  );

  let dataBuffer = fs.readFileSync(pdfFilePath);

  const pdfInfo = await getPdfInfo(dataBuffer);
  const numPages = pdfInfo.numPages;
  const finalHeight = 1080;
  const finalWidth = (finalHeight / pdfInfo.height) * pdfInfo.width;
  const hash = (+new Date()).toString(36);

  console.time(`rasterization ${filename}`);
  const generatedImages = await rasterizePDF(
    pdfFilePath,
    generatedPath,
    hash,
    finalWidth,
    finalHeight,
    numPages
  );
  console.timeEnd(`rasterization ${filename}`);

  const frames = generatedImages.map(({ path }) => path!);
  const videoDestination = path.resolve(videoPath, `${hash}.mp4`);

  console.time(`rendering ${filename}`);
  await renderVideo({
    framesList: frames,
    framerate: fps,
    outputFile: videoDestination,
  }).catch((error) => {
    disposeGeneratedFrames(frames);
    throw error;
  });
  console.timeEnd(`rendering ${filename}`);

  disposeGeneratedFrames(frames);

  return { videoDestination };
}

function calculateFps(options: ConversionOptions) {
  if (options.framesPerSecond) {
    return options.framesPerSecond;
  }

  if (options.secondsPerFrame) {
    return 1 / options.secondsPerFrame;
  }

  throw new Error("Please provide required conversion options.");
}

function disposeGeneratedFrames(frames: string[]) {
  frames.forEach((file) => fs.unlink(file, () => {}));
}
