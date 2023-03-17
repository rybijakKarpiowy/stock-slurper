import { ItemHistory } from "./db";
import { WebSocket } from "ws";

// get statistics out of item history
export const getStatistics = async (itemsHistoryArray: ItemHistory[], client: WebSocket) => {
    let prevProgress = 10;
    const statisticsUnsorted = itemsHistoryArray.map((item, index) => {
        const allDays = (item.history.length - 1) as number;
        let deliveryDays = 0;
        let emptyStockDays = 0;
        const amountDiffs = [] as { amount: number; price: number }[];

        for (let i = 0; i < allDays; i++) {
            amountDiffs.push({
                amount: item.history[i].amount - item.history[i + 1].amount,
                price: item.history[i].price,
            });

            if (amountDiffs[i].amount < 0) {
                amountDiffs[i].amount = 0;
                deliveryDays++;
            }

            if (amountDiffs[i].amount == 0 && item.history[i].amount == 0) {
                emptyStockDays++;
            }
        }

        const sellDays = allDays - deliveryDays - emptyStockDays;

        const stockValues = item.history.map((element) => element.amount * element.price) as number[];
        const maxStockValue = Math.max(...stockValues);
        const avgStockValueFullStock =
            stockValues.reduce((acc, element) => acc + element, 0) /
            (stockValues.length - emptyStockDays);
        const avgPrice =
            item.history.reduce((acc, element) => acc + element.price, 0) / item.history.length;
        const soldAmount = amountDiffs.reduce((acc, element) => acc + element.amount, 0);
        const revenueSum = amountDiffs.reduce(
            (acc, element) => acc + element.amount * element.price,
            0
        );
        const avgRevenuePerDay = revenueSum / allDays;
        const avgRevenuePerDaySellDay = revenueSum / sellDays;
        const maxDailyRevenue = Math.max(
            ...amountDiffs.map((element) => element.amount * element.price)
        );

        const progress = Math.round((index / itemsHistoryArray.length / 2) * 20) + 10;
        if (progress > prevProgress) {
            prevProgress = progress;
            client.send(JSON.stringify({ progress }));
        }

        return {
            name: item.name,
            avgPrice,
            soldAmount,
            allDays,
            sellDays,
            deliveryDays,
            emptyStockDays,
            avgRevenuePerDay,
            avgRevenuePerDaySellDay,
            maxDailyRevenue,
            maxStockValue,
            avgStockValueFullStock,
            code: item.code as string,
            link: item.link as string,
        };
    });

    const statistics = statisticsUnsorted.sort(
        (a, b) => b.avgRevenuePerDaySellDay - a.avgRevenuePerDaySellDay
    );

    const statisticsRounded = statistics.map((element) => {
        return {
            ...element,
            avgPrice: Math.round(element.avgPrice * 100) / 100,
            avgRevenuePerDay: Math.round(element.avgRevenuePerDay * 100) / 100,
            avgRevenuePerDaySellDay: Math.round(element.avgRevenuePerDaySellDay * 100) / 100,
            maxDailyRevenue: Math.round(element.maxDailyRevenue * 100) / 100,
            maxStockValue: Math.round(element.maxStockValue * 100) / 100,
            avgStockValueFullStock: Math.round(element.avgStockValueFullStock * 100) / 100,
        };
    });

    return statisticsRounded;
};
