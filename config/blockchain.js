const { ethers } = require('ethers');

exports.BlockchainConfig = ()=>{
    // Provider setup
    const provider = new ethers.JsonRpcProvider(process.env.GANACHE_URL);

    // Wallet setup with private key
    let privateKey = process.env.GANACHE_PRIVATE_KEY;
    if (!privateKey.startsWith("0x")) {
        privateKey = "0x" + privateKey;
    }
    const wallet = new ethers.Wallet(privateKey,provider);

    // Contract configuration
    const contractAddress = process.env.CONTRACT_ADDRESS;
    const contractABI = require('../build/contracts/MedicalProductTracking.json').abi;

    // Create contract instance
    const contract = new ethers.Contract(contractAddress, contractABI, wallet);
    return contract;
}
