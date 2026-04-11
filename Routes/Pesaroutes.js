import express from "express";
import { stkPush, mpesaCallback } from "../Controllers/Pesacontroller.js"
import { UserAuth } from "../Middleware/userAuth.js"

const Pesarouter = express.Router();

// Initiate STK Push payment (user must be logged in)
Pesarouter.post("/stkpush", stkPush);

// MPESA Callback endpoint (Daraja will call this)
Pesarouter.post("/callback", mpesaCallback);

export default Pesarouter;
