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
	  localStorage.setItem("token", data.token);
	  localStorage.setItem("user", JSON.stringify(data.user));

	  // 🔥 登录后先检查状态
	  fetch("/api/status", {
		headers: {
		  "authorization": data.token
		}
	  })
	  .then(res => res.json())
	  .then(status => {

		if (status.status === "not_checked_in") {
		  window.location = "checkin.html";
		}

		if (status.status === "checked_in") {
		  window.location = "checkout.html";
		}

		if (status.status === "completed") {
		  window.location = "done.html";
		}

	  });
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
  navigator.geolocation.getCurrentPosition(pos => {

    fetch("/api/check", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "authorization": localStorage.getItem("token")
      },
      body: JSON.stringify({
        lat: pos.coords.latitude,
        lng: pos.coords.longitude
      })
    })
    .then(res => res.json())
    .then(data => {
      alert(data.msg);

      // 🔥 只刷新状态，不自己判断
      loadStatus();
    });

  }, () => {
    alert("无法获取GPS");
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

function loadStatus() {
  fetch("/api/status", {
    headers: {
      "authorization": localStorage.getItem("token")
    }
  })
  .then(res => res.json())
  .then(data => {
    console.log("状态:", data);

    const inBtn = document.getElementById("checkInBtn");
    const outBtn = document.getElementById("checkOutBtn");

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
      //alert("今天已完成打卡");
    }

  });
}



function loadUserInfo() {
  const user = JSON.parse(localStorage.getItem("user"));

  if (!user) return;

  document.getElementById("userInfo").innerHTML = `
  <div style="display:flex; align-items:center; gap:10px;">
    <div style="
      width:40px;
      height:40px;
      border-radius:50%;
      background:white;
      color:black;
      display:flex;
      align-items:center;
      justify-content:center;
      font-weight:bold;">
      ${user.name.charAt(0)}
    </div>
    <div>
      <small><strong>${user.employeeId} - ${user.name}</strong></small><br>
      <small>${user.company}</small>
    </div>
  </div>
`;
}
document.addEventListener("DOMContentLoaded", () => {
  loadStatus();
  loadUserInfo(); // 🔥 加这个
});