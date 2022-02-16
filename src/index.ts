export { getPdfFormatInfo } from "./lib/getPdfInfo";
export { renderVideo } from "./lib/renderVideo";
export * from "./utils/sanitization";
export { createEventLogger } from "./utils/eventEmitter";
export { disposeOldFiles } from "./utils/disposeFiles";

import EventEmitter from "events";
import path from "path";

import { Rasterize } from "./lib/rasterize";
import { renderVideo } from "./lib/renderVideo";
import { BenchmarkEmitter } from "./utils/benchmark";
import { disposeFrames } from "./utils/disposeFiles";

export interface DefaultQueryInput {
  filePath: string;
  secondsPerFrame?: number;
  framesPerSecond?: number;
}

export interface CustomPathsInput {
  /** @default is `pdf2mp4/generated/video`. Created if missing */
  outputDir: string;
  /** @default is `pdf2mp4/generated/temp`. Created if missing */
  tempDir: string;
  /** @default is `pdf2mp4/upload/`. */
  uploadDir: string;
}

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
  options: DefaultQueryInput & CustomPathsInput,
  e?: EventEmitter
): Promise<string> {
  const total = new BenchmarkEmitter("benchmark_total", "converting", e);

  const { filePath, framesPerSecond, secondsPerFrame } = options;
  const fps = calculateFps(framesPerSecond, secondsPerFrame);

  e?.emit("start", `Converting ${filePath}...`, filePath);

  const { outputDir, tempDir, uploadDir } = options;
  const pdfFilePath = path.resolve(uploadDir, filePath);

  // this will be the filename for all generated items
  const hash = (+new Date()).toString(36);

  const raster = new BenchmarkEmitter("benchmark_raster", "rasterization", e);
  const rasterize = new Rasterize(
    {
      pdfFilePath,
      destinationPath: tempDir,
      saveFilename: hash,
    },
    e
  );
  const generatedImages = await rasterize.run();

  raster.emitBenchmark();

  const frames = generatedImages.map(({ path }) => path!);
  const videoFilename = `${hash}.mp4`;
  const videoDestination = path.resolve(outputDir, `${hash}.mp4`);

  const render = new BenchmarkEmitter("benchmark_render", "rendering", e);
  await renderVideo(
    {
      framesList: frames,
      framerate: fps,
      outputFile: videoDestination,
    },
    e
  );
  render.emitBenchmark();

  disposeFrames(frames);

  e?.emit(
    "end",
    `Finished converting ${filePath} to ${videoFilename}.`,
    videoFilename,
    videoDestination
  );

  total.emitBenchmark();

  return videoFilename;
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
