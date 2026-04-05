import express from "express";
import pkg from "pg";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const { Pool } = pkg;

const app = express();
app.use(cors());
app.use(express.json());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// 测试接口
app.get("/", (req, res) => {
  res.send("API running 🚀");
});

// 获取所有数据
app.get("/attendance", async (req, res) => {
  const result = await pool.query("SELECT * FROM attendance");
  res.json(result.rows);
});

// 插入数据
app.post("/attendance", async (req, res) => {
  const { employee_id, lat, lng } = req.body;

  const result = await pool.query(
    `INSERT INTO attendance (employee_id, date, check_in, lat, lng)
     VALUES ($1, CURRENT_DATE, NOW(), $2, $3)
     RETURNING *`,
    [employee_id, lat, lng]
  );

  res.json(result.rows[0]);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});