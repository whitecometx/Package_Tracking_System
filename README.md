# SolTrack - Solana Package Tracker

A decentralized package tracking system built on Solana using Anchor. This program allows users to create packages, update their delivery status, and enforce business logic for valid status transitions while handling fees and security.

## Features

- **Package Lifecycle Management**: Create packages with encrypted recipient data and track      status transitions (Created, Dispatched, InTransit, etc.).
- **Fee Mechanism**: 
  - Senders pay creation fees
  - Couriers pay update fees
  - Configurable fees via GlobalConfig PDA
- **Geolocation Validation**: Ensure package locations are within valid latitude/longitude ranges
- **Role-Based Access Control**:
  - Only authorized couriers can update packages
  - Admin-controlled global configuration
- **Event System**: Emit on-chain events for package creation and status updates
- **Comprehensive Testing**: 10+ test cases covering edge cases and security scenarios

## Tech Stack

- **Anchor Framework** v0.29.0
- **Solana Tool Suite** 1.16.x
- **TypeScript** for client interactions
- **Mocha/Chai** for testing

## Installation

### Prerequisites
- Solana CLI 1.16+
- Anchor 0.29+
- Node.js 18+
- Rust 1.72+

# Clone repository
git clone https://github.com/yourusername/package-tracker.git
cd package-tracker

# Install dependencies
npm install
yarn install

# Build program
anchor build

# Start local validator
anchor localnet

## Usage

### Initialize Global Configuration

const [globalConfigPDA] = await PublicKey.findProgramAddressSync(
  [Buffer.from("global_config")],
  program.programId
);

await program.methods.initializeConfig(
  feeCollector.publicKey,
  new anchor.BN(5_000_000), // 0.005 SOL creation fee
  new anchor.BN(5_000_000) // 0.005 SOL update fee
).accounts({
  admin: admin.publicKey,
  globalConfig: globalConfigPDA,
  systemProgram: SystemProgram.programId,
}).rpc();


### Create a Package

const [packagePDA] = await PublicKey.findProgramAddressSync(
  [
    Buffer.from("package"),
    Buffer.from("PKG-12345"),
    courier.publicKey.toBuffer()
  ],
  program.programId
);

await program.methods.createPackage(
  "PKG-12345",
  Buffer.from("ENCRYPTED_DATA"),
  40.7128,
  -74.0060
).accounts({
  sender: sender.publicKey,
  courier: courier.publicKey,
  package: packagePDA,
  feeCollector: feeCollector.publicKey,
  globalConfig: globalConfigPDA,
  systemProgram: SystemProgram.programId,
}).rpc();


### Update Package Status

await program.methods.updatePackageStatus(
  { dispatched: {} }, 
  34.0522, 
  -118.2437
).accounts({
  courier: courier.publicKey,
  package: packagePDA,
  feeCollector: feeCollector.publicKey,
  globalConfig: globalConfigPDA,
  systemProgram: SystemProgram.programId,
}).rpc();

## Testing

anchor test --skip-local-validator


### Test Cases
1. Create wallet addresses and Airdrop 
2. Global config initialization
3. Package creation with valid geolocation
4. Duplicate package prevention
5. Insufficient funds handling
6. Unauthorized status updates
7. Invalid status transitions
8. Invalid geolocation updates
9. Fee collector validation
10. Role-based access control

## Program Structure
/programs/package_tracker
├── src
│   ├── state
│   │   ├── errors.rs       # Custom error codes
│   │   ├── package.rs      # Package account definition
│   │   ├── global_config.rs # Fee configuration
│   │   ├── events.rs       # Event structures
│   │   └── ...            # Other state components
│   ├── contexts
│   │   ├── create_package.rs # Package creation logic
│   │   └── update_status.rs  # Status update logic
│   └── lib.rs              # Program entry point
/tests
└── package_tracker.ts      # Comprehensive test suite


## Contributors
@whitecometx - Maintainer

## Future Improvements (In Progress)

### Frontend Development
🔐 **Encryption System**
- End-to-end encryption/decryption of recipient details using TweetNaCl.js
- Secure key management for senders and receivers
- Expiring access tokens for package tracking links

📦 **Tracking Portal Features**
- Receiver tracking page with:
  - Real-time status updates
  - Geolocation history map
  - Estimated delivery timeline


👤 **Role-Based Interfaces**
- **Sender Dashboard**
  - Package creation wizard
  - Shipping history
  - Cost analytics
  - Recipient management
  
- **Courier Portal**
  - Batch status updates
  - Location verification system
  - Fee balance monitoring
  - Route optimization tools

🦄 **Wallet Integration**
- Phantom wallet authentication
- SOL fee payments directly from UI
- Transaction history tracking
- Multi-sig support for enterprise senders

### Security Enhancements
- [ ] Third-party security audit (Planned with Certik)
- [ ] Zero-knowledge proofs for sensitive data
- [ ] Hardware wallet support (Ledger/Trezor)

### Program Improvements
- [ ] Historical status tracking PDA
- [ ] Decentralized courier identity verification

