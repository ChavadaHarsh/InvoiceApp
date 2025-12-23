const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/auth.routes");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/companies", require("./routes/company.routes"));
app.use("/api/categories", require("./routes/category.routes"));
app.use("/api/units", require("./routes/unit.routes"));
app.use("/api/products", require("./routes/product.routes"));
app.use("/api/parties", require("./routes/party.routes"));
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});
