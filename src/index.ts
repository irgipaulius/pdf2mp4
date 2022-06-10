export { getPdfFormatInfo } from "./lib/getPdfInfo";
export { renderVideo } from "./lib/renderVideo";
export { Rasterize } from "./lib/rasterize";
export { createEventLogger } from "./utils/eventEmitter";
export {
  disposeOldFiles,
  keepDisposingOldFilesForever,
} from "./utils/disposeFiles";

import EventEmitter from "events";
import path from "path";

import { Rasterize } from "./lib/rasterize";
import { renderVideo } from "./lib/renderVideo";
import { BenchmarkEmitter } from "./utils/benchmark";
import { disposeFrames } from "./utils/disposeFiles";
import { getDefaultPaths } from "./paths";

export interface CustomPathsInput {
  /** @default is `pdf2mp4/generated/video`. This directory is created if missing */
  outputDir: string;
  /** @default is `pdf2mp4/generated/temp`. This directory is created if missing */
  tempDir: string;
  /** @default is `pdf2mp4/upload/`. This directory is created if missing */
  uploadDir: string;
}

/**
 * Converts pdf file or buffer to mp4
 * 
 * # Options
 * | Property        | type             | default value             | description                                                                                    |
| --------------- | ---------------- | ------------------------- | ---------------------------------------------------------------------------------------------- |
| fileName        | mandatory string |                           | name of the pdf file.                                                                          |
| secondsPerFrame | optional number  |                           | either this or `framesPerSecond` must be set.                                                  |
| framesPerSecond | optional number  |                           | either this or `secondsPerFrame` must be set.                                                  |
| maxConcurrency  | optional number  | 8                         | max concurrent frames to process at the same time. Directly affects performance and stability. |
| uploadDir       | optional string  | "pdf2mp4/upload"          | path to directory where pdf files are located                                                  |
| tempDir         | optional string  | "pdf2mp4/generated/temp"  | path to directory where temporary files will be generated                                      |
| outputDir       | optional string  | "pdf2mp4/generated/video" | path to directory where generated mp4 file is placed                                           |
 * # Events
 * @param e optional event emitter to receive events throughout each stage of conversion.
 * >@note emitted events: `start`, `benchmark_raster`, `benchmark_render`, `progress`, `end`
 *
 * >@example
 * ```typescript
 * const e = new EventEmitter();
 * 
 * e.on("start", (message, filename) => {
 *   console.log(message); // Converting sample.pdf...
 * });
 * 
 * e.on("benchmark_raster", (message, benchmarkSeconds) => {
 *   console.log(message); // `Finished rasterization in 6.9420 seconds.`
 * });
 * 
 * e.on("benchmark_render", (message, benchmarkSeconds) => {
 *   console.log(message); // `Finished render in 6.9420 seconds.`
 * });
 * 
 * e.on("progress_raster", (message, progress) => {
 *   console.log(message); // Rasterizing... 69/100
 *   setProgress(progress / 100); // great to use with states for react
 * });
 * 
 * e.on("progress_render", (message, progress) => {
 *   console.log(message); // Rendering... 69/100
 *   setProgress(progress / 100); // great to use with states for react
 * });
 * 
 * e.on("end", (message, videoFilename, videoDestination) => {
 *   console.log(message); // Finished converting sample.pdf to /usr/Johnny/.../pdf2mp4/Am83rH3ar0.mp4.
 *   resolve(videoDestination); // final location of the mp4 file.
 * });
 * 
 * // no need to await, result will be in the 'end' event
 * pdf2mp4("sample.pdf", { framesPerSecond: 0.33 }, e);
 * ```
 *
 */
export async function pdf2mp4(
  options: {
    fileName: string;
    secondsPerFrame?: number;
    framesPerSecond?: number;
    /**
     * max concurrent frames to process at the same time. Directly affects performance.
     * @default 8
     * @recommendation if your machine hangs up too much while processing or throws memory errors,
     * consider reducing this number.
     */
    maxConcurrency?: number;
  } & Partial<CustomPathsInput>,
  e?: EventEmitter
): Promise<string> {
  const total = new BenchmarkEmitter("benchmark_total", "converting", e);

  const { fileName, framesPerSecond, secondsPerFrame, maxConcurrency } =
    options;
  const fps = calculateFps(framesPerSecond, secondsPerFrame);

  e?.emit("start", `Converting ${fileName}...`, fileName);

  const { outputDir, tempDir, uploadDir } = getDefaultPaths(options);
  const pdfFilePath = path.resolve(uploadDir, fileName);

  // this will be the filename for all generated items
  const hash = (+new Date()).toString(36);

  const raster = new BenchmarkEmitter("benchmark_raster", "rasterization", e);
  const rasterize = new Rasterize(
    {
      pdfFilePath,
      destinationPath: tempDir,
      saveFilename: hash,
      maxConcurrency,
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
    `Finished converting ${fileName} to ${videoFilename}.`,
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
