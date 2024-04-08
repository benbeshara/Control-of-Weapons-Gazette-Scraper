import { load } from "cheerio";
import { get } from "node:http";
import { ParsePDF } from "./parsePDF.js";

const baseurl = "http://www.gazette.vic.gov.au";
const url = "http://www.gazette.vic.gov.au/gazette_bin/recent_gazettes.cfm";

get(url, (res) => {
  let pageData;
  res.on("data", (chunk) => (pageData += chunk));
  res.on("end", () => {
    let pdfs = [];
    let $ = load(pageData);
    let gl = $(".gazette_link");
    gl.each((_, e) => {
      pdfs.push(baseurl + $(e).attr("href"));
    });

    pdfs.map((uri) => {
      try {
        ParsePDF(uri).then((data) => {
          // This seems to be the consistent string to look for in the PDFs
          if (data.includes("Control of Weapons Act 1990")) {
            console.log(uri);
          }
        });
      } catch (e) {
        console.error(e);
      }
    });
  });
});
