const express = require("express");
const router = express.Router();
const pool = require("../db");
const verifyToken = require("../middleware/authMiddleware");

// 打卡
router.post("/check", verifyToken, async (req, res) => {
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
    return res.json({ msg: "Checked In" });
  }

  const row = result.rows[0];

  if (!row.check_out_time) {
    await pool.query(
      `UPDATE attendance 
       SET check_out_time=NOW(),
           check_out_lat=$1,
           check_out_lng=$2
       WHERE employee_id=$3 AND date=$4`,
      [lat, lng, employeeId, today]
    );
    return res.json({ msg: "Checked Out" });
  }

  res.json({ msg: "Already Completed" });
});

// 查看个人记录
router.get("/my", verifyToken, async (req, res) => {
  const data = await pool.query(
    "SELECT * FROM attendance WHERE employee_id=$1 ORDER BY date DESC",
    [req.user.id]
  );

  res.json(data.rows);
});

module.exports = router;