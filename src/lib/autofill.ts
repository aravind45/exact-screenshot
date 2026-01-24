
import { AUTOMATION_MAPPINGS } from "@/config/automation";

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
