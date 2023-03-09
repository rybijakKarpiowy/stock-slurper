import cron from "node-cron";
import { getStatistics } from "./func/calculations";
import { getNDaysOfCompany, maxDays, getItemIdsOfCompany } from "./func/db";
import { scrape } from "./func/scrape";
import { createSpreadsheet, deleteSpreadsheets } from "./func/spreadsheet";
import ws from "ws";
import http from "http";

const port = process.env.PORT || 5000;
const wss = new ws.Server({ noServer: true });

http.createServer((req, res) => {
    wss.handleUpgrade(req, req.socket, Buffer.alloc(0), onSocketConnection);
}).listen(port, () => {
    console.log(`Backend app listening on port ${port}!`);
});

const onSocketConnection = (client: ws.WebSocket) => {
    client.on("message", (message) => {
        const data = JSON.parse(message.toString());
        if (!data.company || !data.n) {
            client.send(JSON.stringify({ message: "Proszę wypełnić wszystkie pola" }));
            client.close();
            return;
        }
        if (data.company != "Asgard" && data.company != "Par" && data.company != "Axpol") {
            client.send(JSON.stringify({ message: "Nieprawidłowa firma" }));
            client.close();
            return;
        }
        if (isNaN(parseInt(data.n))) {
            client.send(JSON.stringify({ message: "Nieprawidłowa liczba dni" }));
            client.close();
            return;
        }
        if (parseInt(data.n) < 2) {
            client.send(JSON.stringify({ message: "Liczba dni musi wynosić co najmniej 1" }));
            client.close();
            return;
        }

        const company = data.company as "Asgard" | "Par" | "Axpol";
        const n = parseInt(data.n);

        getItemIdsOfCompany(company).then((itemIds) => {
            maxDays(n, itemIds).then((dbDays) => {
                if (n > dbDays) {
                    client.send(
                        JSON.stringify({ message: `Maksymalna liczba dni to ${dbDays - 1}` })
                    );
                    client.close();
                    return;
                }

                getNDaysOfCompany(n, itemIds, client).then((days) => {
                    getStatistics(days, client).then((statistics) => {
                        createSpreadsheet(statistics, company, n).then((spreadsheetLink) => {
                            client.send(JSON.stringify({ spreadsheetLink }));
                            client.close();
                            return;
                        });
                    });
                });
            });
        });
    });
};

cron.schedule("0 0 * * *", async () => {
    console.log("Running cron job");
    await scrape("Axpol").catch((err) => console.log(err));
    await scrape("Par").catch((err) => console.log(err));
});

cron.schedule("0 0 1 * *", async () => {
    console.log("Deleting spreadsheets");
    await deleteSpreadsheets().then(() => console.log("Spreadsheets deleted"));
});
