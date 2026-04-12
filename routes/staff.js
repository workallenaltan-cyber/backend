const express = require("express");
const router = express.Router();
const pool = require("../db"); // 你的数据库
const verify = require("../middleware/verify"); // JWT验证
const bcrypt = require("bcryptjs");

// =============================
// ✅ GET staff
// =============================
router.get("/staff", verify, async (req, res) => {
  try {

    const adminId = req.user.id;

    // ✅ 查同公司员工
    const result = await pool.query(`
      SELECT id, employee_id, name, email
      FROM users
      WHERE company_code = (
        SELECT company_code FROM users WHERE id = $1
      )
      ORDER BY employee_id ASC
    `, [adminId]);

    res.json(result.rows);

  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
});

// =============================
// ✅ ADD staff
// =============================
router.post("/", verify, async (req, res) => {
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
    res.status(500).json({ msg: "Server error" });
  }
});

// =============================
// ✅ UPDATE
// =============================
router.put("/:id", verify, async (req, res) => {
  const { name, email } = req.body;

  await pool.query(
    "UPDATE users SET name=$1, email=$2 WHERE id=$3",
    [name, email, req.params.id]
  );

  res.json({ msg: "Updated" });
});

// =============================
// ✅ PASSWORD
// =============================
router.put("/password/:id", verify, async (req, res) => {
  const { password } = req.body;
  const hashed = await bcrypt.hash(password, 10);

  await pool.query(
    "UPDATE users SET password=$1 WHERE id=$2",
    [hashed, req.params.id]
  );

  res.json({ msg: "Password updated" });
});

// =============================
// ✅ DELETE（可选🔥）
// =============================
router.delete("/:id", verify, async (req, res) => {
  await pool.query(
    "DELETE FROM users WHERE id=$1",
    [req.params.id]
  );

  res.json({ msg: "Deleted" });
});

module.exports = router;