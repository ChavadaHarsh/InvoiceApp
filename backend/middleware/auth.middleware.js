const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.split(" ")[1];

  if (!token) {
    return res.status(401).json({
      message: "Session expired",
    });
  }

  try {
    const decoded = jwt.verify(token, "GST_APP_SECRET");
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({
      message: "Session expired",
    });
  }
};
