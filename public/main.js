document.addEventListener("DOMContentLoaded", function () {
  // Check if a valid token is available in local storage
  const token = localStorage.getItem("token");

  // Get the navbar element
  const navbar = document.querySelector(".navbar-nav");

  if (token) {
    // If a token is present, user is logged in
    // Fetch user information from the token or any other API if needed
    // For now, let's assume the token contains the user's username and role
    const decodedToken = parseJwt(token);
    const userId = decodedToken ? decodedToken.userId : null;
    const username = decodedToken ? decodedToken.username : null;
    const role = decodedToken ? decodedToken.role : null;

    // Update the navbar with user-specific content
    navbar.innerHTML = `
    <li class="nav-item">
      <span class="nav-link">Welcome, <a href="user.html?userId=${userId}">${username}</a></span>
    </li>
    <li class="nav-item">
      <a class="m-2 btn btn-danger" href="#" onclick="logout()">Logout</a>
    </li>
  `;

    // If the user is a creator, display the Upload button
    if (role === "creator") {
      navbar.innerHTML += `
      <li class="nav-item">
        <a class="m-2 btn btn-primary" href="upload.html">Upload</a>
      </li>
    `;
    }
  } else {
    // If no token is present, user is not logged in
    // Update the navbar with login and signup links
    navbar.innerHTML = `
    <li class="nav-item">
      <a class="nav-link" href="login.html">Login</a>
    </li>
    <li class="nav-item">
      <a class="nav-link" href="register.html">Sign Up</a>
    </li>
  `;
  }
});

// Function to parse JWT token and extract information
function parseJwt(token) {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map(function (c) {
          return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
        })
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error("Error parsing JWT token:", error);
    return null;
  }
}

// Function to handle logout
function logout() {
  // Clear the token from local storage
  localStorage.removeItem("token");

  // Redirect or perform any other action after logout
  // For now, let's reload the page
  window.location.reload();
}
