const express = require("express");
const router = express.Router();
const pool = require("../db");
const verify = require("../middleware/verify");
const bcrypt = require("bcryptjs");

// =============================
// ✅ GET staff
// =============================
router.get("/", verify, verifyAdmin, async (req, res) => {
  try {
    const adminId = req.user.id;

    const result = await pool.query(`
      SELECT id, employee_id, name, email
      FROM users
      ORDER BY employee_id ASC
    `);

    res.json(result.rows);

  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
});

// =============================
// ✅ ADD
// =============================
router.post("/", verify, verifyAdmin, async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const adminId = req.user.id;

    const userRes = await pool.query(
      "SELECT company_code FROM users WHERE id=$1",
      [adminId]
    );

    const companyCode = userRes.rows[0].company_code;

    const countRes = await pool.query(
      "SELECT COUNT(*) FROM users WHERE company_code=$1",
      [companyCode]
    );

    const count = parseInt(countRes.rows[0].count) + 1;

    const employeeId =
      companyCode + String(count).padStart(4, "0");

    const hashed = await bcrypt.hash(password, 10);

    await pool.query(`
      INSERT INTO users (employee_id, name, email, password, role, company_code)
      VALUES ($1,$2,$3,$4,'staff',$5)
    `, [employeeId, name, email, hashed, companyCode]);

    res.json({ msg: "Staff added" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
});

// =============================
// ✅ Admin check
// =============================
function verifyAdmin(req, res, next) {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({ msg: "无权限" });
  }
  next();
}

module.exports = router;