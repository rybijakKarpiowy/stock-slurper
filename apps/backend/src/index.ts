import { Request, Response } from "express";
import cron from "node-cron";
import { getStatistics } from "./func/calculations";
import { getNDaysOfCompany, maxDays, getItemIdsOfCompany } from "./func/db";
import { scrape } from "./func/scrape";
import { createSpreadsheet, deleteSpreadsheets } from "./func/spreadsheet";

var express = require("express");
var cors = require("cors");
var app = express();

const port = process.env.PORT || 5000;

app.use(cors({ origin: true }));

app.get("/", async (req: Request, res: Response) => {
    if (!req.query.company || !req.query.n) {
        res.json({ message: "Proszę wypełnić wszystkie pola" }).status(400);
        return;
    }
    if (
        req.query.company != "Asgard" &&
        req.query.company != "Par" &&
        req.query.company != "Axpol"
    ) {
        res.json({ message: "Nieprawidłowa firma" }).status(400);
        return;
    }
    if (isNaN(parseInt(req.query.n as string))) {
        res.json({ message: "Nieprawidłowa liczba dni" }).status(400);
        return;
    }
    if (parseInt(req.query.n as string) < 2) {
        res.json({ message: "Liczba dni musi wynosić co najmniej 1" }).status(400);
        return;
    }

    const company = req.query.company as "Asgard" | "Par" | "Axpol";
    const n = parseInt(req.query.n as string);

    const itemIds = await getItemIdsOfCompany(company);

    const dbDays = await maxDays(n, itemIds);
    if (n > dbDays) {
        res.json({ message: `Maksymalna liczba dni to ${dbDays - 1}` }).status(400);
        return;
    }

    const statistics = await getStatistics(await getNDaysOfCompany(n, itemIds))
        .catch((err) => console.log(err))
        .catch((err) => console.log(err));

    if (!statistics) {
        res.json({ message: "Wystąpił nieoczekiwany błąd" }).status(400);
        return;
    }

    const spreadsheetLink = await createSpreadsheet(statistics, company, n).catch((err) =>
        console.log(err)
    );

    if (!spreadsheetLink) {
        res.json({ message: "Wystąpił nieoczekiwany błąd" }).status(400);
        return;
    }

    res.json({ spreadsheetLink }).status(200).end();
    return;
});

app.listen(port, () => {
    console.log(`Backend app listening on port ${port}!`);
});

cron.schedule("15 0 * * *", async () => {
    console.log("Running cron job");
    await scrape("Asgard").catch((err) => console.log(err));
    await scrape("Par").catch((err) => console.log(err));
});

// cron.schedule("0 0 1 * *", async () => {
//     console.log("Deleting spreadsheets")
//     await deleteSpreadsheets().then(() => console.log("Spreadsheets deleted"));
// });
