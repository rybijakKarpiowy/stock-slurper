import { saveToDB } from "./db";
import { axpolScraper } from "./scrapers/axpol";
import { parScraper, Product } from "./scrapers/par";

export const scrape = async (company: "Asgard" | "Par" | "Axpol" | "Stricker") => {
    let data: Product[] = [];
    switch (company) {
        case "Asgard":
            break;
        case "Par":
            data = (await parScraper().catch((err) => console.log(err))) || [];
            break;
        case "Axpol":
            data = (await axpolScraper().catch((err) => console.log(err))) || [];
            break;
        case "Stricker":
            break;
    }

    if (data.length === 0) {
        console.log(`${company} scraper failed`);
        return;
    }

    await saveToDB(data, company)
        .then(() => console.log(`${company} saved to db`))
        .catch((err) => console.log(err));
};
