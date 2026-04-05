let token = localStorage.getItem("token");

function login() {
  //fetch("/api/login", {//
  app.post("/api/login", async (req, res) => {
  try {
    const { employeeId, password } = req.body;

    // ❌ 不要查数据库（先注释掉）
    // const result = await pool.query(...);

    if (employeeId === "MA001" && password === "1234") {
      return res.json({
        status: "success",
        token: "abc123"
      });
    }

    return res.json({ status: "fail" });

  } catch (err) {
    console.error("LOGIN ERROR:", err);
    res.status(500).json({ error: "server error" });
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