const User = require('../models/User')
const ethers = require('ethers')
exports.generateEthAddress = async () => {
    let newAddress;
    let privateKey; 
  
    while (true) {
      // 1. Generate a random private key
      const wallet = ethers.Wallet.createRandom();
      privateKey = wallet.privateKey;
  
      // 2. Derive the Ethereum address
      newAddress = wallet.address;
  
      // 3. Check if the address exists in the database
      const existingAddress = await User.findOne({ wallet_address: newAddress });
  
      // 4. If the address doesn't exist, break the loop
      if (!existingAddress) {
        break;
      }
    }
    return { privateKey , address: newAddress  };
}