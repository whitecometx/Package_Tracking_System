import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { PackageTracker } from "../target/types/package_tracker";
import { LAMPORTS_PER_SOL, PublicKey, SystemProgram } from "@solana/web3.js";
import {getMinimumBalanceForRentExemptMint} from "@solana/spl-token";
import { assert } from "chai";

describe("package_tracker", () => {
  // Configure the client to use the local cluster.
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const connection = provider.connection;

  const program = anchor.workspace.PackageTracker as Program<PackageTracker>;
  const packageId = "PKG-12345";

  // Test accounts
  let sender = anchor.web3.Keypair.generate();
  let courier = anchor.web3.Keypair.generate();
  let feeCollector = anchor.web3.Keypair.generate();
  let poorSender = anchor.web3.Keypair.generate();
  let admin = anchor.web3.Keypair.generate();
  let packagePDA;
  let globalConfigPDA;

  it("airdrop", async () => {

    const airdropAmount = anchor.web3.LAMPORTS_PER_SOL * 10;
    const airdropAmountPoor = anchor.web3.LAMPORTS_PER_SOL * 0.001;
    
    const confirmAirdrop = async (pubkey: anchor.web3.PublicKey, airdropAmount: number) => {
      const tx = await connection.requestAirdrop(pubkey, airdropAmount);
      const latestBlockhash = await connection.getLatestBlockhash();
      await connection.confirmTransaction({
        signature: tx,
        ...latestBlockhash
      });
    };

    await Promise.all([
      confirmAirdrop(sender.publicKey, airdropAmount),
      confirmAirdrop(courier.publicKey, airdropAmount),
      confirmAirdrop(admin.publicKey, airdropAmount),
      confirmAirdrop(feeCollector.publicKey, airdropAmount),
      confirmAirdrop(poorSender.publicKey, airdropAmountPoor),
    ]);
    /*const courierBalance = await provider.connection.getBalance(courier.publicKey);
    console.log("Courier balance:", courierBalance); // to check balance*/
  });

  it("Initialize Global Config", async () => {
    [globalConfigPDA] = await PublicKey.findProgramAddressSync(
      [
        Buffer.from("config"), 
        admin.publicKey.toBuffer()
      ],
      program.programId
    );
    await program.methods.initializeConfig(
      feeCollector.publicKey, // Fee collector address
      new anchor.BN(10_000_000), // 0.01 SOL creation fee
      new anchor.BN(10_000_000) // 0.01 SOL update fee
    ).accountsPartial({
      admin: admin.publicKey,
      globalConfig: globalConfigPDA,
      systemProgram: SystemProgram.programId,
    })
    .signers([admin])
    .rpc();
    // Verify GlobalConfig
    const globalConfig = await program.account.globalConfig.fetch(globalConfigPDA);
    assert.isTrue(globalConfig.feeCollector.equals(feeCollector.publicKey));
    assert.equal(globalConfig.creationFee.toNumber(), 10_000_000);
    assert.equal(globalConfig.updateFee.toNumber(), 10_000_000);
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
    const senderInitialBalance = await provider.connection.getBalance(sender.publicKey);
    const encryptedData = Buffer.from("ENCRYPTED_RECIPIENT_DATA");
    const globalConfig = await program.account.globalConfig.fetch(globalConfigPDA);
    
    try {
    await program.methods.createPackage(
      packageId,
      encryptedData,
      40.7128, // NYC lat
      -74.0060 // NYC lng
    )
    .accountsPartial({
      sender: sender.publicKey,
      courier: courier.publicKey,
      admin: admin.publicKey,
      feeCollector: globalConfig.feeCollector,
      globalConfig: globalConfigPDA,
      package: packagePDA,
      systemProgram: SystemProgram.programId
    })
    .signers([sender])
    .rpc();

    // Verify PDA account
    const packageAccount = await program.account.package.fetch(packagePDA);
    
    assert.equal(packageAccount.packageId, packageId);
    assert.isTrue(packageAccount.sender.equals(sender.publicKey));
    assert.isTrue(packageAccount.courierPubkey.equals(courier.publicKey));
    assert.isTrue(packageAccount.status.hasOwnProperty('created'));
    assert.equal(packageAccount.currentLocation.latitude, 40.7128);
    assert.equal(packageAccount.currentLocation.longitude, -74.0060);
    
    const senderFinalBalance = await provider.connection.getBalance(sender.publicKey);
    const packageSize = 8 + 50 + 32 + 32 + 1 + 8 + 8 + 16 + 4 + 200;
     // Sum of Package::MAX_SIZE
    const rentExemption = await provider.connection.getMinimumBalanceForRentExemption(packageSize);
  
    // Calculate total expected deduction: creation_fee + rent
    const expectedDeduction = 10_000_000 + rentExemption;
  
    // Assert balance change
    assert.isAtMost(
      senderInitialBalance - senderFinalBalance,
      expectedDeduction + 10_000, // Buffer for transaction fees
      "Sender balance should decrease by creation fee + rent"
    );
  } catch (error) {
    console.error("Error creating package:", error);
    if (error instanceof anchor.web3.SendTransactionError) {
        console.log("Full logs:", error.logs);
    }
    throw error; // Re-throw the error to fail the test
    }
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
      feeCollector: feeCollector.publicKey,
      globalConfig: globalConfigPDA,
      admin: admin.publicKey,
      systemProgram: SystemProgram.programId,
      })
      .signers([sender])
      .rpc();
      assert.fail("Should have thrown error");
    } catch (err) {
      assert.include(err.message, "Allocate: account Address");
    }
  });

    // Test for Insufficient Funds (Sender)
    it("fails to create package if sender has insufficient funds", async () => {
      try{
        // Calculate rent exemption for Package account
        const packageSize = 4 + 10 + 1 + 32 + 32 + 8 + 8 + 16 + 4 + 200; // Match Package::MAX_SIZE
        const rentExemption = await provider.connection.getMinimumBalanceForRentExemption(packageSize);
        // Airdrop enough for rent + tx fee, but NOT creation fee
        const airdropAmount = rentExemption + 10_000; // Rent + small buffer
        const airdropTx = await provider.connection.requestAirdrop(
        poorSender.publicKey,
        airdropAmount
      );
      await provider.connection.confirmTransaction(airdropTx);

      const encryptedData = Buffer.from("ENCRYPTED_RECIPIENT_DATA");
      
        await program.methods.createPackage(
          "PKG-67890",
          encryptedData,
          0,
          0
        )
        .accountsPartial({
          sender: poorSender.publicKey,
          courier: courier.publicKey,
          admin: admin.publicKey,
          feeCollector: feeCollector.publicKey,
          globalConfig: globalConfigPDA,
          package: packagePDA,
          systemProgram: SystemProgram.programId,
        })
        .signers([poorSender])
        .rpc();
        assert.fail("Should have thrown error");
      } catch (err) {
        if (err instanceof anchor.AnchorError) {
          assert.equal(err.error.errorCode.code, "InsufficientFunds");
        } else {
          throw new Error(`Unexpected error: ${err}`);
        }
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
    await program.methods.updatePackageStatus(
      { dispatched: {} }, // New status
      34.0522, // LA lat
      -118.2437 // LA lng
    )
    .accountsPartial({
      courier: courier.publicKey,
      admin: admin.publicKey,
      package: packagePDA,
      feeCollector: feeCollector.publicKey,
      globalConfig: globalConfigPDA,
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
    const updateFee = 5_000_000; // 0.005 SOL in lamports
    assert.isAtLeast(initialCourierBalance - finalCourierBalance, updateFee - 5_000,// Allow small buffer
      "Courier balance should decrease by at least the fee amount"
    );
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
        admin: admin.publicKey,
        package: packagePDA,
        feeCollector: feeCollector.publicKey,
        globalConfig: globalConfigPDA,
        systemProgram: SystemProgram.programId,
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
        admin: admin.publicKey,
        package: packagePDA,
        feeCollector: feeCollector.publicKey, // Invalid collector
        globalConfig: globalConfigPDA,
        systemProgram: SystemProgram.programId,
      })
      .signers([courier])
      .rpc();
      assert.fail("Should have thrown error");
    } catch (err) {
      assert.include(err.message, "InvalidStatusTransition");
    }
  });

  // Test for Invalid Fee Collector
  it("fails to update status with wrong fee collector", async () => {
    const fakeFeeCollector = anchor.web3.Keypair.generate();
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
        courier: courier.publicKey,
        admin: admin.publicKey,
        package: packagePDA,
        feeCollector: fakeFeeCollector.publicKey, // Invalid collector
        globalConfig: globalConfigPDA,
        systemProgram: SystemProgram.programId,
      })
      .signers([courier])
      .rpc();
      assert.fail("Should have thrown error");
    } catch (err) {
      assert.include(err.message, "InvalidFeeCollector");
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
        admin: admin.publicKey,
        package: packagePDA,
        feeCollector: feeCollector.publicKey, // Invalid collector
        globalConfig: globalConfigPDA,
        systemProgram: SystemProgram.programId,
      })
      .signers([courier])
      .rpc();
      assert.fail("Should have thrown error");
    } catch (err) {
      assert.include(err.message, "InvalidGeoPoint");
    }
  });
});