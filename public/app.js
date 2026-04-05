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
      console.log(data);
      alert(data.msg);
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
            <td>${row.date}</td>
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