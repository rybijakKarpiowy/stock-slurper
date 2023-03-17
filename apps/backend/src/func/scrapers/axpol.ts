import * as cheerio from "cheerio";
import { Product } from "./par";

export const axpolScraper = async () => {
    const categoryLinks = await getCategories();
    const headers = await getAuthorisedCookie();
    const products = await getProductData(categoryLinks, headers);

    const uniqueProducts = products.filter(
        (product, index, self) =>
            index === self.findIndex((p) => p.code === product.code)
    );
    
    return uniqueProducts;
};

const getCategories = async () => {
    const res = await fetch("https://axpol.com.pl/pl/", {
        method: "GET",
        headers: {
            "User-Agent":
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome",
        },
    });

    const homeBody = await res.text();
    const $ = cheerio.load(homeBody, null, false);
    const categories = $("[href=pl/1836-elektronika/]")
        .parent()
        .parent()
        .children("li")
        .children("a");

    const categoryLinks = [];
    for (const category of categories) {
        const link = "https://axpol.com.pl/" + category.attribs.href;
        categoryLinks.push(link);
    }

    return categoryLinks;
};

const getProductData = async (categoryLinks: string[], headers: headerDef) => {
    const products: Product[] = [];

    for (const categoryLink of categoryLinks) {
        for (let i = 1; i < 100; i++) {
            const res = await fetch(`${categoryLink}strona-${i}/?pp=100`, {
                method: "GET",
                ...headers,
            });

            const body = await res.text();
            const $ = cheerio.load(body, null, false);
            const containers = $(".product");

            const namesCodesLinks = $(containers).children(".product_symbol").children("a");
            const stocks = $(containers).children(".product_stock");
            const prices = $(containers).children(".product_price");

            for (let i = 0; i < namesCodesLinks.length; i++) {
                const name = namesCodesLinks[i].attribs.title;
                const code = namesCodesLinks.eq(i).text();
                const amount = parseInt(stocks.eq(i).text().split("|")[0].replace(" ", ""));
                const price =
                    parseFloat(
                        prices
                            .eq(i)
                            .children("div")
                            .last()
                            .children("span")
                            .text()
                            .replace(",", ".")
                            .replace(" ", "")
                            .replace("zł", "")
                    ) || 0;
                const link =
                    "https://axpol.com.pl/" + namesCodesLinks[i].attribs.href.split("?")[0];

                const product = {
                    name,
                    code,
                    amount,
                    price,
                    link,
                } as Product;

                products.push(product);
            }
            const nextButton = $("a.gtn");
            if (!nextButton.length) break;
        }
    }

    return products;
};

const getAuthorisedCookie = async () => {
    const config = {
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
        "Accept-Encoding": "gzip, deflate, br",
        "Accept-Language": "pl-PL,pl;q=0.9,en-US;q=0.8,en;q=0.7",
        "Cache-Control": "max-age=0",
        "Sec-Fetch-Dest": "document",
        "Sec-Fetch-Mode": "navigate",
        "Sec-Fetch-User": "?1",
        "Upgrade-Insecure-Requests": "1",
        "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome",
        "sec-ch-ua": '"Google Chrome";v="89", "Chromium";v="89", ";Not A Brand";v="99"',
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": '"Windows"',
    };

    // get cookie
    const cookieRes = await fetch("https://axpol.com.pl/pl/", {
        method: "GET",
        headers: {
            ...config,
        },
    });
    const cookie = cookieRes.headers.get("set-cookie")?.split(";")[0] as string;

    // log in
    const logInRes = await fetch("https://axpol.com.pl/pl/offer/offer.html", {
        method: "POST",
        headers: {
            ...config,
            cookie,
            "Content-Type": "application/x-www-form-urlencoded",
        },
        body: `log_in=order&login=${process.env.AXPOL_LOGIN}&password=${process.env.AXPOL_PASSWORD}&log_in_button=Zaloguj+si%C4%99`,
    });
    if (logInRes.status !== 200) throw new Error("Log in failed");

    return { headers: { ...config, cookie } };
};

interface headerDef {
    headers: {
        cookie: string;
        Accept: string;
        "Accept-Encoding": string;
        "Accept-Language": string;
        "Cache-Control": string;
        "Sec-Fetch-Dest": string;
        "Sec-Fetch-Mode": string;
        "Sec-Fetch-User": string;
        "Upgrade-Insecure-Requests": string;
        "User-Agent": string;
        "sec-ch-ua": string;
        "sec-ch-ua-mobile": string;
        "sec-ch-ua-platform": string;
    };
}
