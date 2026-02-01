
import fs from 'fs';
import path from 'path';
import FormData from 'form-data';
import axios from 'axios';

async function testDiscovery() {
    try {
        const filePath = String.raw`C:\Users\aravi\.gemini\antigravity\brain\5f68d497-06e2-4f05-bdc6-0b7a6244d096\uploaded_media_1769984937280.png`;

        if (!fs.existsSync(filePath)) {
            console.error("File not found:", filePath);
            return;
        }

        const form = new FormData();
        form.append('file', fs.createReadStream(filePath));

        console.log("Uploading file:", filePath);

        // Try connecting directly to backend port 3000
        const response = await axios.post('http://localhost:3000/api/discovery/analyze', form, {
            headers: {
                ...form.getHeaders()
            }
        });

        console.log("Response Status:", response.status);
        console.log("Response Data:", JSON.stringify(response.data, null, 2));

    } catch (error: any) {
        console.error("Script Error:", error.message);
        if (error.response) {
            console.error("Server Response Status:", error.response.status);
            console.error("Server Response Data:", JSON.stringify(error.response.data, null, 2));
        } else if (error.request) {
            console.error("No response received from server.");
        }
    }
}

testDiscovery();
