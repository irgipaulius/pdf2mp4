import express from "express";
import { generateMP4 } from "./services/generateMP4";
import { sanitizeParameterSchema } from "./utils/sanitization";

const app = express();
app.use(express.json())

interface Pdf2Mp4_QuerySchema {
  filename: string;
  secondsPerFrame?: number;
  framesPerSecond?: number;
}

app.get("/pdf2mp4", async function (req, res, next) {
  try {
    if (
      sanitizeParameterSchema<Pdf2Mp4_QuerySchema>(req, {
        filename: { type: "string", optional: false },
        secondsPerFrame: { type: "number", linked: ["framesPerSecond"] },
        framesPerSecond: { type: "number", linked: ["secondsPerFrame"] },
      })
    ) {
      const { filename } = req.body;

      const result = await generateMP4(filename, req.body);


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

app.listen(3200, function () {
  console.log("App listening on port 3200!");
});
