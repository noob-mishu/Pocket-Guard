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

function SignupSigninComponent() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [loginForm, setloginForm] = useState(false);

  const navigate = useNavigate();

  function signupWithEmail() {
    setLoading(true);

    if (name && email && password && confirmPassword) {
      if (password === confirmPassword) {
        createUserWithEmailAndPassword(auth, email, password)
          .then((userCredential) => {
            const user = userCredential.user;
            toast.success("User Created!");
            setLoading(false);
            setName("");
            setPassword("");
            setEmail("");
            setConfirmPassword("");
            createDoc(user);
            navigate("/dashboard");
          })
          .catch((error) => {
            toast.error(error.message);
            setLoading(false);
          });
      } else {
        toast.error("Password and Confirm Password don't match!");
        setLoading(false);
      }
    } else {
      toast.error("All fields are mandatory!");
      setLoading(false);
    }
  }

  function loginUsingEmail() {
    setLoading(true);

    if (email && password) {
      signInWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
          const user = userCredential.user;
          toast.success("Login Successful!");
          createDoc(user);
          setLoading(false);
          navigate("/dashboard");
        })
        .catch((error) => {
          toast.error(error.message);
          setLoading(false);
        });
    } else {
      toast.error("All fields are mandatory!");
      setLoading(false);
    }
  }

  async function createDoc(user) {
    if (!user) return;

    const userRef = doc(db, "users", user.uid);
    const userData = await getDoc(userRef);

    if (!userData.exists()) {
      try {
        await setDoc(userRef, {
          name: user.displayName || name,
          email: user.email,
          photoURL: user.photoURL || "",
          createdAt: Timestamp.now(), // Fixed the issue
        });

        toast.success("Document created successfully!");
      } catch (e) {
        toast.error(e.message);
      } finally {
        setLoading(false);
      }
    } else {
      toast.info("User already exists!");
      setLoading(false);
    }
  }

  function googleAuth() {
    setLoading(true);

    signInWithPopup(auth, provider)
      .then((result) => {
        const user = result.user;
        toast.success("Google Authentication Successful!");
        createDoc(user);
        setLoading(false);
        navigate("/dashboard");
      })
      .catch((error) => {
        toast.error(error.message);
        setLoading(false);
      });
  }

  return (
    <>
      {loginForm ? (
        <div className="signup-wrapper">
          <h2 className="title">
            Login on<span style={{ color: "var(--theme)" }}> Pocket-Guard</span>
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
              text={loading ? "Loading..." : "Login Using Email And Password"}
              onClick={loginUsingEmail}
            />

            <Button
              onClick={googleAuth}
              text={loading ? "Loading..." : "Login Using Google"}
              blue={true}
            />

            <p
              className="p-login"
              style={{ cursor: "pointer" }}
              onClick={() => setloginForm(!loginForm)}
            >
              Don't Have An Account? Click Here
            </p>
          </form>
        </div>
      ) : (
        <div className="signup-wrapper">
          <h2 className="title">
            Sign Up on <span style={{ color: "var(--theme)" }}>Pocket-Guard.</span>
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
              text={loading ? "Loading..." : "Sign Up Using Email And Password"}
              onClick={signupWithEmail}
            />

            <Button
              onClick={googleAuth}
              text={loading ? "Loading..." : "Sign Up Using Google"}
              blue={true}
            />

            <p
              className="p-login"
              style={{ cursor: "pointer" }}
              onClick={() => setloginForm(!loginForm)}
            >
              Have An Account? Click Here
            </p>
          </form>
        </div>
      )}
    </>
  );
}

export default SignupSigninComponent;
