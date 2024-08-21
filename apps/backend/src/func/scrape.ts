import { companyName } from "src";
import { saveToDB } from "./db";
import { asgardScraper } from "./scrapers/asgard";
import { axpolScraper } from "./scrapers/axpol";
// import { maximScraper } from "./scrapers/maxim";
import { parScraper, Product } from "./scrapers/par";
import { strickerScraper } from "./scrapers/stricker";
import { mobScraper } from "./scrapers/mob";    

export const scrape = async (company: companyName) => {
    let data: Product[] = [];
    console.log(`Scraping ${company}...`);
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
        // case "Maxim":
        //     data = (await maximScraper().catch((err) => console.log(err))) || [];
        //     break;
        case "MOB":
            data = (await mobScraper().catch((err) => console.log(err))) || [];
            break;
        // case "PfConcept":
        //     data = (await pfconceptScraper().catch((err) => console.log(err))) || [];
        //     break;
    }

    if (data.length === 0) {
        console.log(`${company} scraper failed`);

        // look for memory leaks
        const memoryUsage = process.memoryUsage();
        console.log(`Memory usage after ${company} scrape:`, memoryUsage);
 
        return;
    }

    console.log(`${company} scraped`);

    await saveToDB(data, company)
        .then(() => console.log(`${company} saved to db`))
        .catch((err) => console.log(err));

    // look for memory leaks
    const memoryUsage = process.memoryUsage();
    console.log(`Memory usage after ${company} scrape:`, memoryUsage);

    return;
};
