import React from "react";
import "./styles.css";

function Button({ text, onClick, blue, disabled, type = "button" }) {
  return (
    <button
      type={type}
      className={blue ? "btn btn-blue" : "btn"}
      onClick={onClick}
      disabled={disabled}
    >
      {text}
    </button>
  );
}

export default Button;
