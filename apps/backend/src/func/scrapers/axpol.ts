import * as cheerio from "cheerio";
import { Product } from "./par";

export const axpolScraper = async () => {
    const categoryLinks = await getCategories();
    const products = await getProductData(categoryLinks);

    return products;
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

const getProductData = async (categoryLinks: string[]) => {
    const products: Product[] = [];

    for (const categoryLink of categoryLinks) {
        for (let i = 1; i < 100; i++) {
            const res = await fetch(`${categoryLink}strona-${i}/?pp=100`, {
                method: "GET",
                headers: {
                    "User-Agent":
                        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome",
                },
            });

            const body = await res.text();
            const $ = cheerio.load(body, null, false);
            const containers = $(".product");

            const namesCodesLinks = $(containers).children(".product_symbol").children("a");
            const stocks = $(containers).children(".product_stock");

            for (let i = 0; i < namesCodesLinks.length; i++) {
                const name = namesCodesLinks[i].attribs.title;
                const code = namesCodesLinks.eq(i).text();
                const amount = parseInt(stocks.eq(i).text().split("|")[0].replace(" ", ""));
                const link =
                    "https://axpol.com.pl/" + namesCodesLinks[i].attribs.href.split("?")[0];

                const product = {
                    name,
                    code,
                    amount,
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
