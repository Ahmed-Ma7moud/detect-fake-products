// controllers/productController.js
const Product = require('../models/Product');
const Order = require('../models/Order');
const User = require('../models/User');
const contractController = require("../controllers/contractController")
exports.addProduct = async (req,res) => {
  try{
    const {name , price , serial_number , batch_number , tradeName} = req.body;

    if(!name || !price || !serial_number || !batch_number)
      return res.status(400).json({success : false , msg : "missing Data"})

    // check uniqueness of serial number
    const exist = await Product.findOne({serial_number});
    if(exist)
      return res.status(400).json({success : false , msg : "duplicate serial number"})

    // get the manufucturer data
    const product_data = {
      manufacturerAddress: req.user.address,
      manufacturerLocation: req.user.location,
      serialNumber:serial_number,
      batchNumber:batch_number,
      productName: name,
      tradeName : req.user.tradeName
    };

    const response = await contractController.registerProduct(product_data);
    const product = await Product.create({
      name ,
      price , 
      serial_number , 
      batch_number,
      owner:req.user.address,
      location:req.user.location,
      txHash:response.transactionHash,
      block_number:response.blockNumber
    })
    res.status(201).json({success : true , product});

  }catch (err) {
    res.status(500).json({ error: err.message });
  }
}
// Get all products
exports.getProducts = async (req, res) => {
  try {
    const products = await Product.find({owner: req.user.address});
      res.status(200).json({
      success: true,
      count: products.length,
      products
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

// Get single product
exports.getProduct = async (req, res) => {
  try {
    const serial_number = req.params.id
    if(!serial_number || serial_number == "")
      return res.status(400).json({success : false , msg : "invalid serial number"});

    const product = await Product.findOne({serial_number});
    if(!product)
      return res.status(400).json({success : false , msg : "invalid serial number"});

    res.status(200).json({
      success: true,
      product
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

// for supplier to receive a batch of products 
exports.receiveBatch = async (req, res) => {
  try {
    const batch_number = req.params.id;

    if (!batch_number)
      return res.status(400).json({ success: false, msg: "Invalid batch number" });

    const products = await Product.find({ batch_number });

    if (!products.length)
      return res.status(400).json({ success: false, msg: "No products found for this batch number" });


    for (const product of products) {
      const data = {
        previousOwnerAddress: product.owner,
        newOwnerAddress: req.user.address,
        newLocation: req.user.location,
        productSerialNumber: product.serial_number,
        tradeName:req.user.tradeName,
        role : req.user.role
      };
    
      const response = await contractController.transferOwnership(data);
    
      product.txHash = response.txhash;
      product.owner = req.user.address;
      product.location = req.user.location;
      await product.save();
    }
    
    return res.status(200).json({ success: true, msg: "Ownership transferred successfully" });
  } catch (error) {
    return res.status(500).json({ success: false, msg: error.message });
  }
};

// for pharmacy to buy
exports.buyProduct = async (req, res) => {
  try {
    const serial_number = req.params.id;

    if (!serial_number)
      return res.status(400).json({ success: false, msg: "Invalid batch number" });

    const product = await Product.findOne({ serial_number });

    if (!product)
      return res.status(400).json({ success: false, msg: "invalid serial number" });

      const data = {
        previousOwnerAddress: product.owner,
        newOwnerAddress: req.user.address,
        newLocation: req.user.location,
        productSerialNumber: product.serial_number,
        tradeName : req.user.tradeName,
        role : req.user.role
      };
    
      const response = await contractController.transferOwnership(data);
    
      product.txHash = response.txhash;
      product.owner = req.user.address;
      product.location = req.user.location;
      await product.save();

    return res.status(200).json({ success: true, msg: "Ownership transferred successfully" });
  } catch (error) {
    return res.status(500).json({ success: false, msg: error.message });
  }
};

//sell product from pharmacy to patient 
exports.sellProduct = async function (req , res , next) {
  try{
    const serial_number = req.params.id;
    if(!serial_number || serial_number == "")
      return res.status(400).json({success :false , msg : "invalid serial number"});

    //check the product
    const product = await Product.findOne({serial_number})
    if(!product)
      return res.status(400).json({success :false , msg : "invalid serial number"});

    if(product.sold == true)
      return res.status(400).json({success :false , msg : "this product is already sold to another patient"});

    // change status of product to sold
    product.sold = true;
    await product.save();

  
    res.status(201).json({success : true , product})
  }catch(error){
    res.status(500).json({success : false , msg : `server error : ${error.message}`})
  }
}