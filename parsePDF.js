import { get } from "node:http";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";

export async function ParsePDF(path) {
  return new Promise((resolve, reject) => {
    get(path, (res) => {
      try {
        let pdfData = [];
        // ugh processing PDFSSSSSSSS without hitting CORS or w/e
        res.on("data", (chunk) => pdfData.push(Buffer.from(chunk, "binary")));
        res.on("end", async () => {
          const data = new Uint8Array(Buffer.concat(pdfData).buffer);
          let doc = await pdfjsLib.getDocument(data).promise;

          let numPages = doc.numPages;
          let content = [];
          for (let i = 1; i <= numPages; i++) {
            doc.getPage(i).then((page) => {
              page.getTextContent().then((pageData) => {
                let items = pageData.items.map((item) => item.str);
                content = content.concat(items);
                if (i == numPages) {
                  resolve(content);
                  return;
                }
              });
            });
          }
        });
      } catch (e) {
        reject(e);
        return;
      }
    });
  });
}
