async function testMarketingAPI() {
    const apiBase = "http://localhost:3000/api/marketing";

    console.log("--- Testing Marketing Event Endpoint ---");
    try {
        const eventRes = await fetch(`${apiBase}/event`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                event: "checklist_viewed",
                utmSource: "whatsapp",
                utmMedium: "message",
                utmCampaign: "executor_help"
            })
        });
        console.log(`Event Status: ${eventRes.status} ${eventRes.statusText}`);
        const eventData = await eventRes.json();
        console.log("Event Response:", eventData);
    } catch (e) {
        console.error("Event Test Failed:", e);
    }

    console.log("\n--- Testing Checklist Submission Endpoint ---");
    try {
        const checklistRes = await fetch(`${apiBase}/checklist`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                email: "tester@example.com",
                utmSource: "whatsapp",
                utmMedium: "message",
                utmCampaign: "executor_help"
            })
        });
        console.log(`Checklist Status: ${checklistRes.status} ${checklistRes.statusText}`);
        const checklistData = await checklistRes.json();
        console.log("Checklist Response:", checklistData);
    } catch (e) {
        console.error("Checklist Test Failed:", e);
    }
}

testMarketingAPI();
