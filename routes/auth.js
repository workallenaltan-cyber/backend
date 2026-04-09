const express = require("express");
const router = express.Router();
const pool = require("../db");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");


// =====================
// ✅ Token Middleware（统一🔥）
// =====================
const authMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || req.headers.Authorization;

    if (!authHeader) {
      return res.status(401).json({
        status: "fail",
        message: "未登录"
      });
    }

    const parts = authHeader.split(" ");

    if (parts.length !== 2 || parts[0] !== "Bearer") {
      return res.status(401).json({
        status: "fail",
        message: "token 格式错误"
      });
    }

    const token = parts[1];

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = decoded;

    next();

  } catch (err) {
    console.error("❌ TOKEN ERROR:", err.message);

    return res.status(401).json({
      status: "fail",
      message: "token 无效或已过期"
    });
  }
};


// =====================
// ✅ 登录 API（最终版🔥）
// =====================
router.post("/login", async (req, res) => {
  try {
    let { employeeId, password } = req.body;

    if (!employeeId || !password) {
      return res.status(400).json({
        status: "fail",
        message: "请输入账号和密码"
      });
    }

    employeeId = employeeId.trim().toUpperCase();

    const result = await pool.query(
      `SELECT u.employee_id, u.employee_name, u.password, c.company_name,u.role
       FROM public.users u
       INNER JOIN public.company c 
       ON u.company_code = c.company_code
       WHERE u.employee_id = $1`,
      [employeeId]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        status: "fail",
        message: "用户不存在"
      });
    }

    const user = result.rows[0];

    const valid = await bcrypt.compare(password, user.password);

    if (!valid) {
      return res.status(401).json({
        status: "fail",
        message: "密码错误"
      });
    }

    if (!process.env.JWT_SECRET) {
      console.error("❌ JWT_SECRET 未设置");
      return res.status(500).json({
        status: "error",
        message: "服务器配置错误"
      });
    }

    const token = jwt.sign(
      {
        id: user.employee_id,
        name: user.employee_name,
        company: user.company_name,
		role: user.role
      },
      process.env.JWT_SECRET,
      { expiresIn: "8h" }
    );

    console.log("✅ 登录成功:", user.employee_id);

    res.json({
      status: "success",
      message: "登录成功",
      token,
      user: {
        employeeId: user.employee_id,
        name: user.employee_name,
        company: user.company_name,
		role: user.role
      }
    });

  } catch (err) {
    console.error("❌ LOGIN ERROR:", err);
    res.status(500).json({
      status: "error",
      message: "服务器错误"
    });
  }
});


// =====================
// ✅ 获取当前用户（用 middleware🔥）
// =====================
router.get("/me", authMiddleware, (req, res) => {
  res.json({
    status: "success",
    user: req.user
  });
});


// =====================
// ✅ 导出
// =====================
module.exports = router;