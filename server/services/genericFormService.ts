/**
 * Generic Form Service
 * 
 * Fallback form service for states without dedicated form services.
 * Provides basic form generation with state-specific terminology.
 */

import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { getStateRule } from "../../src/lib/stateRules";
import { logger } from "../lib/logger";

export interface GenericFormInput {
  formId: string;
  estate: any;
  assets?: any[];
  heirs?: any[];
  overrides?: Record<string, any>;
}

export interface GenericFormResult {
  pdfBytes: Uint8Array;
  fieldValues: Record<string, any>;
  validationErrors: string[];
}

/**
 * Generic form field definitions for common probate forms
 */
const GENERIC_FORM_FIELDS: Record<string, Array<{
  key: string;
  label: string;
  source: string;
  path?: string;
  transform?: string;
  required?: boolean;
}>> = {
  "PROBATE_PETITION": [
    { key: "decedentName", label: "Decedent Name", source: "computed", required: true },
    { key: "dateOfDeath", label: "Date of Death", source: "estate", path: "deceasedDateOfDeath", transform: "formatDate" },
    { key: "petitionerName", label: "Petitioner Name", source: "user", path: "fullName" },
    { key: "petitionerAddress", label: "Petitioner Address", source: "user", path: "address" },
    { key: "estimatedValue", label: "Estimated Estate Value", source: "computed", required: true },
    { key: "courtCounty", label: "County", source: "estate", path: "probateCounty" },
  ],
  "ADMINISTRATION_PETITION": [
    { key: "decedentName", label: "Decedent Name", source: "computed", required: true },
    { key: "dateOfDeath", label: "Date of Death", source: "estate", path: "deceasedDateOfDeath", transform: "formatDate" },
    { key: "administratorName", label: "Administrator Name", source: "computed" },
    { key: "heirSummary", label: "Heirs", source: "computed" },
    { key: "estimatedValue", label: "Estimated Estate Value", source: "computed", required: true },
  ],
  "INVENTORY": [
    { key: "decedentName", label: "Decedent Name", source: "computed", required: true },
    { key: "inventoryDate", label: "Inventory Date", source: "computed", transform: "formatDate" },
    { key: "totalRealProperty", label: "Real Property Value", source: "computed" },
    { key: "totalPersonalProperty", label: "Personal Property Value", source: "computed" },
    { key: "totalEstateValue", label: "Total Estate Value", source: "computed" },
  ],
  "SMALL_ESTATE_AFFIDAVIT": [
    { key: "decedentName", label: "Decedent Name", source: "computed", required: true },
    { key: "dateOfDeath", label: "Date of Death", source: "estate", path: "deceasedDateOfDeath", transform: "formatDate" },
    { key: "petitionerName", label: "Petitioner Name", source: "user", path: "fullName" },
    { key: "estateValue", label: "Estate Value", source: "computed" },
    { key: "heirSummary", label: "Heirs", source: "computed" },
  ],
};

function formatDate(value: any): string {
  if (!value) return '';
  try {
    return new Date(value).toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  } catch {
    return String(value);
  }
}

function formatCurrency(value: any): string {
  const num = Number(value);
  if (isNaN(num)) return '0.00';
  return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function getNestedValue(obj: any, path: string): any {
  if (!obj || !path) return undefined;
  return path.split('.').reduce((acc, key) => acc?.[key], obj);
}

function resolveFieldValue(key: string, def: any, input: GenericFormInput, stateCode: string): any {
  const { estate, assets = [], heirs = [], overrides = {} } = input;

  if (overrides[key] !== undefined) return overrides[key];

  switch (def.source) {
    case "estate":
      return def.path ? getNestedValue(estate, def.path) : undefined;

    case "user":
      return def.path ? getNestedValue(estate.user, def.path) : undefined;

    case "computed":
      return resolveComputed(key, input, stateCode);

    default:
      return undefined;
  }
}

function resolveComputed(key: string, input: GenericFormInput, stateCode: string): any {
  const { estate, assets = [], heirs = [] } = input;
  const stateRule = getStateRule(stateCode);

  switch (key) {
    case "decedentName":
      return `${estate.deceasedFirstName || ''} ${estate.deceasedLastName || ''}`.trim();

    case "petitionerName":
    case "administratorName":
      return estate.user?.fullName || '';

    case "estimatedValue":
    case "estateValue": {
      const personal = Number(estate.estimatedPersonalProperty || 0);
      const real = Number(estate.estimatedRealProperty || 0);
      return personal + real;
    }

    case "totalRealProperty": {
      const realAssets = assets.filter((a: any) => a.inventoryCategory === 'ATTACHMENT_1' || a.category === 'real_property');
      return realAssets.reduce((sum: number, a: any) => sum + Number(a.inventoryValue || a.value || 0), 0);
    }

    case "totalPersonalProperty": {
      const personalAssets = assets.filter((a: any) => a.inventoryCategory !== 'ATTACHMENT_1' && a.category !== 'real_property');
      return personalAssets.reduce((sum: number, a: any) => sum + Number(a.inventoryValue || a.value || 0), 0);
    }

    case "totalEstateValue": {
      return assets.reduce((sum: number, a: any) => sum + Number(a.inventoryValue || a.value || 0), 0);
    }

    case "inventoryDate":
    case "dateOfDeath":
      return new Date();

    case "heirSummary":
      return heirs.length
        ? heirs.map((h: any) => `${h.name} (${h.relationship})`).join('; ')
        : '';

    default:
      return undefined;
  }
}

function applyTransform(value: any, transform?: string): string {
  if (!transform) return value === null || value === undefined ? '' : String(value);
  switch (transform) {
    case 'uppercase':
      return String(value || '').toUpperCase();
    case 'formatDate':
      return formatDate(value);
    case 'formatCurrency':
      return formatCurrency(value);
    default:
      return String(value || '');
  }
}

/**
 * Get state-specific terminology
 */
function getStateTerminology(stateCode: string): {
  court: string;
  petition: string;
  letters: string;
  smallEstate: string;
  administrator: string;
  executor: string;
  estate: string;
} {
  const stateRule = getStateRule(stateCode);
  
  return {
    court: stateRule.probateTerm.includes("Informal") ? "Probate Court" : "Probate Court",
    petition: stateRule.probateTerm,
    letters: stateRule.lettersTerm,
    smallEstate: stateRule.smallEstateTerm,
    administrator: stateRule.lettersTerm.includes("Administration") ? stateRule.lettersTerm : "Administrator",
    executor: stateRule.lettersTerm.includes("Testamentary") ? stateRule.lettersTerm : "Executor",
    estate: "Estate",
  };
}

/**
 * Build a generic PDF for a probate petition
 */
async function buildGenericPetition(fieldValues: Record<string, any>, stateCode: string, formType: string): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const page = doc.addPage([612, 792]);
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
  const fontRegular = await doc.embedFont(StandardFonts.Helvetica);
  const { height } = page.getSize();
  
  const terms = getStateTerminology(stateCode);
  let y = height - 50;

  const draw = (text: string, size = 10, bold = false, indent = 0) => {
    page.drawText(text, { x: 50 + indent, y, size, font: bold ? fontBold : fontRegular });
    y -= size + 6;
  };

  // Header
  draw(`${terms.petition.toUpperCase()}`, 16, true);
  y -= 4;
  
  // Court info
  draw(`Court: ${terms.court}`, 10);
  draw(`County: ${fieldValues.courtCounty || '[County]'}`, 10);
  y -= 10;

  // Estate info
  draw(`Estate of: ${fieldValues.decedentName || '[Decedent Name]'}`, 12, true);
  draw(`Date of Death: ${fieldValues.dateOfDeath || '[Date]'}`, 10);
  y -= 10;

  // Petitioner section
  draw('PETITIONER', 11, true);
  draw(`Name: ${fieldValues.petitionerName || '[Petitioner Name]'}`, 10, false, 10);
  draw(`Address: ${fieldValues.petitionerAddress || '[Address]'}`, 10, false, 10);
  y -= 10;

  // Estate value
  draw('ESTATE VALUE', 11, true);
  const value = fieldValues.estimatedValue || fieldValues.estateValue || 0;
  draw(`Estimated Value: $${formatCurrency(value)}`, 10, false, 10);
  y -= 10;

  // Small estate notice if applicable
  if (formType === "SMALL_ESTATE_AFFIDAVIT") {
    draw('SMALL ESTATE AFFIDAVIT', 11, true);
    draw(`This estate qualifies for ${terms.smallEstate} under state law.`, 10, false, 10);
    draw(`Threshold: $${formatCurrency(getStateRule(stateCode).threshold)}`, 10, false, 10);
    y -= 10;
  }

  // Heirs section
  if (fieldValues.heirSummary) {
    draw('HEIRS', 11, true);
    draw(fieldValues.heirSummary, 9, false, 10);
    y -= 10;
  }

  // Citation
  y -= 10;
  draw('LEGAL CITATION', 11, true);
  draw(getStateRule(stateCode).probateCitation[0], 9, false, 10);
  
  if (formType === "SMALL_ESTATE_AFFIDAVIT") {
    draw(getStateRule(stateCode).smallEstateCitation[0], 9, false, 10);
  }

  // Footer
  y -= 20;
  draw('Note: This is a generic form. State-specific forms may be available.', 8);

  return await doc.save();
}

/**
 * Build a generic inventory PDF
 */
async function buildGenericInventory(fieldValues: Record<string, any>, stateCode: string): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const page = doc.addPage([612, 792]);
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
  const fontRegular = await doc.embedFont(StandardFonts.Helvetica);
  
  const terms = getStateTerminology(stateCode);
  let y = page.getSize().height - 50;

  const draw = (text: string, size = 10, bold = false, indent = 0) => {
    page.drawText(text, { x: 50 + indent, y, size, font: bold ? fontBold : fontRegular });
    y -= size + 6;
  };

  draw('INVENTORY OF ASSETS', 16, true);
  y -= 4;
  
  draw(`Estate of: ${fieldValues.decedentName || '[Decedent Name]'}`, 12, true);
  draw(`Inventory Date: ${fieldValues.inventoryDate || new Date().toLocaleDateString()}`, 10);
  y -= 10;

  draw('SUMMARY', 11, true);
  draw(`Real Property: $${formatCurrency(fieldValues.totalRealProperty || 0)}`, 10, false, 10);
  draw(`Personal Property: $${formatCurrency(fieldValues.totalPersonalProperty || 0)}`, 10, false, 10);
  draw(`Total Estate Value: $${formatCurrency(fieldValues.totalEstateValue || 0)}`, 10, false, 10);
  y -= 10;

  draw('LEGAL CITATION', 11, true);
  draw(getStateRule(stateCode).probateCitation[0], 9, false, 10);

  return await doc.save();
}

/**
 * Generic Form Service
 */
export const GenericFormService = {
  /**
   * Resolve form field values
   */
  resolveFields(input: GenericFormInput): { fieldValues: Record<string, any>; validationErrors: string[] } {
    const stateCode = input.estate?.deceasedState || "CA";
    const fields = GENERIC_FORM_FIELDS[input.formId] || [];
    
    const fieldValues: Record<string, any> = {};
    const validationErrors: string[] = [];

    for (const def of fields) {
      const raw = resolveFieldValue(def.key, def, input, stateCode);
      if (raw !== undefined) {
        fieldValues[def.key] = applyTransform(raw, def.transform);
      }
      
      if (def.required && (raw === undefined || raw === null || raw === '')) {
        validationErrors.push(`Missing required field: ${def.label}`);
      }
    }

    return { fieldValues, validationErrors };
  },

  /**
   * Generate a PDF form
   */
  async generate(input: GenericFormInput): Promise<GenericFormResult> {
    const stateCode = input.estate?.deceasedState || "CA";
    
    logger.warn(`[GenericFormService] Generating ${input.formId} for ${stateCode} (no dedicated service)`);
    
    const { fieldValues, validationErrors } = this.resolveFields(input);
    
    let pdfBytes: Uint8Array;
    
    switch (input.formId) {
      case "PROBATE_PETITION":
      case "ADMINISTRATION_PETITION":
        pdfBytes = await buildGenericPetition(fieldValues, stateCode, input.formId);
        break;
      case "INVENTORY":
        pdfBytes = await buildGenericInventory(fieldValues, stateCode);
        break;
      default:
        // Build generic fallback
        pdfBytes = await buildGenericPetition(fieldValues, stateCode, "PROBATE_PETITION");
    }

    return { pdfBytes, fieldValues, validationErrors };
  },

  /**
   * Get UI schema for a form
   */
  getUISchema(formId: string): Array<{
    key: string;
    label: string;
    type: string;
    required: boolean;
    description?: string;
    overridable: boolean;
  }> {
    const fields = GENERIC_FORM_FIELDS[formId] || [];
    
    return fields.map(def => ({
      key: def.key,
      label: def.label,
      type: "text",
      required: def.required ?? false,
      overridable: true,
    }));
  },
};
