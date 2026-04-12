/*const jwt = require("jsonwebtoken");

module.exports = function (req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ message: "未登录" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ message: "token 无效" });
  }
};*/

const jwt = require("jsonwebtoken");

module.exports = function (req, res, next) {
  try {
    const authHeader =
      req.headers.authorization || req.headers.Authorization;

    let token = null;

    // ✅ 标准 Bearer token
    if (authHeader) {
      const parts = authHeader.split(" ");

      if (parts.length === 2 && parts[0] === "Bearer") {
        token = parts[1];
      }
    }

    // ✅ fallback（给 Excel export 用🔥）
    if (!token && req.query.token) {
      token = req.query.token;
    }

    if (!token) {
      return res.status(401).json({ msg: "未登录" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // ✅ 把用户信息挂进去（关键🔥）
    req.user = decoded;

    next();

  } catch (err) {
    console.error("❌ TOKEN ERROR:", err.message);

    return res.status(401).json({
      msg: "token 无效或已过期"
    });
  }
};

