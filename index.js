import { listPdfs } from "./cowScraper.js";
import express from "express";

const app = express();

app.get("/", (req, res) => {
  let response = `
    <html>
    <head>
    <title>Control of Weapons Acts</title>
    <script src="https://unpkg.com/htmx.org@1.9.12"></script>
    </head>
    <body>
    <div>
    <div hx-get="/list"
        hx-trigger="load"
        hx-swap="outerHTML"
    >Loading...</div>
    </div>
    </body>
    </html>`;
  res.send(response);
});

app.get("/list", async (req, res) => {
  let pdfs = await listPdfs();
  let response = "";
  for (let x of pdfs) {
    response += `<a href=${x["uri"]}>${x["title"]}</a><br />`;
  }
  res.send(response);
});

app.listen(3000);
