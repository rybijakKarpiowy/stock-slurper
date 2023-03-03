import { Request, Response } from "express";
import cron from "node-cron";
import { saveToDB } from "./func/db";
import { parScraper } from "./func/scrapers/par";

var express = require("express");
var app = express();

const port = process.env.PORT || 3000;

app.get("/", async (req: Request, res: Response) => {
    // const par = await parScraper();
    res.send("Backend app");
});

app.listen(port, async () => {
    console.log(`Backend app listening on port ${port}!`);
});

cron.schedule("0 6 * * *", async () => {
    // fetch par
    const par = await parScraper();
    // write to db
    saveToDB(par, "Par")
        .then(() => console.log("Par saved to db"))
        .catch((err) => console.log(err));
});
