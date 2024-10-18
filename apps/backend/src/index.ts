import cron from "node-cron";
import { getStatistics } from "./func/calculations";
import {
	getNDaysOfCompany,
	getItemIdsOfCompany,
	getFirstDay,
	ItemHistory,
	getNumberOfDays,
} from "./func/db";
import { scrape } from "./func/scrape";
import { createSpreadsheet, deleteSpreadsheets } from "./func/spreadsheet";
import ws from "ws";
import http from "http";

require("dotenv").config();

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
			company != "Stricker" &&
			company != "Maxim" &&
			company != "MOB" &&
			company != "all"
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
			filter: string;
			n?: string;
			from?: string;
			to?: string;
		};

		// Data validation
		if (!data.company || (!data.n && (!data.from || !data.to))) {
			client.send(
				JSON.stringify({ message: "Proszę wypełnić wszystkie pola" })
			);
			client.close();
			return;
		}
		if (
			data.company != "Asgard" &&
			data.company != "Par" &&
			data.company != "Axpol" &&
			data.company != "Stricker" &&
			data.company != "Maxim" &&
			data.company != "MOB" &&
			data.company != "all"
		) {
			client.send(JSON.stringify({ message: "Nieprawidłowa firma" }));
			client.close();
			return;
		}
		if (data.n && isNaN(parseInt(data.n))) {
			client.send(
				JSON.stringify({ message: "Nieprawidłowa liczba dni" })
			);
			client.close();
			return;
		}
		if (data.n && parseInt(data.n) < 2) {
			client.send(
				JSON.stringify({
					message: "Liczba dni musi wynosić co najmniej 1",
				})
			);
			client.close();
			return;
		}
		if (data.from && isNaN(Date.parse(data.from))) {
			client.send(
				JSON.stringify({ message: "Nieprawidłowa data początkowa" })
			);
			client.close();
			return;
		}
		if (data.to && isNaN(Date.parse(data.to))) {
			client.send(
				JSON.stringify({ message: "Nieprawidłowa data końcowa" })
			);
			client.close();
			return;
		}
		if (
			data.from &&
			data.to &&
			Date.parse(data.from) >= Date.parse(data.to)
		) {
			client.send(
				JSON.stringify({
					message:
						"Data początkowa musi być wcześniejsza niż data końcowa",
				})
			);
			client.close();
			return;
		}

		const company = data.company as companyName;
		let days = [] as ItemHistory[] | undefined; // If company is not all
		let daysByCompany = {} as { [key: string]: ItemHistory[] } | undefined; // If company is all
		let daysCount = 0;
		let from: Date | undefined;
		let to: Date | undefined;
		if (data.n) {
			from = new Date();
			to = new Date();
			from.setDate(from.getDate() - parseInt(data.n));
		} else if (data.from && data.to) {
			from = new Date(data.from);
			to = new Date(data.to);
		} else {
			client.send(
				JSON.stringify({ message: "Proszę wypełnić wszystkie pola" })
			);
			client.close();
			return;
		}

		const itemIds = await getItemIdsOfCompany(company, data.filter);

		// Check dates vialibility and get number of days
		const count = await getNumberOfDays(from, to, itemIds);
		if (!count) {
			client.send(
				JSON.stringify({
					message: "Brak danych dla tego zakresu dat",
				})
			);
			client.close();
			return;
		}

		// Get days from db
		const daysByCompanyTemp = await getNDaysOfCompany(
			0,
			itemIds,
			client,
			company,
			from,
			to
		);
		if (company !== "all") {
			days = daysByCompanyTemp[company];
		} else {
			daysByCompany = daysByCompanyTemp;
		}
		daysCount = count;

		if (company !== "all") {
			getStatistics(days!, client).then((statistics) => {
				days = [];
				createSpreadsheet(statistics, company, daysCount).then(
					(spreadsheetLink) => {
						client.send(JSON.stringify({ spreadsheetLink }));
						client.close();
						return;
					}
				);
			});
		} else {
			const statistics = (
				await Promise.all(
					companies.map(async (company) => {
						const days = daysByCompany![company];
						if (!days) return [];
						return await getStatistics(days, client);
					})
				)
			)
				.flat()
				.sort(
					(a, b) =>
						b.avgRevenuePerDaySellDay - a.avgRevenuePerDaySellDay
				);

			createSpreadsheet(statistics, "all", daysCount).then(
				(spreadsheetLink) => {
					client.send(JSON.stringify({ spreadsheetLink }));
					client.close();
					return;
				}
			);
		}
	});
};

cron.schedule("0 0 * * *", async () => {
	console.log("Running cron job");

	const companies = [
		"Axpol",
		"Par",
		"Stricker",
		"Asgard",
		"MOB",
		// "Maxim"
	] as companyName[];
	const promises = [];

	for (const company of companies) {
		promises.push(scrape(company));
	}

	const settled = await Promise.allSettled(promises);
	for (const result of settled) {
		if (result.status === "rejected") {
			console.log(result.reason);
		}
	}

	console.log("Cron job finished");
});

cron.schedule("0 23 * * *", async () => {
	console.log("Deleting spreadsheets");
	await deleteSpreadsheets().then(() => console.log("Spreadsheets deleted"));
});

export type companyName =
	| "Asgard"
	| "Par"
	| "Axpol"
	| "Stricker"
	| "Maxim"
	| "MOB"
	| "PfConcept"
	| "all";
const companies = [
	"Asgard",
	"Par",
	"Axpol",
	"Stricker",
	"Maxim",
	"MOB",
	"PfConcept",
];
