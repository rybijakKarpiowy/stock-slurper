import { Request, Response } from "express";
import cron from "node-cron";
import { saveToDB } from "./func/db";
import { axpolScraper } from "./func/scrapers/axpol";
import { parScraper } from "./func/scrapers/par";
import { create } from "./func/spreadsheet";

var express = require("express");
var app = express();

const port = process.env.PORT || 3000;

app.get("/", (req: Request, res: Response) => {
    res.send("Backend app");
});

app.listen(port, () => {
    console.log(`Backend app listening on port ${port}!`);
});

cron.schedule("0 6 * * *", async () => {
    console.log("Running cron job");
    // fetch par and write to db
    const par = await parScraper();
    saveToDB(par, "Par")
        .then(() => console.log("Par saved to db"))
        .catch((err) => console.log(err));
});
