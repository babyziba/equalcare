import React from "react";
import "../CSS/GraphView.css";

function GraphView({ graph }) {
  function onZoomIn() {
    alert("This worked");
  }

  return (
    <div className="indiviualGraph">
      <div className="graphImg">
        <img src={graph.url} alt={graph.title} />
        <div className="zoomIn">
          <button className="zoomInButton" onClick={onZoomIn}>
            +
          </button>
        </div>
      </div>
      <div className="analysis">
        <h3>{graph.title}</h3>
        <p>{graph.analysis}</p>
      </div>
    </div>
  );
}

export default GraphView;
