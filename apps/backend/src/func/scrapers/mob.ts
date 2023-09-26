import * as cheerio from "cheerio";
import { Product } from "./par";

export const mobScraper = async () => {
    const categoryLinks = await getCategoryLinks();
    const returnProducts = await getProducts(categoryLinks);

    return returnProducts;
};

const getCategoryLinks = async () => {
    const res = await fetch("https://www.midocean.com/poland/pl/pln/", {
        method: "GET",
        headers: {
            "User-Agent":
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36",
        },
    });

    const rawBody = await res.text();
    const body = cheerio.load(rawBody, null, false);

    const categories = body("div.products-dropdown-left").children("a");
    const categoryLinks = [];

    for (const category of categories) {
        const categoryLink = body(category).attr("href") as string;
        categoryLinks.push(categoryLink);
    }

    return categoryLinks;
};

const getProducts = async (categoryLinks: string[]) => {
    const SKUfirstBatch = await getCodes(categoryLinks);

    const productsSettled = await Promise.allSettled(
        SKUfirstBatch.map(async (SKUfirst) => {
            return await getProduct(SKUfirst);
        })
    );

    const products = (
        productsSettled.filter((product) => product.status === "fulfilled") as {
            status: "fulfilled";
            value: Product;
        }[]
    ).map((product) => product.value);

    const uniqueProducts = [] as Product[];
    for (const product of products) {
        if (!uniqueProducts.find((p) => p.code === product.code)) {
            uniqueProducts.push(product);
        }
    }

    return uniqueProducts;
};

const getCodes = async (categoryLinks: string[]) => {
    const SKUSettled = await Promise.allSettled(
        categoryLinks.map(async (categoryLink) => {
            const categorySKU = [] as string[];
            let i = 0;

            while (true) {
                const res = await fetch(`${categoryLink}page-${i}`, {
                    method: "GET",
                    headers: {
                        "User-Agent":
                            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36",
                    },
                });
                const rawBody = await res.text();
                const body = cheerio.load(rawBody, null, false);

                const items = body("div.product-list-item");
                for (const item of items) {
                    const code = body(item).attr("data-ajax-content")?.split("SKU=")[1] as string;
                    if (!categorySKU.includes(code)) {
                        categorySKU.push(code);
                    }
                }

                if (items.length < 20) {
                    break;
                }

                i++;
            }

            return categorySKU;
        })
    );

    const SKUNotUnique = (
        SKUSettled.filter((SKU) => SKU.status === "fulfilled") as {
            status: "fulfilled";
            value: string[];
        }[]
    )
        .map((SKU) => SKU.value)
        .flat();

    const SKU = SKUNotUnique.filter((SKU, index, self) => index === self.indexOf(SKU));

    return SKU;
};

const getProduct = (SKUfirst: string): Promise<Product> =>
    new Promise(async (resolve) => {
        let resFirst = null;
        while (!resFirst) {
            resFirst = (await fetch(
                `https://www.midocean.com/INTERSHOP/web/WFS/midocean-PL-Site/pl_PL/-/PLN/ViewProduct-ShowTile?SKU=${SKUfirst}`,
                {
                    method: "GET",
                    headers: {
                        "User-Agent":
                            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36",
                    },
                }
            ).catch(() => null)) as Response | null;
        }

        const rawBodyFirst = await resFirst.text();
        const bodyFirst = cheerio.load(rawBodyFirst, null, false);

        const name = bodyFirst("div.product-description a").text();
        const code = bodyFirst("a.product-title span").text();
        const price =
            parseFloat(
                bodyFirst("div.current-price div.price-wrapper div.current-price-markup")
                    .text()
                    .replace(",", ".")
                    .replace("PLN", "")
                    .trim() as string
            ) || 0;
        const link = bodyFirst("div.product-description a").attr("href") as string;
        const SKUsecond = bodyFirst("div.product-stock a div").attr("data-ajax-content") as string;

        let amount = 0;
        if (SKUsecond) {
            const resSecond = (await fetch(SKUsecond, {
                method: "GET",
                headers: {
                    "User-Agent":
                        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36",
                },
            })) as Response;

            const rawBodySecond = await resSecond.text();
            const bodySecond = cheerio.load(rawBodySecond, null, false);

            amount = parseInt(bodySecond("a span").text().replace(/\D/gm, "") as string) || 0;
        }

        const returnProduct = {
            name,
            code,
            price,
            link,
            amount,
        } as Product;

        return resolve(returnProduct);
    });
