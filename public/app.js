let token = localStorage.getItem("token");

function login() {
  fetch("/api/login", {
    method: "POST",
    headers: {"Content-Type":"application/json"},
    body: JSON.stringify({
      employeeId: id.value,
      password: pw.value
    })
  })
  .then(res=>res.json())
  .then(data=>{
    if(data.status==="success"){
      localStorage.setItem("token", data.token);
      window.location = "dashboard.html";
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