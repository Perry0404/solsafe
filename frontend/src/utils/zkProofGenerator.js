/**
 * Client-side ZK proof generation for vote commitments
 * Uses Circom WASM witness calculator and snarkjs
 */

const snarkjs = require('snarkjs');
const { buildPoseidon } = require('circomlibjs');

/**
 * Generate a ZK proof for a vote commitment
 * @param {boolean} vote - true for approve, false for reject
 * @param {BigInt} salt - Random 254-bit value
 * @param {BigInt} caseId - Case identifier
 * @returns {Promise<{proof: Uint8Array, publicInputs: Uint8Array, commitment: Uint8Array, nullifier: Uint8Array}>}
 */
export async function generateVoteProof(vote, salt, caseId) {
    console.log('🔐 Generating ZK proof for vote...');
    
    // Initialize Poseidon hash
    const poseidon = await buildPoseidon();
    
    // Compute commitment = Poseidon(vote, salt)
    const voteValue = vote ? 1n : 0n;
    const commitment = poseidon.F.toString(poseidon([voteValue, salt]));
    
    // Compute nullifier = Poseidon(caseId, commitment)
    const nullifier = poseidon.F.toString(poseidon([caseId, BigInt(commitment)]));
    
    console.log('📝 Computed commitment and nullifier');
    
    // Prepare circuit inputs
    const input = {
        vote: voteValue.toString(),
        salt: salt.toString(),
        case_id: caseId.toString(),
        commitment: commitment,
        nullifier: nullifier
    };
    
    // Generate witness
    const { proof, publicSignals } = await snarkjs.groth16.fullProve(
        input,
        '/circuits/vote_commitment_js/vote_commitment.wasm',
        '/circuits/vote_commitment_0001.zkey'
    );
    
    console.log('✅ Proof generated successfully');
    
    // Serialize proof for Solana (192 bytes for Groth16)
    const proofBytes = serializeGroth16Proof(proof);
    
    // Serialize public inputs (case_id + commitment)
    const publicInputs = new Uint8Array(40);
    const caseIdBytes = Buffer.from(caseId.toString(16).padStart(16, '0'), 'hex');
    const commitmentBytes = Buffer.from(commitment.padStart(64, '0'), 'hex');
    publicInputs.set(caseIdBytes, 0);
    publicInputs.set(commitmentBytes, 8);
    
    return {
        proof: proofBytes,
        publicInputs,
        commitment: Buffer.from(commitment.padStart(64, '0'), 'hex'),
        nullifier: Buffer.from(nullifier.padStart(64, '0'), 'hex')
    };
}

/**
 * Serialize Groth16 proof to bytes for Solana
 */
function serializeGroth16Proof(proof) {
    const proofBytes = new Uint8Array(192);
    
    // Proof consists of 3 G1 points (pi_a, pi_c) and 1 G2 point (pi_b)
    // Each G1 point: 64 bytes (2 x 32 bytes for x,y coordinates)
    // Each G2 point: 128 bytes (2 x 64 bytes for x,y complex coordinates)
    
    let offset = 0;
    
    // pi_a (G1 point)
    const piA = pointToBytes(proof.pi_a);
    proofBytes.set(piA, offset);
    offset += 64;
    
    // pi_b (G2 point) - Note: Not used in compressed format
    // We skip this in compressed format
    
    // pi_c (G1 point)
    const piC = pointToBytes(proof.pi_c);
    proofBytes.set(piC, offset);
    offset += 64;
    
    return proofBytes;
}

function pointToBytes(point) {
    // Convert field elements to bytes
    const xBytes = hexToBytes(point[0]);
    const yBytes = hexToBytes(point[1]);
    
    const result = new Uint8Array(64);
    result.set(xBytes, 0);
    result.set(yBytes, 32);
    
    return result;
}

function hexToBytes(hex) {
    // Remove 0x prefix if present
    hex = hex.replace('0x', '');
    
    // Pad to 64 characters (32 bytes)
    hex = hex.padStart(64, '0');
    
    const bytes = new Uint8Array(32);
    for (let i = 0; i < 32; i++) {
        bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
    }
    
    return bytes;
}

/**
 * Verify a proof locally (for testing)
 */
export async function verifyVoteProof(proof, publicInputs) {
    const vKey = JSON.parse(
        require('fs').readFileSync('/circuits/verification_key.json', 'utf8')
    );
    
    const valid = await snarkjs.groth16.verify(
        vKey,
        publicInputs,
        proof
    );
    
    return valid;
}

/**
 * Generate random salt for vote commitment
 */
export function generateRandomSalt() {
    const crypto = require('crypto');
    const randomBytes = crypto.randomBytes(31); // 248 bits
    return BigInt('0x' + randomBytes.toString('hex'));
}
