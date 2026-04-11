import mongoose from "mongoose";

const OrderSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  checkoutRequestID: { type: String, unique: true }, // add this to track M-Pesa payments
  items: [
    {
      productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
      name: String,
      price: Number,
      quantity: { type: Number, default: 1 },
      image: String,
    },
  ],
  totalAmount: { type: Number, required: true },
  status: { type: String, default: "Pending" }, // Pending, Completed, Cancelled, etc.
  paymentMethod: { type: String, default: "MPESA" }, // optional
  shippingAddress: {
    name: { type: String, required: true },
    phone: { type: String, required: true },
    apartment: { type: String },
    doorNumber: { type: String, required: true },
  },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("Order", OrderSchema);
