import express from "express";
import { pdf2mp4 } from "./index";
import {
  sanitizeParameterSchema,
  Pdf2Mp4_QuerySchema,
} from "./utils/sanitization";

const app = express();
app.use(express.json());

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

      const result = await pdf2mp4(filename, req.body);

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
