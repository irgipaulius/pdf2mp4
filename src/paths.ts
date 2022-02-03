import path from "path";
import { CustomPathsInput } from ".";

export function getDefaultPaths(): CustomPathsInput {
  const projectRootDir = path.resolve(__dirname, "../");
  const generatedDir = path.resolve(projectRootDir, "generated");
  const tempDir = path.resolve(generatedDir, "temp");
  const outputDir = path.resolve(generatedDir, "video");
  const uploadDir = path.resolve(generatedDir, "upload");

  return {
    generatedDir,
    tempDir,
    outputDir,
    uploadDir,
  };
}
