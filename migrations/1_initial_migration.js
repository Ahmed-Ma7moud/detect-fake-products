// to read compiled contract and interact with it 
const productTracking = artifacts.require("MedicalProductTracking");

module.exports = function (deployer) {
    //Deploys the contract to the blockchain.
    deployer.deploy(productTracking);
};
