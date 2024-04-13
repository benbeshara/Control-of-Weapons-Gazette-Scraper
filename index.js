import { listPdfs } from "./cowScraper.js";
import express from "express";

const app = express();

console.info(await listPdfs());

let pdfs = await listPdfs();

app.get("/", (req, res) => {
  let response = `<html><head><title>Control of Weapons Acts</title></head><body>`;
  for (let x of pdfs) {
    response += `<a href=${x["uri"]}>${x["uri"]}</a><br />`;
  }
  response += `</body></html>`;
  res.send(response);
});

app.listen(3000);
