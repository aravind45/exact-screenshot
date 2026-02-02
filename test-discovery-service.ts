
import { DiscoveryService } from './server/services/discoveryService';
import * as pdfParse from 'pdf-parse';

async function testDiscovery() {
    console.log("Testing Discovery Service...");
    try {
        console.log("pdfParse type:", typeof pdfParse);
        console.log("pdfParse keys:", Object.keys(pdfParse));
        // @ts-ignore
        if (typeof pdfParse.default === 'function') {
            console.log("SUCCESS: pdfParse.default is function");
        } else if (typeof pdfParse === 'function') {
            console.log("SUCCESS: pdfParse is function");
        } else {
            console.log("WARNING: pdfParse is weird.");
        }
    } catch (e) {
        console.error("ERROR: pdf-parse failed:", e);
    }
}

testDiscovery().catch(console.error);
