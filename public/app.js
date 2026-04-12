// =====================
// ✅ 自动登出（下班30分钟🔥）
// =====================
function autoLogoutAfterWork() {

  const checkoutTime = localStorage.getItem("checkoutTime");
  if (!checkoutTime) return;

  const now = Date.now();
  const diff = now - parseInt(checkoutTime);

  const limit = 5 * 60 * 1000; // 30分钟

  if (diff > limit) {
    console.log("⛔ 超过30分钟，自动登出");

    localStorage.clear();
    location.href = "index.html";
  }
}


const links = document.querySelectorAll(".menu");
const current = window.location.pathname;

links.forEach(link => {
  if (link.getAttribute("href") === current.split("/").pop()) {
    link.classList.add("active");
  }
});

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
let token = localStorage.getItem("token");

// =====================
// ✅ 页面控制（你要的🔥）
// =====================

// 👉 登录页
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

  // ✅ 非 admin 禁止进 admin 页面
  if (path.includes("admin.html") && !isAdmin) {
    alert("无权限");
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


		  // ✅ 根据角色跳转
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

  const token = localStorage.getItem("token");
  const btn = document.getElementById("checkBtn"); // 👈 按钮ID

  // ✅ 按钮进入 processing 状态
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = "⏳ Processing...";
  }

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
    .then(async res => {

	  if (res.status === 401) {
		localStorage.clear();
		location.href = "index.html";
		return;
	  }

	  const data = await res.json();

	  // ❌ 关键：处理非200
	  if (!res.ok) {
		alert(data.msg || "打卡失败");

		// ✅ 恢复按钮
		if (btn) {
		  btn.disabled = false;
		  btn.innerText = "CHECK IN";
		}

		return;
	  }

	  return data;
	})
    .then(data => {
      if (!data) return;

      alert(data.msg);

      // ✅ 跳转
      if (data.status === "checkin") {
        location.href = "checkout.html";
      }

      if (data.status === "checkout") {

		  // ✅ 记录下班时间（时间戳）
		  localStorage.setItem("checkoutTime", Date.now());


        location.href = "done.html";
      }

      if (data.status === "done") {
        location.href = "done.html";
      }

    })
    .catch(err => {
      console.error(err);
      alert("打卡失败");

      // ❌ 出错恢复按钮
      if (btn) {
        btn.disabled = false;
        btn.innerText = "CHECK IN";
      }
    });

  }, () => {
    alert("无法获取GPS");

    // ❌ GPS失败恢复按钮
    if (btn) {
      btn.disabled = false;
      btn.innerText = "CHECK IN";
    }
  });
}

// =====================
// ✅ 状态控制 + 自动跳转
// =====================
function loadStatus() {

  // ✅ admin 不执行
  if (isAdmin) return;

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

/*======================================Admin Control=====================================*/
function toggleSidebar() {
  document.getElementById("sidebar").classList.toggle("collapsed");
  document.getElementById("main").classList.toggle("collapsed");
}

function loadSidebarAuto() {
  fetch("./components/admin_sidebar.html")
    .then(res => res.text())
    .then(html => {
      document.getElementById("sidebar-container").innerHTML = html;

      // ✅ 当前页面
      const currentPage = window.location.pathname.split("/").pop();

      // ✅ 找全部 menu
      const links = document.querySelectorAll(".menu");

      links.forEach(link => {
        const href = link.getAttribute("href");

        if (href === currentPage) {
          link.classList.add("active");
        }
      });
    });
}

function initPage() {
  loadSidebarAuto(); // 👈 高亮当前页面
  loadStaff();
}

function openAddDialog() {
  document.getElementById("staffModal").style.display = "block";
  document.getElementById("modalTitle").innerText = "Add Staff";
  document.getElementById("modalName").value = "";
  document.getElementById("modalEmail").value = "";
  document.getElementById("modalPassword").value = "";
}

function loadStaff() {

  const token = localStorage.getItem("token");
  if (!token) return;

  fetch(API + "/api/staff", {
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

    const table = document.getElementById("staffTable");
    if (!table) return;

    table.innerHTML = "";

    // ❌ 没数据
    if (!data || data.length === 0) {
      table.innerHTML = `<tr><td colspan="4">No staff found</td></tr>`;
      return;
    }

    // ✅ 渲染数据
    data.forEach(user => {
      table.innerHTML += `
        <tr>
          <td>${user.employee_id}</td>
          <td>${user.name}</td>
          <td>${user.email || "-"}</td>
          <td>
            <button onclick="openEditDialog('${user.id}','${user.name}','${user.email}')">Edit</button>
            <button onclick="openPasswordDialog('${user.id}')">Password</button>
          </td>
        </tr>
      `;
    });

  })
  .catch(err => {
    console.error(err);

    document.getElementById("staffTable").innerHTML =
      `<tr><td colspan="4">Load failed</td></tr>`;
  });
}
/*===================================================================================*/
/* =========================
   ✅ 加载数据
========================= */
// =====================
// ✅ 加载全部记录（管理员🔥）
// =====================
/*function loadAll() {

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
		let className = "status-ok ";

		// =====================
		// ✅ 判断迟到（核心🔥）
		// =====================
		if (row.check_in_time) {

		  const time = row.check_in_time.split(":");
		  const hour = parseInt(time[0]);
		  const min = parseInt(time[1]);

		  // 转成分钟
		  const totalMin = hour * 60 + min;

		  const start = 8 * 60;       // 08:00
		  const late = 8 * 60 + 30;   // 08:30

		  if (totalMin > late) {
			status = "迟到";
			className = "status-late";
		  }
		}

		// =====================
		// ✅ 未下班优先
		// =====================
		if (!row.check_out_time) {
		  status = "未下班";
		  className = "status-pending";
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
}*/

function loadAll() {

  const token = localStorage.getItem("token");
  if (!token) return;

  // ✅ 获取月份（Flatpickr）
  const month = document.getElementById("monthFilter")?.value;

  let url = API + "/api/all";

  if (month) {
    url += "?month=" + month;
  }

  fetch(url, {
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

      let status = "正常";
      let className = "status-ok";

      // ✅ 判断迟到
      if (row.check_in_time) {
        const [hour, min] = row.check_in_time.split(":").map(Number);
        const totalMin = hour * 60 + min;

        if (totalMin > (8 * 60 + 30)) {
          status = "迟到";
          className = "status-late";
        }
      }

      // ✅ 未下班优先
      if (!row.check_out_time) {
        status = "未下班";
        className = "status-pending";
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
/*function exportExcel() {
  fetch(API + "/api/export", {
    headers: { "Authorization": "Bearer " + token }
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
}*/

function exportExcel() {

  const token = localStorage.getItem("token");
  if (!token) return;

  // ✅ 获取月份
  const month = document.getElementById("monthFilter")?.value;

  let url = API + "/api/export";

  if (month) {
    url += "?month=" + month;
  }

  fetch(url, {
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

    return res.blob();
  })
  .then(blob => {

    if (!blob) return;

    const downloadUrl = window.URL.createObjectURL(blob);
    const a = document.createElement("a");

    a.href = downloadUrl;

    // ✅ 文件名带月份（高级🔥）
    a.download = month 
      ? `attendance_${month}.xlsx`
      : "attendance_all.xlsx";

    document.body.appendChild(a);
    a.click();
    a.remove();

    // ✅ 释放内存（专业写法🔥）
    window.URL.revokeObjectURL(downloadUrl);

  })
  .catch(err => {
    console.error(err);
    alert("导出失败");
  });
}


document.addEventListener("DOMContentLoaded", () => {
	autoLogoutAfterWork();

  if (path.includes("index.html")) return;

  loadUserInfo();
  loadAll();


  if (isAdmin) {
     flatpickr("#monthFilter", {
		dateFormat: "Y-m",
		plugins: [
		  new monthSelectPlugin({
			shorthand: true,
			dateFormat: "Y-m",
			altFormat: "F Y"
		  })
		],
		defaultDate: new Date(new Date().setMonth(new Date().getMonth() - 1)),
		onChange: function() {
		  loadAll();
		}
	  });
	  
	  document.addEventListener("DOMContentLoaded", () => {

	  const addBtn = document.querySelector(".btn");

	  if (addBtn) {
		addBtn.addEventListener("click", openAddDialog);
	  }

});

  } else {
    // ✅ staff 才执行打卡逻辑
    loadStatus();
    loadTodayInRecord();
    loadTodayRecord();
  }

});

// =====================
// ✅ 用户操作监听（🔥放这里）
// =====================
["click", "keydown", "touchstart"].forEach(evt => {
  document.addEventListener(evt, autoLogoutAfterWork);
});