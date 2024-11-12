import React, { useState } from "react";
import Input from "../Input"; 
import Button from "../Button";


function SignupSigninComponent() 
{ const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
    return (
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
            label={"Email"}
            state={email}
            setState={setEmail}
            placeholder={"JohnDoe@gmail.com"}
          />
          <Input
            label={"Password"}
            state={password}
            setState={setPassword}
            placeholder={"Example@123"}
          />
          <Input
            label={"Confirm Password"}
            state={confirmPassword}
            setState={setConfirmPassword}
            placeholder={"Example@123"}
          />
        <Button text={"Sign Up Using Email And Password"}/>
        </form>
      </div>
    );
}

export default SignupSigninComponent;


    