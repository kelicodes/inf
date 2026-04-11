import express from "express";
import  UserAuth  from "../Middleware/userAuth.js"
import {
  addToCart,
  removeFromCart,
  getCart,
  increaseQuantity,
  decreaseQuantity,
  clearCart,
  createOrderFromCart,
} from "../Controllers/Cartcontroller.js";

const Cartrouter = express.Router();

Cartrouter.post("/add", UserAuth, addToCart);
Cartrouter.post("/remove", UserAuth, removeFromCart);
Cartrouter.get("/getcart", UserAuth, getCart);
Cartrouter.post("/increase", UserAuth, increaseQuantity);
Cartrouter.post("/decrease", UserAuth, decreaseQuantity);
Cartrouter.post("/clear", UserAuth, clearCart);
Cartrouter.post("/create-order", UserAuth, createOrderFromCart);

export default Cartrouter;
