export const getStatistics = async ({nDays, listOfDays} : getStatisticsProps ) => {
    let statistics = [{}]

    return statistics
}
interface getStatisticsProps {
    nDays: number;
    listOfDays: DayData[];
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