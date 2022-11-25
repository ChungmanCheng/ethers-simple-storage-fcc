require("@nomicfoundation/hardhat-toolbox");
require("@nomiclabs/hardhat-waffle");
require("@nomiclabs/hardhat-etherscan");
require("solidity-coverage");
require("hardhat-deploy");

require("dotenv").config();

const LOCALHOST_RPC_URL = process.env.LOCALHOST_RPC_URL;
const LOCALHOST_WALLET_PRIVATE_KEY = process.env.LOCALHOST_WALLET_PRIVATE_KEY;

const Goerli_RPC_URL = process.env.Goerli_RPC_URL;
const Goerli_WALLET_PRIVATE_KEY = process.env.Goerli_WALLET_PRIVATE_KEY;

const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY;

const COINMARKETCAP_API_KEY = process.env.COINMARKETCAP_API_KEY;

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
    defaultNetwork: "hardhat",
    networks: {
        hardhat: {
            chainId: 31337,
        },
        Goerli: {
            url: Goerli_RPC_URL,
            accounts: [Goerli_WALLET_PRIVATE_KEY],
            chainId: 5,
        },
    },
    solidity: {
        compilers: [
            {version: "0.8.9"},
            {version: "0.4.24"}
        ]
    },
    etherscan: {
        apiKey: ETHERSCAN_API_KEY,
    },
    gasReporter: {
        enabled: true,
        outputFile: "gas-report.txt",
        noColors: true,
        currency: "USD",
        coinmarketcap: COINMARKETCAP_API_KEY,
    },
    namedAccounts: {
        deployer: {
            default: 0, // here this will by default take the first account as deployer
            1: 0, // similarly on mainnet it will take the first account as deployer. Note though that depending on how hardhat network are configured, the account 0 on one network can be different than on another
        },
        player: {
            default: 1,
        }
    },
    mocha: {
        timeout: 500000,
    },
};
