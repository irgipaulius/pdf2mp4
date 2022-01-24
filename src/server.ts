import express from "express";
import { generateMP4 } from "./generateMP4";

const app = express();

app.get("/pdf2mp4", async function (req, res) {
  const { filename } = req.query;
  const result = await generateMP4(filename);
  console.log(JSON.stringify(result, undefined, " "));

  res.send(result);
});

app.listen(3200, function () {
  console.log("App listening on port 3200!");
});
