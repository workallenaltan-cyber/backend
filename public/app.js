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
function login() {
  const employeeId = document.getElementById("id").value.toUpperCase();
  const password = document.getElementById("pw").value;

  fetch("/api/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ employeeId, password })
  })
  .then(res => res.json())
  .then(data => {

    if (data.status === "success") {

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      // 🔥 登录后直接跳正确页面
      redirectByStatus(data.token);

    } else {
      alert("登录失败");
    }
  })
  .catch(() => {
    alert("服务器错误");
  });
}

// =====================
// ✅ 根据状态跳转（复用🔥）
// =====================
function redirectByStatus(token) {
  fetch("/api/status", {
    headers: {
      "authorization": token
    }
  })
  .then(res => {

    // ❌ token 失效
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
// ✅ 打卡（极速+安全🔥）
// =====================
function check() {

  const token = getToken();
  if (!token) return;

  navigator.geolocation.getCurrentPosition(pos => {

    fetch("/api/check", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "authorization": token
      },
      body: JSON.stringify({
        lat: pos.coords.latitude,
        lng: pos.coords.longitude
      })
    })
    .then(res => {

      // ❌ token 失效
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

      // 🔥 直接用状态跳转（更快）
      if (data.status === "checkin") {
        location.href = "checkout.html";
      }

      if (data.status === "checkout") {
        location.href = "done.html";
      }

      if (data.status === "done") {
        alert("今天已完成打卡");
      }
    });

  }, () => {
    alert("无法获取GPS");
  });
}

// =====================
// ✅ 加载打卡状态（按钮控制）
// =====================
function loadStatus() {

  const token = getToken();
  if (!token) return;

  fetch("/api/status", {
    headers: {
      "authorization": token
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
// ✅ 用户信息显示（右上角UI🔥）
// =====================
function loadUserInfo() {
  const user = JSON.parse(localStorage.getItem("user"));
  if (!user) return;

  const el = document.getElementById("userInfo");
  if (!el) return;

  el.innerHTML = `
    <div style="
      position:absolute;
      top:15px;
      right:20px;
      text-align:right;
      color:white;
    ">
      <div style="
        background:#5a67d8;
        padding:6px 10px;
        border-radius:6px;
        font-size:12px;
      ">
        ${user.company}
      </div>

      <div style="margin-top:5px;font-size:14px;">
        <strong>${user.employeeId}</strong><br>
        ${user.name}
      </div>
    </div>
  `;
}

// =====================
// ✅ 加载全部记录（管理员）
// =====================
function loadAll() {

  const token = getToken();
  if (!token) return;

  fetch("/api/all", {
    headers: {
      "authorization": token
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
// ✅ 导出 Excel（带 token🔥）
// =====================
function exportExcel() {

  const token = getToken();
  if (!token) return;

  window.open("/api/export?token=" + token);
}

// =====================
// ✅ 页面初始化
// =====================
document.addEventListener("DOMContentLoaded", () => {
  loadStatus();
  loadUserInfo();
});