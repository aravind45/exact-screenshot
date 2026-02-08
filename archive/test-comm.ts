import { api } from "./src/lib/api";

async function testCommunicationLogging() {
    try {
        console.log("Testing communication logging...");

        const assetId = "672aa37e-7f28-4bdc-9129-5eed0546146f";

        const commData = {
            method: "phone",
            subject: "Test Communication",
            content: "This is a test communication log entry",
            communicationDate: new Date().toISOString(),
            type: "follow_up",
            direction: "outbound"
        };

        console.log("Sending POST request to create communication...");
        const result = await api.createCommunication(assetId, commData);

        console.log("✅ SUCCESS! Communication created:", result);

    } catch (error: any) {
        console.error("❌ FAILED:", error.message);
    }
}

testCommunicationLogging();
