require("dotenv").config();

const express = require("express");
const cors = require("cors");

const app = express();

app.post("/api/login", (req, res) => {
  console.log("🔥 login route hit");

  try {
    const { employeeId, password } = req.body;
    console.log("data:", employeeId, password);

    return res.json({ status: "success", token: "abc123" });

  } catch (err) {
    console.error("❌ ERROR:", err);
    res.status(500).json({ error: "server error" });
  }
});

app.use(cors());
app.use(express.json());
app.use(express.static("public"));

// routes
app.use("/api", require("./routes/auth"));
app.use("/api", require("./routes/attendance"));
app.use("/api", require("./routes/admin"));

app.listen(3000, () => {
  console.log("Server running on port 3000");
});

