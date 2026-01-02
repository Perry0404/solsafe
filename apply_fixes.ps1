# Apply Priority 2 fixes to select_jurors.rs and lib.rs

$selectJurorsPath = "solsafe-program\programs\solsafe-program\src\instructions\select_jurors.rs"
$libPath = "solsafe-program\programs\solsafe-program\src\lib.rs"

# Read select_jurors.rs
$content = Get-Content $selectJurorsPath -Raw

# Replace the juror selection logic
$oldCode = @'
    // Select jurors using Switchboard's true randomness
    let mut selected = Vec::with_capacity(num_jurors);
    for i in 0..num_jurors {
        // Use different bytes from the randomness for each juror
        let offset = i * 4;
        let idx = u32::from_le_bytes([
            randomness[offset % 32],
            randomness[(offset + 1) % 32],
            randomness[(offset + 2) % 32],
            randomness[(offset + 3) % 32]
        ]) as usize % validator_count;
        
        selected.push(config.validator_list[idx]);
    }
    
    case.jurors = selected;
    case.state = CaseState::Voting;
'@

$newCode = @'
    // Select jurors using Switchboard's true randomness with duplicate prevention
    let mut selected = Vec::with_capacity(num_jurors);
    let mut selected_indices = Vec::with_capacity(num_jurors);
    let mut attempt = 0u32;
    
    while selected.len() < num_jurors {
        require!(attempt < 1000, ErrorCode::JurorSelectionFailed);
        
        // Use checked arithmetic to prevent overflow
        let offset = attempt.checked_mul(4)
            .ok_or(ErrorCode::ArithmeticOverflow)? as usize;
        
        let idx = u32::from_le_bytes([
            randomness[offset % 32],
            randomness[(offset + 1) % 32],
            randomness[(offset + 2) % 32],
            randomness[(offset + 3) % 32]
        ]) as usize % validator_count;
        
        // Only add if not already selected (prevent duplicates)
        if !selected_indices.contains(&idx) {
            selected_indices.push(idx);
            selected.push(config.validator_list[idx]);
        }
        
        attempt = attempt.checked_add(1)
            .ok_or(ErrorCode::ArithmeticOverflow)?;
    }
    
    case.jurors = selected;
    case.state = CaseState::Voting;
'@

$content = $content.Replace($oldCode, $newCode)
Set-Content $selectJurorsPath $content -NoNewline

Write-Host "✅ Updated select_jurors.rs with duplicate prevention and checked arithmetic"

# Update lib.rs to add error codes
$libContent = Get-Content $libPath -Raw

$oldErrors = @'
    #[msg("Nullifier already used - double voting prevented")]
    NullifierAlreadyUsed,
    #[msg("Case already exists")]
    CaseAlreadyExists,
}
'@

$newErrors = @'
    #[msg("Nullifier already used - double voting prevented")]
    NullifierAlreadyUsed,
    #[msg("Case already exists")]
    CaseAlreadyExists,
    #[msg("Juror selection failed after max attempts")]
    JurorSelectionFailed,
    #[msg("Arithmetic overflow detected")]
    ArithmeticOverflow,
}
'@

$libContent = $libContent.Replace($oldErrors, $newErrors)
Set-Content $libPath $libContent -NoNewline

Write-Host "✅ Updated lib.rs with new error codes"
Write-Host "`n🎉 All Priority 2 fixes applied successfully!"
