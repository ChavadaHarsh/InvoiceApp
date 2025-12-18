const jwt = require("jsonwebtoken");

const SECRET = "GST_APP_SECRET";

exports.generateToken = (user) => {
  return jwt.sign({ id: user.id, email: user.email }, SECRET, {
    expiresIn: "7d",
  });
};

exports.verifyToken = (token) => {
  return jwt.verify(token, SECRET);
};
