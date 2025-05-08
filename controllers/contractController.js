const { BlockchainConfig } = require('../config/blockchain');
// Get instance of the contract
const contract = BlockchainConfig();

exports.registerProduct = async (data) => {
    try {
      const {
        manufacturerAddress,
        manufacturerLocation,
        serialNumber,
        batchNumber,
        productName
      } = data || {};
  
      // Validate required fields
      if (!manufacturerAddress || !manufacturerLocation || !serialNumber || !batchNumber || !productName) {
        const errorMsg = "Missing required product data fields.";
        if (res && typeof res.status === 'function')
          return res.status(400).json({ message: errorMsg });
        else
          throw new Error(errorMsg);
      }
  
      // Send transaction to smart contract
      const tx = await contract.registerProduct(
        manufacturerAddress,
        manufacturerLocation,
        serialNumber,
        batchNumber,
        productName
      );
  
      console.log("Transaction sent:", tx);
  
      const receipt = await tx.wait(); // Wait for confirmation
  
      const response = {
        success: true,
        message: "Product registered successfully!",
        transactionHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString(),
        from: receipt.from,
        to: receipt.to,
        status: receipt.status ? "Success" : "Failed"
      };
  
      return response;
  
    } catch (error) {
      console.error("faild to add new product to blockchain:", error);
  
      let message = "faild to add new product to blockchain";
      
      if (error?.info?.error?.message) {
        message = error.info.error.message;
      } else if (error?.reason) {
        message = error.reason;
      } else if (error?.message) {
        message = error.message;
      }
  
      throw new Error(message); // Let the caller (your orderController) handle it
    }
};

// contractController.js
exports.transferOwnership = async (data) => {
    const {previousOwnerAddress,
    newOwnerAddress,
    newLocation,
    productSerialNumber
    } = data;
    try {
      const tx = await contract.transferOwnership(
        previousOwnerAddress,
        newOwnerAddress,
        newLocation,
        productSerialNumber
      );
  
      const receipt = await tx.wait();
  
      return {
        success: true,
        txhash: receipt.hash,
        message: "Product ownership transferred successfully!"
      };
  
    } catch (error) {
      console.error("Ownership transfer failed:", error);
  
      let message = "Ownership transfer failed";
      
      if (error?.info?.error?.message) {
        message = error.info.error.message;
      } else if (error?.reason) {
        message = error.reason;
      } else if (error?.message) {
        message = error.message;
      }
  
      throw new Error(message); // Let the caller (your orderController) handle it
    }
};
exports.getProductHistory = async (req, res, next) => {
    try {
        const { serialNumber } = req.params; // Get serialNumber from request params
        const history = await contract.getProductHistory(serialNumber);
        let arrOfHistoryObj = [];
        let tempObj = {};
        for(let i = 0 ; i < history.length ; i++){
          tempObj = {
            owner : history[i][0],
            location : history[i][1],
            time : history[i][2]
          }
          arrOfHistoryObj.push(tempObj)
        }
        res.json({ success: true, history : arrOfHistoryObj});

    } catch (error) {
      console.log("failed to get product history from blockchain:", error);
  
      let message = "failed to get product history from blockchain";
      
      if (error?.info?.error?.message) {
        message = error.info.error.message;
      } else if (error?.reason) {
        message = error.reason;
      } else if (error?.message) {
        message = error.message;
      }
  
      return res.status(500).json({success : false , msg : message})
    }
};

exports.getProductStatus = async (req, res, next) => {
    try {
        const { serialNumber } = req.params; // Get serialNumber from request params
        //receive the last location of the product
        // product will be array of 1
        const product = await contract.getProduct(serialNumber);
        const productObj = {
          owner : product[0] , 
          location : product[1] , 
          time : new Date(parseInt(product[2]) * 1000).toLocaleString(), 
        }
      res.json({ success: true, product : productObj});
    } catch (error) {
      console.log("failed to get product status from blockchain:", error);
  
      let message = "failed to get product status from blockchain";
      
      if (error?.info?.error?.message) {
        message = error.info.error.message;
      } else if (error?.reason) {
        message = error.reason;
      } else if (error?.message) {
        message = error.message;
      }
  
      return res.status(500).json({success : false , msg : message})
    }
};

exports.checkProduct = async (req, res, next) => {
    try {
        const { serialNumber, ownerAddress, location } = req.body; // Get values from request body
        const isValid = await contract.checkProduct(serialNumber, ownerAddress, location);
        res.json({ success: true, isValid, message: isValid ? "Product is valid" : "Product is invalid" });

    } catch (error) {
      console.log("failed to check product from blockchain:", error);
  
      let message = "failed to check product from blockchain";
      
      if (error?.info?.error?.message) {
        message = error.info.error.message;
      } else if (error?.reason) {
        message = error.reason;
      } else if (error?.message) {
        message = error.message;
      }
  
      return res.status(500).json({success : false , msg : message})
    }
};
