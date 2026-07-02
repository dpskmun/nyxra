import { parse } from "csv-parse/sync"
import { CsvRow } from "../../types/csv/csvRow";
import { ResultMap } from "../../types/csv/resultMap";
import { csvMapResult } from "../../types/csv/csvMapResult";

export async function csvEmailsMap(csvUrls: string | null): Promise<csvMapResult> {
    if (!csvUrls) return { success: false }
    const res = await fetch(csvUrls);
    const csvText = await res.text();
    
    const rows = parse(csvText, {
        columns: true,
        skip_empty_lines: true
    }) as CsvRow[];

    const result: ResultMap = {};

    for (const row of rows) {
        const emailKey = Object.keys(row).find(key => key.toLocaleLowerCase().includes("email") && row[key]?.trim());
        if (!emailKey) continue;
        
        const email = row[emailKey].trim();

        const elseData = Object.fromEntries(
            Object.entries(row).filter(([key]) => key !== emailKey)
        ) as CsvRow;

        if (!result[email]) {
            result[email] = []
        }

        result[email].push(elseData)
    }
    return { success: true, data: result }
}