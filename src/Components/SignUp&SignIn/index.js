import React, { useState } from "react";
import "./styles.css";
import Input from "../Input"; 
import Button from "../Button";
import { toast } from "react-toastify";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,

 } from "firebase/auth";
import { auth,db } from "../../firebase";
import { doc,getDoc,setDoc } from "firebase/firestore";


function SignupSigninComponent() 
{ const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [loginForm, setloginForm] = useState(false);


  function signupWithEmail()
  {
    setLoading(true);
    console.log("Name",name);
    console.log("email",email);
    console.log("password",password);
    console.log("confirmpassword",confirmPassword);

  // Authenticate the user, or basically create a new account using email and pass
  if (name !== "" && email !== "" && password !== "" && confirmPassword !== "") {
    if (password === confirmPassword) {
      createUserWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
          // Signed in
          const user = userCredential.user;
          console.log("User:", user);
          toast.success("User Created!");
          setLoading(false);
          setName("");
          setPassword("");
          setEmail("");
          setConfirmPassword("");
          createDoc(user);
          navigator("/dashboard")
        })
        .catch((error) => {
          const errorCode = error.code;
          const errorMessage = error.message;
          toast.error(errorMessage);
          setLoading(false);
        });
    }
     else {
      toast.error("Password and Confirm Password don't match!");
      setLoading(false);
    }
  } else {
    toast.error("All fields are mandatory!");
    setLoading(false);
  }
  
}

function loginUsingEmail()
{
  console.log("Email",email);
  console.log("password",password);
  setLoading(true);
  if (email !== "" && password !== "") {
  
      signInWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
          // Signed in
          const user = userCredential.user;
          toast.success("User Created!");
          console.log("User:", user);
          createDoc(user);
          setLoading(false);
          navigator("Dashboard")
        })
        .catch((error) => {
          const errorCode = error.code;
          const errorMessage = error.message;
          toast.error(errorMessage);
          setLoading(false);
        });
  } else {
    toast.error("All fields are mandatory!");
    setLoading(false);
  }
}

async function createDoc(user) {
  setLoading(true);
  // Make sure that the doc with the uid doesn't exist
  // Create a doc.
  if (!user) return;

  const userRef = doc(db, "users", user.uid);
  const userData = await getDoc(userRef);

  if (!userData.exists()) {
    try {
      await setDoc(doc(db, "users", user.uid), {
        name: user.displayName ? user.displayName : name,
        email:user.email,
        photoURL: user.photoURL ? user.photoURL : "",
        createdAt:user.createdAt,
      });

      toast.success("Doc created!");
      setLoading(false);
    } catch (e) {
      toast.error(e.message);
      setLoading(false);
    }
  }
    else {
      toast.error("All fields are mandatory!");
      setLoading(false);
    }

}




return (
  <>
      {loginForm ? (   
        <div className="signup-wrapper">
          <h2 className="title">
            Login on<span style={{color: "var(--theme)"}}> Pocket-Guard</span>
     
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
        text={loading ? "Loading..." :"Login Using Email And Password"} 
        onClick={loginUsingEmail}/>

        <Button 
        text={loading? "Loading..." :"Login Using Google"} 
        blue={true}
        />
       <p className="p-login" style={{cursor:"pointer"}} onClick={()=>setloginForm(!loginForm)}>
        Don't Have An Account? CLick Here
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
        text={loading ? "Loading..." :"Sign Up Using Email And Password"} 
        onClick={signupWithEmail}
        />
        
        <Button text={loading? "Loading..." :"Sign Up Using Google"} 
        blue={true}
        />
      <p className="p-login" 
      style={{cursor:"pointer"}}
      onClick={()=>setloginForm(!loginForm)}
      >
        Have An Account? CLick Here
        </p>
        </form>
      </div>
    )}
    </>
    );
}

export default SignupSigninComponent;


    