import React from "react";

type CardProps = {
  title?: string;
  children: React.ReactNode;
  className?: string;
  variant?: "default" | "outlined" | "elevated";
};

export const Card = ({
  title,
  children,
  className = "",
  variant = "default"
}: CardProps) => {
  const variants = {
    default: "bg-surface border border-border",
    outlined: "bg-transparent border-2 border-accent/20",
    elevated: "bg-surface shadow-neo hover:shadow-neo-hover transition-shadow duration-300",
  };

  return (
    <div
      className={`rounded-2xl p-6 ${variants[variant]} ${className}`}
    >
      {title && (
        <h2 className="text-xl font-semibold mb-4 text-accent">{title}</h2>
      )}
      <div>{children}</div>
    </div>
  );
};