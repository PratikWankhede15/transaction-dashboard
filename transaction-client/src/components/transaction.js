import React, { useEffect, useState } from "react";
import axios from "axios";
import "./transaction.css";

const TransactionTable = () => {
  const [transactions, setTransactions] = useState([]);
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [statistics, setStatistics] = useState({
    totalSale: 0,
    totalSoldItem: 0,
    totalNotSoldItem: 0,
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("3");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const months = [
    { value: 1, label: "January" },
    { value: 2, label: "February" },
    { value: 3, label: "March" },
    { value: 4, label: "April" },
    { value: 5, label: "May" },
    { value: 6, label: "June" },
    { value: 7, label: "July" },
    { value: 8, label: "August" },
    { value: 9, label: "September" },
    { value: 10, label: "October" },
    { value: 11, label: "November" },
    { value: 12, label: "December" },
  ];


  useEffect(() => {
    axios
      .get("http://localhost:5000/transactions", {
        params: {
          search: searchTerm || "",
          page: currentPage || 1,
          perPage: itemsPerPage || 10,
          month: selectedMonth || null,
        },
      })
      .then((response) => {
        setTransactions(response.data.transactions);
      })
      .catch((error) => {
        console.error("Error fetching transactions:", error);
      });
  }, [selectedMonth, currentPage, searchTerm]);

  useEffect(() => {
    axios
      .get("http://localhost:5000/statistics", {
        params : {
            month: selectedMonth
        }
      })
      .then((response) => {
        const result = response.data;
        setStatistics({
            totalSale: result.totalSaleAmount,
            totalSoldItem: result.totalSoldItems,
            totalNotSoldItem: result.totalNotSoldItems,
          });
      })
      .catch((error) => {
        console.error("Error fetching statistics:", error);
      });
  }, [selectedMonth])
  

  useEffect(() => {
    const filtered = transactions
      ?.filter((transaction) =>
        transaction.title.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .sort((a, b) => a.id - b.id);

    setFilteredTransactions(filtered); 
  }, [transactions, searchTerm, currentPage]); 

  return (
    <>
      {" "}
      <div
        style={{
          backgroundColor: "#FFD67E",
          borderRadius: "10px",
          padding: "20px",
          width: "300px",
          boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
          right: "20px",
          float: "right",
          position: "absolute",
          top: "0"
        }}
      >
        <h2>Statistics - {months?.find(m => m.value == selectedMonth )?.label || "Select a Month"}</h2>
        <p>
          <strong>Total sale:</strong> {statistics.totalSale}
        </p>
        <p>
          <strong>Total sold item:</strong> {statistics.totalSoldItem}
        </p>
        <p>
          <strong>Total not sold item:</strong> {statistics.totalNotSoldItem}
        </p>
      </div>
      <div className="transaction-container">
        <div className="controls">
          <input
            type="text"
            placeholder="Search transaction"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="month-select"
          >
            <option value="">Select a Month</option>
            {months.map((month) => (
              <option key={month.value} value={month.value}>
                {month.label}
              </option>
            ))}
          </select>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginTop: "20px",
          }}
        >
         
          <div style={{ flex: 1, marginLeft: "20px" }}>
            <table className="transaction-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Title</th>
                  <th>Description</th>
                  <th>Price</th>
                  <th>Category</th>
                  <th>Sold</th>
                  <th>Image</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.map((transaction) => (
                  <tr key={transaction.id}>
                    <td>{transaction.id}</td>
                    <td>{transaction.title}</td>
                    <td>{transaction.description}</td>
                    <td>{transaction.price}</td>
                    <td>{transaction.category}</td>
                    <td>{transaction.sold ? "Yes" : "No"}</td>
                    <td>
                      <img
                        src={transaction.image}
                        alt={transaction.title}
                        width="50"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="pagination">
          <button
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((prev) => prev - 1)}
          >
            Previous
          </button>
          <span>Page No: {currentPage}</span>
          <button
            disabled={filteredTransactions.length < itemsPerPage}
            onClick={() => setCurrentPage((prev) => prev + 1)}
          >
            Next
          </button>
        </div>
      </div>
    </>
  );
};

export default TransactionTable;
