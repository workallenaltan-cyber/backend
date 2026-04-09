const express = require("express");
const router = express.Router();
const pool = require("../db");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");


// =====================
// ✅ 登录 API（最终版🔥）
// =====================
router.post("/login", async (req, res) => {
  try {
    let { employeeId, password } = req.body;

    // ✅ 参数检查
    if (!employeeId || !password) {
      return res.status(400).json({
        status: "fail",
        message: "请输入账号和密码"
      });
    }

    // ✅ 统一大写（防手机输入问题🔥）
    employeeId = employeeId.trim().toUpperCase();

    // ✅ 查询用户
    const result = await pool.query(
      `SELECT u.employee_id, u.employee_name, u.password, c.company_name
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

    // ✅ 验证密码
    const valid = await bcrypt.compare(password, user.password);

    if (!valid) {
      return res.status(401).json({
        status: "fail",
        message: "密码错误"
      });
    }

    // ✅ 检查 JWT_SECRET
    if (!process.env.JWT_SECRET) {
      console.error("❌ JWT_SECRET 未设置");
      return res.status(500).json({
        status: "error",
        message: "服务器配置错误"
      });
    }

    // ✅ 生成 token
    const token = jwt.sign(
      {
        id: user.employee_id,
        name: user.employee_name,
        company: user.company_name
      },
      process.env.JWT_SECRET,
      { expiresIn: "8h" }
    );

    console.log("✅ 登录成功:", user.employee_id);

    // ✅ 返回
    res.json({
      status: "success",
      token,
      user: {
        employeeId: user.employee_id,
        name: user.employee_name,
        company: user.company_name
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
// ✅ 获取当前用户（调试用🔥）
// =====================
router.get("/me", (req, res) => {
  try {
    const authHeader = req.headers.authorization || req.headers.Authorization;

    if (!authHeader) {
      return res.status(401).json({
        status: "fail",
        message: "未登录"
      });
    }

    // ✅ 防止 split 报错
    const parts = authHeader.split(" ");

    if (parts.length !== 2 || parts[0] !== "Bearer") {
      return res.status(401).json({
        status: "fail",
        message: "token 格式错误"
      });
    }

    const token = parts[1];

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    res.json({
      status: "success",
      user: decoded
    });

  } catch (err) {
    console.error("❌ TOKEN ERROR:", err.message);
    res.status(401).json({
      status: "fail",
      message: "token 无效或已过期"
    });
  }
});


// =====================
// ✅ 导出
// =====================
module.exports = router;