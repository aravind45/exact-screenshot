
import { createRequire } from "module";
const require = createRequire(import.meta.url);

try {
    const pdfNode = require("pdf-parse/node");
    console.log("Required 'pdf-parse/node':", typeof pdfNode);
    console.log("Keys:", Object.keys(pdfNode));
    if (pdfNode.default) console.log("Default:", typeof pdfNode.default);
} catch (e) {
    console.log("Failed to require 'pdf-parse/node':", e.message);
}

try {
    const main = require("pdf-parse");
    console.log("Main export keys:", Object.keys(main));
    if (main.PDFParse) {
        console.log("Found PDFParse class.");
        // Try usage ??
    }
} catch (e) {
    console.log("Failed main require:", e.message);
}
