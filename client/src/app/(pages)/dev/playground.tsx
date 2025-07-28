import React, { useState } from "react";
import "../../app/globals.css"; // Ensure CSS variables are loaded

type Position = "center" | "top-left" | "top-right" | "bottom-left" | "bottom-right";

const PlaygroundPage = () => {
  const [position, setPosition] = useState<Position>("center");

  const getPositionClass = (): string => {
    switch (position) {
      case "top-left":
        return "justify-start items-start";
      case "top-right":
        return "justify-end items-start";
      case "bottom-left":
        return "justify-start items-end";
      case "bottom-right":
        return "justify-end items-end";
      case "center":
      default:
        return "justify-center items-center";
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: "var(--color-background)", color: "var(--color-text)" }}
    >
      {/* Control Panel */}
      <div className="p-4 text-center border-b border-[var(--color-border)]">
        <h2 className="text-lg font-bold mb-2">Component Position</h2>
        <div className="flex justify-center gap-4">
          {["center", "top-left", "top-right", "bottom-left", "bottom-right"].map((pos) => (
            <button
              key={pos}
              onClick={() => setPosition(pos as Position)}
              className={`px-4 py-2 rounded-xl border font-medium transition-colors
                ${
                  position === pos
                    ? "bg-[var(--color-primary)] text-white"
                    : "bg-transparent border-[var(--color-border)] text-[var(--color-text)] hover:bg-[var(--color-primary)] hover:text-white"
                }`}
            >
              {pos.replace("-", " ")}
            </button>
          ))}
        </div>
      </div>

      {/* Component Preview Area */}
      <div className={`flex flex-1 p-8 ${getPositionClass()}`}>
        <div className="p-6 rounded-2xl shadow-lg border bg-white dark:bg-black">
          {/* Replace this with your actual component */}
          <p className="text-xl font-bold text-center">🧪 Your Component</p>
        </div>
      </div>
    </div>
  );
};

export default PlaygroundPage;
