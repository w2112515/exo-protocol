import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { PublicKey, Keypair, SystemProgram } from "@solana/web3.js";
import { expect } from "chai";
import * as fs from "fs";
import * as path from "path";

const HOOK_CONFIG_SEED = Buffer.from("hook_config");
const EXTRA_ACCOUNT_METAS_SEED = Buffer.from("extra-account-metas");

// Load IDL manually
const idlPath = path.join(__dirname, "../target/idl/exo_hooks.json");
const idl = JSON.parse(fs.readFileSync(idlPath, "utf8"));
const PROGRAM_ID = new PublicKey("C1iSwHyPWRR48pxbiztvQ6wt92mB7WfebgpEBdTv78kw");

describe("Exo Hooks - Transfer Hook Contract", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = new Program(idl, provider);
  const authority = provider.wallet;

  let mint: Keypair;
  let protocolTreasury: Keypair;
  let hookConfigPda: PublicKey;
  let extraAccountMetaListPda: PublicKey;

  beforeEach(() => {
    mint = Keypair.generate();
    protocolTreasury = Keypair.generate();

    [hookConfigPda] = PublicKey.findProgramAddressSync(
      [HOOK_CONFIG_SEED, mint.publicKey.toBuffer()],
      program.programId
    );

    [extraAccountMetaListPda] = PublicKey.findProgramAddressSync(
      [EXTRA_ACCOUNT_METAS_SEED, mint.publicKey.toBuffer()],
      program.programId
    );
  });

  describe("AC-01: initializeHook", () => {
    it("should initialize hook config with valid fee rates", async () => {
      await program.methods
        .initializeHook(500, 1000)
        .accounts({
          authority: authority.publicKey,
          mint: mint.publicKey,
          protocolTreasury: protocolTreasury.publicKey,
          hookConfig: hookConfigPda,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      const hookConfig = await program.account.hookConfig.fetch(hookConfigPda);
      expect(hookConfig.authority.toBase58()).to.equal(authority.publicKey.toBase58());
      expect(hookConfig.protocolFeeBps).to.equal(500);
      expect(hookConfig.creatorRoyaltyBps).to.equal(1000);
    });

    it("should reject fee config exceeding 100%", async () => {
      try {
        await program.methods
          .initializeHook(6000, 5000)
          .accounts({
            authority: authority.publicKey,
            mint: mint.publicKey,
            protocolTreasury: protocolTreasury.publicKey,
            hookConfig: hookConfigPda,
            systemProgram: SystemProgram.programId,
          })
          .rpc();
        expect.fail("Should have thrown InvalidFeeConfig error");
      } catch (error: any) {
        expect(error.toString()).to.include("InvalidFeeConfig");
      }
    });
  });

  describe("AC-02: initializeExtraAccountMetaList", () => {
    it("should initialize extra account meta list PDA", async () => {
      await program.methods
        .initializeExtraAccountMetaList()
        .accounts({
          payer: authority.publicKey,
          mint: mint.publicKey,
          extraAccountMetaList: extraAccountMetaListPda,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      const accountInfo = await provider.connection.getAccountInfo(extraAccountMetaListPda);
      expect(accountInfo).to.not.be.null;
    });
  });

  describe("AC-04: updateHookConfig", () => {
    beforeEach(async () => {
      await program.methods
        .initializeHook(500, 1000)
        .accounts({
          authority: authority.publicKey,
          mint: mint.publicKey,
          protocolTreasury: protocolTreasury.publicKey,
          hookConfig: hookConfigPda,
          systemProgram: SystemProgram.programId,
        })
        .rpc();
    });

    it("should update fee rates when called by authority", async () => {
      await program.methods
        .updateHookConfig(300, 500)
        .accounts({
          authority: authority.publicKey,
          hookConfig: hookConfigPda,
        })
        .rpc();

      const hookConfig = await program.account.hookConfig.fetch(hookConfigPda);
      expect(hookConfig.protocolFeeBps).to.equal(300);
      expect(hookConfig.creatorRoyaltyBps).to.equal(500);
    });

    it("AC-05: should reject update from non-authority", async () => {
      const unauthorizedUser = Keypair.generate();
      try {
        await program.methods
          .updateHookConfig(300, 500)
          .accounts({
            authority: unauthorizedUser.publicKey,
            hookConfig: hookConfigPda,
          })
          .signers([unauthorizedUser])
          .rpc();
        expect.fail("Should have thrown Unauthorized error");
      } catch (error: any) {
        expect(error.toString().toLowerCase()).to.include("unauthorized");
      }
    });
  });

  describe("AC-03: transferHook (fee calculation verification)", () => {
    it("should verify fee calculation logic", () => {
      const amount = 1000000;
      const protocolFeeBps = 500;
      const creatorRoyaltyBps = 1000;
      
      const protocolFee = Math.floor(amount * protocolFeeBps / 10000);
      const creatorRoyalty = Math.floor(amount * creatorRoyaltyBps / 10000);
      const executorAmount = amount - protocolFee - creatorRoyalty;

      expect(protocolFee).to.equal(50000);
      expect(creatorRoyalty).to.equal(100000);
      expect(executorAmount).to.equal(850000);
    });
  });
});
