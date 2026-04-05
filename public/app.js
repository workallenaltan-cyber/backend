let token = localStorage.getItem("token");

function login() {
  //fetch("/api/login", {//
  fetch("https://backend-z9ir.onrender.com/api/login", {
    method: "POST",
    headers: {"Content-Type":"application/json"},
    body: JSON.stringify({
      employeeId: id.value,
      password: pw.value
    })
  })
   .then(res => res.text())   // 👈 先用 text 看真实返回
  .then(data => {
    console.log("返回内容:", data);

    try {
      const json = JSON.parse(data);

      if (json.status === "success") {
        localStorage.setItem("token", json.token);
        window.location = "dashboard.html";
      } else {
        alert("登录失败");
      }
    } catch (e) {
      alert("后端没有返回JSON！");
    }
  });
}

function check() {
  navigator.geolocation.getCurrentPosition(pos => {
    fetch("/api/check", {
      method: "POST",
      headers: {
        "Content-Type":"application/json",
        "authorization": localStorage.getItem("token")
      },
      body: JSON.stringify({
        lat: pos.coords.latitude,
        lng: pos.coords.longitude
      })
    })
    .then(res=>res.json())
    .then(data=>alert(data.msg));
  });
}

function load() {
  fetch("/api/my", {
    headers: {
      "authorization": localStorage.getItem("token")
    }
  })
  .then(res=>res.json())
  .then(data=>{
    list.innerHTML="";
    data.forEach(r=>{
      list.innerHTML += `<li>${r.date} - ${r.check_in_time} / ${r.check_out_time}</li>`;
    });
  });
}