import express from "express";
import { isError } from "lodash";
import { generateMP4 } from "./services/generateMP4";
import { sanitizeParameterSchema } from "./utils/sanitization";

const app = express();

interface Pdf2Mp4_QuerySchema {
  filename: string;
  secondsPerFrame?: number; // querying with url doesn't work, and it's good.
  framesPerSecond?: number;
}

app.get("/pdf2mp4", async function (req, res, next) {
  try {
    sanitizeParameterSchema<Pdf2Mp4_QuerySchema>(req, {
      filename: { type: "string", optional: false },
      secondsPerFrame: { type: "number", linked: ["framesPerSecond"] },
      framesPerSecond: { type: "number", linked: ["secondsPerFrame"] },
    });

    const { filename } = req.query;

    const result = await generateMP4(filename);

    return res.status(200).send(result);
  } catch (error: any) {
    console.error(error.message);
    res
      .status(error.status || 500)
      .send(error.message)
      .end();
  }
});

app.listen(3200, function () {
  console.log("App listening on port 3200!");
});
