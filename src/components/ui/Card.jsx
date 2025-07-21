import React from "react";

function Card({ children, title, value }) {
  return <div className="card">
    {children}
    <h3>{title}</h3>
    <p>{value}</p>
  </div>;
}

export default Card;
