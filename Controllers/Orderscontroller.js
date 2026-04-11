// controllers/orderController.js

import Order from "../Models/Order.js";
import Cart from "../Models/Cartmodel.js";
import Product from "../Models/Productmodel.js";


// ======================================================================
// ✅ CREATE ORDER FROM USER CART
// ======================================================================
export const createOrder = async (req, res) => {
  const userId = req.user._id;
  const { paymentMethod, shippingAddress } = req.body;

  try {
    const cart = await Cart.findOne({ userId }).populate("items.productId");

    if (!cart || !Array.isArray(cart.items) || cart.items.length === 0) {
      return res.status(400).json({ success: false, message: "Cart is empty" });
    }

    const validItems = cart.items.filter(item => item.productId);

    if (validItems.length === 0) {
      return res.status(400).json({ success: false, message: "Cart has invalid items" });
    }

    const items = validItems.map(item => ({
      productId: item.productId._id,
      name: item.productId.name,
      price: item.productId.price,
      quantity: item.quantity,
      image: item.productId.image,
    }));

    const totalAmount = items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    const status =
      paymentMethod === "Cash" ? "Pending" : "Awaiting Payment";

    const newOrder = await Order.create({
      userId,
      items,
      totalAmount,
      paymentMethod,
      shippingAddress,
      status,
    });

    cart.items = [];
    await cart.save();

    res.status(201).json({
      success: true,
      message:
        paymentMethod === "Cash"
          ? "Order created! Pay on delivery."
          : "Order created. Proceed to payment.",
      order: newOrder,
    });
  } catch (error) {
    console.error("Create Order Error:", error);
    res.status(500).json({ success: false, message: "Server error", error });
  }
};


// ======================================================================
// ✅ GET ALL ORDERS FOR CURRENT USER
// ======================================================================
export const getUserOrders = async (req, res) => {
  const userId = req.user._id;

  try {
    const orders = await Order.find({ userId }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, orders });
  } catch (error) {
    console.error("Get User Orders Error:", error);
    res.status(500).json({ success: false, message: "Server error", error });
  }
};


// ======================================================================
// ✅ GET SINGLE ORDER BY ID
// ======================================================================
export const getOrderById = async (req, res) => {
  const { orderId } = req.params;

  try {
    const order = await Order.findById(orderId);
    if (!order)
      return res.status(404).json({ success: false, message: "Order not found" });

    res.status(200).json({ success: true, order });
  } catch (error) {
    console.error("Get Order By ID Error:", error);
    res.status(500).json({ success: false, message: "Server error", error });
  }
};


// ======================================================================
// 🚀 FINAL & CORRECT — CHECK PAYMENT STATUS (USED BY POLLING)
// ======================================================================
export const checkPaymentStatus = async (req, res) => {
  try {
    const { checkoutRequestID } = req.params;

    const order = await Order.findOne({ checkoutRequestID });

    if (!order) {
      return res.status(404).json({ paid: false, message: "Order not found" });
    }

    if (order.status === "Completed") {
      return res.json({ paid: true });
    }

    if (order.status === "Failed") {
      return res.json({ paid: false, failed: true });
    }

    return res.json({ paid: false });
  } catch (err) {
    return res.status(500).json({ paid: false, error: err.message });
  }
};


// ======================================================================
// ✅ UPDATE ORDER STATUS (ADMIN)
// ======================================================================
export const updateOrderStatus = async (req, res) => {
  const { orderId } = req.params;
  const { status } = req.body;

  const allowedStatuses = [
    "Pending",
    "Paid",
    "Packaged",
    "Out for Delivery",
    "Delivered",
    "Cancelled",
    "Completed",  // Add completed also
    "Failed",
  ];

  if (!allowedStatuses.includes(status)) {
    return res.status(400).json({ success: false, message: "Invalid status" });
  }

  try {
    const order = await Order.findById(orderId);
    if (!order)
      return res.status(404).json({ success: false, message: "Order not found" });

    order.status = status;
    await order.save();

    res.status(200).json({
      success: true,
      message: `Order status updated to ${status}`,
      order,
    });
  } catch (error) {
    console.error("Update Order Status Error:", error);
    res.status(500).json({ success: false, message: "Server error", error });
  }
};


// ======================================================================
// ✅ GET ALL ORDERS (ADMIN)
// ======================================================================
export const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, orders });
  } catch (error) {
    console.error("Get All Orders Error:", error);
    res.status(500).json({ success: false, message: "Server error", error });
  }
};


// ======================================================================
// ✅ BUY NOW (Direct purchase, no cart needed)
// ======================================================================
export const buyNow = async (req, res) => {
  try {
    const userId = req.user._id;
    const { productId } = req.body;

    if (!productId) {
      return res.status(400).json({ success: false, message: "Product ID required" });
    }

    const theProduct = await Product.findById(productId);

    if (!theProduct) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    return res.json({ success: true, message: "Product found", product: theProduct });
  } catch (error) {
    console.error("Buy Now Error:", error);
    return res.status(500).json({ success: false, message: "Buy now failed" });
  }
};


