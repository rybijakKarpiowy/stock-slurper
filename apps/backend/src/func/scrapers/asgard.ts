import { Product } from "./par";

export const asgardScraper = async () => {
	const category_ids = await fetch(
		"https://bluecollection.gifts/pl/graphql?hash=600508575&identifier_1=%22new-main-menu%22&_currency=%22%22",
		{
			headers: {
				accept: "application/json",
				"application-model": "DataContainer_1724148661641",
				authorization: "",
				"content-currency": "",
				"content-type": "application/json",
				newrelic:
					"eyJ2IjpbMCwxXSwiZCI6eyJ0eSI6IkJyb3dzZXIiLCJhYyI6IjQwNzc4NzEiLCJhcCI6IjUzODUwOTE3MCIsImlkIjoiYWQ4NmRiZmUzZWRlNGQ4OCIsInRyIjoiZGZiY2QyMTA1NGNhMWFhMWIxMGVjOGU4Nzk1ODZiYzkiLCJ0aSI6MTcyNDE0OTMwMzM4Nn19",
				"sec-ch-ua":
					'"Not/A)Brand";v="8", "Chromium";v="126", "Google Chrome";v="126"',
				"sec-ch-ua-mobile": "?0",
				"sec-ch-ua-platform": '"Linux"',
				traceparent:
					"00-dfbcd21054ca1aa1b10ec8e879586bc9-ad86dbfe3ede4d88-01",
				tracestate:
					"4077871@nr=0-1-4077871-538509170-ad86dbfe3ede4d88----1724149303386",
				Referer:
					"https://bluecollection.gifts/pl/sport-i-wypoczynek.html",
				"Referrer-Policy": "strict-origin-when-cross-origin",
			},
			body: null,
			method: "GET",
		},
	)
		.then((res) => res.json())
		.then((data) => {
			return data.data.menu.items
				.filter((item: any) => item.parent_id === 1 && item.category_id !== null)
				.map((item: any) => item.category_id) as number[];
		});

	const promises: Promise<Product[]>[] = [];

	for (const category_id of category_ids) {
		const promise = new Promise<Product[]>(async (resolve, reject) => {
			const category_items: Product[] = [];
			let i = 1;
			while (true) {
				const items = await fetch(
					`https://bluecollection.gifts/pl/graphql?hash=1719317275&sort_1={%22name%22:%22ASC%22}&filter_1={%22price%22:{},%22category_id%22:{%22eq%22:${category_id}},%22customer_group_id%22:{%22eq%22:%220%22}}&pageSize_1=256&currentPage_1=${i}&_currency=%22%22`,
					{
						headers: {
							accept: "application/json",
							"accept-language":
								"en-US,en;q=0.9,pl-PL;q=0.8,pl;q=0.7,la;q=0.6",
							"application-model": "ProductList_1724148661641",
							authorization: "",
							"content-currency": "",
							"content-type": "application/json",
							newrelic:
								"eyJ2IjpbMCwxXSwiZCI6eyJ0eSI6IkJyb3dzZXIiLCJhYyI6IjQwNzc4NzEiLCJhcCI6IjUzODUwOTE3MCIsImlkIjoiZDE3N2EyZTI1Mzk4YzJjYyIsInRyIjoiYzg2NGJjMGNmOGVmZjkwYWEyOWY4ZDY0YjZjZjNhZjgiLCJ0aSI6MTcyNDE0OTE1ODg3Nn19",
							priority: "u=1, i",
							"sec-ch-ua":
								'"Not/A)Brand";v="8", "Chromium";v="126", "Google Chrome";v="126"',
							"sec-ch-ua-mobile": "?0",
							"sec-ch-ua-platform": '"Linux"',
							"sec-fetch-dest": "empty",
							"sec-fetch-mode": "cors",
							"sec-fetch-site": "same-origin",
							traceparent:
								"00-c864bc0cf8eff90aa29f8d64b6cf3af8-d177a2e25398c2cc-01",
							tracestate:
								"4077871@nr=0-1-4077871-538509170-d177a2e25398c2cc----1724149158876",
							cookie: "_ga=GA1.1.351241892.1723293809; _hjSessionUser_3590261=eyJpZCI6ImVlM2Q0MWExLTZlZWEtNTZiOC04MmQzLWMxZDFiYTBjMDc1NCIsImNyZWF0ZWQiOjE3MjMyOTM4MTI0MTEsImV4aXN0aW5nIjp0cnVlfQ==; PHPSESSID=6a2f6aab5cb8ef32f9236422dd508982; _hjSession_3590261=eyJpZCI6IjFlYWNiMzI3LWM4NzYtNDU2YS1iOGIzLTViNzIzYzJmMGZhNyIsImMiOjE3MjQxNDg2NjQ0MDAsInMiOjAsInIiOjAsInNiIjowLCJzciI6MCwic2UiOjAsImZzIjowLCJzcCI6MH0=; _clck=1y2xkto%7C2%7Cfoh%7C0%7C1683; _clsk=1of5zrs%7C1724149148767%7C6%7C1%7Cs.clarity.ms%2Fcollect; _ga_DL5Y6C3HY9=GS1.1.1724148664.4.1.1724149157.60.0.0; _ga_Z3WWPEVDG6=GS1.1.1724148661.3.1.1724149158.0.0.0; private_content_version=92c6b42fb41471591dd36c7a23be3e50",
							Referer:
								"https://bluecollection.gifts/pl/sport-i-wypoczynek.html",
							"Referrer-Policy":
								"strict-origin-when-cross-origin",
						},
						body: null,
						method: "GET",
					},
				)
					.then((res) => res.json())
					.then((data) => {
						if (data.error) {
							console.log(data.error);
							return resolve([]);
						}
						return data.data.products.items.map(
							(item: any) =>
								({
									name: item.name,
									code: item.sku,
									price:
										item.price_range.minimum_price
											.default_price.value || 0,
									amount: item.salable_qty || 0,
									link:
										"https://bluecollection.gifts" +
										item.url,
								}) as Product,
						);
					});

				category_items.push(...items);

				if (items.length < 256) {
					break;
				}
				i++;
			}

			resolve(category_items);
		});

		promises.push(promise);
	}

	const products = await Promise.allSettled(promises)
		.then((results) => {
			return results
				.filter((result) => result.status === "fulfilled")
				.map(
					(result) =>
						(result as PromiseFulfilledResult<Product[]>).value,
				);
		})
		.then((results) => {
			return results.flat();
		});

	const uniqueProducts = Array.from(
		new Set(products.map((product) => product.code)),
	).map((code) => {
		return products.find((product) => product.code === code) as Product;
	});

	return uniqueProducts;
};
