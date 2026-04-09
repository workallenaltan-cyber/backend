const express = require("express");
const router = express.Router();
const pool = require("../db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// 登录
router.post("/login", async (req, res) => {
  const { employeeId, password } = req.body;

  const user = await pool.query(
    "SELECT * FROM users WHERE employee_id=$1",
    [employeeId]
  );

  if (user.rows.length === 0) {
    return res.json({ status: "fail" });
  }

  const valid = await bcrypt.compare(password, user.rows[0].password);
  //const valid = password === user.rows[0].password;
  if (!valid) {
  console.log("❌ 登录失败1");
  console.log("输入:", employeeId, password);
  console.log("数据库:", user.rows);

  return res.json({ status: "fail" });
}
  const token = jwt.sign(
    { id: employeeId },
    process.env.JWT_SECRET
  );

   // ✅ 关键：在这里返回用户信息
  res.json({
    status: "success",
    token,
    user: {
      employeeId: user.rows[0].employee_id,
      name: user.rows[0].name,
      company: user.rows[0].company
    }
  });
});

module.exports = router;

module.exports = router;