
// synchronous [solidity]
// asynchronous [javascript]

// cooking

// Synchronous
// 1. Put popcorn in microwave -> Promise
// 2. Wait for popcorn to finish
// 3. Pour drinks for everyone

// Asynchronous
// 1. Put popcorn in the microwave
// 2. Pour drinks for everyone
// 3. Wait for popcorn to finish

// Promise
// Pending
// Fulfilled
// Rejected

const ethers = require("ethers");
const fs = require("fs-extra");

async function main() {
    // deploy a contract? Wait for it to be deployed
    // contract.deploy -> wouldn't wait for it to finish
    const provider = new ethers.providers.JsonRpcProvider("http://127.0.0.1:7545");
    const wallet = new ethers.Wallet(
        "c9ea7ca1fe58cc8fbdb975b3ff12acb2151bb639ca9f126c3727db915b719ba5",
        provider
    );
    const abi = fs.readFileSync("./SimpleStorage_sol_SimpleStorage.abi", "utf8");
    const binary = fs.readFileSync("./SimpleStorage_sol_SimpleStorage.bin", "utf-8");

    const contractFactory = new ethers.ContractFactory(abi, binary, wallet);
    console.log("Deploying, please wait...");
    const contract = await contractFactory.deploy(); // STOP here! Wait for contract to deploy
    const transactionReceipt = await contract.deployTransaction.wait(1);
    console.log("Here is the deployment transaction: ");
    console.log(contract.deployTransaction);
    console.log("Here is the transaction receipt: ");
    console.log(transactionReceipt);

}

main()
    .then(() => process.exit(0))
    .catch((e) => {
        console.error(e);
        process.exit(1);
    });
