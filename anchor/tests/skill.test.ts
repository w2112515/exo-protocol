import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { ExoCore } from "../target/types/exo_core";
import { expect } from "chai";
import { createHash } from "crypto";

describe("Skill Registry", () => {
  // Configure the client to use the local cluster
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.ExoCore as Program<ExoCore>;
  const authority = provider.wallet;

  // Helper function to create name hash
  const createNameHash = (name: string): number[] => {
    const hash = createHash("sha256").update(name).digest();
    return Array.from(hash);
  };

  // Helper function to create content hash
  const createContentHash = (content: string): number[] => {
    const hash = createHash("sha256").update(content).digest();
    return Array.from(hash);
  };

  // Derive PDA for skill account
  const deriveSkillPDA = (nameHash: number[]): [anchor.web3.PublicKey, number] => {
    return anchor.web3.PublicKey.findProgramAddressSync(
      [
        Buffer.from("skill"),
        authority.publicKey.toBuffer(),
        Buffer.from(nameHash),
      ],
      program.programId
    );
  };

  describe("register_skill", () => {
    it("should register a new skill", async () => {
      const skillName = "test-skill-1";
      const nameHash = createNameHash(skillName);
      const contentHash = createContentHash("SKILL.md content v1");
      const priceLamports = new anchor.BN(1000000); // 0.001 SOL

      const [skillPDA] = deriveSkillPDA(nameHash);

      await program.methods
        .registerSkill(nameHash, contentHash, priceLamports)
        .accounts({
          authority: authority.publicKey,
          skillAccount: skillPDA,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .rpc();

      // Fetch and verify the skill account
      const skillAccount = await program.account.skillAccount.fetch(skillPDA);

      expect(skillAccount.authority.toBase58()).to.equal(authority.publicKey.toBase58());
      expect(Array.from(skillAccount.contentHash)).to.deep.equal(contentHash);
      expect(skillAccount.priceLamports.toNumber()).to.equal(1000000);
      expect(skillAccount.totalCalls.toNumber()).to.equal(0);
      expect(skillAccount.totalRevenue.toNumber()).to.equal(0);
      expect(skillAccount.version).to.equal(1);
      expect(skillAccount.auditStatus).to.deep.equal({ unverified: {} });
      expect(skillAccount.isDeprecated).to.equal(false);
    });
  });

  describe("update_skill", () => {
    it("should update an existing skill", async () => {
      const skillName = "test-skill-update";
      const nameHash = createNameHash(skillName);
      const contentHash = createContentHash("SKILL.md content v1");
      const priceLamports = new anchor.BN(1000000);

      const [skillPDA] = deriveSkillPDA(nameHash);

      // First register the skill
      await program.methods
        .registerSkill(nameHash, contentHash, priceLamports)
        .accounts({
          authority: authority.publicKey,
          skillAccount: skillPDA,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .rpc();

      // Update the skill
      const newContentHash = createContentHash("SKILL.md content v2");
      const newPrice = new anchor.BN(2000000);

      await program.methods
        .updateSkill(newContentHash, newPrice)
        .accounts({
          authority: authority.publicKey,
          skillAccount: skillPDA,
        })
        .rpc();

      // Verify the update
      const skillAccount = await program.account.skillAccount.fetch(skillPDA);

      expect(Array.from(skillAccount.contentHash)).to.deep.equal(newContentHash);
      expect(skillAccount.priceLamports.toNumber()).to.equal(2000000);
      expect(skillAccount.version).to.equal(2); // Version should be incremented
    });
  });

  describe("deprecate_skill", () => {
    it("should deprecate an existing skill", async () => {
      const skillName = "test-skill-deprecate";
      const nameHash = createNameHash(skillName);
      const contentHash = createContentHash("SKILL.md content");
      const priceLamports = new anchor.BN(1000000);

      const [skillPDA] = deriveSkillPDA(nameHash);

      // First register the skill
      await program.methods
        .registerSkill(nameHash, contentHash, priceLamports)
        .accounts({
          authority: authority.publicKey,
          skillAccount: skillPDA,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .rpc();

      // Deprecate the skill
      await program.methods
        .deprecateSkill()
        .accounts({
          authority: authority.publicKey,
          skillAccount: skillPDA,
        })
        .rpc();

      // Verify the deprecation
      const skillAccount = await program.account.skillAccount.fetch(skillPDA);
      expect(skillAccount.isDeprecated).to.equal(true);
    });

    it("should fail to update a deprecated skill", async () => {
      const skillName = "test-skill-deprecated-update";
      const nameHash = createNameHash(skillName);
      const contentHash = createContentHash("SKILL.md content");
      const priceLamports = new anchor.BN(1000000);

      const [skillPDA] = deriveSkillPDA(nameHash);

      // Register and deprecate
      await program.methods
        .registerSkill(nameHash, contentHash, priceLamports)
        .accounts({
          authority: authority.publicKey,
          skillAccount: skillPDA,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .rpc();

      await program.methods
        .deprecateSkill()
        .accounts({
          authority: authority.publicKey,
          skillAccount: skillPDA,
        })
        .rpc();

      // Try to update - should fail
      const newContentHash = createContentHash("SKILL.md content v2");
      const newPrice = new anchor.BN(2000000);

      try {
        await program.methods
          .updateSkill(newContentHash, newPrice)
          .accounts({
            authority: authority.publicKey,
            skillAccount: skillPDA,
          })
          .rpc();
        expect.fail("Should have thrown an error");
      } catch (error) {
        expect(error).to.exist;
      }
    });
  });
});
