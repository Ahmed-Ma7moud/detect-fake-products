const Product = require('../models/Product');
const Tracking = require("../models/Tracking");
const Batch = require("../models/Batch");
const Order = require('../models/Order');
const { v4: uuidv4 } = require('uuid');

// Add a new batch of products
exports.addBatch = async (req, res) => {
  try {
    const { medicineName, genericName, price, quantity, productionDate, expirationDate } = req.body;
    if (!medicineName || !genericName || !price || !quantity || !productionDate || !expirationDate)
      return res.status(400).json({ success: false, msg: "Missing data" });

    if (quantity > 1000)
      return res.status(400).json({ success: false, msg: "Max quantity is 1000" });

    const count = await Batch.countDocuments({factory : req.user.address});
    if (count + 1 > 9999)
      return res.status(400).json({ success: false, msg: "No more batches can be added" });

    const batchNumber = `BA${(count + 1).toString().padStart(4, '0')}`;

    // Prepare products for bulk insert
    const serialNumbers = [];
    const products = [];
    for (let i = 0; i < quantity; i++) {
      let serialNumber = uuidv4();
      serialNumbers.push(serialNumber);
      products.push({
        medicineName,
        genericName,
        price,
        serialNumber,
        batchNumber,
        owner: req.user.address,
        location: req.user.location,
        productionDate,
        expirationDate
      });
    }
    // insert products to product collection
    await Product.insertMany(products);
    // any Manufacturer can see his batches and serial numbers
    const batch = await Batch.create({
      factory: req.user.address,
      batchNumber,
      medicineName,
      genericName,
      quantity,
      price,
      productionDate,
      expirationDate,
      products: serialNumbers
    });

    if (!batch)
      return res.status(500).json({ success: false, msg: "Failed to create batch" });   
    res.status(201).json({ success: true, batch, msg: "Batch created successfully"});
  } catch (err) {
    res.status(500).json({ success: false, msg: err.message });
  }
};

// Get all products for the current user
exports.getProducts = async (req, res) => {
  try {
    const products = await Product.find({ owner: req.user.address });
    res.status(200).json({
      success: true,
      count: products.length,
      products
    });
  } catch (err) {
    res.status(500).json({ success: false, msg: 'Server Error' });
  }
};

// Get a single product by serial number
exports.getProduct = async (req, res) => {
  try {
    const serialNumber = req.params.id;
    if (!serialNumber)
      return res.status(400).json({ success: false, msg: "Invalid serial number" });

    const product = await Product.findOne({ serialNumber });
    if (!product)
      return res.status(404).json({ success: false, msg: "Product not found" });

    res.status(200).json({ success: true, product });
  } catch (err) {
    res.status(500).json({ success: false, msg: 'Server Error' });
  }
};

// get sold products
exports.getSoldProducts = async (req, res) => {
  try {
    const soldProducts = await Tracking.find({ seller : req.user.address });
    res.status(200).json({
      success: true,
      soldProducts
    });
  } catch (err) {
    res.status(500).json({ success: false, msg: 'Server Error' });
  }
};

// Supplier receives a batch of products
exports.receiveBatch = async (req, res) => {
  try {
    const batchNumber = req.params.batch;
    const batch = await Batch.findOne(batchNumber);
    if(!batch)
      return res.status(400).json({message : "invalid batch number"})

    batch.soldTo = req.user.address
    await batch.save();

    const products = await Product.find({ batchNumber });
    
    const seller = products[0].owner;
    const buyer = req.user.address;
    if (seller === buyer)
      return res.status(400).json({ success: false, msg: "Cannot transfer to yourself" });

    // Bulk update owner and location
    await Product.updateMany(
      { batchNumber },
      { $set: { owner: buyer, location: req.user.location } }
    );

    // Bulk insert tracking records
    const transactions = products.map(product => ({
      seller,
      buyer,
      serialNumber: product.serialNumber,
      productName: product.name
    }));
    await Tracking.insertMany(transactions);

    res.status(200).json({ success: true, msg: "Ownership transferred successfully" });
  } catch (err) {
    res.status(500).json({ success: false, msg: err.message });
  }
};

// Pharmacy buys a single product
exports.buyProduct = async (req, res) => {
  try {
    const serialNumber = req.params.id;
    const product = await Product.findOne({ serialNumber });
    if (!product)
      return res.status(404).json({ success: false, msg: "Product not found" });

    const seller = product.owner;
    const buyer = req.user.address;
    if (seller === buyer)
      return res.status(400).json({ success: false, msg: "Cannot transfer to yourself" });

    await Tracking.create({
      seller,
      buyer,
      serialNumber,
      productName: product.name
    });

    await Product.updateOne(
      { serialNumber },
      { owner: buyer, location: req.user.location }
    );

    res.status(200).json({ success: true, msg: "Ownership transferred successfully" });
  } catch (err) {
    res.status(500).json({ success: false, msg: err.message });
  }
};

// Sell product from pharmacy to patient
exports.sellProduct = async (req, res) => {
  try {
    const serialNumber = req.params.id;

    const product = await Product.findOne({ owner : req.user.address , serialNumber });
    if (!product)
      return res.status(404).json({ success: false, msg: "Product not found" });

    if (product.sold)
      return res.status(400).json({ success: false, msg: "This product is already sold to another patient" });

    await Product.updateOne(
      { serialNumber },
      { sold: true }
    );

    res.status(200).json({ success: true, product });
  } catch (err) {
    res.status(500).json({ success: false, msg: `Server error: ${err.message}` });
  }
};

// Get product transaction history
exports.productHistory = async (req, res) => {
  try {
    const serialNumber = req.params.id;
    if (!serialNumber)
      return res.status(400).json({ success: false, msg: "Invalid serial number" });

    const trackingDocs = await Tracking.find({ serialNumber });
    const isSold = await Product.findOne({serialNumber})
    if (!trackingDocs.length)
      return res.status(404).json({ success: false, msg: "No history found for this serial number" });

    if(!isSold)
      return res.status(200).json({ success: true, history: trackingDocs });

    res.status(200).json({ success: true, sold : true , history: trackingDocs });
  } catch (err) {
    res.status(500).json({ success: false, msg: `Server error: ${err.message}` });
  }
};

exports.getBatches = async(req , res , next) => {
  try{

    const batches = await Batch.find({factory : req.user.address},("-factory"))

    return res.status(200).json({batches})
  } catch(error){
      return res.status(500).json({message : "faild to get batches"})
  } 
}

exports.deleteBatch = async (req , res , next) => {
    const batchNumber = req.body;
    if(!batchNumber || !isHexString(batchNumber))
      return res.status.json({message: "Invalid batch number"})
    await Batch.findOneAndDelete({batchNumber})
    await Product.deleteMany({batchNumber})
    return res.status(200).json({message : "Batch deleted successfully"})
}

exports.getNearestLocations = async (req, res, next) => {
  let { location, limit } = req.query;

  try {
    const regex = new RegExp(location, 'i'); // Case-insensitive partial match

    const products = await Product.find({
      location: { $regex: regex },
      sold: false
    }).limit(Number(limit));

    if (!products.length) {
      return res.status(404).json({ success: false, msg: "No available products in this location" });
    }

    res.status(200).json({ success: true, products });
  } catch (err) {
    res.status(500).json({ success: false, msg: `Server Error: ${err.message}` });
  }
};
