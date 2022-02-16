import { Express } from "express";
import path from "path";

import { sanitizeQuerySchema } from "..";
import { getDefaultPaths } from "../paths";

export function downloadEndpoint(app: Express) {
  const paths = getDefaultPaths();

  app.get("/video/download", function (req, res) {
    console.log(JSON.stringify({ b: req.body, q: req.query }, undefined, " "));
    if (
      sanitizeQuerySchema<{ name: string }>(req, {
        name: { type: "string", optional: false },
      })
    ) {
      res.download(path.resolve(paths.outputDir, req.query.name));
    }
  });
}
