# pdf2mp4

Module that converts pdf files to MP4 in high resolution. Can be used for fast reading applications.

Required system dependencies:

- [ImageMagick](https://www.imagemagick.org/script/download.php)
- [gm](https://www.npmjs.com/package/gm)
- [ffmpeg](https://evermeet.cx/ffmpeg/)

> multithreaded!

## Installation

```bash
npm install pdf2mp4
```

### Prerequisites

- git
- npm & node
- ImageMagick & gm
- ffmpeg

### Setup

```bash
git clone https://github.com/irgipaulius/pdf2mp4

cd pdf2mp4

npm install
```

### GraphicsMagick

Next, you must install [ImageMagick](https://www.imagemagick.org/script/download.php) and [gm](https://www.npmjs.com/package/gm) on your system:

- Official instructions: https://github.com/yakovmeister/pdf2image/blob/HEAD/docs/gm-installation.md

- **OSX**:
  - `brew install graphicsmagick`
  - `brew install gs`
  - `brew install imagemagick`
- **Windows, Linux** - _install manually:_
  - [ImageMagick](https://www.imagemagick.org/script/download.php)
  - [gm](https://www.npmjs.com/package/gm)
- **Standalone** - _install from source:_
  - https://www.imagemagick.org/script/install-source.php
  - https://www.github.com/aheckmann/gm.git

### FFMPEG

- **OSX**
  - `brew install ffmpeg`
- **Windows**
  - Download installation executables from https://evermeet.cx/ffmpeg/.
  - add `.env` with `FFMPEG_PATH=path/to/ffmpeg/executable`
- **Linux**
  - `sudo apt install ffmpeg`
- **FreeBSD**
  - `pkg install ffmpeg`

# Usage

```typescript
import { pdf2mp4, createEventLogger } from "pdf2mp4";

const e = createEventLogger(); // optional, but great for debugging

await pdf2mp4(
  {
    fileName: "sample.pdf",
    secondsPerFrame: 2.15,
    uploadDir: "./",
    outputDir: "./",
  },
  e
);
```

### Properties

| Property        | type             | default value             | description                                                                                    |
| --------------- | ---------------- | ------------------------- | ---------------------------------------------------------------------------------------------- |
| fileName        | mandatory string |                           | name of the pdf file.                                                                          |
| secondsPerFrame | optional number  |                           | either this or `framesPerSecond` must be set.                                                  |
| framesPerSecond | optional number  |                           | either this or `secondsPerFrame` must be set.                                                  |
| maxConcurrency  | optional number  | 8                         | max concurrent frames to process at the same time. Directly affects performance and stability. |
| uploadDir       | optional string  | "pdf2mp4/upload"          | path to directory where pdf files are located                                                  |
| tempDir         | optional string  | "pdf2mp4/generated/temp"  | path to directory where temporary files will be generated                                      |
| outputDir       | optional string  | "pdf2mp4/generated/video" | path to directory where generated mp4 file is placed                                           |

### Events (optional)

For example, on front-end you can implement a full-fledged processing loading animation, which is accurate to the actual process:

```typescript
const e = new EventEmitter();

e.on("start", (message, filename) => {
  console.log(message); // Converting sample.pdf...
});

e.on("benchmark_raster", (message, benchmarkSeconds) => {
  console.log(message); // `Finished rasterization in 6.9420 seconds.`
});

e.on("benchmark_render", (message, benchmarkSeconds) => {
  console.log(message); // `Finished render in 6.9420 seconds.`
});

e.on("progress_raster", (message, progress) => {
  console.log(message); // Rasterizing... 69/100
  setProgress(progress / 100); // great to use with states for react
});

e.on("progress_render", (message, progress) => {
  console.log(message); // Rendering... 69/100
  setProgress(progress / 100); // great to use with states for react
});

e.on("end", (message, videoFilename, videoDestination) => {
  console.log(message); // Finished converting sample.pdf to /usr/Johnny/.../pdf2mp4/Am83rH3ar0.mp4.
  resolve(videoDestination); // final location of the mp4 file.
});

// no need to await, result will be in the 'end' event
pdf2mp4("sample.pdf", { framesPerSecond: 0.33 }, e);
```
