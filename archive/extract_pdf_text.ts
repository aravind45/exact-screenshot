
import fs from "fs";
import pdf from "pdf-parse";

async function extractText(filePath: string) {
    const dataBuffer = fs.readFileSync(filePath);
    try {
        const data = await pdf(dataBuffer);
        const fileName = filePath.split('\\').pop();
        const outPath = `pdf_text_${fileName?.replace(/\s+/g, '_')}.txt`;
        fs.writeFileSync(outPath, data.text);
        console.log(`Successfully extracted to ${outPath}`);
    } catch (error) {
        console.error(`Error parsing ${filePath}:`, error);
    }
}

const args = process.argv.slice(2);
if (args.length > 0) {
    extractText(args[0]);
} else {
    console.log("Usage: tsx extract_pdf_text.ts <path_to_pdf>");
}
