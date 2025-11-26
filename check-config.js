const { Connection, PublicKey } = require('@solana/web3.js');

const PROGRAM_ID = new PublicKey('FfV3AHU6WS7aPz53DnVvWBMEZR46ydGkEtKpLiKfRTrR');
const connection = new Connection('https://api.devnet.solana.com', 'confirmed');

async function checkConfig() {
  try {
    const [configPda] = PublicKey.findProgramAddressSync(
      [Buffer.from('config')],
      PROGRAM_ID
    );

    console.log('Config PDA:', configPda.toBase58());

    const accountInfo = await connection.getAccountInfo(configPda);
    
    if (accountInfo) {
      console.log('✅ Config account EXISTS - Program is already initialized!');
      console.log('Account owner:', accountInfo.owner.toBase58());
      console.log('Account data length:', accountInfo.data.length);
    } else {
      console.log('❌ Config account DOES NOT EXIST - Program needs initialization');
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkConfig();
