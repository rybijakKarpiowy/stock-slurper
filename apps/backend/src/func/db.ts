import { PrismaClient } from "@prisma/client";
import { Product } from "./scrapers/par";
const prisma = new PrismaClient();

export const saveToDB = async (data: Product[], company: "Asgard" | "Par" | "Axpol") => {
    console.log(`Saving to ${company}...`);
    const itemsDB = await prisma.items.findMany({
        select: {
            code: true,
            company: true,
        },
    });

    const itemsNotIncluded = data.filter(
        (item) => !itemsDB.some((dbItem) => dbItem.code === item.code && dbItem.company === company)
    );
    if (itemsNotIncluded.length > 0) {
        await prisma.items.createMany({
            data: itemsNotIncluded.map((item) => ({
                code: item.code,
                name: item.name,
                link: item.link,
                company,
            })),
        });
    }

    await prisma.stock.createMany({
        data: data.map((item) => ({
            code: item.code,
            amount: item.amount,
            price: item.price,
            company,
        })),
    });
};

export const getNDaysOfCompany = async (n: number, company: "Asgard" | "Par" | "Axpol") => {
    // get last n days of company
    const data = await prisma.stock.findMany({
        where: {
            company,
            created_at: {
                gte: new Date(new Date().setDate(new Date().getDate() - n)),
            },
        },
        include: {
            item: true,
        },
    });

    const itemsHistory = data.reduce((acc: any, element: any) => {
        if (acc[element.code]) {
            acc[element.code].history.push({
                date: element.created_at,
                amount: element.amount,
                price: element.price,
            });
        } else {
            acc[element.code] = {
                name: element.item.name,
                code: element.item.code,
                link: element.item.link,
                history: [
                    {
                        date: element.created_at,
                        amount: element.amount,
                        price: element.price,
                    },
                ],
            };
        }
        return acc;
    }, {});

    const itemsHistoryArray = Object.values(itemsHistory) as ItemHistory[];

    const itemsHistoryArraySorted = itemsHistoryArray.map((item) => {
        item.history.sort((a, b) => a.date.getTime() - b.date.getTime());
        return item;
    });

    return itemsHistoryArraySorted;
};

export const maxDays = async (n: number, company: "Asgard" | "Par" | "Axpol") => {
    const days = await prisma.stock.findMany({
        where: {
            company,
        },
        distinct: ["created_at"],
    });

    return days.length;
};

export interface ItemHistory {
    name: string;
    code: string;
    link: string;
    history: {
        date: Date;
        amount: number;
        price: number;
    }[];
}
