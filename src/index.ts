export * from "./lib/rasterizePDF";
export * from "./lib/getPdfInfo";
export * from "./lib/renderVideo";
export * from "./utils/sanitization";

import fs from "fs";
import path from "path";

import { rasterizePDF } from "./lib/rasterizePDF";
import { renderVideo } from "./lib/renderVideo";

export async function pdf2mp4(
  filename: string,
  options: {
    filename: string;
    secondsPerFrame?: number;
    framesPerSecond?: number;
    /** @default is `pdf2mp4/generated/video/*.mp4`. Last directory created if missing */
    outputPath?: string;
  }
) {
  const projectRootPath = path.resolve(__dirname, "../", "../");
  const pdfFilePath = path.resolve(projectRootPath, filename);
  const generatedPath = path.resolve(projectRootPath, "generated", "temp");
  const videoPath =
    options.outputPath || path.resolve(projectRootPath, "generated", "video");

  const fps = calculateFps(options.framesPerSecond, options.secondsPerFrame);

  [videoPath, generatedPath].forEach(
    (path) => !fs.existsSync(path) && fs.mkdirSync(path)
  );

  const hash = (+new Date()).toString(36);

  console.time(`rasterization ${filename}`);
  const generatedImages = await rasterizePDF({
    pdfFilePath,
    destinationPath: generatedPath,
    saveFilename: hash,
  });
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

function calculateFps(fps?: number, spf?: number) {
  if (fps) {
    return fps;
  }
  if (spf) {
    return 1 / spf;
  }
  throw new Error("Please provide desired output framerate.");
}

function disposeGeneratedFrames(frames: string[]) {
  frames.forEach((file) => fs.unlink(file, () => {}));
}
