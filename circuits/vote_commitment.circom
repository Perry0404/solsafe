pragma circom 2.1.6;

include "circomlib/circuits/poseidon.circom";
include "circomlib/circuits/bitify.circom";

/**
 * Vote Commitment Circuit
 * 
 * Proves knowledge of (vote, salt) such that:
 * commitment = Poseidon(vote, salt)
 * nullifier = Poseidon(case_id, commitment)
 * 
 * Without revealing the actual vote or salt
 */
template VoteCommitment() {
    // Private inputs (witness)
    signal input vote;        // 0 or 1 (reject or approve)
    signal input salt;        // Random 254-bit value
    signal input case_id;     // Case identifier
    
    // Public inputs
    signal input commitment;  // Hash of vote and salt
    signal input nullifier;   // Hash of case_id and commitment
    
    // Intermediate signals
    signal computed_commitment;
    signal computed_nullifier;
    
    // Constraint 1: vote must be binary (0 or 1)
    vote * (1 - vote) === 0;
    
    // Constraint 2: Compute commitment = Poseidon(vote, salt)
    component poseidon_commit = Poseidon(2);
    poseidon_commit.inputs[0] <== vote;
    poseidon_commit.inputs[1] <== salt;
    computed_commitment <== poseidon_commit.out;
    
    // Constraint 3: Verify commitment matches public input
    commitment === computed_commitment;
    
    // Constraint 4: Compute nullifier = Poseidon(case_id, commitment)
    component poseidon_nullifier = Poseidon(2);
    poseidon_nullifier.inputs[0] <== case_id;
    poseidon_nullifier.inputs[1] <== commitment;
    computed_nullifier <== poseidon_nullifier.out;
    
    // Constraint 5: Verify nullifier matches public input
    nullifier === computed_nullifier;
}

component main {public [commitment, nullifier]} = VoteCommitment();
