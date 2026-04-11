import axios from "axios";
import moment from "moment";
import Order from "../../Models/Order.js";

// ======================== PHONE FORMATTER ========================
const formatPhone = (phone) => {
  let p = phone.toString().trim().replace(/\s+/g, "");
  if (p.startsWith("+")) p = p.slice(1);
  if (p.startsWith("0")) p = "254" + p.slice(1);
  if (p.startsWith("7")) p = "254" + p;
  return p;
};

// ======================== SANDBOX CREDENTIALS =====================
const SANDBOX_KEY = "bn7DuBPRDaqB3Gh7t4AXNEDemOMtY0YjYpfBBHuDprf2tTHz";
const SANDBOX_SECRET = "rqmC5DDDPxBs8yMLokzA52A4NvrSacJyYDW9csilVFLusAlsZzVaUiNnW3otWHey";
const SANDBOX_SHORTCODE = "174379";
const SANDBOX_PASSKEY = "bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919";
const SANDBOX_CALLBACK_URL="https://thegoldfina.onrender.com/pay/callback"
const SANDBOX_ACCOUNT = "36321";

// ======================== ACCESS TOKEN ===========================
export const getAccessToken = async () => {
  const auth = Buffer.from(`${SANDBOX_KEY}:${SANDBOX_SECRET}`).toString("base64");

  try {
    const res = await axios.get(
      "https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials",
      { headers: { Authorization: `Basic ${auth}` } }
    );
    return res.data.access_token;
  } catch (err) {
    console.error("Access Token Error:", err.response?.data || err.message);
    throw new Error("Failed to get access token");
  }
};

// ======================== STK PUSH (SANDBOX) =====================
export const stkPush = async (req, res) => {
  try {
    const { phone, amount } = req.body;

    if (!phone || !amount) {
      return res.status(400).json({ success: false, message: "Phone and amount are required" });
    }

    const phoneFormatted = formatPhone(phone);
    const accessToken = await getAccessToken();

    const timestamp = moment().format("YYYYMMDDHHmmss");
    const password = Buffer.from(SANDBOX_SHORTCODE + SANDBOX_PASSKEY + timestamp).toString("base64");

    const data = {
      BusinessShortCode: SANDBOX_SHORTCODE,
      Password: password,
      Timestamp: timestamp,
      TransactionType: "CustomerPayBillOnline",
      Amount: Number(amount),
      PartyA: phoneFormatted,
      PartyB: SANDBOX_SHORTCODE,
      PhoneNumber: phoneFormatted,
      CallBackURL: SANDBOX_CALLBACK_URL,
      AccountReference: SANDBOX_ACCOUNT,
      TransactionDesc: "Online payment"
    };

    const response = await axios.post(
      "https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest",
      data,
      { headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" } }
    );

    return res.status(200).json({
      success: true,
      CheckoutRequestID: response.data.CheckoutRequestID,
      MerchantRequestID: response.data.MerchantRequestID,
      message: "STK Push sent"
    });

  } catch (err) {
    console.error("STK Push Error:", err.response?.data || err.message);
    return res.status(500).json({ success: false, error: err.response?.data || err.message });
  }
};

// ======================== CALLBACK HANDLER =======================

export const mpesaCallback = async (req, res) => {
  try {
    const result = req.body?.Body?.stkCallback;
    if (!result) return res.status(400).send("Invalid callback");

    const { ResultCode, ResultDesc, CheckoutRequestID } = result;

    // ===== PAYMENT FAILED =====
    if (ResultCode !== 0) {
      await Order.findOneAndUpdate(
        { checkoutRequestID: CheckoutRequestID },
        { status: "Failed" }
      );

      console.log("❌ Payment Failed:", ResultDesc);

      return res.json({ status: "failed" });
    }

    // ===== PAYMENT SUCCESS =====
    const order = await Order.findOne({ checkoutRequestID: CheckoutRequestID });

    if (!order) {
      console.log("Order NOT FOUND for callback");
      return res.status(404).json({ message: "Order not found" });
    }

    order.status = "Completed";
    await order.save();

    console.log(`🎉 Payment success. Order ${order._id} marked as Completed.`);

    // Respond to Safaricom (MUST ALWAYS RETURN THIS)
    res.json({ ResultCode: 0, ResultDesc: "Success" });
  } catch (err) {
    console.error("Callback Error:", err.message);
    res.status(500).send("Server Error");
  }
};
