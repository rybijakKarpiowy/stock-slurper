import { PrismaClient } from "@prisma/client";
import { Product } from "./scrapers/par";
const prisma = new PrismaClient();

export const saveToDB = async (data: Product[], company: "Asgard" | "Par" | "Axpol") => {
    console.log(`Saving to ${company}...`);
    const codesDB = await prisma.items.findMany({
        select: {
            code: true,
        },
    });

    const itemsNotIncluded = data.filter((item) => !codesDB.includes({ code: item.code }));
    await prisma.items.createMany({
        data: itemsNotIncluded.map((item) => ({
            code: item.code,
            name: item.name,
            link: item.link,
            company,
        })),
    });

    await prisma.stock.createMany({
        data: data.map((item) => ({
            code: item.code,
            amount: item.amount,
            price: item.price,
            company,
        })),
    });
};
