const { task } = require("hardhat/config");

require("@nomicfoundation/hardhat-toolbox");
require("@nomiclabs/hardhat-waffle");
require("@nomiclabs/hardhat-etherscan");
require("./tasks/block-number");
require("./tasks/accounts");
require("hardhat-gas-reporter");
require("solidity-coverage");

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
        localhost: {
            url: LOCALHOST_RPC_URL,
            accounts: [LOCALHOST_WALLET_PRIVATE_KEY],
            chainId: 1337,
        },
        Goerli: {
            url: Goerli_RPC_URL,
            accounts: [Goerli_WALLET_PRIVATE_KEY],
            chainId: 5,
        },
    },
    solidity: "0.8.9",
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
};
