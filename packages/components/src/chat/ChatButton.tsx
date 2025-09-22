"use client";

import React from "react";
import { MessageCircle } from "lucide-react";
import { Button } from "../ui/Button";
import { cn } from "../lib/utils";

export interface ChatButtonProps {
  onClick: () => void;
  hasSelectedPoints?: boolean;
  className?: string;
  position?: "bottom-right" | "bottom-left" | "top-right" | "top-left";
}

export function ChatButton({
  onClick,
  hasSelectedPoints = false,
  className,
  position = "bottom-right"
}: ChatButtonProps) {
  const positionClasses = {
    "bottom-right": "bottom-6 right-6",
    "bottom-left": "bottom-6 left-6",
    "top-right": "top-20 right-6",
    "top-left": "top-20 left-6"
  };

  return (
    <Button
      onClick={onClick}
      size="lg"
      className={cn(
        "fixed rounded-full shadow-lg z-40",
        "w-14 h-14 p-0",
        "bg-primary hover:bg-primary/90",
        "transition-all duration-200 hover:scale-110",
        hasSelectedPoints && "ring-2 ring-offset-2 ring-primary animate-pulse",
        positionClasses[position],
        className
      )}
    >
      <MessageCircle className="w-6 h-6" />
      {hasSelectedPoints && (
        <span className="absolute -top-1 -right-1 w-3 h-3 bg-destructive rounded-full animate-ping" />
      )}
    </Button>
  );
}