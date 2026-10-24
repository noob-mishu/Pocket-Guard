import React from "react";
import "./styles.css";

/**
 * Reusable button component.
 * @param {Object} props
 * @param {string} props.text - Button label text.
 * @param {Function} [props.onClick] - Click handler.
 * @param {boolean} [props.blue] - Applies blue styling when true.
 * @param {boolean} [props.disabled] - Disables the button when true.
 * @param {"button"|"submit"|"reset"} [props.type="button"] - Button type attribute.
 * @returns {JSX.Element}
 */
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
