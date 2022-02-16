import express from "express";
import path from 'path'
import fileUpload from "express-fileupload";

import config from "../config.json";

import { getDefaultPaths } from "./paths";
import { loadEndpoints } from "./endpoints";
import { keepDisposingOldFilesForever } from "./utils/disposeFiles";

const app = express();
app.set("view options", { layout: false });
app.use(fileUpload());
app.use(express.json());
// app.use(express.static(path.join(__dirname, '../', "/views")));

loadEndpoints(app);

app.listen(config.serverPort, () => {
  console.log(`App listening on port ${config.serverPort}!`);
});

// delete files older than 12 hours
keepDisposingOldFilesForever(getDefaultPaths());
