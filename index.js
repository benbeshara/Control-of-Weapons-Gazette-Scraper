import { load } from "cheerio";
import { get } from "node:http";
import { ParsePDF } from "./parsePDF.js";
import fs from "node:fs/promises";

const baseurl = "http://www.gazette.vic.gov.au";
const url = "http://www.gazette.vic.gov.au/gazette_bin/gazette_archives.cfm";

const cache = "cache.json";

const fetchPdf = async (uri) => {
  return new Promise((resolve, reject) => {
    try {
      ParsePDF(uri).then(async (data) => {
        let row = { uri: uri, flagged: false };

        // This seems to be the consistent string to look for in the PDFs
        if (data.includes("Control of Weapons Act 1990")) {
          row.flagged = true;
        }
        resolve(row);
      });
    } catch (e) {
      reject(e);
    }
  });
};

const updatePdfs = async () => {
  let jsn;

  try {
    jsn = await fs.readFile(cache).then((data) => JSON.parse(data));
  } catch (err) {
    console.error(err);
    jsn = [];
    await fs.writeFile(cache, JSON.stringify(jsn));
  }

  get(url, (res) => {
    let pageData;
    res.on("data", (chunk) => (pageData += chunk));
    res.on("end", async () => {
      // let pdfs = [];
      let $ = load(pageData);
      let gl = $("#special_gazettes a");

      let pdfs = await Promise.allSettled(
        gl.map(async (_, el) => {
          return new Promise((resolve, reject) => {
            let newuri = baseurl + $(el).attr("href");
            for (let i of jsn) {
              if (i["uri"] === newuri) {
                reject();
              }
            }
            resolve(newuri);
          });
        }),
      );

      pdfs = pdfs.filter((pdf) => pdf.status === "fulfilled");

      await Promise.all(pdfs.map(async (uri) => fetchPdf(uri.value))).then(
        (data) => {
          console.log(data);
          data = jsn.concat(data);
          fs.writeFile(cache, JSON.stringify(data));
        },
      );
    });
  });
};

updatePdfs();
