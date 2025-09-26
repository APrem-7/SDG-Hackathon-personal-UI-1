import React, { useRef, useEffect } from "react";
import vegaEmbed from "vega-embed";

function VegaChart({ spec, data }) {
  const chartRef = useRef(null);

  useEffect(() => {
    if (spec && data && chartRef.current) {
      // Embed the chart data into the spec
      const chartSpec = {
        ...spec,
        data: { values: data },
      };

      // Render the chart
      vegaEmbed(chartRef.current, chartSpec, {
        renderer: "svg",
        actions: false,
        width: 600,
        height: 400,
      }).catch(console.error);
    }
  }, [spec, data]);

  if (!spec) return null;

  return <div ref={chartRef} className="w-full h-96 border rounded"></div>;
}

export default VegaChart;
