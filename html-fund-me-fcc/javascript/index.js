
import { ethers } from "./ethers-5.2.esm.min.js";
import { abi, contractAddress } from "./constants.js";

const connectBtn = document.getElementById("connectBtn");
const fundBtn = document.getElementById("fundBtn");
const balanceBtn = document.getElementById("balanceBtn");
const withdrawBtn = document.getElementById("withdrawBtn");

connectBtn.onclick = connect;
fundBtn.onclick = fund;
balanceBtn.onclick = getBalance;
withdrawBtn.onclick = withdraw;

async function connect() {
    if (typeof window.ethereum !== 'undefined'){
        try{
            await window.ethereum.request({method: "eth_requestAccounts"});
            connectBtn.innerHTML = "Connected!";
        } catch (error){
            console.log(error);
        }
    }else{
        connectBtn.innerHTML = "Please install metamask!";
    }
}

async function fund(){
    const ethAmount = document.getElementById("ethAmount").value;
    console.log(`Funding with ${ethAmount}`);
    if (typeof window.ethereum !== 'undefined'){
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();
        const contract = new ethers.Contract(contractAddress, abi, signer);
        try{
            const transactionResponse = await contract.fund({value: ethers.utils.parseEther(ethAmount), })
            await listenForTransactionMine(transactionResponse, provider);
        } catch (error){
            console.log(error);
        }
    }
}

async function getBalance(){
    if (typeof window.ethereum != "undefined"){
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const balance = await provider.getBalance(contractAddress);
        console.log(`Balance: ${ethers.utils.formatEther(balance)}`);
    }
}

async function withdraw(){
    if (typeof window.ethereum != "undefined"){
        console.log("Withdrawing...");
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();
        const contract = new ethers.Contract(contractAddress, abi, signer);
        try{
            const transactionResponse = await contract.withdraw();
            await listenForTransactionMine(transactionResponse, provider);
        } catch (error) {
            console.log(error);
        }
    }
}

function listenForTransactionMine( transactionResponse, provider ){
    console.log(`Mining ${transactionResponse.hash}...`);
    // listen for this transaction to finish
    return new Promise( (resolve, reject) => {
        provider.once(transactionResponse.hash, (transactionReceipt) => {
            console.log(`Completed with ${transactionReceipt.confirmations} confirmations`);
            resolve();
        });
    } )
    
}
