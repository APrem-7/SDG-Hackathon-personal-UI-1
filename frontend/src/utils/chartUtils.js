// Chart utility functions for AI-generated visualizations

export function createChartFromAI(chartConfig, fields) {
  if (!chartConfig) return null;

  const { chartType, xField, yField, title } = chartConfig;

  // Find the fields in our field metadata
  const xFieldMeta = fields.find((f) => f.fid === xField);
  const yFieldMeta = fields.find((f) => f.fid === yField);

  if (!xFieldMeta || !yFieldMeta) {
    console.warn("Chart fields not found:", {
      xField,
      yField,
      availableFields: fields.map((f) => f.fid),
    });
    return null;
  }

  // Create a simple chart specification for GraphicWalker
  const chartSpec = {
    visId: "gw_chart_1",
    name: title || "AI Generated Chart",
    encodings: {
      dimensions: [],
      measures: [],
      rows: [],
      columns: [],
      color: [],
      opacity: [],
      size: [],
      shape: [],
      radius: [],
      theta: [],
      longitude: [],
      latitude: [],
      geoId: [],
      details: [],
      filters: [],
      text: [],
    },
    config: {
      defaultAggregated: false,
      geoms: [
        chartType === "scatter"
          ? "point"
          : chartType === "pie"
          ? "arc"
          : chartType,
      ],
      coordSystem: "generic",
      stack: "none",
      showActions: false,
      interactiveScale: false,
      sorted: "none",
      zeroScale: true,
      scaleIncludeUnmatchedChoropleth: false,
      showAllGeomTypes: false,
      resolve: {
        x: false,
        y: false,
        color: false,
        opacity: false,
        shape: false,
        size: false,
      },
      limit: -1,
    },
  };

  console.log("Creating chart for:", {
    chartType,
    xField,
    yField,
    xFieldMeta,
    yFieldMeta,
  });

  // Configure encodings based on chart type and field types
  if (chartType === "bar") {
    if (xFieldMeta.analyticType === "dimension") {
      chartSpec.encodings.dimensions.push(xField);
      chartSpec.encodings.columns.push(xField);
    } else {
      chartSpec.encodings.measures.push(xField);
      chartSpec.encodings.columns.push(xField);
    }

    if (yFieldMeta.analyticType === "measure") {
      chartSpec.encodings.measures.push(yField);
      chartSpec.encodings.rows.push(yField);
    } else {
      chartSpec.encodings.dimensions.push(yField);
      chartSpec.encodings.rows.push(yField);
    }
  } else if (chartType === "scatter" || chartType === "point") {
    chartSpec.encodings.measures.push(xField, yField);
    chartSpec.encodings.columns.push(xField);
    chartSpec.encodings.rows.push(yField);
  } else if (chartType === "line") {
    if (xFieldMeta.analyticType === "dimension") {
      chartSpec.encodings.dimensions.push(xField);
      chartSpec.encodings.columns.push(xField);
    } else {
      chartSpec.encodings.measures.push(xField);
      chartSpec.encodings.columns.push(xField);
    }

    if (yFieldMeta.analyticType === "measure") {
      chartSpec.encodings.measures.push(yField);
      chartSpec.encodings.rows.push(yField);
    }
  } else if (chartType === "pie") {
    chartSpec.encodings.dimensions.push(xField);
    chartSpec.encodings.color.push(xField);
    chartSpec.encodings.measures.push(yField);
    chartSpec.encodings.theta.push(yField);
  }

  // Remove duplicates
  chartSpec.encodings.dimensions = [...new Set(chartSpec.encodings.dimensions)];
  chartSpec.encodings.measures = [...new Set(chartSpec.encodings.measures)];

  console.log("Generated chart spec:", chartSpec);
  return [chartSpec];
}

export function processShipmentData(data) {
  // Convert shipment data to GraphicWalker format
  const fields = [];

  if (data.length > 0) {
    const sampleItem = data[0];
    Object.keys(sampleItem).forEach((key) => {
      const value = sampleItem[key];
      const isNumeric = typeof value === "number" || !isNaN(Number(value));

      fields.push({
        fid: key,
        name: key,
        semanticType: isNumeric ? "quantitative" : "nominal",
        analyticType: isNumeric ? "measure" : "dimension",
      });
    });
  }

  return { fields, rows: data };
}
