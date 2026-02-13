
import { AUTOMATION_MAPPINGS } from "@/config/automation";


export function generateMagicPipeUrl(baseUrl: string, estate: any, asset?: any) {
    if (!baseUrl) return "";

    const data = {
        deceasedFirstName: estate?.deceasedFirstName || "",
        deceasedLastName: estate?.deceasedLastName || "",
        deceasedState: estate?.deceasedState || "",
        courtCaseNumber: estate?.courtCaseNumber || "",
        accountNumber: asset?.accountNumber || "",
        institutionName: asset?.institution || "",
        // Add more fields as mapped in extension/content.js if needed
    };

    try {
        const json = JSON.stringify(data);
        const base64 = typeof window !== 'undefined' ? btoa(json) : Buffer.from(json).toString('base64');
        const separator = baseUrl.includes('#') ? '&' : '#';
        return `${baseUrl}${separator}ee_data=${base64}`;
    } catch (e) {
        console.error("Failed to generate magic pipe URL", e);
        return baseUrl;
    }
}

export function generateBookmarklet(estateData: any) {
    const script = `
        (function() {
            const data = ${JSON.stringify(estateData)};
            const mappings = ${JSON.stringify(AUTOMATION_MAPPINGS)};
            const currentUrl = window.location.href;
            
            let match = null;
            for (const key in mappings) {
                if (currentUrl.includes(mappings[key].urlPattern)) {
                    match = mappings[key];
                    break;
                }
            }
            
            if (!match) {
                alert("ExpectedEstate: No mapping found for this URL. If this is a supported institution, please ensure you are on the correct form page.");
                return;
            }
            
            console.log("ExpectedEstate: Filling form for " + currentUrl);
            
            for (const field in match.fields) {
                const selector = match.fields[field];
                const input = document.querySelector(selector);
                if (input) {
                    input.value = data[field] || "";
                    input.dispatchEvent(new Event('input', { bubbles: true }));
                    input.dispatchEvent(new Event('change', { bubbles: true }));
                    console.log("Filled: " + field);
                }
            }
            
            alert("ExpectedEstate: Form fields have been populated!");
        })();
    `.replace(/\s+/g, ' ').trim();

    return `javascript:${encodeURIComponent(script)}`;
}
