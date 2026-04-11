import express from "express";
import UserAuth from "../Middleware/userAuth.js";
import Order from "../Models/Order.js";
import {
  createOrder,
  getUserOrders,
  getOrderById,
  updateOrderStatus,
  getAllOrders,
  checkPaymentStatus
} from "../Controllers/Orderscontroller.js";

const OrderRouter = express.Router();

OrderRouter.get("/check-payment/:checkoutRequestID", UserAuth, checkPaymentStatus);

OrderRouter.post("/create", UserAuth, createOrder);
OrderRouter.get("/userorders", UserAuth, getUserOrders);
OrderRouter.get("/all", UserAuth, getAllOrders);
OrderRouter.get("/:orderId", UserAuth, getOrderById);
OrderRouter.put("/:orderId/status", UserAuth, updateOrderStatus);

// Safaricom callback
OrderRouter.post("/mpesa/callback", async (req, res) => {
  try {
    const data = req.body;
    const checkoutRequestID = data.Body.stkCallback.CheckoutRequestID;
    const resultCode = data.Body.stkCallback.ResultCode;

    const order = await Order.findOne({ checkoutRequestID });
    if (!order) return res.status(404).json({ success: false, message: "Order not found" });

    if (resultCode === 0) {
      order.status = "Completed";
      await order.save();
      console.log(`Order ${order._id} marked as Completed.`);
    } else {
      console.log(`STK push failed for order ${order._id}`);
    }

    res.json({ success: true });
  } catch (err) {
    console.error("MPESA callback error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// PATCH to save CheckoutRequestID
OrderRouter.patch("/update-checkout/:orderId", UserAuth, async (req, res) => {
  try {
    const { orderId } = req.params;
    const { checkoutRequestID } = req.body;

    if (!checkoutRequestID) {
      return res.status(400).json({ success: false, message: "checkoutRequestID is required" });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    order.checkoutRequestID = checkoutRequestID;
    await order.save();

    return res.status(200).json({ success: true, message: "CheckoutRequestID saved", order });
  } catch (err) {
    console.error("PATCH /update-checkout error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

export default OrderRouter;
