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

app.get("/listSSE", async (req, res) => {
  const clientId = Date.now();
  const headers = {
    "Content-Type": "text/event-stream",
    Connection: "keep-alive",
    "Cache-Control": "no-cache",
  };
  res.writeHead(200, headers);
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
    response += `<li><a href=${x["uri"]}>${x["title"]}<br /><span class="uri">${x["uri"]}</span></a></li>`;
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
  console.log("beat");
  client.res.write("event: heartbeat\n");
  client.res.write("data: baddum baddum\n\n");
  setTimeout(sseHeartbeat.bind(client), 25000);
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
      response += `<li><a href=${x["uri"]}>${x["title"]}<br /><span class="uri">${x["uri"]}</span></a></li>`;
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
