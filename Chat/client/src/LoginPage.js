import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "./firebase";
import { signInWithEmailAndPassword, onAuthStateChanged, sendPasswordResetEmail } from "@firebase/auth";
import "./App.css";

const LoginPage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        navigate("/chat"); // Redirige vers la page "chat" une fois connecté
      }
    });

    return () => {
      unsubscribe();
    };
  }, [navigate]);

  const signInWithEmail = (e) => {
    e.preventDefault();

    signInWithEmailAndPassword(auth, email, password)
      .then(() => {
        navigate("/chat");
      })
      .catch((error) => {
        setError("Une erreur s'est produite lors de la connexion.");
      });
  };

  const redirectToHome = () => {
    navigate("/");
  };

  const toggleShowPassword = () => {
    setShowPassword(!showPassword);
  };

  const sendResetPasswordEmail = (e) => {
    e.preventDefault();

    sendPasswordResetEmail(auth, resetEmail)
      .then(() => {
        setError("Un e-mail de réinitialisation de mot de passe a été envoyé à " + resetEmail);
      })
      .catch((error) => {
        setError("Une erreur s'est produite lors de l'envoi de l'e-mail de réinitialisation du mot de passe.");
      });
    };

  return (
    <div>
      <h2>Connexion :</h2>
      <form onSubmit={signInWithEmail}>
        <input
          type="email"
          placeholder="Adresse e-mail"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <br />
        <div className="password-input">
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Mot de passe"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <span
            className={`password-toggle ${showPassword ? "show" : ""}`}
            onClick={toggleShowPassword}
          >
            {showPassword ? "Cacher" : "Afficher"}
          </span>
        </div>
        <br />
        <button type="submit">Se connecter</button>
      </form>
      <form onSubmit={sendResetPasswordEmail}>
        <input
          type="email"
          placeholder="Adresse e-mail pour réinitialisation"
          value={resetEmail}
          onChange={(e) => setResetEmail(e.target.value)}
        />
        <br />
        <button type="submit">Mot de passe oublié</button>
      </form>

      {error && <p className="error">{error}</p>}

      <button onClick={redirectToHome}>Accueil</button>
    </div>
    
  );
};

export default LoginPage;
