import { listPdfs } from "./cowScraper.js";
import express from "express";

const app = express();

app.get("/", async (req, res) => {
  let response = `<html><head><title>Control of Weapons Acts</title></head><body>`;
  let pdfs = await listPdfs();
  for (let x of pdfs) {
    response += `<a href=${x["uri"]}>${x["title"]}</a><br />`;
  }
  response += `</body></html>`;
  res.send(response);
});

app.listen(3000);
