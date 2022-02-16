import { Express } from "express";
import path from "path";

import { loadPdf2Mp4Endpoint } from "./pdf2mp4";
import { loadVideoEndpoint } from "./video";
import { loadVideoStreamEndpoint } from "./videoStream";

export function loadEndpoints(app: Express) {
  app.get("/", function (req, res) {
    console.log('test')
    res.sendFile(path.join(__dirname, "../", "../", "views", "index.html"));
  });

  loadPdf2Mp4Endpoint(app);
  loadVideoEndpoint(app);
  loadVideoStreamEndpoint(app);
}
