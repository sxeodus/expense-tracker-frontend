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
  // Renamed updateUser to avoid confusion with local state
  const { logout, updateUser: updateAuthContextUser } = useAuth();
  const [pageData, setPageData] = useState({
    user: null,
    transactions: [],
  });
  const [loading, setLoading] = useState(true);
  const [editBudget, setEditBudget] = useState(false);
  const [newBudget, setNewBudget] = useState("");

  useEffect(() => {
    const fetchPageData = async () => {
      try {
        // Fetch user profile and transactions in parallel for efficiency
        const [userRes, transactionsRes] = await Promise.all([
          apiClient.get("/auth/me"),
          apiClient.get("/transactions"),
        ]);

        setPageData({
          user: userRes.data,
          transactions: transactionsRes.data,
        });

        // Initialize the budget input field with the current budget
        setNewBudget(userRes.data.budget || "");
      } catch (error) {
        console.error("Failed to fetch page data", error);
        // You could add logic here to redirect to login if unauthorized
      } finally {
        setLoading(false);
      }
    };
    fetchPageData();
  }, []);

  const handleBudgetUpdate = async () => {
    try {
      const response = await apiClient.put("/auth/budget", { budget: newBudget });
      const updatedUser = { ...pageData.user, budget: response.data.budget };
      setPageData({ ...pageData, user: updatedUser }); // Update local state for immediate feedback
      updateAuthContextUser(updatedUser); // Update the user in the global context
      setEditBudget(false);
    } catch (error) {
      console.error("Failed to update budget:", error);
      alert("Failed to update budget.");
    }
  };

  if (loading) return <div style={{ textAlign: "center", marginTop: "2rem" }}>Loading...</div>;
  if (!pageData.user) return <div style={{ textAlign: "center", marginTop: "2rem" }}>Could not load user data. Please try logging in again.</div>;

  const { user, transactions } = pageData;
  const budgetAmount = parseFloat(user.budget) || 0;

  const expenses = transactions
    .filter((t) => t.type === "expense")
    .reduce((acc, t) => acc + parseFloat(t.amount), 0);

  const balance = budgetAmount - expenses;

  const isOverspending = budgetAmount > 0 && expenses > budgetAmount;

  const data = {
    labels: ["Budget", "Expenses"],
    datasets: [
      {
        label: "Amount",
        data: [budgetAmount, expenses],
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
          ⚠️ Warning: You are overspending! Your expenses (${expenses.toFixed(2)}) exceed your budget (${budgetAmount.toFixed(2)}).
        </div>
      )}
      <div className="summary-cards">
        <Card
          title="Monthly Budget"
          value={
            editBudget ? (
              <div className="edit-budget-form">
                <input type="number" value={newBudget} onChange={e => setNewBudget(e.target.value)} placeholder="e.g., 1500" />
                <button onClick={handleBudgetUpdate} className="save-btn">Save</button>
              </div>
            ) : (
              <div className="budget-display">
                ${budgetAmount.toFixed(2)}
                <button onClick={() => { setEditBudget(true); setNewBudget(budgetAmount); }} className="edit-btn">Edit</button>
              </div>
            )
          }
        />
        <Card title="Left Of Monthly Budget" value={`$${balance.toFixed(2)}`} />
      </div>
      <div className="chart-container">
        <Bar data={data} options={options} />
      </div>
    </div>
  );
}

export default BudgetOverview;