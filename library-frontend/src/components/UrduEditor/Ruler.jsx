// src/components/UrduEditor/Ruler.jsx
import React from "react";
import { A4_WIDTH_PX } from "./config";

export default function Ruler({ zoom = 100 }) {
  // 21 cm width for A4 (210mm)
  const totalCm = 21;

  // Scale ruler with zoom (so it matches page width visually)
  const scaledWidth = (A4_WIDTH_PX * zoom) / 100;

  return (
    <div
      className="ruler-container sticky top-0"
      style={{
        width: scaledWidth,
        height: 26,
        background: "#f3f2f1",
        borderBottom: "1px solid #d1d5db",
        borderTopLeftRadius: 8,
        borderTopRightRadius: 8,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-between",
          padding: "0 10px",
          fontSize: 10,
          color: "#6b7280",
          userSelect: "none",
        }}
      >
        {Array.from({ length: totalCm + 1 }).map((_, cm) => (
          <div
            key={cm}
            style={{
              position: "relative",
              flex: 1,
              height: "100%",
              display: "flex",
              justifyContent: "center",
              alignItems: "flex-end",
            }}
          >
            {/* Number labels */}
            <span style={{ marginBottom: 2 }}>{cm}</span>

            {/* Main cm tick */}
            <div
              style={{
                position: "absolute",
                bottom: 0,
                width: 1,
                height: 10,
                background: "#9ca3af",
              }}
            />

            {/* Half cm tick */}
            {cm !== totalCm && (
              <div
                style={{
                  position: "absolute",
                  bottom: 0,
                  left: "50%",
                  transform: "translateX(-50%)",
                  width: 1,
                  height: 6,
                  background: "#cbd5e1",
                }}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
