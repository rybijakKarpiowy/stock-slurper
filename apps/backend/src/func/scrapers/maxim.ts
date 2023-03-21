// import Nightmare from "nightmare";
// import * as cheerio from "cheerio";
// import { Product } from "./par";

// export const maximScraper = async () => {
//     const Cookie = await getAuthorisedCookies();

//     const finalProducts = await getProdsWithIds(Cookie).then(
//         async (productsWithIds) => await getPrices(productsWithIds, Cookie).then(
//             async (productsWihPrices) => await getFinalProducts(productsWihPrices, Cookie)
//         )
//     );
    
//     return finalProducts;
// };

// const getAuthorisedCookies = async () => {
//     const nightmare = new Nightmare();

//     const allCookies = await nightmare
//         .goto("https://maxim.com.pl/index/login", { waitUntil: "networkidle2" })
//         .insert("#login", process.env.MAXIM_LOGIN as string)
//         .insert("input[name='password']", process.env.MAXIM_PASSWORD as string)
//         .click("input[type='submit']")
//         .wait(1000)
//         .wait("#cookie_banner")
//         .end()
//         .cookies.get();

//     const cookieMY = allCookies.find((cookie) => cookie.name === "MY") as {
//         name: string;
//         value: string;
//     };
//     const Cookie = `${cookieMY.name}=${cookieMY.value}`;

//     return Cookie;
// };

// const getPrices = async (
//     productsWithIds: { name: string; code: string; id: string; link: string }[],
//     Cookie: string
// ) => {
//     let calcBody = "addaskto=%2Fcalculator%2Fproduct";
//     for (const prod of productsWithIds) {
//         calcBody += `&products%5B%5D=${prod.id}`;
//     }

//     // clear calculator
//     await fetch("https://maxim.com.pl/calculator/clear-list", {
//         method: "GET",
//         headers: {
//             Cookie,
//         },
//     });

//     const calculatorRes = await fetch("https://maxim.com.pl/calculator/product", {
//         method: "POST",
//         headers: {
//             "Content-Type": "application/x-www-form-urlencoded",
//             Cookie,
//         },
//         body: calcBody,
//     });

//     const calculatorResRawBody = await calculatorRes.text();
//     const pruduct_prices_json = JSON.parse(
//         calculatorResRawBody.split("\n")[366].split("= ")[1].slice(0, -2)
//     );

//     const pricesIds = [] as { id: string; price: number }[];
//     for (const [key, value] of Object.entries(pruduct_prices_json)) {
//         // skip packages prices
//         if (key.split("_").length < 3) {
//             continue;
//         }

//         const prodId = key.split("_")[0];
//         const prodPrice = value as number;

//         pricesIds.push({
//             id: prodId,
//             price: prodPrice,
//         });
//     }

//     const meanPricesIds = [] as { id: string; price: number }[];
//     for (const prod of productsWithIds) {
//         const prodPrices = pricesIds.filter((price) => price.id === prod.id);
//         const prodPrice =
//             Math.round((prodPrices.reduce((a, b) => a + b.price, 0) / prodPrices.length) * 100) /
//             100;

//         meanPricesIds.push({
//             id: prod.id,
//             price: prodPrice,
//         });
//     }

//     const pruductWithIdsAndPrices = [] as {
//         name: string;
//         code: string;
//         link: string;
//         price: number;
//         id: string;
//     }[];
//     for (const prod of productsWithIds) {
//         const prodPrice = meanPricesIds.find((price) => price.id === prod.id)?.price as number;

//         const prodReturn = {
//             name: prod.name,
//             code: prod.code,
//             price: prodPrice,
//             id: prod.id,
//             link: prod.link,
//         };

//         pruductWithIdsAndPrices.push(prodReturn);
//     }

//     return pruductWithIdsAndPrices;
// };

// const getProdsWithIds = async (Cookie: string) => {
//     const searchRes = await fetch("https://maxim.com.pl/offer/searchresults", {
//         method: "POST",
//         headers: {
//             "Content-Type": "application/x-www-form-urlencoded",
//             Cookie,
//         },
//         body: "search=Szukaj",
//     });

//     const searchResRawBody = await searchRes.text();
//     const searchResBody = cheerio.load(searchResRawBody);

//     const prods = searchResBody(".produkt_main");

//     const productsWithIds = [] as { name: string; code: string; id: string; link: string }[];
//     for (const prod of prods) {
//         const prodName = searchResBody(prod).find("a").find("h2.h2_list").text().trim() as string;
//         const prodCode = searchResBody(prod)
//             .find("a")
//             .find("div.produkt_main_img")
//             .find("img.produkty_main_img")
//             .attr("title")
//             ?.split(" ")[0] as string;
//         const prodId = searchResBody(prod).find("input").attr("value") as string;
//         const prodLink = ("https://maxim.com.pl/" +
//             searchResBody(prod).find("a").attr("href")) as string;

//         const prodReturn = {
//             name: prodName,
//             code: prodCode,
//             id: prodId,
//             link: prodLink,
//         };

//         productsWithIds.push(prodReturn);
//     }

//     return productsWithIds;
// };

// const getFinalProducts = async (
//     productsWihPrices: {
//         name: string;
//         code: string;
//         link: string;
//         price: number;
//         id: string;
//     }[],
//     Cookie: string
// ) => {
//     const stockRes = await fetch("https://maxim.com.pl/stock", {
//         method: "GET",
//         headers: {
//             Cookie,
//         },
//     });

//     const rawBody = await stockRes.text();
//     const body = cheerio.load(rawBody);

//     const containers = body("tr.logistic_tr_out")
//     const nameAmounts = [] as { name: string; amount: number }[];

//     for (const container of containers) {
//         const name = body(container).find("td").first().text().split(" ml")[0].split(" ").slice(0, -1).join(" ").trim() as string;
//         const amount = parseInt(body(container).find("td").find("span").text())

//         nameAmounts.push({
//             name,
//             amount
//         })
//     }

//     const finalProducts = [] as Product[];
//     for (const prod of productsWihPrices) {
//         // skip Glaxy, Victor, Venezia and Manhattan
//         if (isNaN(prod.price)) {
//             continue;
//         }

//         const amounts = nameAmounts.filter((nameAmount) => nameAmount.name === prod.name);
//         const amount = amounts.reduce((a, b) => a + b.amount, 0);

//         const finalProduct = {
//             name: prod.name,
//             code: prod.code,
//             price: prod.price,
//             amount,
//             link: prod.link,
//         } as Product;

//         finalProducts.push(finalProduct);
//     }

//     return finalProducts;
// };
