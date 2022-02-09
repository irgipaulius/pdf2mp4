import { createReadStream, createWriteStream } from "fs";
import { Converter } from "ffmpeg-stream";
import EventEmitter from "events";
import { sequentialPromiseAll } from "../utils/differentPromiseAll";
import { ProgressEmitter } from "../utils/progress";

/**
 * creates video from image files to `.mp4`.
 */
export async function renderVideo(
  options: {
    /** all image formats are accepted. First image determines the output video resolution. */
    framesList: string[];
    /** for example 0.1 will make each frame loop for 10 seconds */
    framerate: number;
    /** don't forget to append format postfix, like `./myVideo.mp4` */
    outputFile: string;
    /** default is `mp4`. call `ffmpeg -formats` to get the list of format substrings. */
    outputFormat?: string;
  },
  e?: EventEmitter
) {
  const { framesList, framerate, outputFile, outputFormat } = options;

  if (typeof framerate !== "number") {
    // ultimately, this value will get called inside an `exec`, so this check is here for security
    throw new Error("Are you trying to do an exec injection??");
  }

  const converter = new Converter();
  const ffmpegInput = converter.createInputStream({
    f: "image2pipe",
    framerate,
  });
  const ffmpegOutput = converter.createOutputStream({
    f: outputFormat || "mp4",
    vcodec: "libx264",
    movflags: "frag_keyframe + empty_moov",
    r: 25, // having lower output Fps will not change the file size, because H.264 codec compresses it
  });
  ffmpegOutput.pipe(createWriteStream(outputFile));

  const renderJob = converter.run();

  const render = new ProgressEmitter(
    "progress_render",
    `Rendering`,
    framesList.length,
    e
  );

  await sequentialPromiseAll(
    framesList.map((frame) => async () => {
      render.emitProgress();
      await new Promise((resolve, reject) => {
        createReadStream(frame)
          .on("end", resolve)
          .on("error", reject)
          .pipe(ffmpegInput, { end: false }); // pipe to converter, but don't end the input yet
      });
    })
  );

  render.closingEmit();

  ffmpegInput.end();

  await renderJob;
}
