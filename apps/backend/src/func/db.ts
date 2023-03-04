import { PrismaClient } from "@prisma/client";
import { Product } from "./scrapers/par";
const prisma = new PrismaClient();

export const saveToDB = async (data: Product[], table: "Asgard" | "Par" | "Axpol") => {
    console.log(`Saving to ${table}...`)
    switch (table) {
        case "Asgard":
            await prisma.asgard.createMany({
                data,
            });
            console.log("Asgard saved to db")
            break
        case "Par":
            // await prisma.par.createMany({
            //     data,
            // });
            console.log("Par saved to db")
            break
        case "Axpol":
            // await prisma.axpol.createMany({
            //     data,
            // });
            console.log("Axpol saved to db")
            break
    }
};
