import * as cheerio from "cheerio";
import { Product } from "./par";

export const mobScraper = async () => {
	const SKUs = await collectSKUs();
	const authCookie = await getAuthCookie();

	const promises = [] as Promise<Product>[];
	for (const SKU of SKUs) {
		promises.push(getProduct(SKU, authCookie));
	}

	const products = await Promise.allSettled(promises).then((res) =>
		res
			.filter((r) => r.status === "fulfilled")
			.map((r) => (r as PromiseFulfilledResult<Product>).value)
	);

	return products;
};

const getSyncToken = async () => {
	let cookies: string | null = null;
	let res: Response | null = null;

	for (let i = 0; i < 3; i++) {
		const resTemp = await fetch(
			"https://www.midocean.com/poland/pl/pln/login",
			{
				headers: {
					accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
					"accept-language":
						"en-US,en;q=0.9,pl-PL;q=0.8,pl;q=0.7,la;q=0.6",
					"cache-control": "max-age=0",
					"content-type": "application/x-www-form-urlencoded",
					priority: "u=0, i",
					"sec-ch-ua":
						'"Not)A;Brand";v="99", "Google Chrome";v="127", "Chromium";v="127"',
					"sec-ch-ua-mobile": "?0",
					"sec-ch-ua-platform": '"Windows"',
					"sec-fetch-dest": "document",
					"sec-fetch-mode": "navigate",
					"sec-fetch-site": "same-origin",
					"sec-fetch-user": "?1",
					"upgrade-insecure-requests": "1",
					"Referrer-Policy": "strict-origin-when-cross-origin",
				},
			}
		);

		const getCookie = resTemp.headers.get("set-cookie");
		if (getCookie) {
			cookies = getCookie;
			res = resTemp;
			break;
		}
	}

	if (!cookies || !res) {
		throw new Error("Could not get sync token");
	}

	// regex matching "; Expires=...; "
	const regex = /Expires=.*?; /g;
	const parsedCookies = cookies
		.replace(regex, "")
		.split(", ")
		.map((cookie) => cookie.split(";")[0])
		.join("; ");

	const rawBody = await res.text();
	const body = cheerio.load(rawBody, null, false);
	const syncToken = body("input[name='SynchronizerToken']").attr("value");

	return { syncToken, parsedCookies };
};

const getAuthCookie = async () => {
	const { syncToken, parsedCookies } = await getSyncToken();

	let cookies: string | null = null;
	for (let i = 0; i < 3; i++) {
		const res = await fetch(
			"https://www.midocean.com/poland/pl/pln/process-login",
			{
				headers: {
					accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
					"accept-language": "en-US,en;q=0.9",
					"cache-control": "max-age=0",
					"content-type": "application/x-www-form-urlencoded",
					priority: "u=0, i",
					"sec-ch-ua":
						'"Not)A;Brand";v="99", "Google Chrome";v="127", "Chromium";v="127"',
					"sec-ch-ua-mobile": "?0",
					"sec-ch-ua-platform": '"Windows"',
					"sec-fetch-dest": "document",
					"sec-fetch-mode": "navigate",
					"sec-fetch-site": "same-origin",
					"sec-fetch-user": "?1",
					"upgrade-insecure-requests": "1",
					cookie: parsedCookies,
					Referer: "https://www.midocean.com/poland/pl/pln/login",
					"Referrer-Policy": "strict-origin-when-cross-origin",
				},
				body: `SynchronizerToken=${syncToken}&ShopLoginForm_Login=${process.env.MOB_LOGIN}&ShopLoginForm_Password=${process.env.MOB_PASSWORD}&login=Login`,
				method: "POST",
			}
		);

		const getCookie = res.headers.get("set-cookie");
		if (getCookie) {
			cookies = getCookie;
			break;
		}
	}

	if (!cookies) {
		throw new Error("Could not get auth cookie");
	}

	// regex matching "; Expires=...; "
	const regex = /Expires=.*?; /g;
	const parsedCookiesAuth = cookies
		.replace(regex, "")
		.split(", ")
		.map((cookie) => cookie.split(";")[0])
		.join("; ");

	const initKV = parsedCookies.split("; ").map((cookie) => cookie.split("="));
	const authKV = parsedCookiesAuth
		.split("; ")
		.map((cookie) => cookie.split("="));

	// overwrite cookies with auth cookies, keep unchanged cookies
	const authCookie = initKV
		.map((cookie) => {
			const authCookie = authKV.find((kv) => kv[0] === cookie[0]);
			if (authCookie) {
				return authCookie.join("=");
			}
			return cookie.join("=");
		})
		.join("; ");

	return authCookie;
};

const collectSKUs = async () => {
	const promises = [] as Promise<Response>[];

	// fetch 120 pages (there are 108 pages at the moment)
	for (let i = 0; i < 120; i++) {
		promises.push(
			fetch(
				`https://www.midocean.com/poland/pl/pln/search/page-${i}?PageSize=&ViewType=&SearchTerm=*&SearchParameter=%26%40QueryTerm%3D*%26OnlineFlag%3D1%26%40P.BOOST.BoostValues_PLCStatus%3D11%26%40P.BOOST.BoostFactor_PLCStatus%3D100.0%26%40P.BOOST.BoostFactor_DefaultVariation%3D1.1%26%40P.BOOST.BoostValues_DefaultVariation%3Dtrue`
			)
		);
	}

	const rawBodiesPromises = await Promise.allSettled(promises).then((res) =>
		res
			.filter((r) => r.status === "fulfilled")
			.map((r) => {
				const res = (r as PromiseFulfilledResult<Response>).value;
				return res.text();
			})
	);

	const rawBodies = await Promise.allSettled(rawBodiesPromises).then((res) =>
		res
			.filter((r) => r.status === "fulfilled")
			.map((r) => (r as PromiseFulfilledResult<string>).value)
	);

	const SKUs = rawBodies
		.map((rawBody) => {
			const body = cheerio.load(rawBody, null, false);

			const productContainers = body("div.product-list-item");
			const pageSKUs = [] as number[];
			for (const productContainer of productContainers) {
				const SKU = body(productContainer)
					.attr("data-ajax-content")
					?.split("SKU=")[1];
				if (SKU) {
					pageSKUs.push(parseInt(SKU));
				}
			}

			return pageSKUs;
		})
		.flat();

	const uniqueSKUs = SKUs.filter(
		(sku, index, self) => index === self.indexOf(sku)
	);
	return uniqueSKUs;
};

const getProduct = async (SKU: number, authCookie: string) => {
	const tileRes = await fetch(
		`https://www.midocean.com/INTERSHOP/web/WFS/midocean-PL-Site/pl_PL/-/PLN/ViewProduct-ShowTile?SKU=${SKU}`,
		{
			headers: {
				accept: "text/html, */*; q=0.01",
				"accept-language":
					"en-US,en;q=0.9,pl-PL;q=0.8,pl;q=0.7,la;q=0.6",
				newrelic:
					"eyJ2IjpbMCwxXSwiZCI6eyJ0eSI6IkJyb3dzZXIiLCJhYyI6IjI3MDYzNTgiLCJhcCI6IjE1ODg5NDM1NDgiLCJpZCI6ImIxYzYzMTY1YjQxYjIyZTUiLCJ0ciI6IjA3YWM0YWY0OTBjMjc3ZDJiMGIxNWNlNGI3YWI0NmNhIiwidGkiOjE3MjQyNDI2MDgzNzIsInRrIjoiMjg4NDg3NiJ9fQ==",
				priority: "u=1, i",
				"sec-ch-ua":
					'"Not)A;Brand";v="99", "Google Chrome";v="127", "Chromium";v="127"',
				"sec-ch-ua-mobile": "?0",
				"sec-ch-ua-platform": '"Windows"',
				"sec-fetch-dest": "empty",
				"sec-fetch-mode": "cors",
				"sec-fetch-site": "same-origin",
				"x-requested-with": "XMLHttpRequest",
				cookie: authCookie,
				Referer: "https://www.midocean.com/poland/pl/pln/search",
				"Referrer-Policy": "strict-origin-when-cross-origin",
			},
			body: null,
			method: "GET",
		}
	);

	const tileBody = await tileRes.text();
	const tile = cheerio.load(tileBody, null, false);
	const name = tile("div.product-description a").text();
	const code = tile("a.product-title span").text().trim();
	const priceText = tile("div.current-price-markup span").text().trim();
	const price =
		parseFloat(priceText.replace(",", ".").replace("PLN", "").trim()) || 0;
	const link = tile("div.product-description a").attr("href");

	const stockRes = await fetch(
		`https://www.midocean.com/INTERSHOP/web/WFS/midocean-PL-Site/pl_PL/-/PLN/ViewProductStock-StockLevel?SKU=${SKU}&Total=true&ShowShineStock=false`,
		{
			headers: {
				accept: "text/html, */*; q=0.01",
				newrelic:
					"eyJ2IjpbMCwxXSwiZCI6eyJ0eSI6IkJyb3dzZXIiLCJhYyI6IjI3MDYzNTgiLCJhcCI6IjE1ODg5NDM1NDgiLCJpZCI6Ijk1MzI1OGI5YWY2YjlhZTEiLCJ0ciI6IjA4MjM3MzVmNjMzOGQxMzA0MDU3NjVmZDMzOWVjNzVhIiwidGkiOjE3MjQyMzkyMzU2MjgsInRrIjoiMjg4NDg3NiJ9fQ==",
				"sec-ch-ua":
					'"Not)A;Brand";v="99", "Google Chrome";v="127", "Chromium";v="127"',
				"sec-ch-ua-mobile": "?0",
				"sec-ch-ua-platform": '"Windows"',
				traceparent:
					"00-0823735f6338d130405765fd339ec75a-953258b9af6b9ae1-01",
				tracestate:
					"2884876@nr=0-1-2706358-1588943548-953258b9af6b9ae1----1724239235628",
				"x-requested-with": "XMLHttpRequest",
				Referer: "https://www.midocean.com/poland/pl/pln/",
				"Referrer-Policy": "strict-origin-when-cross-origin",
				cookie: authCookie,
			},
			body: null,
			method: "GET",
		}
	);

	const stockBody = await stockRes.text();
	const stock = cheerio.load(stockBody, null, false);

	// match not digit characters
	const regex = /\D/g;
	const amount = parseInt(stock("span.stock").text().replace(regex, "")) || 0;

	const product = {
		name,
		code,
		price,
		amount,
		link,
	} as Product;

	return product;
};
