// Groth16 ZK-SNARK implementation for vote commitment verification
use anchor_lang::prelude::*;
use ark_bn254::{Bn254, Fr};
use ark_groth16::{Groth16, Proof, VerifyingKey};
use ark_serialize::{CanonicalDeserialize, CanonicalSerialize};
use ark_ff::PrimeField;

/// Groth16 proof for vote commitment
/// Circuit proves: commitment = Hash(vote || salt) without revealing vote or salt
#[derive(Clone)]
pub struct VoteCommitmentProof {
    pub proof: Proof<Bn254>,
    pub public_inputs: Vec<Fr>,
}

impl VoteCommitmentProof {
    /// Verify the Groth16 proof
    pub fn verify(
        &self,
        verifying_key: &VerifyingKey<Bn254>,
        commitment: &[u8; 32],
        case_id: u64,
    ) -> Result<bool> {
        // Convert commitment to field element
        let commitment_fr = bytes_to_field_element(commitment)?;
        
        // Convert case_id to field element
        let case_id_fr = Fr::from(case_id);
        
        // Public inputs: [commitment, case_id]
        let public_inputs = vec![commitment_fr, case_id_fr];
        
        // Verify Groth16 proof
        let valid = Groth16::<Bn254>::verify(
            verifying_key,
            &public_inputs,
            &self.proof,
        ).map_err(|_| error!(crate::ErrorCode::InvalidZkProof))?;
        
        Ok(valid)
    }
    
    /// Deserialize proof from bytes
    pub fn from_bytes(proof_bytes: &[u8]) -> Result<Self> {
        require!(proof_bytes.len() >= 192, crate::ErrorCode::InvalidZkProof); // Groth16 proof is 192 bytes
        
        let proof = Proof::<Bn254>::deserialize_compressed(&proof_bytes[0..192])
            .map_err(|_| error!(crate::ErrorCode::InvalidZkProof))?;
        
        // Deserialize public inputs if provided
        let public_inputs = if proof_bytes.len() > 192 {
            let mut inputs = Vec::new();
            let input_bytes = &proof_bytes[192..];
            let mut offset = 0;
            
            while offset + 32 <= input_bytes.len() {
                let bytes: [u8; 32] = input_bytes[offset..offset+32]
                    .try_into()
                    .map_err(|_| error!(crate::ErrorCode::InvalidZkProof))?;
                let fr = bytes_to_field_element(&bytes)?;
                inputs.push(fr);
                offset += 32;
            }
            inputs
        } else {
            Vec::new()
        };
        
        Ok(VoteCommitmentProof {
            proof,
            public_inputs,
        })
    }
}

/// Verifying key for vote commitment circuit
pub struct VoteCommitmentVerifyingKey {
    pub vk: VerifyingKey<Bn254>,
}

impl VoteCommitmentVerifyingKey {
    /// Load verifying key from account data
    pub fn from_account_data(data: &[u8]) -> Result<Self> {
        require!(data.len() >= 256, crate::ErrorCode::InvalidZkProof);
        
        let vk = VerifyingKey::<Bn254>::deserialize_compressed(data)
            .map_err(|_| error!(crate::ErrorCode::InvalidZkProof))?;
        
        Ok(VoteCommitmentVerifyingKey { vk })
    }
    
    /// Get default embedded verifying key
    /// In production, this should be stored on-chain or loaded from a PDA
    pub fn default_embedded() -> Result<Self> {
        // This is a placeholder - in production you'd generate this from your circuit
        // For now, we'll use a mock VK
        msg!("WARNING: Using mock verifying key - replace with real circuit VK");
        
        // In practice, you would:
        // 1. Define your circuit in Circom or arkworks
        // 2. Run the trusted setup ceremony
        // 3. Embed the verifying key here or store on-chain
        
        Err(error!(crate::ErrorCode::InvalidZkProof))
    }
}

/// Convert 32 bytes to BN254 field element
fn bytes_to_field_element(bytes: &[u8; 32]) -> Result<Fr> {
    // Interpret bytes as big-endian field element
    Fr::from_be_bytes_mod_order(bytes);
    
    // Safe conversion ensuring we're in field
    let mut le_bytes = *bytes;
    le_bytes.reverse();
    
    Fr::deserialize_compressed(&le_bytes[..])
        .map_err(|_| error!(crate::ErrorCode::InvalidZkProof))
}

/// Evidence encryption proof using ZK
pub struct EvidenceEncryptionProof {
    pub proof: Proof<Bn254>,
}

impl EvidenceEncryptionProof {
    /// Verify that evidence was properly encrypted without revealing content
    pub fn verify(
        &self,
        verifying_key: &VerifyingKey<Bn254>,
        evidence_hash: &[u8; 32],
    ) -> Result<bool> {
        let hash_fr = bytes_to_field_element(evidence_hash)?;
        
        let valid = Groth16::<Bn254>::verify(
            verifying_key,
            &[hash_fr],
            &self.proof,
        ).map_err(|_| error!(crate::ErrorCode::InvalidZkProof))?;
        
        Ok(valid)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_field_element_conversion() {
        let bytes = [1u8; 32];
        let result = bytes_to_field_element(&bytes);
        assert!(result.is_ok());
    }
}
