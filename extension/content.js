
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

async function fetchEstateData() {
    try {
        const response = await fetch("http://localhost:8080/api/estates/my");
        if (!response.ok) return null;
        return await response.json();
    } catch (e) {
        console.error("ExpectedEstate: Failed to fetch shared data", e);
        return null;
    }
}

function injectFillButton() {
    if (document.getElementById("ee-bridge-btn")) return;

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
        const data = await fetchEstateData();

        if (!data) {
            alert("ExpectedEstate: Unable to fetch estate data. Please make sure the app is running at localhost:8080 and you are logged in.");
            btn.innerText = "✨ Fill with ExpectedEstate";
            return;
        }

        // Map data keys to Config
        const estateValues = {
            deceasedFirstName: data.deceasedName?.split(" ")[0],
            deceasedLastName: data.deceasedName?.split(" ").slice(1).join(" "),
            deceasedSSN: data.deceasedSsn,
            deceasedDOB: data.deceasedDob,
            dateOfDeath: data.dateOfDeath,
        };

        let filledCount = 0;
        for (const fieldKey in config.fields) {
            const selector = config.fields[fieldKey];
            const input = document.querySelector(selector);
            if (input && estateValues[fieldKey]) {
                input.value = estateValues[fieldKey];
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
