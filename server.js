require("dotenv").config();

const express = require("express");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});

app.use(cors());
app.use(express.json());
app.use(express.static("public"));

// routes
app.use("/api", require("./routes/auth"));
app.use("/api", require("./routes/attendance"));