async function testWhatsAppSource() {
    const apiBase = "http://localhost:3000/api/marketing/event";

    console.log("--- Testing WhatsApp Source Mapping ---");
    try {
        const res = await fetch(apiBase, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                event: "whatsapp_link_clicked",
                source: "whatsapp"
            })
        });
        const data = await res.json();
        console.log("Response:", data);
    } catch (e) {
        console.error("Test Failed:", e);
    }
}

testWhatsAppSource();
