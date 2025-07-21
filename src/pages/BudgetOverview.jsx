import React, { useEffect, useState } from "react";
import apiClient from "../api/axios";
import { useAuth } from "../context/AuthContext";
import Card from "../components/ui/Card";
import { Bar } from "react-chartjs-2";
import { Chart, BarElement, CategoryScale, LinearScale, Tooltip, Legend } from "chart.js";
import { Link } from "react-router-dom";
import "../styles/BudgetOverview.css"; // Consolidated stylesheet

// Register chart components
Chart.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

function BudgetOverview() {
  const { user, logout, updateUser } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editBudget, setEditBudget] = useState(false);
  const [newBudget, setNewBudget] = useState(user?.budget || 0);

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const res = await apiClient.get("/transactions");
        setTransactions(res.data);
      } catch (error) {
        console.error("Failed to fetch transactions", error);
      } finally {
        setLoading(false);
      }
    };
    fetchTransactions();
  }, []);

  useEffect(() => {
    if (user) {
      setNewBudget(user.budget);
    }
  }, [user]);

  const handleBudgetUpdate = async () => {
    try {
      const response = await apiClient.put("/auth/budget", {
        budget: newBudget,
      });
      // Update the user in the global context
      updateUser({ budget: response.data.budget });
      setEditBudget(false);
    } catch (error) {
      alert("Failed to update budget.");
    }
  };

  if (loading) return <div style={{ textAlign: "center", marginTop: "2rem" }}>Loading...</div>;
  if (!user) return null;

  const expenses = transactions
    .filter((t) => t.type === "expense")
    .reduce((acc, t) => acc + parseFloat(t.amount), 0);

  const balance = (user?.budget || 0) - expenses;

  const isOverspending = user && expenses > parseFloat(user.budget);

  const data = {
    labels: ["Budget", "Expenses"],
    datasets: [
      {
        label: "Amount",
        data: [parseFloat(user.budget), parseFloat(expenses)],
        backgroundColor: ["#007bff", "#dc3545"],
        borderRadius: 8,
        barThickness: 60,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: { display: false },
      title: { display: true, text: "Budget vs Expenses" },
      tooltip: { callbacks: { label: ctx => `$${ctx.parsed.y}` } }
    },
    scales: {
      y: { beginAtZero: true, ticks: { stepSize: 100 } }
    }
  };

  return (
    <div className="budget-overview-container">
      <header className="budget-header">
        <h2>Budget Overview</h2>
        <div className="header-nav">
          <Link to="/dashboard">← Dashboard</Link>
          <button onClick={logout} className="logout-button">Logout</button>
        </div>
      </header>
      {isOverspending && (
        <div className="overspending-warning">
          ⚠️ Warning: You are overspending! Your expenses (${expenses.toFixed(2)}) exceed your budget (${user?.budget}).
        </div>
      )}
      <div className="summary-cards">
        <Card
          title="Monthly Budget"
          value={
            editBudget ? (
              <div className="edit-budget-form">
                <input type="number" value={newBudget} onChange={e => setNewBudget(e.target.value)} />
                <button onClick={handleBudgetUpdate} className="save-btn">Save</button>
              </div>
            ) : (
              <div className="budget-display">
                ${parseFloat(user.budget).toFixed(2)}
                <button onClick={() => setEditBudget(true)} className="edit-btn">Edit</button>
              </div>
            )
          }
        />
        <Card title="Remaining Budget" value={`$${balance.toFixed(2)}`} />
      </div>
      <div className="chart-container">
        <Bar data={data} options={options} />
      </div>
    </div>
  );
}

export default BudgetOverview;