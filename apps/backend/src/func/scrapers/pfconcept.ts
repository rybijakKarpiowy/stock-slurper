import * as cheerio from "cheerio";
import { Product } from "./par";

export const pfconceptScraper = async () => {
    const cookie = await getCookie() as string;
    const returnProducts = [] as Product[];

    const res = await fetch("https://www.pfconcept.com/pl_pl/catalog/category/view/s/categories/id/1626/", {
        headers: {
            "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36",
            Cookie: cookie
        },
        method: "GET",
        redirect: "follow",
    })
    const rawBody = await  res.text();
    const body = cheerio.load(rawBody);

    const containers = body("div.product-main div.product__detail")
    for (const container of containers) {
        const name = body(container).children("div.product__detail--name").children("a").attr("title")?.trim() as string;
        const code = body(container).children("div.product__detail--sku").text().trim();
        const price = parseFloat(body(container).children("div.product__detail--price").children("b").text().replace("PLN", "").trim().replace(",", ".") as string) || 0;
        const link = body(container).children("div.product__detail--name").children("a").attr("href") as string;
        const amount = parseInt(body(container).children("div.product__detail--stock in").children("span").text().replace(/\D/gm, "") as string) || 0;

        const product = {
            name,
            code,
            price,
            link,
            amount
        } as Product;

        returnProducts.push(product);
    }

    // amounts is 0 for all products
    // console.log(returnProducts)

    return [];
};

const getCookie = async () => {
    const cookieRes = await fetch("https://www.pfconcept.com/pl_pl/", {
        headers: {
            "User-Agent":
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36",
        },
        method: "GET",
        redirect: "manual",
    }) as Response;

    const rawCookie = cookieRes.headers.get("set-cookie") as string;
    // const preBakedCookie = rawCookie.split(";").filter((x) => x.includes("PHPSESSID") || x.includes("X-Magento-Vary")).join(";");

    // const formKey = await getFormKey(preBakedCookie);
    // const bakedCookie = preBakedCookie + `; form_key=${formKey}`;
    // console.log(preBakedCookie)
    // console.log(bakedCookie)
    console.log(rawCookie)

    const authRes = await fetch("https://www.pfconcept.com/pl_pl/customer/account/loginPost/", { // nie udaje się zalogować i trzeba iterowac po stronach
        headers: {
            "User-Agent":
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36",
            "Content-Type": "application/x-www-form-urlencoded",
            "Origin": "https://www.pfconcept.com",
            "Referer": "https://www.pfconcept.com/pl_pl/",
            Cookie: rawCookie,
        },
        method: "POST",
        redirect: "manual",
        body: `login%5Busername%5D=${process.env.PFCONCEPT_LOGIN}&login%5Bpassword%5D=${process.env.PFCONCEPT_PASSWORD}`
    });

    const authCookie = authRes.headers.get("set-cookie");
    console.log(authCookie)
    return authCookie;
};

const getFormKey = async (cookie: string) => {
    const res = await fetch("https://www.pfconcept.com/pl_pl/", {
        headers: {
            "User-Agent":
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36",
            Cookie: cookie,
        },
        method: "GET",
        redirect: "follow",
    }) as Response;

    const rawBody = await res.text();
    const body = cheerio.load(rawBody);

    const formKey = body("input[name='form_key']").attr("value") as string;
    return formKey;
}