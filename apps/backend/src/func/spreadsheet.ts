import { GoogleAuth } from "google-auth-library";
import { google } from "googleapis";

// create a spreadsheet
export const create = async (title: string) => {
    const auth = new GoogleAuth({
        scopes: "https://www.googleapis.com/auth/spreadsheets",
    });

    const service = google.sheets({ version: "v4", auth });
    const resource = {
        properties: {
            title,
        },
    };
    try {
        const spreadsheet = await service.spreadsheets.create({
            // @ts-ignore
            resource,
            fields: "spreadsheetId",
        });
        // @ts-ignore
        console.log(`Spreadsheet ID: ${spreadsheet.data.spreadsheetId}`);
        // @ts-ignore
        return spreadsheet.data.spreadsheetId;
    } catch (err) {
        // TODO (developer) - Handle exception
        throw err;
    }
};
