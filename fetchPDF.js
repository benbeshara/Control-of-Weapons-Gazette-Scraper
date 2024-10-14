import { parentPort, workerData } from "worker_threads";
import { createClient } from "redis";
import { ParsePDF } from "./parsePDF.js";

const redis_url = process.end.REDIS_URL;
const redisClient = createClient({
  url: redis_url,
  socket: {
    tls: redis_url.match(/rediss:/) != null,
    rejectUnauthorized: false,
  },
});

redisClient.on("error", (err) =>
  console.log("Redis Client Error (Worker Thread)", err),
);
redisClient
  .connect()
  .then(() => console.log("Connected to Redis (Worker Thread)"))
  .catch((err) =>
    console.log("Failed to connect to Redis (Worker Thread)", err),
  );

const fetchPdf = async (pdfData) => {
  const title = pdfData[0];
  const uri = pdfData[1];
  const hash = pdfData[2];

  try {
    ParsePDF(uri).then(async (data) => {
      let row = { uri, title };
      // This seems to be the consistent string to look for in the PDFs
      if (data.includes("Control of Weapons Act 1990")) {
        redisClient.hSet(`flagged:${hash}`, row);
      } else redisClient.set(`discarded:${hash}`, "discarded");

      redisClient.set("updated_at", Date.now());

      parentPort.postMessage(`${hash} done`);
      return;
    });
  } catch {
    parentPort.postMessage(false);
    return;
  }
};

fetchPdf(workerData);
