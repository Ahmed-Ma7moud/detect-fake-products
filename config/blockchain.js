const {Web3} = require("web3");
require("dotenv").config();

const web3 = new Web3(process.env.GANACHE_URL);

const account = web3.eth.accounts.privateKeyToAccount(process.env.GANACHE_PRIVATE_KEY);
web3.eth.accounts.wallet.add(account);
web3.eth.defaultAccount = account.address;

const contractABI = require("../build/contracts/MedicalProductTracking.json").abi; // Access .abi explicitly
const contractAddress = process.env.CONTRACT_ADDRESS;

const smartContract = new web3.eth.Contract(contractABI, contractAddress);

module.exports = {
    smartContract,
    web3
}
