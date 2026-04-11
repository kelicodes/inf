import JWT from "jsonwebtoken";

export const UserAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;

  // 1️⃣ No Authorization header at all
  if (!authHeader) {
    return res.status(401).json({
      success: false,
      message: "Login required"
    });
  }

  // 2️⃣ Wrong format
  if (!authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      message: "Invalid auth format"
    });
  }

  const token = authHeader.split(" ")[1];

  // 3️⃣ Token is literally "null" or empty
  if (!token || token === "null") {
    return res.status(401).json({
      success: false,
      message: "Login required"
    });
  }

  try {
    const decoded = JWT.verify(token, process.env.SECRETWORD);
    req.user = { _id: decoded.id };
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: "User login is required"
    });
  }
};

export default UserAuth;
