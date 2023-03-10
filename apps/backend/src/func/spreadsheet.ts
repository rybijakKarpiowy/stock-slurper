import { GoogleAuth } from "google-auth-library";
import { google } from "googleapis";

// create a spreadsheet
export const createSpreadsheet = async (
    data: itemData[],
    company: "Asgard" | "Par" | "Axpol" | "Stricker",
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
                    title: `Analiza firmy ${company} z ${daysCount - 1} dni${
                        daysCount == 2 ? "" : "a"
                    }`,
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
                                                    stringValue: "??rednia cena",
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
                                                    stringValue: "Liczba dni sprzeda??y",
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
                                                    stringValue: "??redni obr??t dziennie",
                                                },
                                            },
                                            {
                                                userEnteredValue: {
                                                    stringValue:
                                                        "??redni obr??t dziennie w dniach sprzeda??y",
                                                },
                                            },
                                            {
                                                userEnteredValue: {
                                                    stringValue: "Maksymalny dzienny obr??t",
                                                },
                                            },
                                            {
                                                userEnteredValue: {
                                                    stringValue: "Maksymalna warto???? na stanie",
                                                },
                                            },
                                            {
                                                userEnteredValue: {
                                                    stringValue:
                                                        "??rednia warto???? na stanie przy pe??nym stanie",
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
                                                    numberValue: item.maxDailyRevenue,
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
    console.log(idsToDelete);

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
    maxDailyRevenue: number;
    maxStockValue: number;
    avgStockValueFullStock: number;
    code: string;
    link: string;
}
