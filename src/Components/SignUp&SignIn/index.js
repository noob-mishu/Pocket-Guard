import React, { useState } from "react";
import "./styles.css";
import Input from "../Input"; 
import Button from "../Button";
import { toast } from "react-toastify";
import {createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "../../Firebase";


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
        })
        .catch((error) => {
          const errorCode = error.code;
          const errorMessage = error.message;
          toast.error(errorMessage);
          toast.error(errorCode);
          setLoading(false);
          console.error(errorMessage);
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
}

function creatDoc(user){

//creatingdoc
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


    