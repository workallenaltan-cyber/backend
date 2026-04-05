function login() {
  const employeeId = document.getElementById("id").value;
  const password = document.getElementById("pw").value;


  fetch("/api/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      employeeId: employeeId,
      password: password
    })
  })
  .then(res => res.json())
  .then(data => {
    console.log("返回:", data);

    if (data.status === "success") {
      alert("登录成功");
      localStorage.setItem("token", data.token);
      window.location = "dashboard.html";
    } else {
      alert("登录失败");
    }
  })
  .catch(err => {
    console.error(err);
    alert("请求失败");
  });
}

/*function login() {
  alert("我是新的JS文件");
  alert("按钮测试成功");

  const employeeId = document.getElementById("id").value;
  const password = document.getElementById("pw").value;

  console.log(employeeId, password);
}*/

function check() {
  const btn = document.getElementById("checkBtn");

  // 1️⃣ 立即反馈（关键）
  btn.innerText = "打卡中...";
  btn.disabled = true;

  // 2️⃣ 先快速提示
  alert("正在打卡，请稍等...");

  // 3️⃣ 获取GPS（异步）
  navigator.geolocation.getCurrentPosition(
    pos => {
      sendCheck(pos.coords.latitude, pos.coords.longitude, btn);
    },
    err => {
      alert("定位失败");
      btn.innerText = "打卡";
      btn.disabled = false;
    },
    {
      enableHighAccuracy: false,  // ⚡ 提升速度
      timeout: 3000,              // ⚡ 最多等3秒
      maximumAge: 60000           // ⚡ 用缓存定位
    }
  );
}

function sendCheck(lat, lng, btn) {
  fetch("/api/check", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "authorization": localStorage.getItem("token")
    },
    body: JSON.stringify({ lat, lng })
  })
  .then(res => res.json())
  .then(data => {
    alert(data.msg);

    btn.innerText = "已打卡";
    btn.style.background = "green";
  })
  .catch(() => {
    alert("网络错误");
    btn.innerText = "打卡";
    btn.disabled = false;
  });
}

function loadAll() {
  fetch("/api/all")
    .then(res => res.json())
    .then(data => {
      console.log(data);

      const table = document.getElementById("tableBody");
      table.innerHTML = "";

      data.forEach(row => {
        const tr = `
          <tr>
            <td>${row.employee_id}</td>
			<td>${row.employee_name}</td>
			<td>${row.company_name}</td>
            <td>${row.adate}</td>
            <td>${row.check_in_time}</td>
            <td>${row.check_out_time}</td>
            <td>${row.check_in_lat}, ${row.check_in_lng}</td>
            <td>${row.check_out_lat || ""}, ${row.check_out_lng || ""}</td>
          </tr>
        `;
        table.innerHTML += tr;
      });
    });
}

function exportExcel() {
  window.open("/api/export");
}