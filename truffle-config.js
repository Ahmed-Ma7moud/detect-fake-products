require('dotenv').config();
const { ethers } = require('ethers');
const HDWalletProvider = require('@truffle/hdwallet-provider');

module.exports = {
  // Network configurations
  networks: {
    // Local Ganache Development Network
    development: {
      provider: () => {
        const privateKey = process.env.GANACHE_PRIVATE_KEY;
        const rpcUrl = process.env.GANACHE_RPC_URL || 'http://127.0.0.1:7545';

        if (!privateKey) {
          throw new Error("Missing GANACHE_PRIVATE_KEY in .env");
        }

        return new HDWalletProvider(privateKey, rpcUrl);
      },
      network_id: '*',     // Match any network id
      gas: 5500000,
      confirmations: 0,    // # of confirmations to wait between deployments
      timeoutBlocks: 200,  // # of blocks before a deployment times out
      skipDryRun: true
    },

    // BSC Testnet Configuration
    bscTestnet: {
      provider: () => {
        const privateKey = process.env.BSC_PRIVATE_KEY;
        const rpcUrl = process.env.BSC_RPC_URL || 'https://data-seed-prebsc-1-s1.binance.org:8545/';

        if (!privateKey || !rpcUrl) {
          throw new Error("Missing BSC_PRIVATE_KEY or BSC_RPC_URL in .env");
        }

        return new HDWalletProvider(privateKey, rpcUrl);
      },
      network_id: 97,      // BSC Testnet ID
      confirmations: 5,    // # of confirmations to wait between deployments
      timeoutBlocks: 200,  // # of blocks before a deployment times out
      skipDryRun: true,
      networkCheckTimeout: 10000,
      gas: 5500000,
      gasPrice: 20000000000  // 20 Gwei
    },
  },

  // Compiler configurations
  compilers: {
    solc: {
      version: "0.8.0",   // Exact version matching contract
      settings: {
        optimizer: {
          enabled: true,
          runs: 200         // Optimize for deployment cost
        }
      }
    }
  },

  // Plugin configurations
  plugins: [
    'truffle-plugin-verify'  // Verify contract on block explorers
  ],

  // Etherscan or BSCScan API configuration for contract verification
  api_keys: {
    bscscan: process.env.BSCSCAN_API_KEY
  }
};