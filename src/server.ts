import express from "express";
import fileUpload, { UploadedFile } from "express-fileupload";
import path from "path";
import fs from "fs";

import { DefaultQueryInput, pdf2mp4 } from "./index";
import { createEventLogger } from "./utils/eventEmitter";
import { sanitizeBodySchema, sanitizeFiles } from "./utils/sanitization";
import { keepDisposingOldFilesForever } from "./utils/disposeFiles";
import { getDefaultPaths } from "./paths";

const app = express();
app.use(fileUpload());
app.use(express.json());

app.get("/pdf2mp4", async (req, res) => {
  try {
    if (
      sanitizeBodySchema<DefaultQueryInput>(req, {
        filename: { type: "string", optional: false },
        secondsPerFrame: { type: "number", linked: ["framesPerSecond"] },
        framesPerSecond: { type: "number", linked: ["secondsPerFrame"] },
      })
    ) {
      const result = await pdf2mp4(
        { ...getDefaultPaths(), ...req.body },
        createEventLogger()
      );

      return res.status(200).send(result);
    }
  } catch (error: any) {
    console.error(error.message);
    res
      .status(error.status || 500)
      .send(error.message)
      .end();
  }
});

app.post("/pdf2mp4", async (req, res) => {
  let uploadPath;
  try {
    if (sanitizeFiles<{ pdf: UploadedFile }>(req, res)) {
      const { pdf } = req.files;
      const uploadDir = path.resolve(__dirname, "../", "upload");

      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir);
      }

      uploadPath = path.resolve(uploadDir, pdf.name);

      // Use the mv() method to place the file somewhere on your server
      await pdf.mv(uploadPath);

      return res.status(200).send(pdf.name);
    }
  } catch (error: any) {
    console.error(error.message);
    res
      .status(error.status || 500)
      .send(error.message)
      .end();
  }
});

app.listen(3200, () => {
  console.log("App listening on port 3200!");
});

// delete files older than 12 hours (with default options)
keepDisposingOldFilesForever(getDefaultPaths());
