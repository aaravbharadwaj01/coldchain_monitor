// =====================================================================
// Cold Chain Monitor — Login
// =====================================================================

const loginForm = document.getElementById("loginForm");
const username = document.getElementById("username");
const password = document.getElementById("password");
const remember = document.getElementById("remember");
const togglePassword = document.getElementById("togglePassword");
const loginBtn = document.getElementById("loginBtn");
const message = document.getElementById("message");

// =====================================================================
// Show / Hide Password
// =====================================================================
togglePassword.addEventListener("click", () => {
    if (password.type === "password") {
        password.type = "text";
        togglePassword.classList.remove("fa-eye");
        togglePassword.classList.add("fa-eye-slash");
    } else {
        password.type = "password";
        togglePassword.classList.remove("fa-eye-slash");
        togglePassword.classList.add("fa-eye");
    }
});

// =====================================================================
// Remember User
// =====================================================================
window.onload = () => {
    const savedUser = localStorage.getItem("rememberUser");
    if (savedUser) {
        username.value = savedUser;
        remember.checked = true;
    }
};

// =====================================================================
// Login
// =====================================================================
loginForm.addEventListener("submit", function(e){

    e.preventDefault();

    const user = username.value.trim();
    const pass = password.value.trim();

    message.innerHTML = "";
    message.className = "message";

    if(user===""){
        showError("Please enter your email.");
        username.focus();
        return;
    }

    if(pass===""){
        showError("Please enter your password.");
        password.focus();
        return;
    }

    loginBtn.disabled = true;
    loginBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Logging In...`;

    // =================================================================
    // 🔌 BACKEND / SQL INTEGRATION POINT
    // -----------------------------------------------------------------
    // Replace the setTimeout() demo block below with a real call to the
    // backend authentication endpoint, which checks the submitted
    // credentials against the SQL `users` table (passwords stored as
    // bcrypt hashes, never in plain text) and returns a session token
    // / JWT on success. See backend/api/server.js -> POST /api/auth/login
    // and backend/database/schema.sql -> `users` table.
    //
    // Example real implementation:
    //
    // try {
    //   const res = await fetch("/api/auth/login", {
    //     method: "POST",
    //     headers: { "Content-Type": "application/json" },
    //     body: JSON.stringify({ email: user, password: pass })
    //   });
    //   if(!res.ok) throw new Error("Invalid credentials");
    //   const { token, user: userData } = await res.json();
    //   localStorage.setItem("isLoggedIn", "true");
    //   localStorage.setItem("authToken", token);
    //   localStorage.setItem("loggedInUser", userData.name);
    //   if(remember.checked) localStorage.setItem("rememberUser", user);
    //   else localStorage.removeItem("rememberUser");
    //   showSuccess("Login Successful");
    //   setTimeout(()=> window.location.href = "../dashboard/dashboard.html", 1000);
    // } catch (err) {
    //   showError("Invalid Email or Password");
    //   loginBtn.disabled = false;
    //   loginBtn.innerHTML = "Login";
    // }
    // =================================================================

    // ---- Demo/mock login (no backend yet) ----
    setTimeout(()=>{

        if(user==="admin" && pass==="admin123"){

            localStorage.setItem("isLoggedIn","true");
            localStorage.setItem("loggedInUser",user);

            if(remember.checked){
                localStorage.setItem("rememberUser",user);
            }else{
                localStorage.removeItem("rememberUser");
            }

            showSuccess("Login Successful");

            setTimeout(()=>{
                window.location.href="../dashboard/dashboard.html";
            },1000);

        } else {

            showError("Invalid Email or Password");
            loginBtn.disabled=false;
            loginBtn.innerHTML="Login";

        }

    },1500);

});

// =====================================================================
// Forgot Password
// =====================================================================
document.getElementById("forgotPassword").addEventListener("click",(e)=>{
    e.preventDefault();
    // 🔌 INTEGRATION POINT: POST /api/auth/forgot-password { email } ->
    // backend generates a reset token, stores it in SQL `password_resets`
    // table, and emails a reset link to the user.
    alert("Please contact your administrator to reset the password.");
});

// =====================================================================
// Success / Error helpers
// =====================================================================
function showSuccess(text){
    message.className="message success";
    message.innerHTML=`<i class="fa-solid fa-circle-check"></i> ${text}`;
}

function showError(text){
    message.className="message error";
    message.innerHTML=`<i class="fa-solid fa-circle-xmark"></i> ${text}`;
}

// =====================================================================
// Enter Key submits form
// =====================================================================
document.addEventListener("keydown",(e)=>{
    if(e.key==="Enter"){
        loginForm.requestSubmit();
    }
});

// =====================================================================
// Auto Login (uncomment once real session validation is in place)
// =====================================================================
// if(localStorage.getItem("isLoggedIn")==="true"){
//     window.location.href="../dashboard/dashboard.html";
// }
