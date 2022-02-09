import express from "express";
import path from "path";

export function launchFrontEnd() {
  const app = express();
  app.set("view options", { layout: false });
  app.use(express.static(__dirname + "/views"));

  app.get("/", function (req, res) {
    res.sendFile(path.join(__dirname + "/views/index.html"));
  });

  app.listen(8080, () => {
    console.log("Website live at 8080!");
  });
}
