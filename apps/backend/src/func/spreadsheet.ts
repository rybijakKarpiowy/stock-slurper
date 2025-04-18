import { GoogleAuth } from "google-auth-library";
import { google } from "googleapis";
import { companyName } from "src";

// create a spreadsheet
export const createSpreadsheet = async (
    data: itemData[],
    company: companyName,
    daysCount: number
) => {
    const auth = new GoogleAuth({
        scopes: [
            "https://www.googleapis.com/auth/spreadsheets.readonly",
            "https://www.googleapis.com/auth/spreadsheets",
            "https://www.googleapis.com/auth/drive.readonly",
            "https://www.googleapis.com/auth/drive",
        ],
        credentials: {
            client_email: process.env.GOOGLE_CLIENT_EMAIL,
            private_key: JSON.parse(process.env.GOOGLE_PRIVATE_KEY as string),
        },
    });
    google.options({ auth });
    const service = google.sheets({ version: "v4" });
    const drive = google.drive({ version: "v3" });

    const spreadsheetData = await service.spreadsheets
        .create({
            requestBody: {
                properties: {
                    title: `Analiza firmy ${company} z ${daysCount - 1} dni`,
                },
                sheets: [
                    {
                        properties: {
                            title: "Analiza",
                        },
                        data: [
                            {
                                startRow: 0,
                                startColumn: 0,
                                rowData: [
                                    {
                                        values: [
                                            {
                                                userEnteredValue: {
                                                    stringValue: "Nazwa",
                                                },
                                            },
                                            {
                                                userEnteredValue: {
                                                    stringValue: "Średnia cena",
                                                },
                                            },
                                            {
                                                userEnteredValue: {
                                                    stringValue: "Liczba sprzedanych sztuk",
                                                },
                                            },
                                            {
                                                userEnteredValue: {
                                                    stringValue: "Liczba dni",
                                                },
                                            },
                                            {
                                                userEnteredValue: {
                                                    stringValue: "Liczba dni sprzedaży",
                                                },
                                            },
                                            {
                                                userEnteredValue: {
                                                    stringValue: "Liczba dni dostawy",
                                                },
                                            },
                                            {
                                                userEnteredValue: {
                                                    stringValue: "Liczba dni braku na stanie",
                                                },
                                            },
                                            {
                                                userEnteredValue: {
                                                    stringValue: "Średni obrót dziennie",
                                                },
                                            },
                                            {
                                                userEnteredValue: {
                                                    stringValue:
                                                        "Średni obrót dziennie w dniach sprzedaży",
                                                },
                                            },
                                            {
                                                userEnteredValue: {
                                                    stringValue:
                                                        "Procentowy udział największych sprzedaży",
                                                },
                                            },
                                            {
                                                userEnteredValue: {
                                                    stringValue:
                                                        "Procentowy udział produktu w obrocie firmy",
                                                },
                                            },
                                            {
                                                userEnteredValue: {
                                                    stringValue: "Maksymalna wartość na stanie",
                                                },
                                            },
                                            {
                                                userEnteredValue: {
                                                    stringValue:
                                                        "Średnia wartość na stanie przy pełnym stanie",
                                                },
                                            },
                                            {
                                                userEnteredValue: {
                                                    stringValue: "Udział w wartości na stanie",
                                                },
                                            },
                                            {
                                                userEnteredValue: {
                                                    stringValue: "Kod",
                                                },
                                            },
                                            {
                                                userEnteredValue: {
                                                    stringValue: "Link",
                                                },
                                            },
                                        ],
                                    },
                                    ...data.map((item) => ({
                                        values: [
                                            {
                                                userEnteredValue: {
                                                    stringValue: item.name,
                                                },
                                            },
                                            {
                                                userEnteredValue: {
                                                    numberValue: item.avgPrice,
                                                },
                                            },
                                            {
                                                userEnteredValue: {
                                                    numberValue: item.soldAmount,
                                                },
                                            },
                                            {
                                                userEnteredValue: {
                                                    numberValue: item.allDays,
                                                },
                                            },
                                            {
                                                userEnteredValue: {
                                                    numberValue: item.sellDays,
                                                },
                                            },
                                            {
                                                userEnteredValue: {
                                                    numberValue: item.deliveryDays,
                                                },
                                            },
                                            {
                                                userEnteredValue: {
                                                    numberValue: item.emptyStockDays,
                                                },
                                            },
                                            {
                                                userEnteredValue: {
                                                    numberValue: item.avgRevenuePerDay,
                                                },
                                            },
                                            {
                                                userEnteredValue: {
                                                    numberValue: item.avgRevenuePerDaySellDay,
                                                },
                                            },
                                            {
                                                userEnteredValue: {
                                                    stringValue: item.largestPercentageString,
                                                },
                                            },
                                            {
                                                userEnteredValue: {
                                                    stringValue: item.partOfCompanyRevenue,
                                                },
                                            },
                                            {
                                                userEnteredValue: {
                                                    numberValue: item.maxStockValue,
                                                },
                                            },
                                            {
                                                userEnteredValue: {
                                                    numberValue: item.avgStockValueFullStock,
                                                },
                                            },
                                            {
                                                userEnteredValue: {
                                                    stringValue: item.partOfCompanyAvgStockValue,
                                                },
                                            },
                                            {
                                                userEnteredValue: {
                                                    stringValue: item.code,
                                                },
                                            },
                                            {
                                                userEnteredValue: {
                                                    stringValue: item.link,
                                                },
                                            },
                                        ],
                                    })),
                                ],
                            },
                        ],
                    },
                ],
            },
        })
        .then((res) => res.data)
        .catch((err) => console.log(err));

    if (!spreadsheetData) return;

    const spreadsheetId = spreadsheetData.spreadsheetId;
    const spreadsheetLink = spreadsheetData.spreadsheetUrl;

    await drive.permissions.create({
        fileId: spreadsheetId as string,
        requestBody: {
            role: "writer",
            type: "anyone",
        },
    });

    return spreadsheetLink as string;
};

const getSpreadsheetIds = async () => {
    const auth = new GoogleAuth({
        scopes: [
            "https://www.googleapis.com/auth/spreadsheets.readonly",
            "https://www.googleapis.com/auth/spreadsheets",
            "https://www.googleapis.com/auth/drive.readonly",
            "https://www.googleapis.com/auth/drive",
        ],
        credentials: {
            client_email: process.env.GOOGLE_CLIENT_EMAIL,
            private_key: JSON.parse(process.env.GOOGLE_PRIVATE_KEY as string),
        },
    });
    google.options({ auth });
    const drive = google.drive({ version: "v3" });

    const files = await drive.files.list({
        q: "mimeType='application/vnd.google-apps.spreadsheet'",
        orderBy: "createdTime desc",
    });

    const spreadsheetIds = files.data.files?.map((file) => file.id) as string[];

    if (spreadsheetIds?.length < 10) return [];

    const idsToDelete = spreadsheetIds.slice(10);

    return idsToDelete;
};

export const deleteSpreadsheets = async () => {
    const idsToDelete = (await getSpreadsheetIds()) as string[];

    const auth = new GoogleAuth({
        scopes: [
            // "https://www.googleapis.com/auth/spreadsheets.readonly",
            "https://www.googleapis.com/auth/spreadsheets",
            // "https://www.googleapis.com/auth/drive.readonly",
            "https://www.googleapis.com/auth/drive",
        ],
        credentials: {
            client_email: process.env.GOOGLE_CLIENT_EMAIL,
            private_key: JSON.parse(process.env.GOOGLE_PRIVATE_KEY as string),
        },
    });
    google.options({ auth });
    const drive = google.drive({ version: "v3" });

    idsToDelete?.forEach(async (id) => {
        await drive.files.delete({
            fileId: id,
        });
    });
};

interface itemData {
    name: string;
    avgPrice: number;
    soldAmount: number;
    allDays: number;
    sellDays: number;
    deliveryDays: number;
    emptyStockDays: number;
    avgRevenuePerDay: number;
    avgRevenuePerDaySellDay: number;
    largestPercentageString: string;
    partOfCompanyRevenue: string;
    maxStockValue: number;
    avgStockValueFullStock: number;
    partOfCompanyAvgStockValue: string;
    code: string;
    link: string;
}
