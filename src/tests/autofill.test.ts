import { describe, it, expect } from 'vitest';
import { generateMagicPipeUrl } from '../lib/autofill';

describe('generateMagicPipeUrl', () => {
    const mockEstate = {
        deceasedFirstName: 'John',
        deceasedLastName: 'Doe',
        deceasedState: 'CA',
        courtCaseNumber: '2024-PR-12345'
    };

    const mockAsset = {
        institution: 'Fidelity',
        accountNumber: '123456789'
    };

    it('should generate a URL with a hash and encoded data', () => {
        const baseUrl = 'https://www.fidelity.com';
        const url = generateMagicPipeUrl(baseUrl, mockEstate, mockAsset);

        expect(url).toContain(baseUrl);
        expect(url).toContain('#ee_data=');

        const base64 = url.split('#ee_data=')[1];
        const json = Buffer.from(base64, 'base64').toString('utf8');
        const decodedData = JSON.parse(json);

        expect(decodedData.deceasedFirstName).toBe('John');
        expect(decodedData.accountNumber).toBe('123456789');
    });

    it('should handle base URLs that already have a hash', () => {
        const baseUrl = 'https://www.fidelity.com#some-hash';
        const url = generateMagicPipeUrl(baseUrl, mockEstate, mockAsset);

        expect(url).toBe(`${baseUrl}&ee_data=${Buffer.from(JSON.stringify({
            deceasedFirstName: 'John',
            deceasedLastName: 'Doe',
            deceasedState: 'CA',
            courtCaseNumber: '2024-PR-12345',
            accountNumber: '123456789',
            institutionName: 'Fidelity'
        })).toString('base64')}`);
    });

    it('should return the base URL if it is empty', () => {
        expect(generateMagicPipeUrl('', mockEstate)).toBe('');
    });

    it('should handle missing asset data', () => {
        const baseUrl = 'https://www.fidelity.com';
        const url = generateMagicPipeUrl(baseUrl, mockEstate);

        const base64 = url.split('#ee_data=')[1];
        const json = Buffer.from(base64, 'base64').toString('utf8');
        const decodedData = JSON.parse(json);

        expect(decodedData.accountNumber).toBe('');
    });
});
