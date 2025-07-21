import React, { useEffect, useState } from "react";
import apiClient from "../api/axios";
import { useAuth } from "../context/AuthContext";
import Card from "../components/ui/Card";
import { Link } from "react-router-dom";
import "../styles/ExpenseTracker.css"; // Consolidated stylesheet
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFilter } from "@fortawesome/free-solid-svg-icons";
import { Pie } from "react-chartjs-2";
import { Chart, ArcElement, Tooltip, Legend } from "chart.js";
import ChartDataLabels from "chartjs-plugin-datalabels";

// Register chart components
Chart.register(ArcElement, Tooltip, Legend, ChartDataLabels);

function ExpenseTracker() {
  const { user, logout } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [isOverspending, setIsOverspending] = useState(false);
  const [form, setForm] = useState({
    type: "expense",
    amount: "",
    description: "",
    category: "",
  });
  const [filterCategory, setFilterCategory] = useState("all");
  const [editId, setEditId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5; // Show 5 transactions per page

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const res = await apiClient.get("/transactions");
        setTransactions(res.data);
      } catch (error) {
        console.error("Error loading transactions:", error);
      }
    };

    fetchTransactions();
  }, []);

  // Reset to page 1 when the filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [filterCategory]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { amount, description } = form;
    if (!amount || isNaN(amount) || !description) {
      alert("Please fill in all fields correctly.");
      return;
    }

    try {
      const payload = {
        ...form,
        category: form.category.trim() || "General",
      };

      if (editId) {
        const response = await apiClient.put(`/transactions/${editId}`, payload);
        setTransactions(
          transactions.map((t) => (t.id === editId ? response.data.transaction : t))
        );
      } else {
        const response = await apiClient.post("/transactions", payload);
        // Add new transaction to the top of the list for better UX
        setTransactions([response.data.transaction, ...transactions]);
      }

      setForm({ type: "expense", amount: "", description: "", category: "" });
      setEditId(null);
    } catch (error) {
      console.error("Error saving transaction:", error);
      alert("Failed to save transaction.");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this transaction?")) return;
    try {
      await apiClient.delete(`/transactions/${id}`);
      setTransactions(transactions.filter((t) => t.id !== id));
    } catch (error) {
      console.error("Failed to delete transaction", error);
    }
  };

  const handleEdit = (transaction) => {
    setForm({
      type: transaction.type,
      amount: transaction.amount,
      description: transaction.description,
      category: transaction.category,
    });
    setEditId(transaction.id);
  };

  const generateCSV = () => {
    const headers = ["Description", "Amount", "Type", "Category", "Added Date", "Edited Date"];
    const rows = transactions.map(t => [
      t.description,
      parseFloat(t.amount).toFixed(2),
      t.type,
      t.category,
      new Date(t.created_at).toLocaleDateString(),
      t.updated_at && t.updated_at !== t.created_at
        ? new Date(t.updated_at).toLocaleDateString()
        : ""
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "expense-report.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const income = transactions
    .filter((t) => t.type === "income")
    .reduce((acc, t) => acc + parseFloat(t.amount), 0);

  const expenses = transactions
    .filter((t) => t.type === "expense")
    .reduce((acc, t) => acc + parseFloat(t.amount), 0);

  const total = income + expenses;

  // Pie Chart Data and Options
  const pieData = {
    labels: ["Income", "Expenses"],
    datasets: [
      {
        data: [income, expenses],
        backgroundColor: [
          "rgba(0, 200, 255, 0.85)", // blue-cyan
          "rgba(255, 99, 132, 0.85)", // red-pink
        ],
        borderColor: [
          "rgba(0, 200, 255, 1)",
          "rgba(255, 99, 132, 1)",
        ],
        borderWidth: 3,
        hoverOffset: 10,
      },
    ],
  };

  const pieOptions = {
    plugins: {
      legend: {
        display: true,
        position: "bottom",
        labels: {
          color: "#222",
          font: { size: 15, weight: "bold" },
          padding: 18,
        },
      },
      datalabels: {
        color: "#fff",
        font: { weight: "bold", size: 16 },
        formatter: (value, context) => {
          const percent = total ? ((value / total) * 100).toFixed(0) : 0;
          return percent > 0 ? percent + "%" : "";
        },
        display: true,
        anchor: "center",
      },
      tooltip: {
        callbacks: {
          label: function (context) {
            const label = context.label || "";
            const value = context.parsed;
            const percent = total ? ((value / total) * 100).toFixed(1) : 0;
            return `${label}: $${value} (${percent}%)`;
          },
        },
      },
    },
    responsive: true,
    maintainAspectRatio: false,
  };

  useEffect(() => {
    if (user && expenses > parseFloat(user.budget)) {
      setIsOverspending(true);
    } else {
      setIsOverspending(false);
    }
  }, [user, expenses]);

  const filteredTransactions = filterCategory === "all"
    ? transactions
    : transactions.filter(t => t.category === filterCategory);

  const categories = [...new Set(transactions.map(t => t.category))];

  // --- Pagination Logic ---
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentTransactions = filteredTransactions.slice(indexOfFirstItem, indexOfLastItem);

  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);

  return (
    <div className="expense-tracker">
      <header className="dashboard-header">
        <div>
          <h2>Expense Tracker</h2>
          {user && (
            <p className="welcome-message">
              Welcome, <strong>{user.firstname} {user.lastname}</strong>
            </p>
          )}
        </div>
        <div className="header-meta">
          <p>{new Date().toLocaleDateString(undefined, { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
          <button onClick={logout} className="logout-button">Logout</button>
        </div>
      </header>

      <nav className="dashboard-nav">
        <Link to="/budget-overview">
          📊 Go To Budget Overview
        </Link>
        <Link to="/profile">
          👤 Profile
        </Link>
      </nav>

      {isOverspending && (
        <div className="overspending-warning">
          ⚠️ Warning: You are overspending! Your expenses (${expenses.toFixed(2)}) exceed your budget (${user?.budget}).
        </div>
      )}

      <div className="summary-cards">
        <Card title="Income" value={`$${income.toFixed(2)}`} />
        <div className="pie-chart-container">
          <Pie data={pieData} options={pieOptions} />
        </div>
        <Card title="Expenses" value={`$${expenses.toFixed(2)}`} />
      </div>

      <form onSubmit={handleSubmit} className="transaction-form">
        <select name="type" value={form.type} onChange={handleChange}>
          <option value="income">Income</option>
          <option value="expense">Expense</option>
        </select>
        <input
          name="amount"
          type="number"
          placeholder="Amount"
          value={form.amount}
          onChange={handleChange}
        />
        <input
          name="description"
          placeholder="Description"
          value={form.description}
          onChange={handleChange}
        />
        <input
          name="category"
          placeholder="Category"
          value={form.category}
          onChange={handleChange}
        />
        <button type="submit">{editId ? "Update" : "Add"}</button>
      </form>

      <div className="filter-bar">
        <label>
          <FontAwesomeIcon icon={faFilter} style={{ marginRight: "0.4rem" }} />
          Filter By Category:
        </label>
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
        >
          <option value="all">All</option>
          {categories.map((cat, idx) => (
            <option key={idx} value={cat}>{cat}</option>
          ))}
        </select>
        <button onClick={generateCSV}>
          Download CSV
        </button>
      </div>

      <div className="transaction-list">
        {currentTransactions.length > 0 ? (
          currentTransactions.map((t) => (
            <div key={t.id} className={`transaction-item ${t.type}`}>
              <div className="transaction-details">
                <span className="transaction-description">{t.description}</span>
                <span className="transaction-category">{t.category}</span>
                <small className="transaction-date">
                  Added: {new Date(t.created_at).toLocaleDateString()}
                  {t.updated_at && t.updated_at !== t.created_at && (
                    <> • Edited: {new Date(t.updated_at).toLocaleDateString()}</>
                  )}
                </small>
              </div>
              <div className="transaction-info">
                <span className="transaction-amount">${parseFloat(t.amount).toFixed(2)}</span>
                <div className="transaction-actions">
                  <button onClick={() => handleEdit(t)} className="edit-btn">Edit</button>
                  <button onClick={() => handleDelete(t.id)} className="delete-btn">Delete</button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="no-transactions-message">
            <p>No transactions found. Add one using the form above!</p>
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="pagination-controls">
          <button onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} disabled={currentPage === 1}>&laquo; Previous</button>
          <span>Page {currentPage} of {totalPages}</span>
          <button onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages}>Next &raquo;</button>
        </div>
      )}
    </div>
  );
}

export default ExpenseTracker;
