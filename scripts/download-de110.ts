import https from 'https';
import fs from 'fs';
import path from 'path';

const url = 'https://www.courts.ca.gov/documents/de110.pdf';
const destination = path.join(process.cwd(), 'server', 'templates', 'DE-110.pdf');

console.log('⬇️  Downloading DE-110...');

const file = fs.createWriteStream(destination);

https.get(url, (response) => {
    if (response.statusCode === 301 || response.statusCode === 302) {
        const redirectUrl = response.headers.location;
        if (redirectUrl) {
            file.close();
            fs.unlinkSync(destination);
            console.log(`🔄 Following redirect to: ${redirectUrl}`);
            https.get(redirectUrl, (res) => {
                res.pipe(file);
                file.on('finish', () => {
                    file.close();
                    const stats = fs.statSync(destination);
                    console.log(`✅ Downloaded DE-110: ${(stats.size / 1024).toFixed(1)} KB`);
                });
            });
        }
    } else if (response.statusCode === 200) {
        response.pipe(file);
        file.on('finish', () => {
            file.close();
            const stats = fs.statSync(destination);
            console.log(`✅ Downloaded DE-110: ${(stats.size / 1024).toFixed(1)} KB`);
        });
    } else {
        file.close();
        fs.unlinkSync(destination);
        console.error(`❌ Failed: HTTP ${response.statusCode}`);
    }
}).on('error', (err) => {
    file.close();
    if (fs.existsSync(destination)) {
        fs.unlinkSync(destination);
    }
    console.error(`❌ Error: ${err.message}`);
});
