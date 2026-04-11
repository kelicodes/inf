import Cart from "../Models/Cartmodel.js";
import Order from "../Models/Order.js"
import Product from "../Models/Productmodel.js"; // ✅ Make sure product model is imported

// ✅ ADD ITEM TO CART USING productId ONLY
export const addToCart = async (req, res) => {
  const userId = req.user._id;
  const { productId, quantity } = req.body;

  if (!productId) return res.status(400).json({ message: "Product ID missing" });
  if(!quantity) return res.status(400).json({ message: "quantinty missing" });

  try {
    // ✅ Check if product exists
    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ message: "Product not found" });

    let cart = await Cart.findOne({ userId });

    if (cart) {
      const itemIndex = cart.items.findIndex(
        (item) => item.productId.toString() === productId
      );

      if (itemIndex > -1) {
        // ✅ Increase quantity
        cart.items[itemIndex].quantity += quantity || 1;
      } else {
        // ✅ Add new item with only productId + quantity
        cart.items.push({ productId, quantity: quantity || 1 });
      }

      await cart.save();
    } else {
      // ✅ Create a new cart
      cart = await Cart.create({
        userId,
        items: [{ productId, quantity: quantity || 1 }],
      });
    }

    res.status(200).json(cart);

  } catch (error) {
    console.log("error in add to acrt",error)
    res.status(500).json({ message: "Server error", error });
  }
};

// ✅ REMOVE ITEM FROM CART
export const removeFromCart = async (req, res) => {
  const userId = req.user._id;
  const { productId } = req.body;

  if (!productId) return res.status(400).json({ message: "Product ID missing" });

  try {
    const cart = await Cart.findOne({ userId });
    if (!cart) return res.status(404).json({ message: "Cart not found" });

    cart.items = cart.items.filter((item) => item.productId.toString() !== productId);
    await cart.save();

    res.status(200).json(cart);
  } catch (error) {
    console.log(error)
    res.status(500).json({ message: "Server error", error });
  }
};
//get my cart
export const getmyCart = async (req, res) => {
  const userId = req.user._id; // set by verifyToken middleware

  try {
    // Find cart for the user and populate product details
    const cart = await Cart.findOne({ userId }).populate("items.productId");

    if (!cart || cart.items.length === 0) {
      return res.status(200).json({ items: [], message: "Cart is empty" });
    }

    // Transform cart items to include product info
    const items = cart.items.map((item) => ({
      productId: item.productId._id,
      name: item.productId.name,
      price: item.productId.price,
      image: item.productId.image,
      quantity: item.quantity,
    }));

    res.status(200).json({ items });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};



// ✅ GET CART (POPULATE PRODUCT DETAILS)
export const getCart = async (req, res) => {
  const userId = req.user._id;
  console.log("req body",req.body)
  try {
    const cart = await Cart.findOne({ userId }).populate("items.productId");
    if (!cart) return res.status(404).json({ message: "Cart is empty" });

    res.status(200).json(cart);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

// ✅ INCREASE QUANTITY
export const increaseQuantity = async (req, res) => {
  const userId = req.user._id;
  const { productId } = req.body;

  try {
    const cart = await Cart.findOne({ userId });
    if (!cart) return res.status(404).json({ message: "Cart not found" });

    const item = cart.items.find((item) => item.productId.toString() === productId);
    if (!item) return res.status(404).json({ message: "Item not in cart" });

    item.quantity += 1;
    await cart.save();

    res.status(200).json(cart);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

// ✅ DECREASE QUANTITY
export const decreaseQuantity = async (req, res) => {
  const userId = req.user._id;
  const { productId } = req.body;

  try {
    const cart = await Cart.findOne({ userId });
    if (!cart) return res.status(404).json({ message: "Cart not found" });

    const item = cart.items.find((item) => item.productId.toString() === productId);
    if (!item) return res.status(404).json({ message: "Item not in cart" });

    item.quantity -= 1;

    if (item.quantity <= 0) {
      cart.items = cart.items.filter((i) => i.productId.toString() !== productId);
    }

    await cart.save();
    res.status(200).json(cart);

  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

// ✅ CLEAR CART
export const clearCart = async (req, res) => {
  const userId = req.user._id;

  try {
    const cart = await Cart.findOneAndUpdate(
      { userId },
      { items: [] },
      { new: true }
    );

    res.status(200).json({ message: "Cart cleared", cart });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

// ✅ CREATE ORDER FROM CART (FETCH PRICES FROM PRODUCT MODEL)
export const createOrderFromCart = async (req, res) => {
  const userId = req.user._id;

  try {
    const cart = await Cart.findOne({ userId }).populate("items.productId");
    if (!cart || cart.items.length === 0)
      return res.status(400).json({ message: "Cart is empty" });

    const orderItems = cart.items.map((item) => ({
      productId: item.productId._id,
      quantity: item.quantity,
      price: item.productId.price,
      name: item.productId.name,
      image: item.productId.image,
    }));

    const totalAmount = orderItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    const newOrder = await Order.create({
      userId,
      items: orderItems,
      totalAmount,
      status: "Pending",
      createdAt: new Date(),
    });

    cart.items = [];
    await cart.save();

    res.status(200).json({ message: "Order created successfully", order: newOrder });

  } catch (error) {
    console.log(error)
    res.status(500).json({ message: "Server error", error });
  }
};
