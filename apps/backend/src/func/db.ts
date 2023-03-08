import { PrismaClient } from "@prisma/client";
import { Product } from "./scrapers/par";
const prisma = new PrismaClient();

export const saveToDB = async (data: Product[], company: "Asgard" | "Par" | "Axpol") => {
    console.log(`Saving to ${company}...`);
    const itemsDB = await prisma.items.findMany({
        select: {
            id: true,
            code: true,
        },
        where: {
            company,
        },
    });

    const itemsNotIncluded = data.filter(
        (item) => !itemsDB.some((dbItem) => dbItem.code === item.code)
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

    const dataWithIds = data.map((item) => {
        const id = itemsDB.find((dbItem) => dbItem.code === item.code)?.id;
        return {
            itemId: id as number,
            name: item.name,
            code: item.code,
            price: item.price,
            amount: item.amount,
            link: item.link,
        };
    });

    await prisma.stock.createMany({
        data: dataWithIds.map((item) => ({
            itemId: item.itemId,
            amount: item.amount,
            price: item.price,
        })),
    });
};

export const getNDaysOfCompany = async (n: number, itemIds: number[]) => {
    // get last n days of items with ids
    const data = await prisma.stock.findMany({
        where: {
            itemId: {
                in: itemIds,
            },
            created_at: {
                gte: new Date(new Date().setDate(new Date().getDate() - n)),
            },
        },
        include: {
            item: true,
        },
    });

    const itemsHistory = data.reduce((acc: any, element: any) => {
        if (acc[element.item.code]) {
            acc[element.item.code].history.push({
                date: element.created_at,
                amount: element.amount,
                price: element.price,
            });
        } else {
            acc[element.item.code] = {
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

export const maxDays = async (n: number, itemIds: number[]) => {
    const days = await prisma.stock.findMany({
        where: {
            itemId: {
                in: itemIds,
            },
        },
        distinct: ["created_at"],
    });

    return days.length;
};

export const getItemIdsOfCompany = async (company: "Asgard" | "Par" | "Axpol") => {
    const items = await prisma.items.findMany({
        where: {
            company,
        },
        select: {
            id: true,
        },
    });

    return items.map((item) => item.id);
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
