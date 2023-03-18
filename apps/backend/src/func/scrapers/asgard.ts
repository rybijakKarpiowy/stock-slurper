import * as cheerio from "cheerio";
import { Product } from "./par";

export const asgardScraper = async () => {
    const options = await getAuthorisedCookie();
    const hash = await getHash(options);

    const products: Product[] = [];
    const savedCodes = new Set<string>();
    let i = 1;
    while (true) {
        const res = await fetch("https://asgard.gifts/search/getData", {
            method: "POST",
            headers: {
                ...options,
            },
            referrer: `https://asgard.gifts/szukaj.html?${hash}`,
            body: `${hash}&activePage=${i}&perPage=100`,
        });

        const rawBody = await res.text();
        const regexedBody = rawBody
            .replace(/.(?=<script).+?(?=<\/script>)<\/script>/gms, "")
            .replace(/.(?=input).+?(?=<\/label>)<\/label>/gms, "");
        const body = cheerio.load(regexedBody, null, false);

        const containers = body("div.productList").find("div.item");

        if (containers.length === 0) {
            break;
        }

        for (const container of containers) {
            const code = body(container).find("div").find("span").text().trim();
            if (savedCodes.has(code)) {
                continue;
            }
            savedCodes.add(code);

            const name = body(container).find("div").find("h2").text().trim();
            const price = parseFloat(
                body(container).find("p").find("span").text().replace(" ", "").replace("zł", "") ||
                    "0"
            );
            const amount = parseInt(
                body(container)
                    .find("p")
                    .find("strong")
                    .text()
                    .replace(" ", "")
                    .replace("szt.", "") || "0"
            );
            const link = body(container).find("a.hover").attr("href");

            const product = {
                name,
                code,
                price,
                amount,
                link,
            } as Product;

            products.push(product);
        }

        i += 1;
    }

    return products;
};

const getAuthorisedCookie = async () => {
    const options = {
        "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/87.0.4280.88 Safari/537.36",
        Accept: "*/*",
        "Accept-Language": "en-US,en;q=0.9,pl-PL;q=0.8,pl;q=0.7,la;q=0.6",
        "Accept-Encoding": "gzip, deflate, br",
        Host: "asgard.gifts",
        Origin: "https://asgard.gifts",
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
    };

    const cookieRes = await fetch("https://asgard.gifts/", {
        method: "GET",
        headers: {
            ...options,
        },
    });

    const cookie = cookieRes.headers.get("set-cookie")?.split(";")[0] as string;

    const authoriseCookie = await fetch("https://asgard.gifts/ajax/user-login/", {
        method: "POST",
        headers: {
            ...options,
            Cookie: cookie,
        },
        body: `login=${process.env.ASGARD_LOGIN}&password=${process.env.ASGARD_PASSWORD}`,
    });

    return { ...options, Cookie: cookie };
};

const getHash = async (options: any) => {
    const res = await fetch("https://asgard.gifts/search/post", {
        method: "POST",
        headers: {
            ...options,
        },
        referrer: "https://asgard.gifts/",
        body: `search_action=main&status=0`,
    });

    const hash = res.url.split("?")[1];

    return hash;
};
