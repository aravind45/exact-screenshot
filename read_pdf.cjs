const fs = require('fs');
const pdf = require('pdf-parse');

let dataBuffer = fs.readFileSync('forms/NY/p-chklst-frm.pdf');

pdf(dataBuffer).then(function (data) {
    fs.writeFileSync('ny_checklist.txt', data.text);
    console.log('PDF parsed successfully.');
}).catch(function (err) {
    console.error('Error parsing PDF:', err);
});
