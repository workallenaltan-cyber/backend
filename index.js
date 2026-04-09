// =====================
// ✅ 引入
// =====================
const express = require("express");
const pkg = require("pg");
const cors = require("cors");
require("dotenv").config();
const path = require("path");

const { Pool } = pkg;

// =====================
// ✅ 初始化（必须在最前🔥）
// =====================
const app = express();

// =====================
// ✅ 中间件
// =====================
app.use(cors({
  origin: "*"
}));

app.use(express.json());

// ✅ 静态前端（方案3用）🔥
app.use(express.static(path.join(__dirname, "public")));

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
// ✅ 路由
// =====================
const authRoutes = require("./routes/auth");
app.use("/api", authRoutes);

// =====================
// ✅ Token 验证
// =====================
const authMiddleware = require("./middleware/auth");

// =====================
// ✅ 测试保护接口
// =====================
app.get("/api/test", authMiddleware, (req, res) => {
  res.json({
    message: "成功",
    user: req.user
  });
});

// =====================
// ✅ 获取考勤
// =====================
app.get("/api/attendance", authMiddleware, async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM attendance");
    res.json(result.rows);
  } catch (err) {
    console.error("ATTENDANCE ERROR:", err);
    res.status(500).json({ error: "server error" });
  }
});

// =====================
// ✅ 状态 API（你必须有🔥）
// =====================
app.get("/api/status", authMiddleware, async (req, res) => {
  try {
    const employeeId = req.user.id;
    const today = new Date().toLocaleDateString("en-CA");

    const result = await pool.query(
      "SELECT * FROM attendance WHERE employee_id=$1 AND date=$2",
      [employeeId, today]
    );

    if (result.rows.length === 0) {
      return res.json({ status: "not_checked_in" });
    }

    const record = result.rows[0];

    if (record.check_in_time && !record.check_out_time) {
      return res.json({ status: "checked_in" });
    }

    if (record.check_in_time && record.check_out_time) {
      return res.json({ status: "completed" });
    }

    res.json({ status: "not_checked_in" });

  } catch (err) {
    console.error("STATUS ERROR:", err);
    res.status(500).json({ error: "server error" });
  }
});

// =====================
// ❗ 启动服务器（只能一个🔥）
// =====================
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});