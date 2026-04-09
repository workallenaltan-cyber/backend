// =====================
// ✅ API 地址
// =====================
const API = "https://backend-z9ir.onrender.com";

// =====================
// ✅ 当前页面路径 + token
// =====================
const path = window.location.pathname;
let token = localStorage.getItem("token");

// =====================
// ✅ 页面控制（你要的🔥）
// =====================

// 👉 登录页
if (path.includes("index.html")) {

  if (token) {
    location.href = "checkin.html";
  }

} else {

  if (!token) {
    alert("请先登录");
    location.href = "index.html";
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

      location.href = "checkin.html";

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

  const token = localStorage.getItem("token");

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
// ✅ 状态控制 + 自动跳转
// =====================
function loadStatus() {

  const token = localStorage.getItem("token");

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

    // ✅ 自动跳转
    if (data.status === "not_checked_in" && !path.includes("checkin")) {
      location.href = "checkin.html";
    }

    if (data.status === "checked_in" && !path.includes("checkout")) {
      location.href = "checkout.html";
    }

    if (data.status === "completed" && !path.includes("done")) {
      location.href = "done.html";
    }

    // ✅ 按钮控制
    const inBtn = document.getElementById("checkInBtn");
    const outBtn = document.getElementById("checkOutBtn");

    if (inBtn) inBtn.style.display = data.status === "not_checked_in" ? "block" : "none";
    if (outBtn) outBtn.style.display = data.status === "checked_in" ? "block" : "none";
  });
}

// =====================
// ✅ 显示用户信息（重点🔥🔥🔥）
// =====================
function loadUserInfo() {

  const userStr = localStorage.getItem("user");
  if (!userStr) return;

  const user = JSON.parse(userStr);

  const el = document.getElementById("userInfo");
  if (!el) return;

  el.innerHTML = `
    <div style="text-align:center;">
      <h2 style="background:#5a67d8;color:white;padding:10px;border-radius:8px;">
        ${user.company}
      </h2>
      <p><strong>${user.employeeId} - ${user.name}</strong></p>
    </div>
  `;
}


// =====================
// ✅ 今日上班信息（新增🔥）
// =====================
function loadTodayInRecord() {

  const token = localStorage.getItem("token");

  fetch(API + "/api/my-today", {
    headers: {
      "Authorization": "Bearer " + token
    }
  })
  .then(res => res.json())
  .then(data => {

    const el = document.getElementById("todayInInfo");
    if (!el) return;

    // ❌ 没打卡
    if (data.status === "empty") {
      el.innerHTML = `<p style="color:red;">今天还没打卡</p>`;
      return;
    }

    // ❌ 错误
    if (data.status !== "success") {
      el.innerHTML = `<p style="color:red;">加载失败</p>`;
      return;
    }

    // ✅ 正常显示
    el.innerHTML = `
      <div style="margin-top:15px;">
        <p><strong>📅 日期:</strong> ${data.adate}</p>
        <p><strong>🕒 上班:</strong> ${data.check_in_time}</p>
      </div>
    `;
  });
}

// =====================
// ✅ 今日打卡信息（新增🔥）
// =====================
function loadTodayRecord() {

  const token = localStorage.getItem("token");

  fetch(API + "/api/my-today", {
    headers: {
      "Authorization": "Bearer " + token
    }
  })
  .then(res => res.json())
  .then(data => {

    const el = document.getElementById("todayInfo");
    if (!el) return;

    // ❌ 没打卡
    if (data.status === "empty") {
      el.innerHTML = `<p style="color:red;">今天还没打卡</p>`;
      return;
    }

    // ❌ 错误
    if (data.status !== "success") {
      el.innerHTML = `<p style="color:red;">加载失败</p>`;
      return;
    }

    // ✅ 正常显示
    el.innerHTML = `
      <div style="margin-top:15px;">
        <p><strong>📅 日期:</strong> ${data.adate}</p>
        <p><strong>🕒 上班:</strong> ${data.check_in_time}</p>
		<p><strong>🕒 下班:</strong> ${data.check_out_time}</p>
      </div>
    `;
  });
}

/* =========================
   ✅ 加载数据
========================= */
// =====================
// ✅ 加载全部记录（管理员🔥）
// =====================
function loadAll() {

  const token = localStorage.getItem("token");
  if (!token) return;

  fetch(API + "/api/all", {
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

    const table = document.getElementById("tableBody");
    if (!table) return;

    table.innerHTML = "";

    data.forEach(row => {

      // ✅ 状态判断（加分🔥）
      let status = "正常";
      let className = "on-time";

      if (!row.check_out_time) {
        status = "未下班";
        className = "late";
      }

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
          <td><span class="badge ${className}">${status}</span></td>
        </tr>
      `;
    });

    // ❌ 没数据
    if (data.length === 0) {
      table.innerHTML = `<tr><td colspan="11">暂无数据</td></tr>`;
    }

  })
  .catch(err => {
    console.error(err);
    document.getElementById("tableBody").innerHTML =
      `<tr><td colspan="11">加载失败</td></tr>`;
  });
}

/* =========================
   ✅ 导出 Excel（带 token）
========================= */
function exportExcel() {
  fetch("/api/export", {
    headers: { "authorization": token }
  })
  .then(res => {
    if (res.status === 401 || res.status === 403) {
      alert("登录已过期");
      localStorage.clear();
      location.href = "index.html";
      return;
    }
    return res.blob();
  })
  .then(blob => {
    if (!blob) return;

    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "attendance.xlsx";
    a.click();
  });
}


document.addEventListener("DOMContentLoaded", () => {

  if (path.includes("index.html")) return;

  loadStatus();
  loadUserInfo();
  loadTodayInRecord();
  loadTodayRecord();
  loadAll();  // ✅ 加这一行🔥

});