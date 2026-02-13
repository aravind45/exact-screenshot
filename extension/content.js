
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
    },
    "localhost": {
        fields: {
            deceasedFirstName: "#deceasedFirstName",
            deceasedLastName: "#deceasedLastName",
            bio: "#bio",
            expertise: "#expertise",
            hourlyRate: "#hourlyRate",
            licenseNumber: "#licenseNumber"
        }
    },
    "expectedestate.com": {
        fields: {
            deceasedFirstName: "#deceasedFirstName",
            deceasedLastName: "#deceasedLastName",
            bio: "#bio",
            expertise: "#expertise",
            hourlyRate: "#hourlyRate",
            licenseNumber: "#licenseNumber"
        }
    }
};

/**
 * THE MAGIC PIPE:
 * Reads data from window.location.hash if present.
 * Format: #ee_data=BASE64_JSON
 */
function getIncomingData() {
    const hash = window.location.hash;
    if (hash.includes("ee_data=")) {
        try {
            const base64 = hash.split("ee_data=")[1];
            const json = atob(base64);
            return JSON.parse(json);
        } catch (e) {
            console.error("ExpectedEstate: Failed to parse magic pipe data", e);
        }
    }
    return null;
}

async function handleAutoFill() {
    const data = getIncomingData();
    if (!data) {
        // Fallback to storage if no pipe data
        return new Promise((resolve) => {
            chrome.storage.local.get(["estateData"], (result) => {
                resolve(result.estateData || null);
            });
        });
    }
    return data;
}

function injectFillButton() {
    const currentDomain = window.location.hostname.replace("www.", "");

    let config = null;
    for (const domain in MAPPINGS) {
        if (currentDomain.includes(domain)) {
            config = MAPPINGS[domain];
            break;
        }
    }

    if (!config) return;

    // Auto-trigger if data came through the pipe
    const pipeData = getIncomingData();
    if (pipeData) {
        console.log("ExpectedEstate: Pipe data detected, auto-filling...");
        setTimeout(() => performFill(pipeData, config), 1000); // Wait for page load
    }

    if (document.getElementById("ee-bridge-btn")) return;

    const btn = document.createElement("button");
    btn.id = "ee-bridge-btn";
    btn.innerText = "✨ Fill with ExpectedEstate";
    btn.style.cssText = `
        position: fixed;
        bottom: 24px;
        right: 24px;
        z-index: 10000;
        background: #00D1FF;
        color: white;
        border: none;
        padding: 14px 28px;
        border-radius: 99px;
        font-weight: bold;
        cursor: pointer;
        box-shadow: 0 8px 30px rgba(0, 0, 0, 0.2);
        font-family: sans-serif;
        transition: all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    `;

    btn.onmouseover = () => {
        btn.style.transform = "scale(1.05) translateY(-2px)";
        btn.style.boxShadow = "0 12px 40px rgba(0, 209, 255, 0.5)";
    };
    btn.onmouseout = () => {
        btn.style.transform = "scale(1)";
        btn.style.boxShadow = "0 8px 30px rgba(0, 0, 0, 0.2)";
    };

    btn.onclick = async () => {
        const data = await handleAutoFill();
        if (!data) {
            alert("ExpectedEstate: No data synced. Open the link from your ExpectedEstate dashboard to enable auto-fill.");
            return;
        }
        performFill(data, config);
    };

    document.body.appendChild(btn);
}

function performFill(data, config) {
    let filledCount = 0;
    for (const fieldKey in config.fields) {
        const selector = config.fields[fieldKey];
        const input = document.querySelector(selector);
        if (input && data[fieldKey]) {
            input.value = data[fieldKey];
            input.dispatchEvent(new Event('input', { bubbles: true }));
            input.dispatchEvent(new Event('change', { bubbles: true }));
            filledCount++;

            // Visual feedback for filled fields
            input.style.backgroundColor = "rgba(0, 209, 255, 0.1)";
            input.style.transition = "background-color 0.5s";
            setTimeout(() => input.style.backgroundColor = "", 2000);
        }
    }

    const btn = document.getElementById("ee-bridge-btn");
    if (btn) {
        btn.innerText = `✅ Filled ${filledCount} fields`;
        setTimeout(() => btn.innerText = "✨ Fill with ExpectedEstate", 3000);
    }
}

injectFillButton();
const observer = new MutationObserver(injectFillButton);
observer.observe(document.body, { childList: true, subtree: true });
