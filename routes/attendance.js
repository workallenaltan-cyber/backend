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

  try {
    const result = await pool.query(
      "SELECT * FROM attendance WHERE employee_id=$1 AND date=$2",
      [employeeId, today]
    );

    // 👉 第一次 → 上班
    if (result.rows.length === 0) {
      await pool.query(
        `INSERT INTO attendance 
        (employee_id, date, check_in_time, check_in_lat, check_in_lng)
        VALUES ($1,$2,NOW(),$3,$4)`,
        [employeeId, today, lat, lng]
      );

      return res.json({ msg: "上班打卡成功" });
    }

    // 👉 第二次 → 下班
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

    // 👉 第三次 → 禁止
    res.json({ msg: "今天已经完成打卡" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "服务器错误" });
  }
});

module.exports = router;

// 获取全部打卡记录（管理员）
router.get("/all", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM attendance ORDER BY date DESC"
    );

    res.json(result.rows);

  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "服务器错误" });
  }
});

const ExcelJS = require("exceljs");

// 导出 Excel
router.get("/export", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM attendance ORDER BY date DESC"
    );

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Attendance");

    // 表头
    sheet.columns = [
      { header: "员工ID", key: "employee_id" },
      { header: "日期", key: "date" },
      { header: "上班时间", key: "check_in_time" },
      { header: "下班时间", key: "check_out_time" },
      { header: "上班纬度", key: "check_in_lat" },
      { header: "上班经度", key: "check_in_lng" },
      { header: "下班纬度", key: "check_out_lat" },
      { header: "下班经度", key: "check_out_lng" }
    ];

    // 数据
    result.rows.forEach(row => {
      sheet.addRow(row);
    });

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );

    res.setHeader(
      "Content-Disposition",
      "attachment; filename=attendance.xlsx"
    );

    await workbook.xlsx.write(res);
    res.end();

  } catch (err) {
    console.error(err);
    res.status(500).send("导出失败");
  }
});