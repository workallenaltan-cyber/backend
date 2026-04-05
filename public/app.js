// 登录
function login() {
  console.log("登录点击");

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
      window.location = "dashboard.html";
    } else {
      alert("登录失败");
    }
  })
  .catch(err => {
    console.error("错误:", err);
    alert("请求失败");
  });
}


// 打卡
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

  });

/*function login() {
  alert("我是新的JS文件");
  alert("按钮测试成功");

  const employeeId = document.getElementById("id").value;
  const password = document.getElementById("pw").value;

  console.log(employeeId, password);
}*/