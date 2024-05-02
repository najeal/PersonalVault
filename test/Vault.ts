import {
  time,
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import hre from "hardhat";

describe("Vault", function() {

    async function deployVault() {
        const Vault = await hre.ethers.getContractFactory("Vault");
        const vault = await Vault.deploy({value: 1_000_000_000 });
        return vault;
    }

    describe("Deployment", function() {
        it("Should set the right owner", async function() {
            const [owner] = await hre.ethers.getSigners();
            const vault = await deployVault();
            expect(await vault.owner()).to.equal(owner);
        });
    });

    describe("Withdraw", function() {
        it("Should revert if not the owner", async function() {
            const [_, notOwner] = await hre.ethers.getSigners();
            const vault = await deployVault();
            expect(vault.connect(notOwner).withdraw(2000)).to.be.revertedWith("you should be the owner");
        })

        it("Should revert vault has not enought token", async function() {
            const [_, notOwner] = await hre.ethers.getSigners();
            const vault = await deployVault();
            expect(vault.connect(notOwner).withdraw(2000)).to.be.revertedWith("vault has not enough token");
        })

        it("Should not fail", async function() {
            const [owner] = await hre.ethers.getSigners();
            const vault = await deployVault();
            expect(await vault.connect(owner).withdraw(2)).not.to.be.reverted;
            expect(await hre.ethers.provider.getBalance(vault.target)).to.equal(999_999_998);
        })
    })
})