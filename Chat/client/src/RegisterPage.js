import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAuth, createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, updateProfile, sendEmailVerification } from "firebase/auth";
import { getDatabase, ref, set } from "firebase/database";
import "./App.css";
import googleLogo from "./googleLogo.png";

const RegisterPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPasswords, setShowPasswords] = useState(false);
  const [passwordsMatch, setPasswordsMatch] = useState(true);
  const [passwordLengthError, setPasswordLengthError] = useState(false); 
  const [emailUsed, setEmailUsed] = useState(false);
  const navigate = useNavigate();
  const auth = getAuth();
  const db = getDatabase();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!passwordsMatch || password.length < 6) {
      console.error("Les mots de passe ne correspondent pas ou sont trop courts.");
      return;
    }

    createUserWithEmailAndPassword(auth, email, password)
    .then(async ({ user }) => {
      // Envoyer l'email de vérification
      await sendEmailVerification(user)
        .then(() => {
          console.log("Email de vérification envoyé");
        })
        .catch((error) => {
          console.error("Erreur lors de l'envoi de l'email de vérification :", error);
        });

      await updateProfile(user, { displayName: email });

      const userRef = ref(db, `users/${user.uid}`);
      const newUser = { email: email };

      set(userRef, newUser)
        .then(() => {
          setEmail("");
          setPassword("");
          setConfirmPassword("");
          setEmailUsed(false);
          setTimeout(() => navigate("/chat"), 0);
        })
        .catch((error) => {
          console.error("Erreur lors de l'enregistrement de l'utilisateur :", error);
        });
    })
    .catch((error) => {
      if (error.code === 'auth/email-already-in-use') {
        setEmailUsed(true);
      } else {
        console.error("Error registering the user: ", error);
      }
    });
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
    setPasswordLengthError(passwordValue.length < 6);
    setPasswordsMatch(passwordValue === confirmPassword);
  };

  const handleConfirmPasswordChange = (e) => {
    const confirmPasswordValue = e.target.value;
    setConfirmPassword(confirmPasswordValue);
    setPasswordLengthError(confirmPasswordValue.length < 6);
    setPasswordsMatch(password === confirmPasswordValue);
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
          onChange={(e) => {
            setEmail(e.target.value);
            setEmailUsed(false);
          }}
        />
        {emailUsed && <div style={{ color: "red" }}>Cette adresse e-mail est déjà utilisée.</div>}
        <div className="password-input">
          <input
            type={showPasswords ? "text" : "password"}
            placeholder="Mot de passe"
            value={password}
            onChange={handlePasswordChange}
          />
        </div>
        <div className="password-input">
          <input
            type={showPasswords ? "text" : "password"}
            placeholder="Confirmer le mot de passe"
            value={confirmPassword}
            onChange={handleConfirmPasswordChange}
          />
          {confirmPassword && passwordLengthError && <div style={{ color: "red" }}>Le nombre de caractères minimal pour un mot de passe est de 6.</div>}
          {confirmPassword && !passwordsMatch && <div style={{ color: "red" }}>Les mots de passe ne correspondent pas.</div>}
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
