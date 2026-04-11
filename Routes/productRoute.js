import express from "express";
import upload from "../Middleware/Multer.js"; // Cloudinary middleware
import { 
  fetchproduct, 
  fetchproducts, 
  productUpload, 
  removeProduct,
  fetchProductsByCategory 
} from "../Controllers/Productcontroller.js";

const productRouter = express.Router();

// ------------------ Routes ------------------

// Upload product images
productRouter.post(
  "/upload",
  upload.fields([
    { name: "image1", maxCount: 1 },
    { name: "image2", maxCount: 1 },
    { name: "image3", maxCount: 1 },
    { name: "image4", maxCount: 1 },
  ]),
  productUpload
);

// Fetch a single product
productRouter.get("/fetch/:productId", fetchproduct);

// Fetch all products (no Redis caching)
productRouter.get("/fetch", async (req, res) => {
  try {
    const products = await fetchproducts(req, res, true); // true = return data instead of sending response
    res.json({ products });
  } catch (err) {
    console.error("Error fetching products:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// Delete a product
productRouter.delete("/remove/:itemId", removeProduct);

// Fetch products by category
productRouter.get("/category/:cat", fetchProductsByCategory);

export default productRouter;
