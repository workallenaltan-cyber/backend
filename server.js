require("dotenv").config();

const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static("public"));

// routes
app.use("/api", require("./routes/auth"));
app.use("/api", require("./routes/attendance"));

app.listen(3000, () => {
  console.log("Server running on port 3000");
});