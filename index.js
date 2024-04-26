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
    <div class="center">
    <span class="heading">Control of Weapons Act Notices</span>
    <span class="subheading">Gazettes sourced from the Victorian Gazette website</span>
    <ul>
    <li hx-get="/list"
        hx-trigger="load"
        hx-swap="outerHTML"
    >Loading (If there's a lot of new gazettes, this could take some time)</li>
    </ul>
    </div>
    <style>
    body {
      background-color: #225;
      color: #CCC;
      font-family: sans-serif;
    }
    div.center {
      margin: auto;
      width: 60%;
    }
    span.heading {
      font-size: 1.8rem;
      display: block;
    }
    span.subheading {
      font-size: 1.4rem;
      display: block;
    }
    span.uri {
      font-size: 0.9rem;
      color: #aaa;
    }
    a {
      color: #CCC;
      text-decoration: none;
      font-size: 1.2rem;
    }
    ul {
      width: 80%;
      list-style-type: none
    }
    li {
      padding: 0.5em 0px;
    }
    </style>
    </body>
    </html>`;
  res.send(response);
});

app.get("/list", async (req, res) => {
  let pdfs = await listPdfs();
  pdfs.sort((a, b) => {
    a = a.uri.toUpperCase();
    b = b.uri.toUpperCase();

    if (a < b) {
      return 1;
    }
    if (a > b) {
      return -1;
    }

    return 0;
  });

  let response = "";
  for (let x of pdfs) {
    response += `<li><a href=${x["uri"]}>${x["title"]}<br /><span class="uri">${x["uri"]}</span></a></li>`;
  }
  res.send(response);
});

app.get("/latest", async (req, res) => {
  let pdfs = await listPdfs();
  pdfs.sort((a, b) => {
    a = a.uri.toUpperCase();
    b = b.uri.toUpperCase();

    if (a < b) {
      return 1;
    }
    if (a > b) {
      return -1;
    }

    return 0;
  });
  res.send(pdfs);
});

app.listen(3000);
