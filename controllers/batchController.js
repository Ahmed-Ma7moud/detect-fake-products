const Batch = require("../models/Batch");
const Product = require("../models/Product");
const Order = require("../models/Order");
const Tracking = require("../models/Tracking");
const { v4: uuidv4 } = require('uuid');

exports.addBatch = async (req, res) => {
  try {
    const { medicineName, genericName, price, quantity, productionDate, expirationDate } = req.body;
    if (!medicineName || !genericName || !price || !quantity || !productionDate || !expirationDate)
      return res.status(400).json({ success: false, msg: "Missing data" });

    if (quantity > 1000)
      return res.status(400).json({ success: false, msg: "Max quantity is 1000" });

    const count = await Batch.countDocuments({factory : req.user.id});
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
        factory : req.user.id,
        medicineName, 
        genericName,
        price,
        serialNumber,
        batchNumber,
        owner: req.user.id,
        location: req.user.location,
        productionDate,
        expirationDate
      });
    }

    // any Manufacturer can see his batches and serial numbers
    const batch = await Batch.create({
      factory: req.user.id,
      owner: req.user.id, // owner is the same as factory for now
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
    
    // insert products to product collection
    await Product.insertMany(products);

    // insert tracking for each product
    const trackingDocs = products.map(product => ({
      serialNumber: product.serialNumber,
      medicineName: product.medicineName,
      owner: product.owner
    }));
    await Tracking.insertMany(trackingDocs);

    res.status(201).json({ success: true, batch, msg: "Batch created successfully"});
  } catch (err) {
    res.status(500).json({ success: false, msg: err.message });
  }
};

// Get a batch by its id
exports.getBatchById = async (req, res) => {
  try {
    const batchNumber = req.params.id;
    if (!batchNumber || !/BA\d{4}/.test(batchNumber))
      return res.status(400).json({ message: "Invalid batch number" });

    const batch = await Batch.findOne(
    {
        batchNumber,
        $or: [
        { factory: req.user.id },
        { owner: req.user.id }
        ]
    },
    '-__v -status' // Projection: exclude __v and status fields
    );
    if (!batch)
      return res.status(404).json({ message: "Batch not found" });

    return res.status(200).json({ batch });
  } catch (error) {
    return res.status(500).json({ message: "Failed to get batch" });
  }
};

// Get all batches for manufacturer
exports.getBatches = async(req , res , next) => {
  try{
    let {status} = req.query;
    let query = {};
    if(req.user.role === "supplier")
      query.owner = req.user.id;
    else if(req.user.role === "manufacturer"){
        query.factory = req.user.id;
        if(!status || !['available', 'unavailable', 'sold'].includes(status))
            query.status = "available";
    }

    const batches = await Batch.find(query,("-owner -__v -status"))

    return res.status(200).json({batches})
  } catch(error){
      return res.status(500).json({message : "faild to get batches"})
  } 
}

// Delete a batch and all its products
exports.deleteBatch = async (req , res , next) => {
try{
  const batchNumber = req.params.id;
  if(!batchNumber || !/BA\d{4}/.test(batchNumber))
    return res.status(400).json({message: "Invalid batch number"});
  const batch = await Batch.
  findOneAndDelete({batchNumber , factory : req.user.id , status : "available"});
  if(!batch)
    return res.status(404).json({message: "Batch not found or can not be deleted this batch"});

  //Delete all products in this batch
  await Product.deleteMany({batchNumber});
  
  return res.status(200).json({message : "Batch deleted successfully"});
}catch(error){
  return res.status(500).json({message : "faild to delete batch"})  
}
}

// Receive a batch by its id
exports.receiveBatch = async (req, res) => {
  try {
    const batchNumber = req.params.batch;
    if(!batchNumber || !/BA\d{4}/.test(batchNumber)) {
      return res.status(400).json({ success: false, msg: "Invalid batch number format" });
    }
    // check if batch exists
    const batch = await Batch.findOne({ batchNumber });
    if (!batch) {
      return res.status(400).json({ message: "Invalid batch number" });
    }

    // check if supplier has an order to receive this batch
    const order = await Order.findOne({ supplier: req.user.id, batchNumber, status: 'accepted' });
    if (!order) {
      return res.status(400).json({ success: false, msg: "No order found for this batch" });
    }

    const seller = batch.factory;
    const buyer = req.user.id;
    if (seller.toString() === buyer.toString()) {
      return res.status(400).json({ success: false, msg: "Cannot transfer to yourself" });
    }

    // update owner and location
    await Product.updateMany(
      { batchNumber },
      { $set: { owner: buyer, location: req.user.location } }
    );

    batch.status = "sold"; // mark batch as sold
    await batch.save();

    const products = await Product.find({ batchNumber }).select("serialNumber medicineName owner");

    await Tracking.insertMany(products);

    res.status(200).json({ success: true, msg: "Ownership transferred successfully" });
  } catch (err) {
    res.status(500).json({ success: false, msg: err.message });
  }
};
