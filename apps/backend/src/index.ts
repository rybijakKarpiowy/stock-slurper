import cron from "node-cron";
import { getStatistics } from "./func/calculations";
import {
    getNDaysOfCompany,
    maxDays,
    getItemIdsOfCompany,
    getFirstDay,
    ItemHistory,
    fromToValidator,
} from "./func/db";
import { scrape } from "./func/scrape";
import { createSpreadsheet, deleteSpreadsheets } from "./func/spreadsheet";
import ws from "ws";
import http from "http";

const port = process.env.PORT || 5000;
const wss = new ws.Server({ noServer: true });

http.createServer(async (req, res) => {
    if (req.url?.includes("/firstday") && req.method === "GET") {
        const URL = new URLSearchParams(req.url.split("?")[1]);
        const company = URL.get("company");
        if (
            company != "Asgard" &&
            company != "Par" &&
            company != "Axpol" &&
            company != "Stricker"
        ) {
            res.writeHead(400, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ message: "Nieprawidłowa firma" }));
            return;
        }
        const { firstDay, secondDay } = await getFirstDay(company);
        res.writeHead(200, {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
        });
        res.end(JSON.stringify({ firstDay, secondDay }));
        return;
    }

    wss.handleUpgrade(req, req.socket, Buffer.alloc(0), onSocketConnection);
}).listen(port, () => {
    console.log(`Backend app listening on port ${port}!`);
});

const onSocketConnection = (client: ws.WebSocket) => {
    client.on("message", async (message) => {
        const data = JSON.parse(message.toString()) as {
            company: string;
            n?: string;
            from?: string;
            to?: string;
        };

        // Data validation
        if (!data.company || (!data.n && (!data.from || !data.to))) {
            client.send(JSON.stringify({ message: "Proszę wypełnić wszystkie pola" }));
            client.close();
            return;
        }
        if (
            data.company != "Asgard" &&
            data.company != "Par" &&
            data.company != "Axpol" &&
            data.company != "Stricker"
        ) {
            client.send(JSON.stringify({ message: "Nieprawidłowa firma" }));
            client.close();
            return;
        }
        if (data.n && isNaN(parseInt(data.n))) {
            client.send(JSON.stringify({ message: "Nieprawidłowa liczba dni" }));
            client.close();
            return;
        }
        if (data.n && parseInt(data.n) < 2) {
            client.send(JSON.stringify({ message: "Liczba dni musi wynosić co najmniej 1" }));
            client.close();
            return;
        }
        if (data.from && isNaN(Date.parse(data.from))) {
            client.send(JSON.stringify({ message: "Nieprawidłowa data początkowa" }));
            client.close();
            return;
        }
        if (data.to && isNaN(Date.parse(data.to))) {
            client.send(JSON.stringify({ message: "Nieprawidłowa data końcowa" }));
            client.close();
            return;
        }
        if (data.from && data.to && Date.parse(data.from) >= Date.parse(data.to)) {
            client.send(
                JSON.stringify({
                    message: "Data początkowa musi być wcześniejsza niż data końcowa",
                })
            );
            client.close();
            return;
        }

        const company = data.company as "Asgard" | "Par" | "Axpol" | "Stricker";
        let days = [] as ItemHistory[];
        let daysCount = 0;
        if (data.n) {
            const n = parseInt(data.n);
            const itemIds = await getItemIdsOfCompany(company);

            // Check if n is not bigger than maxDays
            maxDays(n, itemIds).then((dbDays) => {
                if (n > dbDays) {
                    client.send(
                        JSON.stringify({ message: `Maksymalna liczba dni to ${dbDays - 1}` })
                    );
                    client.close();
                    return;
                }
            });

            days = await getNDaysOfCompany(n, itemIds, client, company);
            daysCount = n;
        }

        if (data.from && data.to) {
            const from = new Date(data.from);
            const to = new Date(data.to);
            const itemIds = await getItemIdsOfCompany(company);

            // Check dates vialibility and get number of days
            const { valid, count } = await fromToValidator(from, to, itemIds);
            if (!valid) {
                client.send(
                    JSON.stringify({
                        message: "Podano nieprawidłowy zakres dat, spróbój ponownie",
                    })
                );
                client.close();
                return;
            }

            // Get days from db
            days = await getNDaysOfCompany(0, itemIds, client, company, from, to);
            daysCount = count;
        }

        getStatistics(days, client).then((statistics) => {
            days = [];
            createSpreadsheet(statistics, company, daysCount).then((spreadsheetLink) => {
                client.send(JSON.stringify({ spreadsheetLink }));
                client.close();
                return;
            });
        });
    });
};

cron.schedule("0 0 * * *", async () => {
    console.log("Running cron job");
    await scrape("Axpol").catch((err) => console.log(err));
    await scrape("Par").catch((err) => console.log(err));
    await scrape("Stricker").catch((err) => console.log(err));
});

cron.schedule("0 23 * * *", async () => {
    console.log("Deleting spreadsheets");
    await deleteSpreadsheets().then(() => console.log("Spreadsheets deleted"));
});
