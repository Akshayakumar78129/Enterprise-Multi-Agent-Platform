import React from "react";

type ButtonProps = {
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
  disabled?: boolean;
  loading?: boolean;
  onClick?: () => void;
  type?: "button" | "submit" | "reset";
  className?: string;
};

export const Button = ({
  children,
  variant = "primary",
  size = "md",
  fullWidth = false,
  disabled = false,
  loading = false,
  onClick,
  type = "button",
  className = "",
}: ButtonProps) => {
  const variants = {
    primary: "bg-accent text-background hover:bg-accent/90 shadow-neo hover:shadow-neo-hover",
    secondary: "bg-accent-secondary text-white hover:bg-accent-secondary/90 shadow-neo-secondary",
    outline: "bg-transparent border-2 border-accent text-accent hover:bg-accent/10",
    ghost: "bg-transparent text-foreground hover:bg-surface",
    danger: "bg-error text-white hover:bg-error/90",
  };

  const sizes = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-base",
    lg: "px-6 py-3 text-lg",
  };

  const isDisabled = disabled || loading;

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={isDisabled}
      suppressHydrationWarning
      className={`
        ${variants[variant]}
        ${sizes[size]}
        ${fullWidth ? "w-full" : ""}
        ${isDisabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
        rounded-xl font-medium transition-all duration-200
        focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-background
        ${className}
      `}
    >
      <span className={`flex items-center justify-center gap-2 ${loading ? "opacity-0" : ""}`}>
        {children}
      </span>
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
        </div>
      )}
    </button>
  );
};