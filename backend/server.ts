import { Connection, PublicKey, Keypair } from "@solana/web3.js";
import * as anchor from "@coral-xyz/anchor";
import { Program, AnchorProvider } from "@coral-xyz/anchor";
import idl from "../solsafe-program/target/idl/solsafe_program.json";
import fs from "fs";

const RPC_URL = process.env.RPC_URL || "https://pit129.nodes.rpcpool.com";
const connection = new Connection(RPC_URL, "confirmed");

function loadKeypair(path: string): Keypair {
  const raw = fs.readFileSync(path, "utf8");
  const arr = JSON.parse(raw);
  return Keypair.fromSecretKey(new Uint8Array(arr));
}

async function updateValidators() {
  const payerPath = process.env.SOL_KEYPAIR || `${process.env.HOME}/.config/solana/id.json`;
  const payer = loadKeypair(payerPath);
  const wallet = new anchor.Wallet(payer);
  const provider = new AnchorProvider(connection, wallet, { preflightCommitment: "confirmed" });
  anchor.setProvider(provider);

  const programId = new PublicKey(process.env.PROGRAM_ID || "Hvo63PGhSivug4ju5bEWrVwLuDukk45DcKBZM2XPUUVr");
  const program = new Program(idl as anchor.Idl, programId, provider);

  const validators = await connection.getVoteAccounts();
  const votePubkeys = validators.current.map(v => new PublicKey(v.votePubkey)).slice(0, 50);

  const [configPda] = PublicKey.findProgramAddressSync([
    Buffer.from("config")
  ], program.programId);

  await program.methods
    .updateValidators(votePubkeys)
    .accounts({ config: configPda, admin: wallet.publicKey })
    .rpc();

  console.log("Validators updated:", votePubkeys.length);
}

updateValidators().catch(console.error);