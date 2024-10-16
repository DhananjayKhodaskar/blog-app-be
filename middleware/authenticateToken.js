const jwt = require("jsonwebtoken");

// Middleware function to authenticate JWT tokens in incoming requests
const authenticateToken = (req, res, next) => {
  const token = req.header("Authorization")?.split(" ")[1];

  if (!token) return res.status(403).json({ error: "Access denied" });

  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET); // Verify the token
    req.user = verified; // Attach user info to the request
    next();
  } catch (error) {
    res.status(401).json({ error: "Invalid token" }); // Handle invalid token
  }
};

module.exports = authenticateToken;
