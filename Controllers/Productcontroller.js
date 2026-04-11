import product from "../Models/Productmodel.js";
import cloudinary from "../Config/Cloud.js";
import fs from "fs";
import mongoose from "mongoose";

// ======= Upload a new product =======
export const productUpload = async (req, res) => {
  try {
    const { name, price, category, desc } = req.body;

    // Validation
    if (!name || !price || !category || !desc) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    const uploadedImages = [];

    // Upload each image to Cloudinary
    for (const key of ["image1", "image2", "image3", "image4"]) {
      if (req.files[key] && req.files[key][0]) {
        const filePath = req.files[key][0].path;

        const result = await cloudinary.uploader.upload(filePath, {
          folder: "products",
        });

        uploadedImages.push(result.secure_url);

        // Remove temp file from server
        fs.unlinkSync(filePath);
      }
    }

    if (uploadedImages.length < 1) {
      return res.status(400).json({
        success: false,
        message: "At least one image is required",
      });
    }

    // Create and save product
    const newProduct = new product({
      name,
      price,
      category,
      desc,
      images: uploadedImages,
    });

    await newProduct.save();

    return res.status(201).json({
      success: true,
      message: "Product uploaded successfully",
      product: newProduct,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Product upload failed",
      error: error.message,
    });
  }
};

// ======= Fetch all products =======
export const fetchproducts = async (req, res) => {
  try {
    const products = await product.find({});
    return res.json({ success: true, message: "Products fetched", products });
  } catch (e) {
    console.error(e);
    return res.json({ success: false, message: "Fetch products failed" });
  }
};

// ======= Fetch single product by ID =======
export const fetchproduct = async (req, res) => {
  try {
    const { productId } = req.params;

    // Validate product ID
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid product ID format" });
    }

    const theproduct = await product.findById(productId);

    if (!theproduct) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }

    return res.json({ success: true, message: "Product fetched", theproduct });
  } catch (e) {
    console.error(e);
    return res.json({ success: false, message: "Fetch product failed" });
  }
};

// ======= Remove product =======
export const removeProduct = async (req, res) => {
  try {
    const { itemId } = req.params;

    // Validate itemId
    if (!mongoose.Types.ObjectId.isValid(itemId)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid product ID format" });
    }

    await product.findByIdAndDelete(itemId);
    return res.json({ success: true, message: "Product removed successfully" });
  } catch (e) {
    console.error(e);
    return res.json({ success: false, message: "Remove product failed" });
  }
};



// ======= Fetch products by category =======
export const fetchProductsByCategory = async (req, res) => {
  try {
    const { cat } = req.params;

    if (!cat) {
      return res.status(400).json({
        success: false,
        message: "Category is required",
      });
    }

    // Find products matching the category (case-insensitive)
    const products = await product.find({
      category: { $regex: new RegExp(cat, "i") }
    });

    if (products.length === 0) {
      return res.json({
        success: true,
        message: "No products found in this category",
        products: [],
      });
    }

    return res.json({
      success: true,
      message: "Products fetched by category",
      products,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Fetch by category failed",
      error: error.message,
    });
  }
};
