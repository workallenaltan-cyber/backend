import express from "express";
import pkg from "pg";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors()); // ⭐ 关键
app.use(express.json());

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
app.post("/api/login", async (req, res) => {
  try {
    const { employeeId, password } = req.body;

    // 👉 示例：直接写死（先跑通）
    if (employeeId === "MA001" && password === "1234") {
      return res.json({
        status: "success",
        token: "abc123"
      });
    }

    return res.json({
      status: "fail"
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "server error" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});