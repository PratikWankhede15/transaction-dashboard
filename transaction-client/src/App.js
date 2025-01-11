import React from "react";
import TransactionTable from "./components/transaction";

const App = () => {
  return (
    <div style={{ position: "relative" }}>
      <h1 style={{ width: "50%", margin: "10px" }}>Transaction Page</h1>
      <TransactionTable />
    </div>
  );
};

export default App;
