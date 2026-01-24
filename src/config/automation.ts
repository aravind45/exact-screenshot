
export interface FormMapping {
    urlPattern: string;
    fields: Record<string, string>; // ExpectedEstate Field Key -> CSS Selector
    actions?: {
        selector: string;
        type: "click" | "scroll";
    }[];
}

export const AUTOMATION_MAPPINGS: Record<string, FormMapping> = {
    robinhood: {
        urlPattern: "robinhood.com/contact",
        fields: {
            deceasedFirstName: "input[name='first_name'], input#first-name",
            deceasedLastName: "input[name='last_name'], input#last-name",
            deceasedSSN: "input[name='ssn'], input#ssn",
            deceasedDOB: "input[name='dob'], input#dob",
            dateOfDeath: "input[name='date_of_death'], input#date-of-death",
        }
    },
    fidelity: {
        urlPattern: "fidelity.com/estate-services",
        fields: {
            deceasedFirstName: "#deceased-first-name",
            deceasedLastName: "#deceased-last-name",
            deceasedSSN: "#deceased-ssn",
            deceasedDOB: "#deceased-dob",
        }
    }
};
