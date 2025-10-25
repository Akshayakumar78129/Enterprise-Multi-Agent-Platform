import React from "react";

type CardProps = {
  title?: string;
  children: React.ReactNode;
  className?: string;
  variant?: "default" | "outlined" | "elevated";
  onClick?: () => void;
  onShiftClick?: (event: React.MouseEvent) => void;
};

export const Card = ({
  title,
  children,
  className = "",
  variant = "default",
  onClick,
  onShiftClick
}: CardProps) => {
  const handleClick = (event: React.MouseEvent) => {
    if (event.shiftKey && onShiftClick) {
      onShiftClick(event);
    } else if (onClick) {
      onClick();
    }
  };
  const variants = {
    default: "bg-surface border border-border",
    outlined: "bg-transparent border-2 border-accent/20",
    elevated: "bg-surface shadow-neo hover:shadow-neo-hover transition-shadow duration-300",
  };

  return (
    <div
      className={`rounded-2xl p-6 ${variants[variant]} ${className} ${(onClick || onShiftClick) ? 'cursor-pointer' : ''}`}
      onClick={handleClick}
    >
      {title && (
        <h2 className="text-xl font-semibold mb-4 text-accent">{title}</h2>
      )}
      <div>{children}</div>
    </div>
  );
};