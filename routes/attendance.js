const express = require("express");
const router = express.Router();
const pool = require("../db");
const jwt = require("jsonwebtoken");
const ExcelJS = require("exceljs");

// =============================
// ✅ Token 验证（升级版🔥）
// =============================
function verify(req, res, next) {
  const token = req.headers["authorization"];

  // ❌ 没 token
  if (!token) {
    return res.status(403).json({ msg: "No token" });
  }

  // ❌ token 无效
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(401).json({ msg: "Invalid token" });
    }

    req.user = user;
    next();
  });
}

// =============================
// ✅ 马来西亚时间
// =============================
function getMalaysiaTime() {
  const now = new Date();
  return new Date(
    now.toLocaleString("en-US", { timeZone: "Asia/Kuala_Lumpur" })
  );
}

function getToday() {
  return getMalaysiaTime().toISOString().split("T")[0];
}

// =============================
// ✅ 获取状态（必须登录🔥）
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

    if (!result.rows[0].check_out_time) {
      return res.json({ status: "checked_in" });
    }

    return res.json({ status: "completed" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "error" });
  }
});

// =============================
// ✅ 打卡（企业安全版🔥🔥🔥）
// =============================
router.post("/check", verify, async (req, res) => {
  try {
    const employeeId = req.user.id;
    const { lat, lng } = req.body;

    // ✅ 获取 IP（🔥 关键）
    const ip =
      req.headers["x-forwarded-for"]?.split(",")[0] ||
      req.socket.remoteAddress;

    // ❌ 防止空GPS
    if (!lat || !lng) {
      return res.status(400).json({ msg: "GPS missing" });
    }

    const now = getMalaysiaTime();
    const today = getToday();

    const result = await pool.query(
      "SELECT * FROM attendance WHERE employee_id=$1 AND date=$2",
      [employeeId, today]
    );

    // =============================
    // ✅ 上班打卡
    // =============================
    if (result.rows.length === 0) {
      await pool.query(
        `INSERT INTO attendance 
        (employee_id, date, check_in_time, check_in_lat, check_in_lng, check_in_ip)
        VALUES ($1,$2,$3,$4,$5,$6)`,
        [employeeId, today, now, lat, lng, ip]
      );

      return res.json({
        status: "checkin",
        msg: "上班打卡成功"
      });
    }

    const record = result.rows[0];

    // =============================
    // ✅ 下班打卡
    // =============================
    if (!record.check_out_time) {
      await pool.query(
        `UPDATE attendance 
         SET check_out_time=$1,
             check_out_lat=$2,
             check_out_lng=$3,
             check_out_ip=$4
         WHERE id=$5`,
        [now, lat, lng, ip, record.id]
      );

      return res.json({
        status: "checkout",
        msg: "下班打卡成功"
      });
    }

    // =============================
    // ✅ 已完成
    // =============================
    return res.json({
      status: "done",
      msg: "今天已完成打卡"
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "服务器错误" });
  }
});

// =============================
// ✅ 获取全部记录（建议加验证🔥）
// =============================
router.get("/all", verify, async (req, res) => {
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
        attendance.check_out_lng,
		attendance.check_in_ip,
		attendance.check_out_ip
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
// ✅ 导出 Excel（建议加验证🔥）
// =============================
router.get("/export", verify, async (req, res) => {
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
        attendance.check_out_lng,
		attendance.check_in_ip,
		attendance.check_out_ip
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
      { header: "下班经度", key: "check_out_lng" },
	  { header: "上班IP", key: "check_in_ip" },
	  { header: "下班IP", key: "check_out_ip" }
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
// ✅ 获取今天个人记录
// =============================
router.get("/my-today", verify, async (req, res) => {
  try {
    const employeeId = req.user.id;

    const today = new Date().toLocaleDateString("en-CA", {
      timeZone: "Asia/Kuala_Lumpur"
    });

    const result = await pool.query(
      `SELECT 
        TO_CHAR(check_in_time, 'HH24:MI:SS') AS check_in_time,
        TO_CHAR(check_out_time, 'HH24:MI:SS') AS check_out_time,
        TO_CHAR(date, 'DD/MM/YYYY') AS adate
       FROM attendance
       WHERE employee_id=$1 AND date=$2`,
      [employeeId, today]
    );

    if (result.rows.length === 0) {
      return res.json({});
    }

    res.json(result.rows[0]);

  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "error" });
  }
});

// =============================
module.exports = router;