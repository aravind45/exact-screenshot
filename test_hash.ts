
import bcrypt from 'bcryptjs'

async function main() {
    const password = 'password';
    const hash1 = await bcrypt.hash(password, 10);
    const hash2 = '$2b$10$w9dg8Ssyf.xSkQDsvviHSOxmJLUmUdmo4bmas5DoaIcoygz1V7Vo.'; // From seed.ts
    const hash3 = '$2b$10$MMBCOPnu0EMVoCQ19ypxLeghBFat//LeZiyXLIe65ShEFggTXcjjW'; // From DB for aravind.77479

    console.log(`Testing 'password' against hash1 (newly generated): ${await bcrypt.compare(password, hash1)}`);
    console.log(`Testing 'password' against hash2 (seed.ts): ${await bcrypt.compare(password, hash2)}`);
    console.log(`Testing 'password' against hash3 (DB current): ${await bcrypt.compare(password, hash3)}`);

    console.log(`New hash generated: ${hash1}`);
}

main().catch(console.error);
