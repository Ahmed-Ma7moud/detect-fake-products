const Order = require("../models/Order")
const Product = require("../models/Product")
const contractController = require("../controllers/contractController")
exports.confirmation = async (req , res) => {
  try{
    const {serial_number , confirmed} = req.body;
  
    const order = await Order.findOne({serial_number,to:req.user.address})
    if(!order)
        return res.status(400).json({success : false , msg : "you can not confirm this product"})
    if(order.status != "pending")
        return res.status(400).json({success : false , msg : "you can not confirm this product"})
  
    const product = await Product.findOne({serial_number})
    if(!confirmed){
      order.status = "cancelled";
      await order.save();
      product.status = true;
      await product.save();
      return res.status(200).json({success : true , msg : "the order cancelled successfully"})
    }else{
      const data = {
        previousOwnerAddress:order.from,
        newOwnerAddress:order.to,
        newLocation : order.location2,
        productSerialNumber : order.serial_number
    };
      req.data = data;
      const response = await contractController.transferOwnership(data)
      order.status = "success";
      order.tx_hash = response.txhash;
      await order.save();
      //edit product data
      product.owner = order.to;
      product.location = order.location2;
      product.status = true
      await product.save();
  
      return res.status(200).json({success : true , ...response});
    }
  }catch(error){
      return res.status(500).json({ success : false , msg : error.message});
  }
}
exports.getTransactions = async (req , res) => {
  try{
    const transactions = await Order.find({
      $or: [
        { to: req.user.address },
        { from: req.user.address }
      ],
      status: { $in: ['cancelled', 'success'] }
    });

    res.status(200).json({success : true , transactions})
  }catch(error){
    return res.status(500).json({success : true , msg : "server error"})
  }
}
exports.getOrders = async (req , res) => {
  try{
    const orders = await Order.find({
      $and: [
        {
          $or: [
            { to: req.user.address },
            { from: req.user.address }
          ]
        },
        { status: "pending" }
      ]
    });
    res.status(200).json({success : true , orders})
  }catch(error){
    return res.status(500).json({success : true , msg : "server error"})
  }
}
