"use client";

import React, { useState } from "react";

type TabItem = {
  id: string;
  label: string;
  content: React.ReactNode;
  disabled?: boolean;
  icon?: React.ReactNode;
};

type TabsProps = {
  tabs: TabItem[];
  defaultTab?: string;
  variant?: "default" | "pills" | "underlined";
  fullWidth?: boolean;
  onChange?: (tabId: string) => void;
  className?: string;
};

export const Tabs = ({
  tabs,
  defaultTab,
  variant = "default",
  fullWidth = false,
  onChange,
  className = "",
}: TabsProps) => {
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.id);

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    onChange?.(tabId);
  };

  const getTabStyles = (isActive: boolean, isDisabled: boolean) => {
    const base = `
      px-4 py-2 font-medium transition-all duration-200
      ${isDisabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
      ${fullWidth ? "flex-1" : ""}
    `;

    switch (variant) {
      case "pills":
        return `
          ${base}
          rounded-xl
          ${
            isActive
              ? "bg-accent text-background shadow-neo"
              : "text-muted hover:text-foreground hover:bg-surface"
          }
        `;
      case "underlined":
        return `
          ${base}
          border-b-2
          ${
            isActive
              ? "border-accent text-accent"
              : "border-transparent text-muted hover:text-foreground hover:border-border"
          }
        `;
      case "default":
      default:
        return `
          ${base}
          rounded-t-xl
          ${
            isActive
              ? "bg-surface text-accent border border-b-0 border-border"
              : "text-muted hover:text-foreground"
          }
        `;
    }
  };

  const activeTabContent = tabs.find((tab) => tab.id === activeTab)?.content;

  return (
    <div className={className}>
      <div
        className={`
          flex
          ${variant === "underlined" ? "border-b border-border" : ""}
          ${variant === "pills" ? "gap-2 p-1 bg-background rounded-xl" : ""}
          ${fullWidth ? "w-full" : ""}
        `}
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => !tab.disabled && handleTabChange(tab.id)}
            disabled={tab.disabled}
            className={getTabStyles(tab.id === activeTab, tab.disabled || false)}
          >
            <span className="flex items-center gap-2">
              {tab.icon}
              {tab.label}
            </span>
          </button>
        ))}
      </div>
      <div
        className={`
          ${variant === "default" ? "bg-surface border border-border rounded-b-xl rounded-tr-xl" : ""}
          ${variant !== "pills" ? "p-6" : "pt-6"}
        `}
      >
        {activeTabContent}
      </div>
    </div>
  );
};

type TabPanelProps = {
  children: React.ReactNode;
  className?: string;
};

export const TabPanel = ({ children, className = "" }: TabPanelProps) => {
  return <div className={className}>{children}</div>;
};