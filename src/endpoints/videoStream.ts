import { Express } from "express";
import path from "path";
import fs from "fs";

import { sanitizeQuerySchema } from "..";
import { getDefaultPaths } from "../paths";

export function loadVideoStreamEndpoint(app: Express) {
  const paths = getDefaultPaths();

  app.get("/video/stream", function (req, res) {
    if (
      sanitizeQuerySchema<{ name: string }>(req, {
        name: { type: "string", optional: false },
      })
    ) {
      const range = req.headers.range;
      if (!range) {
        res.status(400).send("Requires Range header");
      }

      const videoPath = path.resolve(paths.outputDir, req.query.name);
      const videoSize = fs.statSync(videoPath).size;

      // Parse Range
      // Example: "bytes=32324-"
      const CHUNK_SIZE = 5 * 10 ** 6; // 5MB
      const start = Number(range!.replace(/\D/g, ""));
      const end = Math.min(start + CHUNK_SIZE, videoSize - 1);

      // Create headers
      const contentLength = end - start + 1;
      const headers = {
        "Content-Range": `bytes ${start}-${end}/${videoSize}`,
        "Accept-Ranges": "bytes",
        "Content-Length": contentLength,
        "Content-Type": "video/mp4",
      };

      // HTTP Status 206 for Partial Content
      res.writeHead(206, headers);

      // create video read stream for this particular chunk
      const videoStream = fs.createReadStream(videoPath, { start, end });

      // Stream the video chunk to the client
      videoStream.pipe(res);
    }
  });
}
