import GraphicsMagick from "gm";
import fs, { ReadStream } from "fs";
import _ from "lodash";
import path from "path";

import { getPdfFormatInfo } from "..";
import EventEmitter from "events";
import { sequentialPromiseAll } from "../utils/differentPromiseAll";
import { ProgressEmitter } from "../utils/progress";

import config from "../config.json";

export type WriteImageResponse = {
  name: string;
  size: string;
  fileSize: number;
  path: string;
  page: number;
};

/** turn pdf into a set of images.
 * @param e optional event emitter to receive events throughout each stage of rasterization.
 * >@note emitted events: `progress`
 *
 * >@example
 * ```typescript
 * e.on('progress_raster', (message, progress) => {
 *  console.log(message); // Rasterizing... 69/100
 *  setProgress(progress / 100); // great to use with states in react
 * })
 *
 * await new Rasterize(..., e).run();
 * ```
 */
export class Rasterize {
  private numPages: number = 1;
  private finalHeight: number = 1080;
  private finalWidth: number = 1920;
  private gm: GraphicsMagick.SubClass;
  private raster: ProgressEmitter | null;

  constructor(
    private options: {
      pdfFilePath: string;
      destinationPath: string;
      saveFilename: string;
      /** default is 1080. width is scaled according to the pdf aspect ratio */
      height?: number;
    },
    private e?: EventEmitter
  ) {
    this.raster = null;
    this.gm = GraphicsMagick.subClass({ imageMagick: true });
  }

  async run() {
    const dataBuffer = fs.readFileSync(this.options.pdfFilePath);
    const pdfInfo = await getPdfFormatInfo(dataBuffer);

    this.numPages = pdfInfo.numPages;
    this.finalHeight = Math.round(this.options.height || 1080);
    this.finalWidth = Math.round(
      (this.finalHeight / pdfInfo.height) * pdfInfo.width
    );

    this.initBenchmark(this.numPages);

    /** Asynchronously running only `config.maxConcurrency` number of pages at the time,
     * with a different readStream for each. */
    const results = await sequentialPromiseAll(
      _.chunk([...Array(this.numPages).keys()], config.maxConcurrency || 1).map(
        (chunk) => () => {
          const readStream = fs.createReadStream(this.options.pdfFilePath);
          return Promise.all(
            chunk.map((page) => this.rasterize(readStream, page))
          );
        }
      )
    );

    this.raster?.closingEmit();

    this.raster = null;

    return results.flat();
  }

  private async rasterize(readStream: ReadStream, page: number) {
    const newFilename = `${this.options.destinationPath}/${
      this.options.saveFilename
    }_${page + 1}.png`;

    return new Promise<WriteImageResponse>((resolve, reject) => {
      const command = this.gm(readStream, `${readStream.path}[${page}]`)
        .density(96, 96)
        .resize(this.finalWidth, this.finalHeight, "!") // ignore aspect ratio
        .quality(75)
        .background("#FFF") // white
        .mosaic()
        .matte()
        .compress("jpeg"); // this is compression, not format.

      return command.write(newFilename, (error) => {
        if (error) {
          return reject(error);
        }

        this.raster?.emitProgress(); // emit progress log

        return resolve({
          name: path.basename(newFilename),
          size: `${this.finalWidth}x${this.finalHeight}`,
          fileSize: fs.statSync(newFilename).size / 1000.0,
          path: newFilename,
          page: page + 1,
        });
      });
    });
  }

  private initBenchmark(numPages: number) {
    this.raster = new ProgressEmitter(
      "progress_raster",
      `Rasterizing`,
      numPages,
      this.e
    );
  }
}
