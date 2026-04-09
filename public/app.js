// =====================
// ✅ API 地址（重要🔥）
// =====================
const API = "https://backend-z9ir.onrender.com";


// =====================
// ✅ 通用：检查 token
// =====================
function getToken() {
  const token = localStorage.getItem("token");

  if (!token) {
    alert("请先登录");
    location.href = "index.html";
    return null;
  }

  return token;
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

    console.log("LOGIN RESPONSE:", data);

    if (data.status === "success") {

      // ✅ 存 token + user（关键🔥）
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      alert("登录成功");

      window.location.href = "checkin.html";

    } else {
      alert(data.message || "账号或密码错误");
    }

  } catch (err) {
    console.error(err);
    alert("服务器错误");
  }
}


// =====================
// ✅ 根据状态跳转
// =====================
function redirectByStatus(token) {
  fetch(API + "/api/status", {
    headers: {
      "Authorization": "Bearer " + token
    }
  })
  .then(res => {

    if (res.status === 401 || res.status === 403) {
      alert("登录已过期");
      localStorage.clear();
      location.href = "index.html";
      return;
    }

    return res.json();
  })
  .then(status => {
    if (!status) return;

    if (status.status === "not_checked_in") {
      location.href = "checkin.html";
    }

    if (status.status === "checked_in") {
      location.href = "checkout.html";
    }

    if (status.status === "completed") {
      location.href = "done.html";
    }
  });
}


// =====================
// ✅ 打卡
// =====================
function check() {

  const token = getToken();
  if (!token) return;

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

      if (res.status === 401 || res.status === 403) {
        alert("登录已过期");
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
// ✅ 加载状态（控制按钮）
// =====================
function loadStatus() {

  const token = getToken();
  if (!token) return;

  fetch(API + "/api/status", {
    headers: {
      "Authorization": "Bearer " + token
    }
  })
  .then(res => {

    if (res.status === 401 || res.status === 403) {
      localStorage.clear();
      location.href = "index.html";
      return;
    }

    return res.json();
  })
  .then(data => {
    if (!data) return;

    const inBtn = document.getElementById("checkInBtn");
    const outBtn = document.getElementById("checkOutBtn");

    if (!inBtn || !outBtn) return;

    if (data.status === "not_checked_in") {
      inBtn.style.display = "block";
      outBtn.style.display = "none";
    }

    if (data.status === "checked_in") {
      inBtn.style.display = "none";
      outBtn.style.display = "block";
    }

    if (data.status === "completed") {
      inBtn.style.display = "none";
      outBtn.style.display = "none";
    }
  });
}


// =====================
// ✅ 用户信息显示
// =====================
function loadUserInfo() {
  const user = JSON.parse(localStorage.getItem("user"));
  if (!user) return;

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
// ✅ 加载全部记录（管理员）
// =====================
function loadAll() {

  const token = getToken();
  if (!token) return;

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
      table.innerHTML += `
        <tr>
          <td>${row.employee_id}</td>
          <td>${row.employee_name}</td>
          <td>${row.company_name}</td>
          <td>${row.adate}</td>
          <td>${row.check_in_time}</td>
          <td>${row.check_out_time || ""}</td>
          <td>${row.check_in_lat}, ${row.check_in_lng}</td>
          <td>${row.check_out_lat || ""}, ${row.check_out_lng || ""}</td>
        </tr>
      `;
    });
  });
}


// =====================
// ✅ 导出 Excel
// =====================
function exportExcel() {

  const token = getToken();
  if (!token) return;

  window.open(API + "/api/export?token=" + token);
}


// =====================
// ✅ 页面初始化
// =====================
document.addEventListener("DOMContentLoaded", () => {
  loadStatus();
  loadUserInfo();
});