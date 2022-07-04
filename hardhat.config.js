const fs = require('fs');
const os = require('os');
const path = require('path');
require("@nomiclabs/hardhat-waffle");
require('hardhat-abi-exporter');

const configPath = path.join(os.homedir(), '.wallet');
if (!fs.existsSync(configPath)) {
    console.log('config file missing, please place it at:', configPath);
    process.exit();
}
const config = JSON.parse(fs.readFileSync(configPath));

// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
task("accounts", "Prints the list of accounts", async (taskArgs, hre) => {
  const accounts = await hre.ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
});

task('balance', 'Prints an account balance')
    .addParam('account', 'the account address')
    .setAction(async ({ account }, hre) => {
        console.log('get balance for account', account);
        await hre.ethers.provider.getBalance(account)
            .then(b => hre.ethers.utils.formatEther(b, 'ether'))
            .then(console.log);
    });

task('send', 'Sends ETH to an account')
    .addParam('to', 'the account to receive ETH')
    .addParam('eth', 'the amount of ETH to send')
    .setAction(async ({ to, eth }, hre) => {
        console.log('to:', to, 'eth:', eth);
        const value = hre.ethers.utils.parseEther(eth);
        console.log(value);
        const [signer] = await hre.ethers.getSigners();
        await signer.sendTransaction({ to, value }).then(tx => tx.wait()).then(r => console.log('sent', r));
    });

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
    networks: {
        hardhat: {
            mining: {
                auto: true,
            },
        },
        arbitrum: {
            url: config.arbitrum,
            accounts: [config.key],
        },
    },
    solidity: {
        version: "0.8.4",
        settings: {
            optimizer: {
                enabled: true,
                runs: 200,
            },
        },
    },
    abiExporter: {
        runOnCompile: true,
        clear: true,
    },
};
