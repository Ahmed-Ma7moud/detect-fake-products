const Product = require('../models/Product');
const Tracking = require("../models/Tracking");
const Batch = require("../models/Batch");
const { v4: uuidv4 } = require('uuid');

// Add a new batch of products
exports.addBatch = async (req, res) => {
  try {
    const { name, price, quantity, productionDate, expirationDate } = req.body;

    if (!name || !price || !quantity || !productionDate || !expirationDate)
      return res.status(400).json({ success: false, msg: "Missing data" });

    if (quantity > 1000)
      return res.status(400).json({ success: false, msg: "Max quantity is 1000" });

    const count = await Batch.countDocuments({owner : req.user.owner});
    if (count + 1 > 9999)
      return res.status(400).json({ success: false, msg: "No more batches can be added" });

    const batchNumber = `BA${(count + 1).toString().padStart(4, '0')}`;

    // Prepare products for bulk insert
    const serialNumbers = [];
    const products = [];
    for (let i = 0; i < quantity; i++) {
      const serialNumber = uuidv4();
      serialNumbers.push(serialNumber);
      products.push({
        name,
        price,
        serialNumber,
        batchNumber,
        owner: req.user.address,
        location: req.user.location,
        productionDate,
        expirationDate
      });
    }

    await Product.insertMany(products);

    await Batch.create({
      owner: req.user.address,
      batchNumber,
      products: serialNumbers
    });

    res.status(201).json({ success: true, batchNumber, serialNumbers });
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
    const batchNumber = req.params.id;
    if (!batchNumber)
      return res.status(400).json({ success: false, msg: "Invalid batch number" });

    const products = await Product.find({ batchNumber });
    if (!products.length)
      return res.status(404).json({ success: false, msg: "No products found for this batch number" });

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
    if (!serialNumber)
      return res.status(400).json({ success: false, msg: "Invalid serial number" });

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
    if (!serialNumber)
      return res.status(400).json({ success: false, msg: "Invalid serial number" });

    const product = await Product.findOne({ serialNumber });
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
    if (!trackingDocs.length)
      return res.status(404).json({ success: false, msg: "No history found for this serial number" });

    res.status(200).json({ success: true, history: trackingDocs });
  } catch (err) {
    res.status(500).json({ success: false, msg: `Server error: ${err.message}` });
  }
};

exports.getBatches = async(req , res , next) => {
  try{
    const batches = await Batch.find({owner : req.user.owner},("-owner -_id"))
    return res.status(200).json({batches})
  } catch(error){
      return res.status(500).json({message : "faild to get batches"})
  } 
}

exports.getNearestLocations = async (req, res, next) => {
  const { location, limit = 20 } = req.query;

  if (!location) {
    return res.status(400).json({ success: false, msg: "Location is required" });
  }

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
