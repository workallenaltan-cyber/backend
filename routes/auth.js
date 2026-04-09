const express = require("express");
const router = express.Router();
const pool = require("../db");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

// =====================
// ✅ 登录
// =====================
router.post("/login", async (req, res) => {
  try {
    const { employeeId, password } = req.body;

    // ❗1. 参数检查（避免空值）
    if (!employeeId || !password) {
      return res.status(400).json({ status: "fail", message: "Missing fields" });
    }

    // ❗2. 查询用户（优化写法）
    const result = await pool.query(
      `SELECT u.employee_id, u.employee_name, u.password, c.company_name
       FROM public.users u
       INNER JOIN public.company c 
       ON u.company_code = c.company_code
       WHERE u.employee_id = $1`,
      [employeeId]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ status: "fail", message: "User not found" });
    }

    const user = result.rows[0];

    // ❗3. 密码验证
    const valid = await bcrypt.compare(password, user.password);

    if (!valid) {
      return res.status(401).json({ status: "fail", message: "Wrong password" });
    }

    // ❗4. JWT SECRET 检查（很多人忘🔥）
    if (!process.env.JWT_SECRET) {
      console.error("JWT_SECRET 未设置！");
      return res.status(500).json({ status: "error", message: "Server config error" });
    }

    // ❗5. 生成 token（建议加更多信息）
    const token = jwt.sign(
      { 
        id: user.employee_id,
        name: user.employee_name
      },
      process.env.JWT_SECRET,
      { expiresIn: "8h" }
    );

    // ❗6. 返回数据（统一格式）
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
    console.error("LOGIN ERROR:", err);
    res.status(500).json({ status: "error", message: "Server error" });
  }
});

module.exports = router;