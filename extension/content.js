
const MAPPINGS = {
    "robinhood.com": {
        fields: {
            deceasedFirstName: "input[name='first_name'], input#first-name",
            deceasedLastName: "input[name='last_name'], input#last-name",
            deceasedSSN: "input[name='ssn'], input#ssn",
            deceasedDOB: "input[name='dob'], input#dob",
            dateOfDeath: "input[name='date_of_death'], input#date-of-death",
        }
    },
    "fidelity.com": {
        fields: {
            deceasedFirstName: "#deceased-first-name, input[name*='firstName']",
            deceasedLastName: "#deceased-last-name, input[name*='lastName']",
            deceasedSSN: "#deceased-ssn",
            deceasedDOB: "#deceased-dob",
        }
    }
};

const IS_APP_DOMAIN = window.location.origin.includes("localhost:8080");

// 1. DATA CAPTURE (On localhost:8080)
if (IS_APP_DOMAIN) {
    console.log("ExpectedEstate: Bridge active on App Domain");
    window.addEventListener("message", (event) => {
        if (event.data && event.data.type === "EE_SYNC_DATA") {
            chrome.storage.local.set({ estateData: event.data.payload }, () => {
                console.log("ExpectedEstate: Data synced to extension storage");
            });
        }
    });
}

// 2. DATA POPULATION (On Institution Domains)
async function getStoredData() {
    return new Promise((resolve) => {
        chrome.storage.local.get(["estateData"], (result) => {
            resolve(result.estateData || null);
        });
    });
}

function injectFillButton() {
    if (IS_APP_DOMAIN || document.getElementById("ee-bridge-btn")) return;

    const currentDomain = window.location.hostname.replace("www.", "");
    let config = null;
    for (const domain in MAPPINGS) {
        if (currentDomain.includes(domain)) {
            config = MAPPINGS[domain];
            break;
        }
    }

    if (!config) return;

    const btn = document.createElement("button");
    btn.id = "ee-bridge-btn";
    btn.innerText = "✨ Fill with ExpectedEstate";
    btn.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 10000;
        background: #00D1FF;
        color: white;
        border: none;
        padding: 12px 24px;
        border-radius: 99px;
        font-weight: bold;
        cursor: pointer;
        box-shadow: 0 4px 20px rgba(0, 209, 255, 0.4);
        font-family: sans-serif;
        transition: transform 0.2s;
    `;

    btn.onmouseover = () => btn.style.transform = "scale(1.05)";
    btn.onmouseout = () => btn.style.transform = "scale(1)";

    btn.onclick = async () => {
        btn.innerText = "⏳ Filling...";
        const data = await getStoredData();

        if (!data) {
            alert("ExpectedEstate: No data found. Please make sure you have the dashboard open in another tab to sync your estate profile.");
            btn.innerText = "✨ Fill with ExpectedEstate";
            return;
        }

        let filledCount = 0;
        for (const fieldKey in config.fields) {
            const selector = config.fields[fieldKey];
            const input = document.querySelector(selector);
            if (input && data[fieldKey]) {
                input.value = data[fieldKey];
                input.dispatchEvent(new Event('input', { bubbles: true }));
                input.dispatchEvent(new Event('change', { bubbles: true }));
                filledCount++;
            }
        }

        btn.innerText = `✅ Filled ${filledCount} fields`;
        setTimeout(() => btn.innerText = "✨ Fill with ExpectedEstate", 3000);
    };

    document.body.appendChild(btn);
}

// Initial injection
injectFillButton();

// Support SPA navigation
const observer = new MutationObserver(injectFillButton);
observer.observe(document.body, { childList: true, subtree: true });
