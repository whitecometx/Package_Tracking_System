import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { PackageTracker } from "../target/types/package_tracker";
import { LAMPORTS_PER_SOL, PublicKey, SystemProgram } from "@solana/web3.js";
import {getMinimumBalanceForRentExemptMint} from "@solana/spl-token";
//import { chai } from "chai";
const { assert } = require('chai');

describe("package_tracker", () => {
  // Configure the client to use the local cluster.
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.PackageTracker as Program<PackageTracker>;
  const packageId = "PKG-12345";

  // Test accounts
  let sender = anchor.web3.Keypair.generate();
  let courier = anchor.web3.Keypair.generate();
  let feeCollector = anchor.web3.Keypair.generate();
  let packagePDA;

  it("airdrop", async () => {

    const connection = provider.connection;
    const airdropAmount = anchor.web3.LAMPORTS_PER_SOL * 10;
    
    const confirmAirdrop = async (pubkey: anchor.web3.PublicKey) => {
      const tx = await connection.requestAirdrop(pubkey, airdropAmount);
      const latestBlockhash = await connection.getLatestBlockhash();
      await connection.confirmTransaction({
        signature: tx,
        ...latestBlockhash
      });
    };

    await Promise.all([
      confirmAirdrop(sender.publicKey),
      confirmAirdrop(courier.publicKey),
    ]);
    const courierBalance = await provider.connection.getBalance(courier.publicKey);
    const senderBalance = await provider.connection.getBalance(sender.publicKey);
    console.log("Sender balance:", senderBalance);
    console.log("Courier balance:", courierBalance);
  });


  it('Creates a package successfully', async () => {
    const [packagePDA] = await PublicKey.findProgramAddressSync(
      [
        Buffer.from("package"),
        Buffer.from(packageId, 'utf8'),
        courier.publicKey.toBuffer()
      ],
      program.programId
    );
    console.log({
      packagePDA: packagePDA.toString()
    })
    const encryptedData = Buffer.from("ENCRYPTED_RECIPIENT_DATA");

    await program.methods.createPackage(
      packageId,
      encryptedData,
      40.7128, // NYC lat
      -74.0060 // NYC lng
    )
    .accountsPartial({
      sender: sender.publicKey,
      courier: courier.publicKey,
      package: packagePDA,
      systemProgram: SystemProgram.programId
    })
    .signers([sender])
    .rpc();

    // Verify PDA account
    const packageAccount = await program.account.package.fetch(packagePDA);
    console.log({
      sender: sender.publicKey.toString(), 
      courier: courier.publicKey.toString(),
    });
    assert.equal(packageAccount.packageId, packageId);
    assert.isTrue(packageAccount.sender.equals(sender.publicKey));
    assert.isTrue(packageAccount.courierPubkey.equals(courier.publicKey));
    assert.isTrue(packageAccount.status.hasOwnProperty('created'));
    assert.equal(packageAccount.currentLocation.latitude, 40.7128);
    assert.equal(packageAccount.currentLocation.longitude, -74.0060);
    console.log("Package Status:", packageAccount.status);

    
  });

  it('Fails to create duplicate package', async () => {
    try {
      await program.methods.createPackage(
        packageId,
        Buffer.from("DUPLICATE_DATA"),
        0,
        0
      )
      .accountsPartial({
        sender: sender.publicKey,
        courier: courier.publicKey,
        package: packagePDA,
        systemProgram: SystemProgram.programId
      })
      .signers([sender])
      .rpc();
      assert.fail("Should have thrown error");
    } catch (err) {
      assert.include(err.message, "Allocate: account Address");
    }
  });

  it('Updates package status successfully', async () => {
    const initialCourierBalance = await provider.connection.getBalance(courier.publicKey);
    const [packagePDA] = await PublicKey.findProgramAddressSync(
      [
        Buffer.from("package"),
        Buffer.from(packageId, 'utf8'),
        courier.publicKey.toBuffer()
      ],
      program.programId
    );
    console.log({
      packagePDA: packagePDA.toString()
    })
    await program.methods.updatePackageStatus(
      { dispatched: {} }, // New status
      34.0522, // LA lat
      -118.2437 // LA lng
    )
    .accountsPartial({
      courier: courier.publicKey,
      package: packagePDA,
      feeCollector: feeCollector.publicKey,
      systemProgram: SystemProgram.programId,
    })
    .signers([courier])
    .rpc();

    // Verify status update
    const packageAccount = await program.account.package.fetch(packagePDA);
    assert.isTrue(packageAccount.status.hasOwnProperty('dispatched'));
    assert.equal(packageAccount.currentLocation.latitude, 34.0522);
    assert.equal(packageAccount.currentLocation.longitude, -118.2437);
    
    // Verify fee deduction
    const finalCourierBalance = await provider.connection.getBalance(courier.publicKey);
    const feeAmount = 10_000_000; // 0.01 SOL in lamports
    const txFeeBuffer = 5_000; // Additional buffer for transaction fees
    assert.isAtLeast(initialCourierBalance - finalCourierBalance, feeAmount,
      "Courier balance should decrease by at least the fee amount"
    );
    console.log("Initial balance:", initialCourierBalance);
    console.log("Final balance:", finalCourierBalance);
    console.log("Current status of Package is: ", packageAccount.status);

  });

  it('Fails unauthorized status update', async () => {
    const fakeCourier = anchor.web3.Keypair.generate();
    const [packagePDA] = await PublicKey.findProgramAddressSync(
      [
        Buffer.from("package"),
        Buffer.from(packageId),
        courier.publicKey.toBuffer() // Use real courier's key
      ],
      program.programId
    );
  
    try {
      await program.methods.updatePackageStatus(
        { inTransit: {} },
        0,
        0
      )
      .accountsPartial({
        courier: fakeCourier.publicKey,
        package: packagePDA,
        feeCollector: feeCollector.publicKey,
        systemProgram: SystemProgram.programId
      })
      .signers([fakeCourier])
      .rpc();
      assert.fail("Should have thrown error");
    } catch (err) {
      assert.include(err.message, "UnauthorizedCourier");
    }
  });

  it('Fails invalid status transition', async () => {
    try {
      const [packagePDA] = await PublicKey.findProgramAddressSync(
        [
          Buffer.from("package"),
          Buffer.from(packageId),
          courier.publicKey.toBuffer()
        ],
        program.programId
      );
    
      // Attempt invalid transition: Dispatched → Delivered
      await program.methods.updatePackageStatus(
        { delivered: {} },
        0,
        0
      )
      .accountsPartial({
        courier: courier.publicKey,
        package: packagePDA,
        feeCollector: feeCollector.publicKey,
        systemProgram: SystemProgram.programId
      })
      .signers([courier])
      .rpc();
      assert.fail("Should have thrown error");
    } catch (err) {
      assert.include(err.message, "InvalidStatusTransition");
    }
  });

  it('Fails invalid geolocation', async () => {
    try {
      const [packagePDA] = await PublicKey.findProgramAddressSync(
        [
          Buffer.from("package"),
          Buffer.from(packageId),
          courier.publicKey.toBuffer() // Use real courier's key
        ],
        program.programId
      );
    
      await program.methods.updatePackageStatus(
        { inTransit: {} },
        100.0, // Invalid latitude
        0
      )
      .accountsPartial({
        courier: courier.publicKey,
        package: packagePDA,
        feeCollector: feeCollector.publicKey,
        systemProgram: SystemProgram.programId
      })
      .signers([courier])
      .rpc();
      assert.fail("Should have thrown error");
    } catch (err) {
      assert.include(err.message, "InvalidGeoPoint");
    }
  });
});