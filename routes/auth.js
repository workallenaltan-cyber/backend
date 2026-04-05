const express = require("express");
const router = express.Router();
const pool = require("../db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

router.post("/login", async (req, res) => {
  const { employeeId, password } = req.body;

  const user = await pool.query(
    "SELECT * FROM users WHERE employee_id=$1",
    [employeeId]
  );

  if (user.rows.length === 0)
    return res.json({ status: "fail" });

  const valid = await bcrypt.compare(password, user.rows[0].password);

  if (!valid)
    return res.json({ status: "fail" });

  const token = jwt.sign(
    {
      id: employeeId,
      role: user.rows[0].role
    },
    process.env.JWT_SECRET
  );

  res.json({ status: "success", token });
});

module.exports = router;