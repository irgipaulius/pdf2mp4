# pdf2mp4
NodeJS REST API that converts pdf files to MP4 in high resolution

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
    - `brew install imagemagick`
    - `brew install graphicsmagick`
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

### Run on localhost:

```bash
?????
```

# Usage

>// todo