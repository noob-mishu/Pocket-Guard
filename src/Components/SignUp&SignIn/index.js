import React, { useState } from "react";
import "./styles.css";
import Input from "../Input";
import Button from "../Button";
import { toast } from "react-toastify";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
} from "firebase/auth";
import { auth, db, provider } from "../../firebase";
import { doc, getDoc, setDoc, Timestamp } from "firebase/firestore";
import { GoogleAuthProvider } from "firebase/auth/web-extension";
import { useNavigate } from "react-router-dom";
import { getFirebaseErrorMessage } from "../../utils/firebaseErrors";

function SignupSigninComponent() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [loginForm, setloginForm] = useState(false);

  const navigate = useNavigate();

  async function signupWithEmail() {
    if (name && email && password && confirmPassword) {
      if (password === confirmPassword) {
        setLoading(true);
        try {
          const userCredential = await createUserWithEmailAndPassword(
            auth,
            email,
            password
          );
          const user = userCredential.user;
          toast.success("User Created!");
          await createDoc(user);
          setName("");
          setPassword("");
          setEmail("");
          setConfirmPassword("");
          navigate("/dashboard");
        } catch (error) {
          toast.error(getFirebaseErrorMessage(error));
        } finally {
          setLoading(false);
        }
      } else {
        toast.error("Password and Confirm Password don't match!");
      }
    } else {
      toast.error("All fields are mandatory!");
    }
  }

  async function loginUsingEmail() {
    if (email && password) {
      setLoading(true);
      try {
        const userCredential = await signInWithEmailAndPassword(
          auth,
          email,
          password
        );
        const user = userCredential.user;
        toast.success("Login Successful!");
        await createDoc(user);
        navigate("/dashboard");
      } catch (error) {
        toast.error(getFirebaseErrorMessage(error));
      } finally {
        setLoading(false);
      }
    } else {
      toast.error("All fields are mandatory!");
    }
  }

  async function createDoc(user) {
    if (!user) return;

    const userRef = doc(db, "users", user.uid);
    const userData = await getDoc(userRef);

    if (!userData.exists()) {
      await setDoc(userRef, {
        name: user.displayName || name,
        email: user.email,
        photoURL: user.photoURL || "",
        createdAt: Timestamp.now(),
      });
      toast.success("Document created successfully!");
    } else {
      toast.info("User already exists!");
    }
  }

  async function googleAuth() {
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      toast.success("Google Authentication Successful!");
      await createDoc(user);
      navigate("/dashboard");
    } catch (error) {
      toast.error(getFirebaseErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {loginForm ? (
        <div className="signup-wrapper">
          <h2 className="title">
            Log in to<span style={{ color: "var(--theme)" }}> Yo Wallet</span>
          </h2>
          <form>
            <Input
              type="email"
              label={"Email"}
              state={email}
              setState={setEmail}
              placeholder={"JohnDoe@gmail.com"}
            />
            <Input
              type="password"
              label={"Password"}
              state={password}
              setState={setPassword}
              placeholder={"Example@123"}
            />

            <Button
              disabled={loading}
              text={loading ? "Loading..." : "Log in with email"}
              onClick={loginUsingEmail}
            />

            <Button
              onClick={googleAuth}
              disabled={loading}
              text={loading ? "Loading..." : "Log in with Google"}
              blue={true}
            />

            <button
              type="button"
              className="p-login"
              onClick={() => setloginForm(!loginForm)}
            >
              New here? Create an account
            </button>
          </form>
        </div>
      ) : (
        <div className="signup-wrapper">
          <h2 className="title">
            Create your
            <span style={{ color: "var(--theme)" }}> Yo Wallet</span> account
          </h2>
          <form>
            <Input
              label={"Full Name"}
              state={name}
              setState={setName}
              placeholder={"John Doe"}
            />
            <Input
              type="email"
              label={"Email"}
              state={email}
              setState={setEmail}
              placeholder={"JohnDoe@gmail.com"}
            />
            <Input
              type="password"
              label={"Password"}
              state={password}
              setState={setPassword}
              placeholder={"Example@123"}
            />
            <Input
              type="password"
              label={"Confirm Password"}
              state={confirmPassword}
              setState={setConfirmPassword}
              placeholder={"Example@123"}
            />

            <Button
              disabled={loading}
              text={loading ? "Loading..." : "Create account with email"}
              onClick={signupWithEmail}
            />

            <Button
              onClick={googleAuth}
              disabled={loading}
              text={loading ? "Loading..." : "Sign up with Google"}
              blue={true}
            />

            <button
              type="button"
              className="p-login"
              onClick={() => setloginForm(!loginForm)}
            >
              Already have an account? Log in
            </button>
          </form>
        </div>
      )}
    </>
  );
}

export default SignupSigninComponent;