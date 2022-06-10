import fs from "fs";
import findRemoveSync from "find-remove";

/**
 * Deletes provided frames
 */
export function disposeFrames(frames: string[]) {
  frames.forEach((file) => fs.unlink(file, () => {}));
}

/**
 * Deletes files from tempDir, if they're older than one hour
 */
export function disposeOldFiles(tempDir: string) {
  findRemoveSync(tempDir, {
    age: { seconds: 1000 * 3600 },
  });
}

/**
 * Deletes older than one hour files from tempDir every 12 hours
 */
export function keepDisposingOldFilesForever(tempDir: string) {
  disposeOldFiles(tempDir);
  setTimeout(() => keepDisposingOldFilesForever(tempDir), 1000 * 3600 * 12); // 12 hours
}
