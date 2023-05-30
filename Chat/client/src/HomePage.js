import React from "react";

function HomePage() {
  const navigateTo = (path) => {
    window.location.href = path;
  };

  return (
    <div>
      <h1>Mon Application de Chat en React</h1>
      <p>Bienvenue sur mon application de chat en React !</p>
      <div>
        <a href="/register">
          <button onClick={() => navigateTo("/register")} style={{ marginRight: '10px' }}>S'inscrire</button>
        </a>
        <a href="/login">
          <button onClick={() => navigateTo("/login")}>Se connecter</button>
        </a>
      </div>
    </div>
  );
}

export default HomePage;
