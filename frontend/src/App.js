import React from "react";
import UploadForm from "./components/UploadForm";
//import GraphView from "./components/GraphView";
import DataSummary from "./components/DataSummary";
import "./App.css";
import GridView from "./components/gridView";

function App() {
  return (
    <div className="App" style={{ padding: "2rem", fontFamily: "sans-serif" }}>
      <header>
        <h1>EqualCare</h1>
        <p>A simple tool to analyze bias in healthcare datasets.</p>
      </header>

      <main>
        <section>
          <UploadForm />
        </section>
        
        <section>
          <GridView />
        </section>
        <section>
          <DataSummary />
        </section>
      </main>
    </div>
  );
}

export default App;
