import React from "react";
import GraphView from "./GraphView";
import "../CSS/gridView.css";

function GridView() {
  const graphs = [
    { id: 1, title: "Heart Attack" },
    { id: 2, title: "Stroke" },
    { id: 3, title: "Auto-Immune disease" },
    { id: 4, title: "Depression" },
    { id: 5, title: "Alzheimer’s" },
    { id: 6, title: "Adverse drug reactions" },
  ];

  return (
    <div className="gridView">
      <div className="graphGrids">
        {graphs.map((graph) => (
          <GraphView graph={graph} key={graph.id} />
        ))}
      </div>
    </div>
  );
}

export default GridView;
