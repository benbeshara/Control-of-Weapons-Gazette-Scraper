import { listPdfs } from "./cowScraper.js";
import express from "express";

const app = express();

app.get("/", (req, res) => {
  let response = `
    <html>
    <head>
    <title>Control of Weapons Acts</title>
    <script src="https://unpkg.com/htmx.org@2.0.0-beta3"></script>
    <script src="https://unpkg.com/htmx-ext-sse@2.1.0/sse.js"></script>
    </head>
    <body>
    <div class="center">
    <span class="heading">Control of Weapons Act Notices</span>
    <span class="subheading">Gazettes sourced from the Victorian Gazette website</span>
    <ul>
    <li hx-ext="sse"
        sse-connect="/listSSE"
        sse-close="close"
        sse-swap="list"
        hx-swap="outerHTML">
      Loading (If there's a lot of new gazettes, this could take some time)
    </li>
    </ul>
    <a
      class="attribution"
      href="https://github.com/benbeshara/Control-of-Weapons-Gazette-Scraper"
      target="_blank"
    >
      Source available here under the permissive AGPL-3.0 license
    </a>
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
      margin-top: 1.0rem;
    }
    span.subheading {
      font-size: 1.4rem;
      display: block;
      word-wrap: break-word;
      white-space: normal;
      margin-bottom: 1rem;
    }
    span.uri {
      font-size: 0.9rem;
      color: #aaa;
      display: block;
      word-wrap: break-word;
    }
    a {
      color: #CCC;
      text-decoration: none;
      font-size: 1.2rem;
    }
    ul {
      margin: 0;
      padding: 0;
      list-style-type: none;
    }
    li {
      padding: 0.5em 1rem;
      margin: 0 -1rem;
    }
    li:hover {
      background-color: #447;
    }
    li:nth-child(2n) {
      background-color: #114;
    }
    li:nth-child(2n):hover {
      background-color: #225;
    }
    .attribution {
      margin: 1rem 0;
      font-size: 0.65rem;
      display: block;
    }
    @media(max-width: 430px) {
      div.center {
        width: 95%;
      }
      span.uri {
        font-size: 1.0rem;
        padding-top: 0.5rem;
      }
      a {
        font-size: 1.4rem;
      }
      li {
        padding: 1.0rem;
        margin: 0;
        background-color: #336;
      }
      .attribution {
        font-size: 0.8rem;
      }
    }
    </style>
    </body>
    </html>`;
  res.send(response);
});

app.get("/listSSE", async (req, res) => {
  const clientId = Date.now();
  const headers = {
    "Content-Type": "text/event-stream",
    Connection: "keep-alive",
    "Cache-Control": "no-cache",
  };
  res.writeHead(200, headers);
  req.on("close", () => {
    res.end();
  });
  const newClient = {
    id: clientId,
    res,
  };
  updatePdfsInBackground(newClient);
});

app.get("/list", async (req, res) => {
  const pdfs = await listPdfs();
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
    response += `<li><a href=${x["uri"]} target="_blank">${x["title"]}<br /><span class="uri">${x["uri"]}</span></a></li>`;
  }
  res.send(response);
});

app.get("/latest", async (req, res) => {
  const pdfs = await listPdfs();
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

const sseHeartbeat = (client) => {
  if (!client) {
    return;
  }
  client.res.write("event: heartbeat\n");
  client.res.write("data: badum badum\n\n");
  setTimeout(sseHeartbeat.bind(client), 54000);
};

const updatePdfsInBackground = (client) => {
  sseHeartbeat(client);
  listPdfs().then((pdfs) => {
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
      response += `<li><a href=${x["uri"]} target="_blank">${x["title"]}<br /><span class="uri">${x["uri"]}</span></a></li>`;
    }

    client.res.write("event: list\n");
    client.res.write(`data: ${response}\n\n`);
    client.res.write("event: close\n");
    client.res.write("data: true\n");
    client.res.end();
  });
};

const PORT = process.env.PORT || 3000;
app.listen(PORT);
