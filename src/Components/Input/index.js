import React, { useId } from "react";
import "./styles.css";

function Input({ label, state, setState, placeholder, type = "text" }) {
  const id = useId();
  return (
    <div className="input-wrapper">
      <label className="label-input" htmlFor={id}>
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={state}
        placeholder={placeholder}
        onChange={(e) => setState(e.target.value)}
        className="custom-input"
      />
    </div>
  );
}

export default Input;
