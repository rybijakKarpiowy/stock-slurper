import { Items, PrismaClient, Stock } from "@prisma/client";
import { WebSocket } from "ws";
import { Product } from "./scrapers/par";
import { companyName } from "src";
const prisma = new PrismaClient();

export const saveToDB = async (
    data: Product[],
    company: companyName
) => {
    console.log(`Saving to ${company}...`);
    const oldItemsIds = await prisma.items.findMany({
        select: {
            id: true,
            code: true,
        },
        where: {
            company,
        },
    });

    // Find old items and update them
    const itemsIncluded = data.filter(
        (item) => oldItemsIds.some((dbItem) => dbItem.code === item.code)
    );

    // TODO: Update items (links and names)

    // Find new items
    const itemsNotIncluded = data.filter(
        (item) => !oldItemsIds.some((dbItem) => dbItem.code === item.code)
    );

    // Create new items in db
    let freshItemsIds: { id: number; code: string }[] = [];
    if (itemsNotIncluded.length > 0) {
        await prisma.items.createMany({
            data: itemsNotIncluded.map((item) => ({
                code: item.code,
                name: item.name,
                link: item.link,
                company,
            })),
        });

        freshItemsIds = await prisma.items.findMany({
            select: {
                id: true,
                code: true,
            },
            where: {
                company,
            },
        });
    } else {
        console.log(`No new items in ${company}`)
        freshItemsIds = oldItemsIds;
    }

    const dataWithIds = data.map((item) => {
        const id = freshItemsIds.find((dbItem) => dbItem.code === item.code)?.id;
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

export const getNDaysOfCompany = async (
    n: number,
    itemIds: number[],
    client: WebSocket,
    company: companyName,
    from?: Date,
    to?: Date
) => {
    let data = [] as (Stock & {
        item: Items;
    })[];
    if (n) {
        // get last n days of items with ids
        data = await prisma.stock.findMany({
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
    }

    if (from && to) {
        // get days between from and to of items with ids
        data = await prisma.stock.findMany({
            where: {
                itemId: {
                    in: itemIds,
                },
                created_at: {
                    gte: from,
                    lte: to,
                },
            },
            include: {
                item: true,
            },
        });
    }

    const twoItemsLength = data.length * 2;
    let prevProgress = 0;
    const itemsHistory = data.reduce((acc: any, element: Stock & { item: Items }, id) => {
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

        const progress = Math.floor((id / (twoItemsLength - 2)) * 20);
        if (progress > prevProgress) {
            prevProgress = progress;
            client.send(JSON.stringify({ progress: prevProgress }));
        }

        return acc;
    }, {});

    const itemsHistoryArray = Object.values(itemsHistory) as ItemHistory[];

    const itemsHistoryArraySorted = itemsHistoryArray.map((item) => {
        item.history.sort((a, b) => a.date.getTime() - b.date.getTime());
        return item;
    });

    if (company === "Stricker") {
        const itemHistoryArrayDisguised = itemsHistoryArraySorted.map(
            (itemsHistory: ItemHistory) => {
                const disguise =
                    Math.random() * parseFloat(process.env.DISGUISE_DELTA as string) +
                    parseFloat(process.env.DISGUISE_BASE as string);
                return {
                    ...itemsHistory,
                    history: itemsHistory.history.map((history) => ({
                        ...history,
                        price: history.price * disguise,
                    })),
                };
            }
        );

        return itemHistoryArrayDisguised;
    }

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

export const getItemIdsOfCompany = async (
    company: companyName
) => {
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

export const getFirstDay = async (company: companyName) => {
    const data = (await prisma.stock.findFirst({
        where: {
            item: {
                company,
            },
        },
        orderBy: {
            created_at: "asc",
        },
        select: {
            created_at: true,
        },
    })) as Stock & { created_at: Date };

    const firstDay = data.created_at;
    const secondDay = new Date(firstDay.getTime() + 1000 * 60 * 60 * 24);

    const firstDayReturn = firstDay.toISOString().split("T")[0];
    const secondDayReturn = secondDay.toISOString().split("T")[0];

    return { firstDay: firstDayReturn, secondDay: secondDayReturn };
};

export const fromToValidator = async (from: Date, to: Date, itemIds: number[]) => {
    const data = await prisma.stock.findMany({
        where: {
            itemId: {
                in: itemIds,
            },
        },
        distinct: ["created_at"],
    });

    const fromString = from.toISOString().split("T")[0];
    const toString = to.toISOString().split("T")[0];

    const datesArray = data.map((date) => date.created_at);
    const dateStrings = datesArray.map((date) => date.toISOString().split("T")[0]);

    const datesFiltered = datesArray.filter((date) => {
        return date >= from && date <= to;
    });

    if (datesFiltered.length === 0) {
        return { valid: false, count: 0 };
    }

    const fromValid = dateStrings.includes(fromString);
    const toValid = dateStrings.includes(toString);

    return { valid: fromValid && toValid, count: datesFiltered.length };
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
