const { expect } = require("chai");
const { ethers, waffle } = require("hardhat");

describe("Pfper", () => {
    it("Should be able to deploy", async () => {
        const Pfper = await ethers.getContractFactory("Pfper");
        const pfper = await Pfper.deploy(100, 200);
        await pfper.deployed();
    });

    it("Should be owned by the deployer", async () => {
        const [account] = await ethers.getSigners();
        const Pfper = await ethers.getContractFactory("Pfper");
        const pfper = await Pfper.deploy(100, 200);
        await pfper.deployed();
        expect(await pfper.owner()).to.equal(account.address);
    });
    
    it("Has the expected name", async () => {
        const Pfper = await ethers.getContractFactory("Pfper");
        const pfper = await Pfper.deploy(100, 200);
        await pfper.deployed();
        expect(await pfper.name()).to.equal("pfper");
        expect(await pfper.symbol()).to.equal("PFPER");
    });

    it("Has the expected cost", async () => {
        const Pfper = await ethers.getContractFactory("Pfper");
        const pfper = await Pfper.deploy(100, 200);
        await pfper.deployed();
        expect(await pfper.getCost()).to.equal(100);
    });

    it("Can update the cost", async () => {
        const Pfper = await ethers.getContractFactory("Pfper");
        const pfper = await Pfper.deploy(100, 200);
        await pfper.deployed();
        expect(await pfper.getCost()).to.equal(100);

        await pfper.setCost(150).then(tx => tx.wait());
        expect(await pfper.getCost()).to.equal(150);
    });

    it("Has the expected fee", async () => {
        const Pfper = await ethers.getContractFactory("Pfper");
        const pfper = await Pfper.deploy(100, 200);
        await pfper.deployed();
        expect(await pfper.getSellerFeeBasisPoints()).to.equal(200);
    });

    it("Can update the fee", async () => {
        const Pfper = await ethers.getContractFactory("Pfper");
        const pfper = await Pfper.deploy(100, 200);
        await pfper.deployed();
        expect(await pfper.getSellerFeeBasisPoints()).to.equal(200);

        await pfper.setSellerFeeBasisPoints(150).then(tx => tx.wait());
        expect(await pfper.getSellerFeeBasisPoints()).to.equal(150);
    });

    it("Can mint a PFP", async () => {
        const [account] = await ethers.getSigners();

        const Pfper = await ethers.getContractFactory("Pfper");
        const pfper = await Pfper.deploy(100, 200);
        await pfper.deployed();

        expect(await pfper.totalSupply()).to.equal(0);

        // mint it
        await pfper.mintPfp('myCID', {
            value: 100,
        }).then(tx => tx.wait());

        expect(await pfper.totalSupply()).to.equal(1);
        expect(await pfper.ownerOf(1)).to.equal(account.address);
        const json = {
            name: 'pfper #1',
            description: `each pfper is drawn by its author.`,
            image: `ipfs://myCID`,
            fee_recipient: account.address.toString().toLowerCase(),
            seller_fee_basis_points: 200,
        };
        expect(await pfper.tokenURI(1).then(uri => JSON.parse(Buffer.from(uri.replace('data:application/json;base64,', ''), 'base64').toString('ascii')))).to.include(json);
        expect(await pfper.balanceOf(account.address)).to.equal(1);

        const provider = waffle.provider;
        expect(await provider.getBalance(pfper.address)).to.equal(100);
    });

    it("Cannot mint with insufficient funds", async () => {
        const Pfper = await ethers.getContractFactory("Pfper");
        const pfper = await Pfper.deploy(100, 200);
        await pfper.deployed();

        expect(await pfper.totalSupply()).to.equal(0);

        await expect(pfper.mintPfp('myCID', {
            value: 99,
        })).to.be.revertedWith('mint payment insufficient');

        expect(await pfper.totalSupply()).to.equal(0);

        const provider = waffle.provider;
        expect(await provider.getBalance(pfper.address)).to.equal(0);
    });

    it("Cannot mint something that has already been minted", async () => {
        const Pfper = await ethers.getContractFactory("Pfper");
        const pfper = await Pfper.deploy(100, 200);
        await pfper.deployed();

        expect(await pfper.totalSupply()).to.equal(0);

        // mint it
        await pfper.mintPfp('myCID', {
            value: 100,
        }).then(tx => tx.wait());

        expect(await pfper.totalSupply()).to.equal(1);

        const provider = waffle.provider;
        expect(await provider.getBalance(pfper.address)).to.equal(100);

        // try to mint again
        await expect(pfper.mintPfp('myCID', {
            value: 100,
        })).to.be.revertedWith('pfp already minted');

        expect(await pfper.totalSupply()).to.equal(1);
        expect(await provider.getBalance(pfper.address)).to.equal(100);
    });

    it("Tracks the original author", async () => {
        const [account] = await ethers.getSigners();

        const Pfper = await ethers.getContractFactory("Pfper");
        const pfper = await Pfper.deploy(100, 200);
        await pfper.deployed();

        expect(await pfper.totalSupply()).to.equal(0);

        // mint it
        await pfper.mintPfp('myCID', {
            value: 100,
        }).then(tx => tx.wait());

        expect(await pfper.authorOf(1)).to.equal(account.address);
    });

    it("Can withdraw mint payments", async () => {
        const provider = waffle.provider;
        const [account] = await ethers.getSigners();

        const Pfper = await ethers.getContractFactory("Pfper");
        const pfper = await Pfper.deploy(100, 200);
        await pfper.deployed();

        // starting balance
        const startingBalance = await provider.getBalance(account.address);
        let gas = ethers.BigNumber.from(0);

        // mint one
        await pfper.mintPfp('myCID1', {
            value: 100,
        }).then(tx => tx.wait()).then(receipt => {
            gas = gas.add(receipt.cumulativeGasUsed.mul(receipt.effectiveGasPrice));
        });

        // mint another
        await pfper.mintPfp('myCID2', {
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

    it("Can enumerate ownership", async () => {
        const provider = waffle.provider;
        const [account1, account2] = await ethers.getSigners();

        const Pfper = await ethers.getContractFactory("Pfper");
        const pfper = await Pfper.deploy(100, 200);
        await pfper.deployed();

        // mint one
        await pfper.mintPfp('myCID1', {
            value: 100,
        }).then(tx => tx.wait());

        // mint from a different account
        await pfper.connect(account2).mintPfp('myCID3', {
            value: 100,
        }).then(tx => tx.wait());

        // mint another
        await pfper.mintPfp('myCID2', {
            value: 100,
        }).then(tx => tx.wait());

        expect(await pfper.totalSupply()).to.equal(3);

        expect(await pfper.balanceOf(account1.address)).to.equal(2);
        expect(await pfper.tokenOfOwnerByIndex(account1.address, 0)).to.equal(1);
        expect(await pfper.tokenOfOwnerByIndex(account1.address, 1)).to.equal(3);

        expect(await pfper.balanceOf(account2.address)).to.equal(1);
        expect(await pfper.tokenOfOwnerByIndex(account2.address, 0)).to.equal(2);
    });
});
