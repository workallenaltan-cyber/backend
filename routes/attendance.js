const express = require("express");
const router = express.Router();
const pool = require("../db");
const jwt = require("jsonwebtoken");
const ExcelJS = require("exceljs");

// =============================
// ✅ Token 验证
// =============================
function verify(req, res, next) {
  const token = req.headers["authorization"];

  if (!token) return res.sendStatus(403);

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(401);
    req.user = user;
    next();
  });
}

// =============================
// ✅ 获取马来西亚时间
// =============================
function getMalaysiaTime() {
  const now = new Date();
  return new Date(
    now.toLocaleString("en-US", { timeZone: "Asia/Kuala_Lumpur" })
  );
}

// =============================
// ✅ 获取今天日期 YYYY-MM-DD
// =============================
function getToday() {
  return getMalaysiaTime().toISOString().split("T")[0];
}

// =============================
// ✅ 获取状态（控制按钮）
// =============================
router.get("/status", verify, async (req, res) => {
  try {
    const employeeId = req.user.id;
    const today = getToday();

    const result = await pool.query(
      "SELECT * FROM attendance WHERE employee_id=$1 AND date=$2",
      [employeeId, today]
    );

    if (result.rows.length === 0) {
      return res.json({ status: "not_checked_in" });
    }

    const record = result.rows[0];

    if (!record.check_out_time) {
      return res.json({ status: "checked_in" });
    }

    return res.json({ status: "completed" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "error" });
  }
});

// =============================
// ✅ 打卡（自动判断上下班）
// =============================
router.post("/check", verify, async (req, res) => {
  try {
    const employeeId = req.user.id;
    const { lat, lng } = req.body;

    const now = getMalaysiaTime();
    const today = getToday();

    const result = await pool.query(
      "SELECT * FROM attendance WHERE employee_id=$1 AND date=$2",
      [employeeId, today]
    );

    // ✅ 上班打卡
    if (result.rows.length === 0) {
      await pool.query(
        `INSERT INTO attendance 
        (employee_id, date, check_in_time, check_in_lat, check_in_lng)
        VALUES ($1,$2,$3,$4,$5)`,
        [employeeId, today, now, lat, lng]
      );

      return res.json({ msg: "上班打卡成功" });
    }

    const record = result.rows[0];

    // ✅ 下班打卡
    if (!record.check_out_time) {
      await pool.query(
        `UPDATE attendance 
         SET check_out_time=$1, check_out_lat=$2, check_out_lng=$3
         WHERE id=$4`,
        [now, lat, lng, record.id]
      );

      return res.json({ msg: "下班打卡成功" });
    }

    // ✅ 已完成
    return res.json({ msg: "今天已完成打卡" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "服务器错误" });
  }
});

// =============================
// ✅ 获取全部记录（管理员）
// =============================
router.get("/all", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT 
        attendance.employee_id,
        users.employee_name,
        company.company_name,
        TO_CHAR(attendance.date, 'DD/MM/YYYY') AS adate,
        TO_CHAR(attendance.check_in_time, 'HH24:MI:SS') AS check_in_time,
        TO_CHAR(attendance.check_out_time, 'HH24:MI:SS') AS check_out_time,
        attendance.check_in_lat,
        attendance.check_in_lng,
        attendance.check_out_lat,
        attendance.check_out_lng
      FROM attendance
      INNER JOIN users ON attendance.employee_id = users.employee_id
      LEFT JOIN company ON users.company_code = company.company_code
      ORDER BY attendance.date DESC`
    );

    res.json(result.rows);

  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "服务器错误" });
  }
});

// =============================
// ✅ 导出 Excel
// =============================
router.get("/export", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT 
        attendance.employee_id,
        users.employee_name,
        company.company_name,
        TO_CHAR(attendance.date, 'DD/MM/YYYY') AS adate,
        TO_CHAR(attendance.check_in_time, 'HH24:MI:SS') AS check_in_time,
        TO_CHAR(attendance.check_out_time, 'HH24:MI:SS') AS check_out_time,
        attendance.check_in_lat,
        attendance.check_in_lng,
        attendance.check_out_lat,
        attendance.check_out_lng
      FROM attendance
      INNER JOIN users ON attendance.employee_id = users.employee_id
      LEFT JOIN company ON users.company_code = company.company_code
      ORDER BY attendance.date DESC`
    );

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Attendance");

    sheet.columns = [
      { header: "员工ID", key: "employee_id" },
      { header: "Employee Name", key: "employee_name" },
      { header: "Company Name", key: "company_name" },
      { header: "日期", key: "adate" },
      { header: "上班时间", key: "check_in_time" },
      { header: "下班时间", key: "check_out_time" },
      { header: "上班纬度", key: "check_in_lat" },
      { header: "上班经度", key: "check_in_lng" },
      { header: "下班纬度", key: "check_out_lat" },
      { header: "下班经度", key: "check_out_lng" }
    ];

    result.rows.forEach(row => sheet.addRow(row));

    // ✅ 自动列宽
    sheet.columns.forEach(column => {
      let maxLength = 10;
      column.eachCell({ includeEmpty: true }, cell => {
        const val = cell.value ? cell.value.toString() : "";
        maxLength = Math.max(maxLength, val.length);
      });
      column.width = maxLength + 2;
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

// =============================
module.exports = router;