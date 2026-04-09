// =====================
// ✅ 用户信息
// =====================
const user = JSON.parse(localStorage.getItem("user") || "{}");
const role = user.role;
const isAdmin = role === "admin";

// =====================
// ✅ API 地址
// =====================
const API = "https://backend-z9ir.onrender.com";

// =====================
// ✅ 当前页面路径 + token
// =====================
const path = window.location.pathname;
const token = localStorage.getItem("token");

// =====================
// ✅ 页面控制
// =====================
if (path.includes("index.html")) {

  if (token) {
    if (isAdmin) {
      location.href = "admin.html";
    } else {
      location.href = "checkin.html";
    }
  }

} else {

  if (!token) {
    alert("请先登录");
    location.href = "index.html";
  }

  // ✅ 非 admin 禁止进 admin
  if (path.includes("admin.html") && !isAdmin) {
    alert("无权限");
    location.href = "checkin.html";
  }
}

// =====================
// ✅ 登录
// =====================
async function login() {
  const employeeId = document.getElementById("id").value.trim().toUpperCase();
  const password = document.getElementById("pw").value;

  if (!employeeId || !password) {
    alert("请输入账号和密码");
    return;
  }

  try {
    const res = await fetch(API + "/api/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ employeeId, password })
    });

    const data = await res.json();

    if (data.status === "success") {
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      alert("登录成功");

      if (data.user.role === "admin") {
        location.href = "admin.html";
      } else {
        location.href = "checkin.html";
      }

    } else {
      alert(data.message || "账号或密码错误");
    }

  } catch (err) {
    console.error(err);
    alert("服务器错误");
  }
}

// =====================
// ✅ 打卡
// =====================
function check() {

  navigator.geolocation.getCurrentPosition(pos => {

    fetch(API + "/api/check", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + token
      },
      body: JSON.stringify({
        lat: pos.coords.latitude,
        lng: pos.coords.longitude
      })
    })
    .then(res => {
      if (res.status === 401) {
        localStorage.clear();
        location.href = "index.html";
        return;
      }
      return res.json();
    })
    .then(data => {
      if (!data) return;

      alert(data.msg);

      if (data.status === "checkin") {
        location.href = "checkout.html";
      }

      if (data.status === "checkout") {
        location.href = "done.html";
      }
    });

  }, () => {
    alert("无法获取GPS");
  });
}

// =====================
// ✅ 状态控制（修正版🔥）
// =====================
function loadStatus() {

  if (isAdmin) return; // ✅ admin 不执行

  fetch(API + "/api/status", {
    headers: {
      "Authorization": "Bearer " + token
    }
  })
  .then(res => {

    if (res.status === 401) {
      localStorage.clear();
      location.href = "index.html";
      return;
    }

    return res.json();
  })
  .then(data => {
    if (!data) return;

    if (data.status === "not_checked_in" && !path.includes("checkin")) {
      location.href = "checkin.html";
    }

    if (data.status === "checked_in" && !path.includes("checkout")) {
      location.href = "checkout.html";
    }

    if (data.status === "completed" && !path.includes("done")) {
      location.href = "done.html";
    }

    const inBtn = document.getElementById("checkInBtn");
    const outBtn = document.getElementById("checkOutBtn");

    if (inBtn) inBtn.style.display = data.status === "not_checked_in" ? "block" : "none";
    if (outBtn) outBtn.style.display = data.status === "checked_in" ? "block" : "none";
  });
}

// =====================
// ✅ 用户信息
// =====================
function loadUserInfo() {

  const el = document.getElementById("userInfo");
  if (!el) return;

  el.innerHTML = `
    <div style="text-align:center;">
      <h2 style="background:#5a67d8;color:white;padding:10px;border-radius:8px;">
        ${user.company || ""}
      </h2>
      <p><strong>${user.employeeId || ""} - ${user.name || ""}</strong></p>
    </div>
  `;
}

// =====================
// ✅ 今日记录
// =====================
function loadTodayRecord() {

  fetch(API + "/api/my-today", {
    headers: {
      "Authorization": "Bearer " + token
    }
  })
  .then(res => res.json())
  .then(data => {

    const el = document.getElementById("todayInfo");
    if (!el) return;

    if (data.status === "empty") {
      el.innerHTML = `<p style="color:red;">今天还没打卡</p>`;
      return;
    }

    if (data.status !== "success") {
      el.innerHTML = `<p style="color:red;">加载失败</p>`;
      return;
    }

    el.innerHTML = `
      <p>📅 ${data.adate}</p>
      <p>🕒 上班: ${data.check_in_time}</p>
      <p>🕒 下班: ${data.check_out_time || "-"}</p>
    `;
  });
}

// =====================
// ✅ 管理员加载全部
// =====================
function loadAll() {

  fetch(API + "/api/all", {
    headers: {
      "Authorization": "Bearer " + token
    }
  })
  .then(res => res.json())
  .then(data => {

    const table = document.getElementById("tableBody");
    if (!table) return;

    table.innerHTML = "";

    data.forEach(row => {

      let status = row.check_out_time ? "正常" : "未下班";
      let cls = row.check_out_time ? "on-time" : "late";

      table.innerHTML += `
        <tr>
          <td>${row.employee_id}</td>
          <td>${row.employee_name}</td>
          <td>${row.company_name}</td>
          <td>${row.adate}</td>
          <td>${row.check_in_time}</td>
          <td>${row.check_out_time || "-"}</td>
          <td>${row.check_in_lat}, ${row.check_in_lng}</td>
          <td>${row.check_out_lat || "-"}, ${row.check_out_lng || "-"}</td>
          <td>${row.check_in_ip}</td>
          <td>${row.check_out_ip || "-"}</td>
          <td><span class="badge ${cls}">${status}</span></td>
        </tr>
      `;
    });

    if (data.length === 0) {
      table.innerHTML = `<tr><td colspan="11">暂无数据</td></tr>`;
    }
  });
}

// =====================
// ✅ 导出 Excel（修正🔥）
// =====================
function exportExcel() {
  fetch(API + "/api/export", {
    headers: {
      "Authorization": "Bearer " + token
    }
  })
  .then(res => res.blob())
  .then(blob => {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "attendance.xlsx";
    a.click();
  });
}

// =====================
// ✅ 页面初始化
// =====================
document.addEventListener("DOMContentLoaded", () => {

  if (path.includes("index.html")) return;

  loadUserInfo();

  if (isAdmin) {
    loadAll();   // ✅ admin
  } else {
    loadStatus(); 
    loadTodayRecord(); // ✅ staff
  }
});