const express = require("express");
const router = express.Router();
const pool = require("../db");
const jwt = require("jsonwebtoken");

// 验证token
function verify(req, res, next) {
  const token = req.headers["authorization"];
  if (!token) return res.sendStatus(403);

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(401);
    req.user = user;
    next();
  });
}

// 打卡
router.post("/check", verify, async (req, res) => {
  const { lat, lng } = req.body;
  const employeeId = req.user.id;

  const today = new Date().toISOString().slice(0, 10);

  const result = await pool.query(
    "SELECT * FROM attendance WHERE employee_id=$1 AND date=$2",
    [employeeId, today]
  );

  if (result.rows.length === 0) {
    await pool.query(
      `INSERT INTO attendance 
      (employee_id, date, check_in_time, check_in_lat, check_in_lng)
      VALUES ($1,$2,NOW(),$3,$4)`,
      [employeeId, today, lat, lng]
    );
    return res.json({ msg: "上班打卡成功" });
  }

  if (!result.rows[0].check_out_time) {
    await pool.query(
      `UPDATE attendance SET 
        check_out_time=NOW(),
        check_out_lat=$1,
        check_out_lng=$2
      WHERE employee_id=$3 AND date=$4`,
      [lat, lng, employeeId, today]
    );
    return res.json({ msg: "下班打卡成功" });
  }

  res.json({ msg: "今天已完成打卡" });
});

module.exports = router;