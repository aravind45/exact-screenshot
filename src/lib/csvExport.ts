
/**
 * Utility to export estate data (assets, liabilities) to CSV format
 * for professional handoff (CPAs, Attorneys).
 */

export function exportToCSV(data: any[], filename: string) {
    if (data.length === 0) return;

    const headers = Object.keys(data[0]);
    const csvRows = [];

    // Add Headers
    csvRows.push(headers.join(','));

    // Add Data Rows
    for (const row of data) {
        const values = headers.map(header => {
            const val = row[header];
            const escaped = ('' + val).replace(/"/g, '""');
            return `"${escaped}"`;
        });
        csvRows.push(values.join(','));
    }

    const csvString = csvRows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');

    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}

export function generateCPAExport(assets: any[], liabilities: any[]) {
    const timestamp = new Date().toISOString().split('T')[0];

    // Format Assets for CPA
    const assetExport = assets.map(a => ({
        'Institution/Asset': a.institution,
        'Type': a.type,
        'Current Value': a.value,
        'Date of Death Value': a.dateOfDeathValue || 'N/A',
        'Category': a.category,
        'Status': a.status,
        'Authority Type': a.authorityType,
        'Last Verified': a.lastContactDate || 'N/A'
    }));

    exportToCSV(assetExport, `ExpectedEstate_Assets_${timestamp}.csv`);

    // Format Liabilities for CPA
    if (liabilities.length > 0) {
        const liabilityExport = liabilities.map(l => ({
            'Creditor': l.creditor,
            'Type': l.type,
            'Amount': l.amount,
            'Status': l.status,
            'Priority': l.priority,
            'Due Date': l.dueDate || 'N/A'
        }));
        exportToCSV(liabilityExport, `ExpectedEstate_Liabilities_${timestamp}.csv`);
    }
}
