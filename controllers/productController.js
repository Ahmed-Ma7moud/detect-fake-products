const Product = require('../models/Product');
const Tracking = require("../models/Tracking");
const Batch = require("../models/Batch");


// Get available or sold products for pharmacy and supplier and manufacturer
exports.getProducts = async (req, res) => {
  try {
    let {
      batchNumber,
      medicineName,
      sold,
      page = 1,
      limit = 10
    } = req.query;

    const maxLimit = 30;
    const maxPage = 100;

    // Validate and parse page and limit
    const pageNum = Math.min(maxPage, Math.max(1, parseInt(page)));
    const limitNum = Math.min(maxLimit, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    // Build dynamic query
    const query = {
      owner: req.user.id
    };

    // Only add 'sold' to query if it's exactly "true" or "false"
    if (sold === "true") {
      query.sold = true;
    } else if (sold === "false") {
      query.sold = false;
    }

    // Validate batchNumber format
    if (!/^FC\d{1,}-BA\d{4}$/.test(batchNumber)) {
      return res.status(400).json({ success: false, msg: "Invalid batch number format" });
    }
    query.batchNumber = batchNumber;

    // Case-insensitive medicine name search
    if (medicineName) {
      query.medicineName = { $regex: new RegExp(medicineName, 'i') };
    }

    // Fetch products and count
    const [products, total] = await Promise.all([
      Product.find(query).skip(skip).limit(limitNum).populate('owner', 'tradeName location').select('-__v -_id'),
      Product.countDocuments(query)
    ]);

    res.status(200).json({
      success: true,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum),
      count: products.length,
      products
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, msg: 'Server Error' });
  }
};


// Get a single product by serial number for any user
exports.getProduct = async (req, res) => {
  try {
    const serialNumber = req.params.id;
    if (!serialNumber)
      return res.status(400).json({ success: false, msg: "Invalid serial number" });

    const product = await Product.findOne({ serialNumber });

    if (!product)
      return res.
    status(404).
    json({ success: false, msg: "Product not found"});

    res.status(200).json({ success: true, product });
  } catch (err) {
    res.status(500).json({ success: false, msg: 'Server Error' });
  }
};

// Pharmacy buys a single product from supplier
// This will transfer ownership from supplier to pharmacy
exports.buyProduct = async (req, res) => {
  try {
    const serialNumber = req.params.id;
    const product = await Product.findOne({ serialNumber });
    if (!product)
      return res.status(404).json({ success: false, msg: "Product not found" });

    const seller = product.owner;
    const buyer = req.user.id;
    if (seller.toString() === buyer.toString())
      return res.status(400).json({ success: false, msg: "Cannot transfer to yourself" });

    await Tracking.create({
      serialNumber: product.serialNumber,
      medicineName: product.medicineName,
      owner: buyer,
    });

    await Product.updateOne(
      { serialNumber },
      { owner: buyer, location: req.user.location }
    );

    // update product in the batch
    await Batch.updateOne(
      { "products.serialNumber": serialNumber },
      { $set: { "products.$.sold": true } }
    );

    res.status(200).json({
       success: true,
       msg: "Ownership transferred successfully",
      });
  } catch (err) {
    res.status(500).json({ success: false, msg: err.message });
  }
};

// Sell product from pharmacy to patient
exports.sellProduct = async (req, res) => {
  try {
    const serialNumber = req.params.id;

    const product = await Product.
    findOne({ owner : req.user.id , serialNumber , sold: false });
    if (!product)
      return res.status(404).json({ success: false, msg: "Product not found" });

    await Product.updateOne(
      { serialNumber },
      { sold: true }
    );

    res.status(200).json({ success: true, product });
  } catch (err) {
    res.status(500).json({ success: false, msg: `Server error: ${err.message}` });
  }
};

// Get product history by serial number
exports.productHistory = async (req, res) => {
  try {
    const serialNumber = req.params.id;
    if (!serialNumber)
      return res.status(400).json({ success: false, msg: "Invalid serial number" });

    const trackingDocs = await Tracking.
    find({ serialNumber })
    .populate("owner" , "tradeName role location")
    .select("-__v -_id");

    if (!trackingDocs) {
      return res.status(404).
      json({ success: false, msg: "No history found for this serial number" });
    }

    res.status(200).json({ success: true, history: trackingDocs });
  } catch (err) {
    res.status(500).json({ success: false, msg: `Server error: ${err.message}` });
  }
};

// Get nearest locations based on partial match of location name
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
