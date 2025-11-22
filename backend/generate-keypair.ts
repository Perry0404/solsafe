import { Keypair } from '@solana/web3.js';
import * as fs from 'fs';
import * as path from 'path';

const keypair = Keypair.generate();
const keypairPath = path.join(__dirname, '../solsafe-program/target/deploy/solsafe_program-keypair.json');
fs.writeFileSync(keypairPath, JSON.stringify(Array.from(keypair.secretKey)));

console.log('Generated new program keypair');
console.log('Program ID:', keypair.publicKey.toString());
console.log('Saved to:', keypairPath);
