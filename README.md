# pfper-contract

This is an ERC-721 NFT smart contract that tracks ownership of `pfper` pixelart
images that you draw yourself.

The images themselves are stored in IPFS, and the smart contract stores a reference
to the CID in IPFS. Clients are responsible for fetching the image data from IPFS.

The token metadata is generated on-chain, only the image data is in IPFS. They
are intended to be SVG images.

The contract is enumerable, so you'll be able to see all the tokens that an
address currently owns.

## localhost deployment

```shell
npx hardhat --network localhost run scripts/deploy.js
```

After deployment, the contract address will be printed to the console but
_also_ written to a file called `deployed` ... you can use this file to
read the contract more easily, for instance during verification, but let's
not commit it to the repo.

## arbiscan verification

```shell
npx hardhat --network arbitrum verify --constructor-args scripts/arguments.js $(cat deployed)
```

## hardhat development

Try running some of the following tasks:

```shell
npx hardhat accounts
npx hardhat compile
npx hardhat clean
npx hardhat test
npx hardhat node
node scripts/sample-script.js
npx hardhat help
```
