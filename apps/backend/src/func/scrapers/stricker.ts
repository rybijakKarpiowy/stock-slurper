import * as cheerio from "cheerio";
import { Product } from "./par";

export const strickerScraper = async () => {
    const options = await getAuthorisedCookie();

    const products: Product[] = [];
    const savedCodes = new Set<string>();
    let i = 0;
    while (true) {
        const res = await fetch(
            `https://www.stricker-europe.com/pl/catalogo/ajax/aplicaScroll.php?current=${15 * i}`,
            {
                method: "GET",
                headers: {
                    ...options,
                },
            }
        );

        const rawBody = await res.text();
        const body = cheerio.load(rawBody, null, false);

        const containers = body("a.produto");

        if (containers.length === 0) {
            break;
        }

        containers.each((_, container) => {
            const code = body(container).find("div.bottom").find("div.ref").text().trim();
            if (savedCodes.has(code)) {
                return;
            }
            savedCodes.add(code);

            const name = body(container).find("div.bottom").find("div.titulo").text().trim();
            const price = parseFloat(
                body(container)
                    .find("div.bottom")
                    .find("div.from-wrap")
                    .text()
                    .trim()
                    .replace('"', "")
                    .replace(" ", "")
                    .replace(",", ".")
                    .replace("zł", "")
                    .replace("Z", "")
                    .trim()
            );
            const amount = parseInt(
                body(container)
                    .find("div.bottom")
                    .find("div.stock")
                    .first()
                    .find("span")
                    .text()
                    .replace(".", "")
                    .trim()
            );
            const link = "https://www.stricker-europe.com" + body(container).attr("href");

            const product = {
                name,
                code,
                price,
                amount,
                link,
                company: "Stricker",
            } as Product;

            products.push(product);
        });

        i += 1;
    }

    return products;
};

const getAuthorisedCookie = async () => {
    const config = {
        "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36",
    };

    const getCookie = await fetch("https://www.hideagifts.com/pl/zastrzezony-obszar/kontynuuj/", {
        method: "GET",
        headers: {
            ...config,
        },
    });

    const Cookie = getCookie.headers.get("set-cookie")?.split(";")[0] as string;

    const authoriseCookie = await fetch(
        "https://www.stricker-europe.com/pl/zastrzezony-obszar/kontynuuj/",
        {
            method: "POST",
            headers: {
                ...config,
                Cookie,
                "Content-Type": "application/x-www-form-urlencoded",
                Host: "www.stricker-europe.com",
                Origin: "https://www.stricker-europe.com",
                Referer: "https://www.stricker-europe.com/pl/zastrzezony-obszar/kontynuuj/",
            },
            body: `login=${process.env.STRICKER_LOGIN}&pwd=${process.env.STRICKER_PASSWORD}&subm=true`,
        }
    );

    return { ...config, Cookie };
};
