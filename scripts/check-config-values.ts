import 'dotenv/config';
import { ConfigService } from '../server/services/configService.js';

async function main() {
    const domain = await ConfigService.get("MAILGUN_DOMAIN");
    const apiKey = await ConfigService.get("MAILGUN_API_KEY");
    const baseUrl = await ConfigService.get("MAILGUN_BASE_URL");

    console.log(`Resolved MAILGUN_DOMAIN: ${domain}`);
    console.log(`Resolved MAILGUN_API_KEY: ${apiKey ? 'Found' : 'Missing'}`);
    console.log(`Resolved MAILGUN_BASE_URL: ${baseUrl}`);

    console.log(`process.env.MAILGUN_DOMAIN: ${process.env.MAILGUN_DOMAIN}`);
}

main().catch(console.error);
