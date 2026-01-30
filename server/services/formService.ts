import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import fs from 'fs';
import path from 'path';
import { prisma } from '../db.js';

export interface OverlayCoordinate {
    x: number;
    y: number;
    size?: number;
    font?: string; // Standard font name
}

export interface FormMapping {
    [key: string]: OverlayCoordinate;
}

export class FormService {
    private static TEMPLATES_DIR = path.join(process.cwd(), 'server', 'templates');

    /**
     * Generates a PDF by overlaying text on an official template at specific coordinates.
     */
    static async generateOverlayPdf(templateName: string, data: Record<string, any>, mapping: FormMapping) {
        let templateBytes: Buffer;

        // Try DB first
        const dbTemplate = await prisma.formTemplate.findUnique({
            where: { name: templateName }
        });

        if (dbTemplate) {
            templateBytes = Buffer.from(dbTemplate.data);
        } else {
            // Fallback to filesystem
            const templatePath = path.join(this.TEMPLATES_DIR, templateName.endsWith('.pdf') ? templateName : `${templateName}.pdf`);
            if (!fs.existsSync(templatePath)) {
                throw new Error(`Template ${templateName} not found in DB or at ${templatePath}`);
            }
            templateBytes = fs.readFileSync(templatePath);
        }

        const pdfDoc = await PDFDocument.load(templateBytes, { ignoreEncryption: true });
        const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
        const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

        const pages = pdfDoc.getPages();

        for (const [key, value] of Object.entries(data)) {
            const coord = mapping[key];
            if (coord) {
                // Determine which page to draw on (default to 0 if not specified - to be expanded)
                const page = pages[0];
                const { height } = page.getSize();

                // Draw the text
                page.drawText(String(value || ''), {
                    x: coord.x,
                    y: coord.y, // Assumes coordinate system where 0 is bottom
                    size: coord.size || 10,
                    font: coord.font?.includes('Bold') ? fontBold : font,
                    color: rgb(0, 0, 0),
                });
            }
        }

        return await pdfDoc.save();
    }

    /**
     * Calibration Utility: Generates a PDF with a grid overlay to help find coordinates.
     */
    static async generateCalibrationPdf(templateName: string) {
        const templatePath = path.join(this.TEMPLATES_DIR, templateName);
        const templateBytes = fs.readFileSync(templatePath);
        const pdfDoc = await PDFDocument.load(templateBytes, { ignoreEncryption: true });

        const pages = pdfDoc.getPages();
        const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

        pages.forEach(page => {
            const { width, height } = page.getSize();

            // Draw vertical lines every 50 points
            for (let x = 0; x <= width; x += 50) {
                page.drawLine({
                    start: { x, y: 0 },
                    end: { x, y: height },
                    thickness: 0.5,
                    color: rgb(0.8, 0, 0),
                    opacity: 0.3,
                });
                page.drawText(String(x), { x: x + 2, y: 10, size: 8, font, color: rgb(0.8, 0, 0) });
            }

            // Draw horizontal lines every 50 points
            for (let y = 0; y <= height; y += 50) {
                page.drawLine({
                    start: { x: 0, y },
                    end: { x: width, y },
                    thickness: 0.5,
                    color: rgb(0, 0, 0.8),
                    opacity: 0.3,
                });
                page.drawText(String(y), { x: 10, y: y + 2, size: 8, font, color: rgb(0, 0, 0.8) });
            }

            // Add fine grid (10 points)
            for (let x = 0; x <= width; x += 10) {
                page.drawLine({
                    start: { x, y: 0 },
                    end: { x, y: height },
                    thickness: 0.1,
                    color: rgb(0.5, 0.5, 0.5),
                    opacity: 0.1,
                });
            }
            for (let y = 0; y <= height; y += 10) {
                page.drawLine({
                    start: { x: 0, y },
                    end: { x: width, y },
                    thickness: 0.1,
                    color: rgb(0.5, 0.5, 0.5),
                    opacity: 0.1,
                });
            }
        });

        return await pdfDoc.save();
    }
}
