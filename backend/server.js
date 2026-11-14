import { createServer } from "node:http";
import { handleReports } from "./routes/reportRoutes.js";
import { initDB } from "./utils/fileDb.js";

const host = "127.0.0.1";
const port = Number(process.env.PORT || 4000);

initDB();

createServer(async (request, response) => {
  let result;
  try {
    result = await handleReports(request);
  } catch (error) {
    console.error("Error procesando el reporte:", error.message);
    result = { status: 500, body: { error: "No se pudo procesar el reporte." } };
  }
  response.writeHead(result.status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
  });
  response.end(JSON.stringify(result.body));
}).listen(port, host, () => {
  console.log("API ASTRIA en http://" + host + ":" + port);
});
