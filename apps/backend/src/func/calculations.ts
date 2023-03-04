// get statistics out of days and company
export const getStatistics = async (nDays: number, listOfDays: DayData[]) => {
    let statistics = [{}]

    return statistics
}

interface DayData {
    date: string;
    items: Item[]
}

interface Item {
    name: string;
    price: number;
    quantity: number;
}