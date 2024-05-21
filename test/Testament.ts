import {
    time,
    loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import hre from "hardhat";

describe("Testament", function () {

    async function deployTestament(amount = 1_000_000_000) {
        console.log(amount);
        const [owner, notary, ben1, ben2] = await hre.ethers.getSigners();
        const Testament = await hre.ethers.getContractFactory("Testament");
        const testament = await Testament.deploy(notary, [ben1, ben2], { value: amount });
        return { testament, owner, notary, beneficiaries: [ben1, ben2] };
    }

    describe("Deployment", function () {
        it("Should set the right owner", async function () {
            const [owner] = await hre.ethers.getSigners();
            const { testament } = await deployTestament();
            expect(await testament.owner()).to.equal(owner);
        });
    });

    describe("Withdraw", function () {
        it("Should revert if not the owner", async function () {
            const { testament, notary } = await deployTestament();
            expect(testament.connect(notary).withdraw(2000)).to.be.revertedWith("you should be the owner");
        })

        it("Should revert testament has not enought token", async function () {
            const { testament, owner } = await deployTestament();
            expect(testament.connect(owner).withdraw(1_000_000_001)).to.be.revertedWith("vault has not enough token");
        })

        it("Should not fail", async function () {
            const { testament, owner } = await deployTestament();
            expect(await testament.connect(owner).withdraw(2)).not.to.be.reverted;
            expect(await hre.ethers.provider.getBalance(testament.target)).to.equal(999_999_998);
        })

    })

    describe("OwnerDied", async function () {
        it("Should revert if not the notary", async function () {
            const { testament, owner } = await deployTestament();
            expect(testament.connect(owner).withdraw(2000)).to.be.revertedWith("you should be the notary");
        })

        it("Should not fail", async function () {
            const { testament, notary, beneficiaries: [ben1, ben2] } = await deployTestament();
            let amountBen1 = await hre.ethers.provider.getBalance(ben1);
            let expectedAmount = amountBen1 + hre.ethers.toBigInt(500_000_000);
            expect(await testament.connect(notary).ownerDied()).not.to.be.reverted;
            expect(await hre.ethers.provider.getBalance(testament.target)).to.equal(0);
            expect(await hre.ethers.provider.getBalance(ben1)).to.equal(expectedAmount);
            expect(await hre.ethers.provider.getBalance(ben2)).to.equal(expectedAmount);
        })

        it("Rest of testament going to notary", async function () {
            const { testament, notary, beneficiaries: [ben1, ben2] } = await deployTestament(3);
            let amountBen1 = await hre.ethers.provider.getBalance(ben1);
            let notaryAmount = await hre.ethers.provider.getBalance(notary);
            let expectedAmount = amountBen1 + hre.ethers.toBigInt(1);
            let txResponse = await testament.connect(notary).ownerDied();
            let receipt = await hre.ethers.provider.getTransactionReceipt(txResponse.hash);
            let notaryExpectedAmount = notaryAmount
                - (receipt!.fee)
                + hre.ethers.toBigInt(1);
            expect(txResponse).not.to.be.reverted;
            expect(await hre.ethers.provider.getBalance(notary)).to.equal(notaryExpectedAmount);
            expect(await hre.ethers.provider.getBalance(testament.target)).to.equal(0);
            expect(await hre.ethers.provider.getBalance(ben1)).to.equal(expectedAmount);
            expect(await hre.ethers.provider.getBalance(ben2)).to.equal(expectedAmount);

        })
    })
})