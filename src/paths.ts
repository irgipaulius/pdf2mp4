import fs from "fs";
import path from "path";

import { CustomPathsInput } from ".";

import config from "./config.json";

export function getDefaultPaths(): CustomPathsInput {
  const { uploadPath, temporaryPath, outputPath } = config;

  const projectRootDir = path.resolve(__dirname, "../");

  const normalize = (p: string) => p.replace("__dirname", projectRootDir);

  const generatedDir = path.resolve(projectRootDir, "generated");

  const defaultTempDir = path.resolve(generatedDir, "temp");
  const defaultOutputDir = path.resolve(generatedDir, "video");
  const defaultUploadDir = path.resolve(projectRootDir, "upload");

  const tempDir = normalize(temporaryPath) || defaultTempDir;
  const outputDir = normalize(outputPath) || defaultOutputDir;
  const uploadDir = normalize(uploadPath) || defaultUploadDir;

  // resolve path to destination, if needed
  [outputDir, tempDir, uploadDir].forEach(
    (path) => !fs.existsSync(path) && fs.mkdirSync(path, { recursive: true })
  );

  return {
    tempDir,
    outputDir,
    uploadDir,
  };
}
