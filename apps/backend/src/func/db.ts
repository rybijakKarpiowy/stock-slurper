import { PrismaClient } from "@prisma/client";
import { Product } from "./scrapers/par";
const prisma = new PrismaClient();

export const saveToDB = async (data: Product[], table: string) => {
    switch (table) {
        case "Asgard":
            await prisma.asgard.createMany({
                data,
            });
        case "Par":
            await prisma.par.createMany({
                data,
            });
        case "Axpol":
            await prisma.axpol.createMany({
                data,
            });
    }
};
