const { expect } = require("chai");
const { ethers, waffle } = require("hardhat");

describe("Pfper", () => {
    it("Should be able to deploy", async () => {
        const Pfper = await ethers.getContractFactory("Pfper");
        const pfper = await Pfper.deploy(100);
        await pfper.deployed();
    });

    it("Should be owned by the deployer", async () => {
        const [account] = await ethers.getSigners();
        const Pfper = await ethers.getContractFactory("Pfper");
        const pfper = await Pfper.deploy(100);
        await pfper.deployed();
        expect(await pfper.owner()).to.equal(account.address);
    });
    
    it("Has the expected name", async () => {
        const Pfper = await ethers.getContractFactory("Pfper");
        const pfper = await Pfper.deploy(100);
        await pfper.deployed();
        expect(await pfper.name()).to.equal("pfper");
        expect(await pfper.symbol()).to.equal("PFPER");
    });

    it("Has the expected cost", async () => {
        const Pfper = await ethers.getContractFactory("Pfper");
        const pfper = await Pfper.deploy(100);
        await pfper.deployed();
        expect(await pfper.getCost()).to.equal(100);
    });

    it("Can update the cost", async () => {
        const Pfper = await ethers.getContractFactory("Pfper");
        const pfper = await Pfper.deploy(100);
        await pfper.deployed();
        expect(await pfper.getCost()).to.equal(100);

        await pfper.setCost(150).then(tx => tx.wait());
        expect(await pfper.getCost()).to.equal(150);
    });

    it("Can mint a PFP", async () => {
        const [account] = await ethers.getSigners();

        const Pfper = await ethers.getContractFactory("Pfper");
        const pfper = await Pfper.deploy(100);
        await pfper.deployed();

        expect(await pfper.tokenSupply()).to.equal(0);

        // mint it
        await pfper.mintPfp('ipfs://myCID/metadata.json', {
            value: 100,
        }).then(tx => tx.wait());

        expect(await pfper.tokenSupply()).to.equal(1);
        expect(await pfper.ownerOf(1)).to.equal(account.address);
        expect(await pfper.tokenURI(1)).to.equal('ipfs://myCID/metadata.json');
        expect(await pfper.balanceOf(account.address)).to.equal(1);

        const provider = waffle.provider;
        expect(await provider.getBalance(pfper.address)).to.equal(100);
    });

    it("Cannot mint with insufficient funds", async () => {
        const Pfper = await ethers.getContractFactory("Pfper");
        const pfper = await Pfper.deploy(100);
        await pfper.deployed();

        expect(await pfper.tokenSupply()).to.equal(0);

        await expect(pfper.mintPfp('ipfs://myCID/metadata.json', {
            value: 99,
        })).to.be.revertedWith('mint payment insufficient');

        expect(await pfper.tokenSupply()).to.equal(0);

        const provider = waffle.provider;
        expect(await provider.getBalance(pfper.address)).to.equal(0);
    });

    it("Cannot mint something that has already been minted", async () => {
        const Pfper = await ethers.getContractFactory("Pfper");
        const pfper = await Pfper.deploy(100);
        await pfper.deployed();

        expect(await pfper.tokenSupply()).to.equal(0);

        // mint it
        await pfper.mintPfp('ipfs://myCID/metadata.json', {
            value: 100,
        }).then(tx => tx.wait());

        expect(await pfper.tokenSupply()).to.equal(1);

        const provider = waffle.provider;
        expect(await provider.getBalance(pfper.address)).to.equal(100);

        // try to mint again
        await expect(pfper.mintPfp('ipfs://myCID/metadata.json', {
            value: 100,
        })).to.be.revertedWith('pfp already minted');

        expect(await pfper.tokenSupply()).to.equal(1);
        expect(await provider.getBalance(pfper.address)).to.equal(100);
    });

    it("Tracks the original author", async () => {
        const [account] = await ethers.getSigners();

        const Pfper = await ethers.getContractFactory("Pfper");
        const pfper = await Pfper.deploy(100);
        await pfper.deployed();

        expect(await pfper.tokenSupply()).to.equal(0);

        // mint it
        await pfper.mintPfp('ipfs://myCID/metadata.json', {
            value: 100,
        }).then(tx => tx.wait());

        expect(await pfper.authorOf(1)).to.equal(account.address);
    });

    it("Can withdraw mint payments", async () => {
        const provider = waffle.provider;
        const [account] = await ethers.getSigners();

        const Pfper = await ethers.getContractFactory("Pfper");
        const pfper = await Pfper.deploy(100);
        await pfper.deployed();

        // starting balance
        const startingBalance = await provider.getBalance(account.address);
        let gas = ethers.BigNumber.from(0);

        // mint one
        await pfper.mintPfp('ipfs://myCID1/metadata.json', {
            value: 100,
        }).then(tx => tx.wait()).then(receipt => {
            gas = gas.add(receipt.cumulativeGasUsed.mul(receipt.effectiveGasPrice));
        });

        // mint another
        await pfper.mintPfp('ipfs://myCID2/metadata.json', {
            value: 100,
        }).then(tx => tx.wait()).then(receipt => {
            gas = gas.add(receipt.cumulativeGasUsed.mul(receipt.effectiveGasPrice));
        });

        const postMintBalance = await provider.getBalance(account.address);
        expect(postMintBalance).to.equal(startingBalance.sub(gas).sub(200));

        expect(await provider.getBalance(pfper.address)).to.equal(200);

        // withdraw
        await pfper.withdraw().then(tx => tx.wait()).then(receipt => {
            gas = gas.add(receipt.cumulativeGasUsed.mul(receipt.effectiveGasPrice));
        });
        const finalBalance = await provider.getBalance(account.address);
        expect(finalBalance).to.equal(startingBalance.sub(gas));
        expect(await provider.getBalance(pfper.address)).to.equal(0);
    });
});
