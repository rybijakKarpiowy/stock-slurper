import { GoogleAuth } from "google-auth-library";
import { google } from "googleapis";

// create a spreadsheet
export const createSpreadsheet = async (title: string) => {
    const auth = new GoogleAuth({
        scopes: "https://www.googleapis.com/auth/spreadsheets",
        credentials: {
            client_email: process.env.GOOGLE_CLIENT_EMAIL,
            client_id: process.env.GOOGLE_CLIENT_ID,
            client_secret: process.env.GOOGLE_CLIENT_SECRET,
        }
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
