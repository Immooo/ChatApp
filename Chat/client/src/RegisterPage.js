import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "./firebase";
import {
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  updateProfile,
} from "firebase/auth";
import { db } from "./firebase";
import { ref, set } from "firebase/database";
import "./App.css";
import googleLogo from "./googleLogo.png";

const RegisterPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPasswords, setShowPasswords] = useState(false);
  const [passwordsMatch, setPasswordsMatch] = useState(true);
  const [passwordLengthError, setPasswordLengthError] = useState(false); // New state for password length error
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!passwordsMatch) {
      console.error("Les mots de passe ne correspondent pas.");
      return;
    }

    if (password.length < 6) {
      setPasswordLengthError(true); // Set password length error to true
      return;
    }

    try {
      const { user } = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      await updateProfile(user, { displayName: email });

      const userRef = ref(db, `users/${user.uid}`);
      const newUser = {
        email: email,
      };

      set(userRef, newUser)
        .then(() => {
          setEmail("");
          setPassword("");
          setConfirmPassword("");
          navigate("/chat");
        })
        .catch((error) => {
          console.error(
            "Erreur lors de l'enregistrement de l'utilisateur :",
            error
          );
        });
    } catch (error) {
      console.error(error);
    }
  };

  const handleGoogleSignIn = () => {
    const provider = new GoogleAuthProvider();
    signInWithPopup(auth, provider)
      .then(() => {
        navigate("/chat");
      })
      .catch((error) => {
        console.error("Erreur lors de la connexion avec Google :", error);
      });
  };

  const handleGoBack = () => {
    navigate("/");
  };

  const toggleShowPasswords = () => {
    setShowPasswords(!showPasswords);
  };

  const handlePasswordChange = (e) => {
    const passwordValue = e.target.value;
    setPassword(passwordValue);

    // Check password length when setting password
    if (passwordValue.length < 6) {
      setPasswordLengthError(true);
    } else {
      setPasswordLengthError(false);
    }

    // Check passwords match when setting password
    if (passwordValue !== confirmPassword) {
      setPasswordsMatch(false);
    } else {
      setPasswordsMatch(true);
    }
  };

  const handleConfirmPasswordChange = (e) => {
    const confirmPasswordValue = e.target.value;
    setConfirmPassword(confirmPasswordValue);

    // Check password length when confirming password
    if (confirmPasswordValue.length < 6) {
      setPasswordLengthError(true);
    } else {
      setPasswordLengthError(false);
    }

    // Check passwords match when confirming password
    if (password !== confirmPasswordValue) {
      setPasswordsMatch(false);
    } else {
      setPasswordsMatch(true);
    }
  };


  return (
    <div>
      <div>
        <h3>Connexion avec Google :</h3>
        <button onClick={handleGoogleSignIn}>
          <img
            src={googleLogo}
            alt="Se connecter avec Google"
            className="google-logo"
          />
        </button>
      </div>

      <h2>Créer un compte :</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <div className="password-input">
          <input
            type={showPasswords ? "text" : "password"}
            placeholder="Mot de passe"
            value={password}
            onChange={handlePasswordChange} // use the new function
          />
        </div>
        <div className="password-input">
          <input
            type={showPasswords ? "text" : "password"}
            placeholder="Confirmer le mot de passe"
            value={confirmPassword}
            onChange={handleConfirmPasswordChange}
          />
          {confirmPassword && passwordLengthError && (
            <div style={{ color: "red" }}>
              Le nombre de caractères minimal pour un mot de passe est de 6.
            </div>
          )}
          {confirmPassword && !passwordsMatch && (
            <div style={{ color: "red" }}>
              Les mots de passe ne correspondent pas.
            </div>
          )}
          <span
            className={`password-toggle ${showPasswords ? "show" : ""}`}
            onClick={toggleShowPasswords}
          >
            {showPasswords ? "Cacher" : "Afficher"}
          </span>
        </div>

        <div>
          <button onClick={handleGoBack}>Revenir à l'accueil</button>
          &nbsp;
          <button type="submit" disabled={!passwordsMatch || passwordLengthError}>
            S'inscrire
          </button>
        </div>
      </form>
    </div>
  );
};

export default RegisterPage;
