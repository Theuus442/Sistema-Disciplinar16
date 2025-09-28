import React from "react";

export default function ResponsiveWrapper({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-transparent">
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8">{children}</div>
    </div>
  );
}
