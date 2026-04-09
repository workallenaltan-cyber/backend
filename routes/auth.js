const express = require("express");
const router = express.Router();
const pool = require("../db");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

// 登录
router.post("/login", async (req, res) => {
  try {
    const { employeeId, password } = req.body;

    const result = await pool.query(
      `SELECT u.employee_id, u.employee_name, u.password, c.company_name
       FROM public.users u
       INNER JOIN public.company c 
       ON u.company_code = c.company_code
       WHERE u.employee_id = $1`,
      [employeeId]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ status: "fail" });
    }

    const user = result.rows[0];

    const valid = await bcrypt.compare(password, user.password);

    if (!valid) {
      return res.status(401).json({ status: "fail" });
    }

    const token = jwt.sign(
      { id: user.employee_id },
      process.env.JWT_SECRET,
      { expiresIn: "8h" }
    );

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
    res.status(500).json({ status: "error" });
  }
});

// ✅ 导出 router
module.exports = router;