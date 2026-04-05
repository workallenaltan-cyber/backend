function login() {
  const employeeId = document.getElementById("id").value;
  const password = document.getElementById("pw").value;
  
  alert(employeeId);

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