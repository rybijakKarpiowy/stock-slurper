import { Request, Response } from "express";
import cron from "node-cron";
import { getStatistics } from "./func/calculations";
import { getNDaysOfCompany, saveToDB, maxDays } from "./func/db";
import { axpolScraper } from "./func/scrapers/axpol";
import { parScraper } from "./func/scrapers/par";
import { create } from "./func/spreadsheet";

var express = require("express");
var cors = require("cors");
var app = express();

const port = process.env.PORT || 5000;

app.use(cors({ origin: true }));

app.get("/", async (req: Request, res: Response) => {
    if (!req.query.company || !req.query.n) {
        res.send("Proszę wypełnić wszystkie pola").status(400);
        return;
    }
    if (
        req.query.company != "Asgard" &&
        req.query.company != "Par" &&
        req.query.company != "Axpol"
    ) {
        res.send("Nieprawidłowa firma").status(400);
        return;
    }
    if (isNaN(parseInt(req.query.n as string))) {
        res.send("Nieprawidłowa liczba dni").status(400);
        return;
    }
    if (parseInt(req.query.n as string) < 2) {
        res.send("Liczba dni musi wynosić co najmniej 1").status(400);
        return;
    }

    const company = req.query.company as "Asgard" | "Par" | "Axpol";
    const n = parseInt(req.query.n as string);

    const dbDays = await maxDays(n, company);
    if (n > dbDays) {
        res.send(`Maksymalna liczba dni to ${dbDays}`).status(400);
        return;
    }

    const statistics = getStatistics(await getNDaysOfCompany(n, company));

    res.status(200);
});

app.listen(port, () => {
    console.log(`Backend app listening on port ${port}!`);
});

cron.schedule("0 0 * * *", async () => {
    console.log("Running cron job");
    // fetch par and write to db
    const par = await parScraper();
    saveToDB(par, "Par")
        .then(() => console.log("Par saved to db"))
        .catch((err) => console.log(err));
});
