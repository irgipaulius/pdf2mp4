import fs from "fs";
import findRemoveSync from "find-remove";

import { CustomPathsInput } from "..";

export function disposeFrames(frames: string[]) {
  frames.forEach((file) => fs.unlink(file, () => {}));
}

export function disposeOldFiles(options: CustomPathsInput) {
  findRemoveSync(options.tempDir, {
    age: { seconds: 1000 * 3600 },
  });
}

/** deletes all unnecessary files from tempDir */
export function keepDisposingOldFilesForever(options: CustomPathsInput) {
  disposeOldFiles(options);
  setTimeout(() => keepDisposingOldFilesForever(options), 1000 * 3600 * 12); // 12 hours
}
