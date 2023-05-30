import React from 'react';
import './App.css';
import { getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth";

const LoginPage = () => {
  const signInWithGoogle = () => {
    const auth = getAuth();
    const provider = new GoogleAuthProvider();
    signInWithPopup(auth, provider);
  };

  return (
    <div>
      <button onClick={signInWithGoogle}>Se connecter avec Google</button>
    </div>
  );
};

export default LoginPage;
