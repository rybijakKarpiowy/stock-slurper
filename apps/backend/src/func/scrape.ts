import { saveToDB } from "./db";
import { asgardScraper } from "./scrapers/asgard";
import { axpolScraper } from "./scrapers/axpol";
import { parScraper, Product } from "./scrapers/par";
import { strickerScraper } from "./scrapers/stricker";

export const scrape = async (company: "Asgard" | "Par" | "Axpol" | "Stricker") => {
    let data: Product[] = [];
    switch (company) {
        case "Asgard":
            data = (await asgardScraper().catch((err) => console.log(err))) || [];
            break;
        case "Par":
            data = (await parScraper().catch((err) => console.log(err))) || [];
            break;
        case "Axpol":
            data = (await axpolScraper().catch((err) => console.log(err))) || [];
            break;
        case "Stricker":
            data = (await strickerScraper().catch((err) => console.log(err))) || [];
            break;
    }

    if (data.length === 0) {
        console.log(`${company} scraper failed`);
        return;
    }

    console.log(`${company} scraped`);

    await saveToDB(data, company)
        .then(() => console.log(`${company} saved to db`))
        .catch((err) => console.log(err));
};
