import { createReadStream, createWriteStream } from "fs";
import { Converter } from "ffmpeg-stream";

/**
 * creates video from image files to `.mp4`.
 */
export async function renderVideo(options: {
  /** all image formats are accepted. First image determines the output video resolution. */
  framesList: string[];
  /** for example 0.1 will make each frame loop for 10 seconds */
  framerate: number;
  /** don't forget to append format postfix, like `./myVideo.mp4` */
  outputFile: string;
  /** default is `mp4`. call `ffmpeg -formats` to get the list of format substrings. */
  outputFormat?: string;
}) {
  const { framesList, framerate, outputFile, outputFormat } = options;

  if (typeof framerate !== "number") {
    // ultimately, this value will get called inside an `exec`, so this check is here for security
    throw new Error("Are you trying to do an exec injection??");
  }

  const converter = new Converter();
  const input = converter.createInputStream({
    f: "image2pipe",
    framerate,
  });
  const output = converter.createOutputStream({
    f: outputFormat || "mp4",
    vcodec: "libx264",
    movflags: "frag_keyframe + empty_moov",
    r: 25, // having lower output Fps will not change the file size, because H.264 codec compresses it
  });
  output.pipe(createWriteStream(outputFile));

  const renderJob = converter.run();

  for (const frame of framesList) {
    await new Promise((resolve, reject) => {
      createReadStream(frame)
        .on("end", resolve)
        .on("error", reject)
        .pipe(input, { end: false }); // pipe to converter, but don't end the input yet
    });
  }
  input.end();

  await renderJob;
}
