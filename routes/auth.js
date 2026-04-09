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

    const user = await pool.query(
      "SELECT * FROM public.users inner join public.company on users.company_code= company.company_code WHERE employee_id=$1",
      [employeeId]
    );

    if (user.rows.length === 0) {
      return res.json({ status: "fail" });
    }

    const valid = await bcrypt.compare(
      password,
      user.rows[0].password
    );

    if (!valid) {
      return res.json({ status: "fail" });
    }

    // ✅ 生成 token（建议加过期时间）
    const token = jwt.sign(
      { id: employeeId },
      process.env.JWT_SECRET,
      { expiresIn: "8h" }
    );

    // ✅ 返回用户信息
    res.json({
      status: "success",
      token,
      user: {
        employeeId: user.rows[0].employee_id,
        name: user.rows[0].employee_name,
        company: user.rows[0].company_name
      }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ status: "error" });
  }
});

module.exports = router;