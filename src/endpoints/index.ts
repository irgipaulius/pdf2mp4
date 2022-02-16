import { Express } from "express";

import { loadPdf2Mp4Endpoint } from "./pdf2mp4";
import { loadVideoEndpoint } from "./video";
import { loadVideoStreamEndpoint } from "./videoStream";

export function loadEndpoints(app: Express) {
  loadPdf2Mp4Endpoint(app);
  loadVideoEndpoint(app);
  loadVideoStreamEndpoint(app);
}
