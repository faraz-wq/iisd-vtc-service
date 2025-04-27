const jwt = require("jsonwebtoken");

const authenticate = (req, res, next) => {
  console.log(req.cookies);
  const token = req.cookies.token; // Extract token from the cookie
  if (!token) return res.status(401).json({ message: 'Access denied' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(400).json({ message: 'Invalid token' });
  }
};

module.exports = authenticate;