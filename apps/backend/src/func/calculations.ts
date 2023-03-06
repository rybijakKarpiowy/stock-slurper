import { ItemHistory } from "./db";

// get statistics out of item history
export const getStatistics = async (itemsHistoryArray: ItemHistory[]) => {
    const statisticsUnsorted = itemsHistoryArray.map((item) => {
        const allDays = item.history.length - 1;
        let deliveryDays = 0;
        let emptyStockDays = 0;
        const amountDiffs = [] as { amount: number; price: number }[];

        for (let i = 0; i < item.history.length - 1; i++) {
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

        const stockValues = item.history.map((element) => element.amount * element.price);
        const maxStockValue = Math.max(...stockValues);
        const avgStockValueFullStock =
            stockValues.reduce((acc, element) => acc + element, 0) /
            (stockValues.length - emptyStockDays);
        const avgPrice =
            item.history.reduce((acc, element) => acc + element.price, 0) / item.history.length;
        const soldAmount = amountDiffs.reduce((acc, element) => acc + element.amount, 0);
        const avgRevenuePerDay =
            amountDiffs.reduce((acc, element) => acc + element.amount * element.price, 0) / allDays;
        const avgRevenuePerDaySellDay =
            amountDiffs.reduce((acc, element) => acc + element.amount * element.price, 0) /
            sellDays;

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
            maxStockValue,
            avgStockValueFullStock,
            code: item.code,
            link: item.link,
        };
    });

    const statistics = statisticsUnsorted.sort(
        (a, b) => b.avgRevenuePerDaySellDay - a.avgRevenuePerDaySellDay
    );

    return statistics;
};
