# Blockchain Integration Guide - useCases Hook

## 🎯 Overview

The `useCases` hook replaces local state management with **direct blockchain queries**. All case data now comes from the Solana blockchain via your deployed smart contract.

---

## 📦 What Was Created

### 1. **useCases Hook** (`frontend/src/hooks/useCases.ts`)
React hook for blockchain interaction with:
- ✅ Fetch all cases from blockchain
- ✅ Fetch specific case by ID
- ✅ Submit new cases
- ✅ Vote on cases
- ✅ Request/select jurors
- ✅ Auto-refresh on wallet connection

### 2. **CasesDashboard Component** (`frontend/src/components/CasesDashboard.tsx`)
Full-featured UI component showing:
- ✅ Real-time case data from blockchain
- ✅ Case status and voting state badges
- ✅ Vote buttons for active cases
- ✅ IPFS evidence links
- ✅ Responsive grid layout
- ✅ Loading and error states

---

## 🚀 Setup Instructions

### Step 1: Generate IDL File

First, build your Solana program to generate the IDL:

```bash
cd solsafe-program
anchor build
```

This creates: `target/idl/solsafe_program.json`

### Step 2: Copy IDL to Frontend

```bash
# Create IDL directory in frontend
mkdir -p frontend/src/idl

# Copy IDL file
cp solsafe-program/target/idl/solsafe_program.json frontend/src/idl/
```

### Step 3: Update useCases.ts

Uncomment the IDL import in `frontend/src/hooks/useCases.ts`:

```typescript
// Change this:
// import IDL from '../idl/solsafe_program.json';

// To this:
import IDL from '../idl/solsafe_program.json';

// And update the program creation:
return new Program(IDL as Idl, PROGRAM_ID, provider);
```

### Step 4: Install Dependencies

```bash
cd frontend
npm install

# Additional required packages
npm install @types/node --save-dev
```

### Step 5: Setup Wallet Provider

Create or update your main App component:

```typescript
// frontend/src/App.tsx
import React, { useMemo } from 'react';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-wallets';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { clusterApiUrl } from '@solana/web3.js';
import CasesDashboard from './components/CasesDashboard';

// Import wallet adapter CSS
import '@solana/wallet-adapter-react-ui/styles.css';

export default function App() {
  // Use devnet (or mainnet-beta for production)
  const network = WalletAdapterNetwork.Devnet;
  const endpoint = useMemo(() => clusterApiUrl(network), [network]);

  // Initialize wallets
  const wallets = useMemo(
    () => [new PhantomWalletAdapter()],
    []
  );

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <CasesDashboard />
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}
```

---

## 💡 Usage Examples

### Basic: Fetch and Display Cases

```typescript
import { useCases } from '../hooks/useCases';

function MyCasesComponent() {
  const { cases, loading, fetchCases } = useCases();

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      {cases.map(c => (
        <div key={c.publicKey.toString()}>
          Case #{c.account.caseId} - 
          Votes: {c.account.votesFor}/{c.account.votesAgainst}
        </div>
      ))}
      <button onClick={fetchCases}>Refresh</button>
    </div>
  );
}
```

### Submit a New Case

```typescript
import { useCases } from '../hooks/useCases';

function SubmitCaseForm() {
  const { submitCase } = useCases();

  const handleSubmit = async () => {
    try {
      const tx = await submitCase(
        1, // caseId
        'https://ipfs.io/ipfs/Qm...', // evidenceUrl
        '7xKXtDnNxGpU9fGxU...' // scamAddress
      );
      console.log('Transaction:', tx);
    } catch (err) {
      console.error(err);
    }
  };

  return <button onClick={handleSubmit}>Submit Case</button>;
}
```

### Vote on a Case

```typescript
import { useCases } from '../hooks/useCases';

function VoteButtons({ caseId }: { caseId: number }) {
  const { voteOnCase } = useCases();

  const handleVote = async (approve: boolean) => {
    try {
      await voteOnCase(caseId, approve);
      alert('Vote submitted!');
    } catch (err: any) {
      if (err.message.includes('AlreadyVoted')) {
        alert('You already voted on this case');
      } else if (err.message.includes('NotJuror')) {
        alert('Only selected jurors can vote');
      } else {
        alert('Vote failed: ' + err.message);
      }
    }
  };

  return (
    <div>
      <button onClick={() => handleVote(true)}>Approve</button>
      <button onClick={() => handleVote(false)}>Reject</button>
    </div>
  );
}
```

### Fetch Specific Case

```typescript
const { fetchCaseById } = useCases();

const caseData = await fetchCaseById(123);
if (caseData) {
  console.log('Case:', caseData.account);
}
```

---

## 🔄 State Management

### Hook Returns

```typescript
const {
  // State
  cases: CaseData[],        // All cases from blockchain
  loading: boolean,          // Fetching state
  error: string | null,      // Error message
  connected: boolean,        // Wallet connection status
  
  // Functions
  fetchCases: () => Promise<CaseData[]>,
  fetchCaseById: (id) => Promise<CaseData | null>,
  submitCase: (id, url, address) => Promise<string>,
  voteOnCase: (id, approve) => Promise<string>,
  requestJurors: (id, vrf) => Promise<string>,
  selectJurors: (id, vrf) => Promise<string>,
  
  // Utils
  program: Program | null,
  publicKey: PublicKey | null,
} = useCases();
```

### Auto-Refresh

Cases automatically refresh when:
- ✅ Wallet connects
- ✅ After submitting a case
- ✅ After voting
- ✅ After selecting jurors

Manual refresh:
```typescript
const { fetchCases } = useCases();
await fetchCases();
```

---

## 🎨 Component Integration

### Replace Old Local State

**Before (Local State):**
```typescript
const [cases, setCases] = useState([]);

const addCase = (newCase) => {
  setCases([...cases, newCase]);
};
```

**After (Blockchain):**
```typescript
const { cases, submitCase } = useCases();

const addCase = async (newCase) => {
  await submitCase(newCase.id, newCase.url, newCase.address);
  // Cases auto-refresh after submission
};
```

### Display Cases from Blockchain

```typescript
import { useCases, formatCaseStatus, formatCaseState } from '../hooks/useCases';

function CasesList() {
  const { cases } = useCases();

  return (
    <div>
      {cases.map(caseData => (
        <div key={caseData.publicKey.toString()}>
          <h3>Case #{caseData.account.caseId}</h3>
          <p>Status: {formatCaseStatus(caseData.account.status)}</p>
          <p>State: {formatCaseState(caseData.account.state)}</p>
          <p>Votes: 👍 {caseData.account.votesFor} 👎 {caseData.account.votesAgainst}</p>
          <a href={caseData.account.evidence}>View Evidence</a>
        </div>
      ))}
    </div>
  );
}
```

---

## 🔐 Error Handling

### Common Errors and Solutions

**1. "Wallet not connected"**
```typescript
const { connected } = useCases();

if (!connected) {
  return <WalletMultiButton />;
}
```

**2. "Program not initialized"**
- Check that IDL is properly imported
- Verify PROGRAM_ID matches deployed program
- Ensure wallet is connected

**3. "AlreadyVoted"**
```typescript
try {
  await voteOnCase(caseId, true);
} catch (err: any) {
  if (err.message.includes('AlreadyVoted')) {
    alert('You already voted on this case');
  }
}
```

**4. "NotJuror"**
Only selected jurors can vote. Check:
```typescript
const caseData = await fetchCaseById(caseId);
const isJuror = caseData.account.jurors.some(
  j => j.equals(publicKey)
);
```

---

## 🧪 Testing

### Test Blockchain Connection

```typescript
import { useCases } from '../hooks/useCases';

function TestComponent() {
  const { program, publicKey, connected } = useCases();

  return (
    <div>
      <p>Connected: {connected ? 'Yes' : 'No'}</p>
      <p>Wallet: {publicKey?.toString() || 'None'}</p>
      <p>Program: {program ? 'Initialized' : 'Not initialized'}</p>
    </div>
  );
}
```

### Mock Data for Development

While testing without a deployed program:

```typescript
// Temporarily return mock data
const mockCases = [
  {
    publicKey: new PublicKey('...'),
    account: {
      caseId: 1,
      scamAddress: new PublicKey('...'),
      evidence: 'https://ipfs.io/ipfs/Qm...',
      votesFor: 2,
      votesAgainst: 1,
      // ...
    }
  }
];
```

---

## 📊 Performance Optimization

### 1. Memoize Program Instance

Already implemented - program only recreates when connection/wallet changes.

### 2. Debounce Refresh

```typescript
import { debounce } from 'lodash';

const debouncedFetch = debounce(fetchCases, 1000);
```

### 3. Pagination for Large Case Lists

```typescript
const fetchCasesWithPagination = async (limit: number, offset: number) => {
  const allCases = await program.account.caseAccount.all();
  return allCases.slice(offset, offset + limit);
};
```

### 4. Cache Cases Locally

```typescript
const [cachedCases, setCachedCases] = useState<CaseData[]>([]);

useEffect(() => {
  if (cases.length > 0) {
    localStorage.setItem('cases', JSON.stringify(cases));
  }
}, [cases]);
```

---

## 🔄 Migration Checklist

- [ ] Build Solana program (`anchor build`)
- [ ] Copy IDL to frontend (`cp target/idl/*.json frontend/src/idl/`)
- [ ] Install dependencies (`npm install`)
- [ ] Update useCases.ts (uncomment IDL import)
- [ ] Setup WalletProvider in App.tsx
- [ ] Replace local state with useCases hook
- [ ] Update components to use blockchain data
- [ ] Test wallet connection
- [ ] Test case fetching
- [ ] Test case submission
- [ ] Test voting functionality
- [ ] Deploy to production

---

## 🎯 Next Steps

1. **Deploy Program to Devnet**
   ```bash
   anchor deploy
   ```

2. **Update PROGRAM_ID**
   ```typescript
   const PROGRAM_ID = new PublicKey('YOUR_DEPLOYED_PROGRAM_ID');
   ```

3. **Test with Real Transactions**
   ```bash
   npm start
   # Connect Phantom wallet (Devnet)
   # Submit a test case
   # Vote as different wallets
   ```

4. **Add Real-time Updates**
   ```typescript
   // Subscribe to account changes
   const subscriptionId = connection.onAccountChange(
     casePda,
     (accountInfo) => {
       console.log('Case updated!');
       fetchCases();
     }
   );
   ```

---

## 📝 Summary

**Benefits of Blockchain Integration:**
- ✅ No centralized database needed
- ✅ Immutable case records
- ✅ Transparent voting
- ✅ Decentralized data storage
- ✅ Cryptographic verification
- ✅ Real-time synchronization

**Hook Features:**
- ✅ Automatic wallet integration
- ✅ Error handling
- ✅ Loading states
- ✅ Auto-refresh
- ✅ TypeScript support

Your SolSafe platform now reads and writes directly to the Solana blockchain! 🚀
