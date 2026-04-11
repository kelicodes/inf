import axios from "axios";
import moment from "moment";
import dotenv from "dotenv";
dotenv.config();

// Get live Daraja access token
export const getAccessToken = async () => {
  const consumerKey = process.env.MPESA_KEY;
  const consumerSecret = process.env.MPESA_SECRET;
  const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString("base64");

  try {
    const res = await axios.get(
      "https://api.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials",
      { headers: { Authorization: `Basic ${auth}` } }
    );
    return res.data.access_token;
  } catch (err) {
    console.error("Access Token Error:", err.response?.data || err.message);
    throw new Error("Failed to get access token");
  }
};

// STK Push
export const stkPush = async (req, res) => {
  try {
    const { phone, amount } = req.body;

    const accessToken = await getAccessToken(); // dynamic token
    const shortCode = process.env.MPESA_SHORTCODE; // your real till number
    const passkey = process.env.MPESA_PASSKEY;

    const timestamp = moment().format("YYYYMMDDHHmmss");
    const password = Buffer.from(shortCode + passkey + timestamp).toString("base64");

    const data = {
      BusinessShortCode: shortCode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: "CustomerBuyGoodsOnline",
      Amount: amount,
      PartyA: phone,
      PartyB: shortCode,
      PhoneNumber: phone,
      CallBackURL: process.env.MPESA_CALLBACK_URL,
      AccountReference: "Order001",
      TransactionDesc: "Payment for Order 001",
    };

    const response = await axios.post(
      "https://api.safaricom.co.ke/mpesa/stkpush/v1/processrequest",
      data,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    return res.status(200).json({
      success: true,
      CheckoutRequestID: response.data.CheckoutRequestID,
      MerchantRequestID: response.data.MerchantRequestID,
      message: "STK Push sent",
    });

  } catch (err) {
    console.error("STK Error:", err.response?.data || err.message);
    return res.status(500).json({ success: false, error: err.response?.data || err.message });
  }
};

// Callback handler
export const mpesaCallback = async (req, res) => {
  try {
    const callbackData = req.body;

    console.log("========== M-PESA CALLBACK RECEIVED ==========");
    console.log(JSON.stringify(callbackData, null, 2));

    const result = callbackData?.Body?.stkCallback;

    if (!result) return res.status(400).send("Invalid callback");

    const { MerchantRequestID, CheckoutRequestID, ResultCode, ResultDesc, CallbackMetadata } = result;

    if (ResultCode !== 0) {
      console.log("❌ Payment Failed:", ResultDesc);
      return res.status(200).json({ message: "Callback received", status: "failed", MerchantRequestID, CheckoutRequestID, ResultDesc });
    }

    let Amount, MpesaReceiptNumber, TransactionDate, PhoneNumber;
    if (CallbackMetadata && CallbackMetadata.Item) {
      const items = CallbackMetadata.Item;
      Amount = items.find(i => i.Name === "Amount")?.Value;
      MpesaReceiptNumber = items.find(i => i.Name === "MpesaReceiptNumber")?.Value;
      TransactionDate = items.find(i => i.Name === "TransactionDate")?.Value;
      PhoneNumber = items.find(i => i.Name === "PhoneNumber")?.Value;
    }

    console.log("✅ PAYMENT SUCCESS");
    console.log({ Amount, MpesaReceiptNumber, PhoneNumber, TransactionDate });

    res.status(200).json({ ResultCode: 0, ResultDesc: "Success" });
  } catch (err) {
    console.error("Callback Error:", err.message);
    res.status(500).send("Server Error");
  }
};
