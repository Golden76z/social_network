"use client"

import React, { useState, useEffect } from 'react';
import "../../globals.css";

type ColorSet = Record<string, string>;

export default function PalettePage() {
  const [lightColors, setLightColors] = useState<ColorSet>({});
  const [darkColors, setDarkColors] = useState<ColorSet>({});
  const [lightBg, setLightBg] = useState<string>('#fff');
  const [darkBg, setDarkBg] = useState<string>('#000');

  useEffect(() => {
    const getVars = (themeClass: string) => {
      const tempEl = document.createElement('div');
      tempEl.style.display = 'none';
      tempEl.setAttribute('data-theme', themeClass);
      document.body.appendChild(tempEl);

      const styles = getComputedStyle(tempEl);
      const vars: ColorSet = {};
      for (const name of styles) {
        if (name.startsWith('--color-') && !name.match(/\d{3}$/)) {
            vars[name] = styles.getPropertyValue(name).trim();
        }
      }

      document.body.removeChild(tempEl);
      return vars;
    };

    const light = getVars('light');
    const dark = getVars('dark');

    setLightColors(light);
    setDarkColors(dark);
    setLightBg(light['--color-background'] ?? '#fff');
    setDarkBg(dark['--color-background'] ?? '#000');
  }, []);

  const renderColors = (colors: ColorSet) => (
    <div className="grid grid-cols-2 gap-6 w-full">
      {Object.entries(colors).map(([key, value]) => (
        <div key={key} className="flex flex-col items-center space-y-2">
          <div
            className="w-32 h-32 rounded-xl border shadow-md"
            style={{ backgroundColor: value }}
          />
          <div
            className="text-center px-3 py-2 rounded-lg"
            style={{ color: value }}
            >
            <div className="text-md font-semibold text-outline">Test Color</div>
            <div className="text-sm font-mono text-outline">{key}</div>
            <div className="text-sm text-outline">{value}</div>
        </div>


        </div>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-2">
      <div
        className="text-black p-10 flex flex-col items-center w-full"
        style={{ backgroundColor: lightBg }}
      >
        <h2 className="text-3xl font-bold mb-6 text-center text-[var(--color-primary)]">🌞 Light Mode Colors</h2>
        {renderColors(lightColors)}
      </div>
      <div
        className="text-white p-10 flex flex-col items-center w-full"
        style={{ backgroundColor: darkBg }}
      >
        <h2 className="text-3xl font-bold mb-6 text-center text-[var(--color-primary)]">🌙 Dark Mode Colors</h2>
        {renderColors(darkColors)}
      </div>
    </div>
  );
}
