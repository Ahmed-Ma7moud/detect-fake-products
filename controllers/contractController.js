const User = require('../models/User');
const Contract = require('../models/Contract');
const mongoose = require('mongoose');
exports.makeContract = async (req, res, next) => {
  try {
    const { supplierID, description } = req.body;
    const checkSupplier = await User.findById(supplierID);
    if (!checkSupplier)
      return res.status(400).json({ success: false, msg: "Invalid supplier address" });
    if(checkSupplier.role !== "supplier")
      return res.status(400).json({ success: false, msg: "This user is not a supplier" });
    const newContract = new Contract({
      factory : req.user.id,
      supplier : supplierID,
      description
    });

    await newContract.save();

    res.status(201).json({message: "Contract created successfully", contract: newContract });
  } catch (err) {
    res.status(500).json({ success: false, msg: `Server error: ${err.message}` });
  }
};

// Get the suppliers who have contracts with the factory
exports.getSuppliers = async (req, res, next) => {
  try {
      const suppliers = await Contract.find({ factory : req.user.id , status : 'accepted' })
        .populate('supplier', 'tradeName email location')
        .select('-__v -factory -status');

    res.status(200).json({ success: true, suppliers });
  } catch (err) {
    res.status(500).json({ success: false, msg: `Server error: ${err.message}` });
  }
}

// only for the suppliers
exports.updateContractStatus = async (req, res, next) => {
  try {
    const { id, status } = req.body;
    if (!id || !status)
      return res.status(400).json({ success: false, msg: "Missing contract ID or status" });

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, msg: "Invalid contract ID" });
    }

    const contract = await Contract.findById(id);
    if (!contract)
      return res.status(404).json({ success: false, msg: "Contract not found" });

    if(contract.supplier.toString() !== req.user.id)
      return res.status(403).json({ success: false, msg: "You are not authorized to update this contract" });

    if(contract.status !== 'pending')
        return res.status(400).json({ success: false, msg: "can not update a non-pending contract" });
    const validStatuses = ['pending', 'accepted', 'rejected'];
    if (!validStatuses.includes(status))
      return res.status(400).json({ success: false, msg: "Invalid status" });

    contract.status = status;
    await contract.save();

    res.status(200).json({ success: true, msg: "Contract status updated successfully", contract });
  } catch (err) {
    res.status(500).json({ success: false, msg: `Server error: ${err.message}` });
  }
}
exports.getContractById = async (req, res, next) => {
  try {
    const { id} = req.params;
    if (!id)
      return res.status(400).json({ success: false, msg: "Missing contract ID" });

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, msg: "Invalid contract ID" });
    }

    const contract = await Contract.findById(id)
      .populate('factory', 'tradeName email location')
      .populate('supplier', 'tradeName email location')
      .select('-__v');

    if (!contract)
      return res.status(404).json({ success: false, msg: "Contract not found" });

    res.status(200).json({ success: true, contract });
  } catch (err) {
    res.status(500).json({ success: false, msg: `Server error: ${err.message}` });
  }
};

// get all contracts for the factory and suppliers
exports.getContracts = async (req, res, next) => {
  try {
    let contracts = [];
    if (req.user.role === 'manufacturer') {
      contracts = await Contract.find({ factory: req.user.id })
        .populate('supplier', 'tradeName email location')
        .select('-factory -__v');
    } else if (req.user.role === 'supplier') {
      contracts = await Contract.find({ supplier: req.user.id })
        .populate('factory', 'tradeName email location')
        .select('-supplier -__v');
    }

    res.status(200).json({ success: true, contracts });
  } catch (err) {
    res.status(500).json({ success: false, msg: `Server error: ${err.message}` });
  }
};

// only for the factory
exports.deleteContract = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!id)
      return res.status(400).json({ success: false, msg: "Missing contract ID" });

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, msg: "Invalid contract ID" });
    }

    // Check if the contract belongs to the factory
    const contract = await Contract.findOneAndDelete({_id: new mongoose.Types.ObjectId(id) , factory: req.user.id});
    if (!contract)
      return res.status(404).json({ success: false, msg: "can not delete this contract" });

    res.status(200).json({ success: true, msg: "Contract deleted successfully" });
  } catch (err) {
    res.status(500).json({ success: false, msg: `Server error: ${err.message}` });
  }
}

