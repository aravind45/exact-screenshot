
import fs from 'fs';
import pdf from 'pdf-parse';

async function readPdf() {
    try {
        const dataBuffer = fs.readFileSync('c:\\Users\\aravi\\Documents\\AI_LLM\\projects\\exact-screenshot\\SEO Audit.pdf');
        const data = await pdf(dataBuffer);
        console.log("PDF Content extracted successfully.");
        console.log("-----------------------------------");
        console.log(data.text);
        console.log("-----------------------------------");
    } catch (error) {
        console.error("Error reading PDF:", error);
    }
}

readPdf();
