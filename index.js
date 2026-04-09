// =====================
// ✅ 引入
// =====================
const express = require("express");
const pkg = require("pg");
const cors = require("cors");
require("dotenv").config();

const path = require("path");

app.use(express.static(path.join(__dirname, "public")));

const { Pool } = pkg;

// =====================
// ✅ 初始化
// =====================
const app = express();

app.use(cors({
  origin: "*"
}));

app.use(express.json());

// =====================
// ✅ 数据库
// =====================
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// =====================
// ✅ 测试接口
// =====================
app.get("/", (req, res) => {
  res.send("API running 🚀");
});

// =====================
// ✅ 登录路由（重点🔥）
// =====================
const authRoutes = require("./routes/auth");
app.use("/api", authRoutes);

// =====================
// ✅ 引入 token 验证（你缺这个🔥）
// =====================
const authMiddleware = require("./middleware/auth");

// =====================
// ✅ 受保护接口（测试用）
// =====================
app.get("/api/test", authMiddleware, (req, res) => {
  res.json({
    message: "成功",
    user: req.user
  });
});

// =====================
// ✅ 获取考勤（必须带 token🔥）
// =====================
app.get("/api/attendance", authMiddleware, async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM attendance");
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "server error" });
  }
});

// =====================
// ❗ 启动服务器（只能有一个🔥）
// =====================
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});