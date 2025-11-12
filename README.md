# SolSafe 🔒

The decentralized juror protocol on Solana.

> SolSafe is the first system to deliver *proof of justice* in crypto:  
> - Scams are detected with on-chain evidence  
> - Cases are judged by staked jurors  
> - Illicit funds are frozen by smart contract  
>  
> No courts. No admins. Just code and community.

## 🚀 Quick Start

### Prerequisites
- Anchor Framework v0.30.1
- Solana CLI
- Node.js v16+
- Rust 1.70+

### Deployment
Ready to deploy? Follow these guides:
- **[Quick Deployment Checklist](./DEPLOYMENT_CHECKLIST.md)** - Step-by-step checklist
- **[Comprehensive Deployment Guide](./DEPLOYMENT.md)** - Detailed instructions

### Development
```bash
# Build the program
cd solsafe-program
anchor build

# Run tests
anchor test

# Deploy to devnet
./scripts/deploy.sh devnet
```

## 📁 Project Structure

```
solsafe/
├── solsafe-program/          # Anchor smart contract
│   ├── programs/
│   │   └── solsafe-program/  # Main program
│   ├── scripts/              # Deployment scripts
│   └── tests/                # Program tests
├── backend/                  # Backend server
├── frontend/                 # React frontend
├── DEPLOYMENT.md             # Deployment guide
└── DEPLOYMENT_CHECKLIST.md   # Deployment checklist
```

## 🔧 Configuration

All fixed issues and ready for deployment:
- ✅ Program compiles successfully
- ✅ All account structures defined with proper space allocation
- ✅ Deployment scripts ready
- ✅ Initialization scripts ready
- ✅ Environment templates provided

See `.env.example` files for configuration options.

## 📖 Documentation

- [Deployment Guide](./DEPLOYMENT.md)
- [Deployment Checklist](./DEPLOYMENT_CHECKLIST.md)

## 🤝 Contributing

Issues and pull requests welcome!

## 📄 License

See [LICENSE](./LICENSE) file for details.
