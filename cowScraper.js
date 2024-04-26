import { load } from "cheerio";
import { get } from "node:http";
import { ParsePDF } from "./parsePDF.js";

import { createClient } from "redis";
import { createHash } from "node:crypto";

const baseurl = "http://www.gazette.vic.gov.au";
const url = "http://www.gazette.vic.gov.au/gazette_bin/gazette_archives.cfm";

// Create a Redis client object
const redisClient = createClient();

// Handle connection errors
redisClient.on("error", (err) => console.log("Redis Client Error", err));

// Connect to Redis
redisClient
  .connect()
  .then(() => console.log("Connected to Redis"))
  .catch((err) => console.log("Failed to connect to Redis", err));

const fetchPdf = async (uri, title, hash) => {
  return new Promise((resolve, reject) => {
    try {
      ParsePDF(uri).then(async (data) => {
        let row = { uri, title };
        // This seems to be the consistent string to look for in the PDFs
        if (data.includes("Control of Weapons Act 1990")) {
          redisClient.hSet(`flagged:${hash}`, row);
        } else redisClient.set(`discarded:${hash}`, "discarded");

        resolve();
      });
    } catch (e) {
      reject(e);
    }
  });
};

const updatePdfs = () => {
  return new Promise(async (resolve, reject) => {
    const updated_at = await redisClient.get("updated_at");
    if (Number(updated_at) > Date.now() - 21600000) {
      resolve();
    }

    get(url, (res) => {
      let pageData;
      res.on("data", (chunk) => (pageData += chunk));
      res.on("end", async () => {
        let $ = load(pageData);
        let gl = $("#special_gazettes a");

        let pdfs = await Promise.allSettled(
          gl.map(async (_, el) => {
            return new Promise(async (resolve, reject) => {
              let title = $(el).text();
              let newuri = baseurl + $(el).attr("href");
              let hash = createHash("sha1")
                .update($(el).attr("href"))
                .digest("base64");
              let exists = await redisClient.exists(`*:${hash}`);
              console.log(exists);
              if (exists) {
                reject();
              }

              resolve([title, newuri, hash]);
            });
          }),
        );

        pdfs = pdfs.filter((pdf) => pdf.status === "fulfilled");

        await Promise.all(
          pdfs.map(async (pdf) =>
            fetchPdf(pdf.value[1], pdf.value[0], pdf.value[2]),
          ),
        );

        redisClient.set("updated_at", Date.now());
        resolve();
      });
    });
  });
};

const getFlaggedPdfs = async () => {
  return new Promise(async (resolve, reject) => {
    let keys = await redisClient.keys("flagged:*");
    let gazettes = []
    for (let key of keys) {
      gazettes.push(await redisClient.hGetAll(key))
    }
    resolve(gazettes);
  });
};

export const listPdfs = async () => {
  try {
    await updatePdfs();
    return await getFlaggedPdfs();
  } catch (e) {
    console.error("Failed to read PDF list: ", e);
    return;
  }
};
