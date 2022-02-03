export { rasterizePDF } from "./lib/rasterizePDF";
export { getPdfFormatInfo } from "./lib/getPdfInfo";
export { renderVideo } from "./lib/renderVideo";
export * from "./utils/sanitization";
export { createEventLogger } from "./utils/eventEmitter";

import EventEmitter from "events";
import fs from "fs";
import path from "path";

import { rasterizePDF } from "./lib/rasterizePDF";
import { renderVideo } from "./lib/renderVideo";
import { BenchmarkEmitter } from "./utils/benchmark";

/**
 * converts pdf file or buffer to mp4
 * @param process.env.PDF2MP4_UNLOCK if set to 'true', it will go at max speed. If set to 'false', it will go at slowest speed. Recommended to not set it at all.
 * @param e optional event emitter to receive events throughout each stage of conversion.
 * >@note emitted events: `start`, `benchmark_raster`, `benchmark_render`, `progress`, `end`
 *
 * >@example
 * ```typescript
 * e.on('start', (message, filename) => {
 *  console.log(message); // Converting sample.pdf...
 * })
 *
 * e.on('benchmark_raster', (message, benchmarkSeconds) => {
 *  console.log(message); // `Finished rasterization in 6.9420 seconds.`
 * })
 *
 * e.on('benchmark_render', (message, benchmarkSeconds) => {
 *  console.log(message); // `Finished render in 6.9420 seconds.`
 * })
 *
 * e.on('progress_raster', (message, progress) => {
 *  console.log(message); // Rasterizing... 69/100
 *  setProgress(progress / 100); // great to use with states in react
 * })
 *
 * e.on('progress_render', (message, progress) => {
 *  console.log(message); // Rendering... 69/100
 *  setProgress(progress / 100); // great to use with states in react
 * })
 *
 * e.on('end', (message, videoFilename, videoPath) => {
 *  console.log(message); //
 *  resolve(videoDestination);
 * })
 *
 * // no need to await, result will be in the 'end' event
 * pdf2mp4('sample.pdf', { framesPerSecond: 0.33 }, e);
 * ```
 *
 */
export async function pdf2mp4(
  filename: string,
  options: {
    // filename: string;
    secondsPerFrame?: number;
    framesPerSecond?: number;
    /** @default is `pdf2mp4/generated/video/*.mp4`. Last directory created if missing */
    outputPath?: string;
  },
  e?: EventEmitter
) {
  const total = new BenchmarkEmitter("benchmark_total", "converting", e);

  e?.emit("start", `Converting ${filename}...`, filename);

  const fps = calculateFps(options.framesPerSecond, options.secondsPerFrame);

  const projectRootPath = path.resolve(__dirname, "../");
  const pdfFilePath = path.resolve(projectRootPath, filename);
  const generatedPath = path.resolve(projectRootPath, "generated", "temp");
  const videoPath =
    options.outputPath || path.resolve(projectRootPath, "generated", "video");

  // resolve path to destination, if needed
  [videoPath, generatedPath].forEach(
    (path) => !fs.existsSync(path) && fs.mkdirSync(path)
  );

  // this will be the filename for all generated items
  const hash = (+new Date()).toString(36);

  const raster = new BenchmarkEmitter("benchmark_raster", "rasterization", e);
  const generatedImages = await rasterizePDF(
    {
      pdfFilePath,
      destinationPath: generatedPath,
      saveFilename: hash,
    },
    e
  );
  raster.emitBenchmark();

  const frames = generatedImages.map(({ path }) => path!);
  const videoFilename = `${hash}.mp4`;
  const videoDestination = path.resolve(videoPath, `${hash}.mp4`);

  const render = new BenchmarkEmitter("benchmark_render", "rendering", e);
  await renderVideo(
    {
      framesList: frames,
      framerate: fps,
      outputFile: videoDestination,
    },
    e
  ).catch((error) => {
    disposeGeneratedFrames(frames);
    throw error;
  });
  render.emitBenchmark();

  disposeGeneratedFrames(frames);

  e?.emit(
    "end",
    `Finished converting ${filename} to ${videoFilename}.`,
    videoFilename,
    videoDestination
  );

  total.emitBenchmark();

  return videoDestination;
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
