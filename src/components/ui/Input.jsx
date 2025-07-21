import React from "react";

function Input({ type = "text", name, value, onChange, placeholder, inputRef }) {
  return (
    <input
      type={type}
      ref={inputRef}
      name={name}
      value={value}
      onChange={onChange}
      className="custom-input"
      placeholder={placeholder}
    />
  );
}

export default Input;
