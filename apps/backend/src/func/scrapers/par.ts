import axios from "axios";
import * as cheerio from "cheerio";

export const parScraper = async () => {
    const axiosResponse = await axios.request({
        method: "GET",
        url: "https://www.par.com.pl/products/products_content?st=asc&limit=2000&p=0",
        headers: {
            "User-Agent":
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36",
        },
    });

    const $ = cheerio.load(axiosResponse.data, null, false);
    const products = $("li div.border")

    const returnData = []
    
    for (const product of products) {
        const name = $(product).find("div p").not(".add-to-cart").find("a").text().slice(0, -1) as string;
        const code = $(product).find("div h3 a").text() as string;
        const price = parseFloat($(product).find("p.price").text().slice(1, -5).replace(",", ".") as string);
        const amount = parseInt($(product).find("div dl dd").eq(0).text().slice(1, -6).replace(" ", "") as string);
        const link = "https://www.par.com.pl/" + $(product).find("a").eq(0).attr("href") as string;
        
        const returnProduct = {
            name,
            code,
            price,
            amount,
            link
        } as Product;

        returnData.push(returnProduct);
    }

    return returnData;
};

export interface Product {
    name: string;
    code: string;
    price: number;
    amount: number;
    link: string;
}