"use client";

import React, { useEffect, useState } from "react";

type ToastType = "success" | "error" | "warning" | "info";

type ToastProps = {
  id: string;
  message: string;
  type?: ToastType;
  duration?: number;
  onClose?: (id: string) => void;
  action?: {
    label: string;
    onClick: () => void;
  };
};

export const Toast = ({
  id,
  message,
  type = "info",
  duration = 5000,
  onClose,
  action,
}: ToastProps) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(() => onClose?.(id), 300);
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [duration, id, onClose]);

  const types = {
    success: {
      bg: "bg-success/20",
      border: "border-success/30",
      icon: (
        <svg className="w-5 h-5 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      ),
    },
    error: {
      bg: "bg-error/20",
      border: "border-error/30",
      icon: (
        <svg className="w-5 h-5 text-error" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      ),
    },
    warning: {
      bg: "bg-warning/20",
      border: "border-warning/30",
      icon: (
        <svg className="w-5 h-5 text-warning" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      ),
    },
    info: {
      bg: "bg-accent/20",
      border: "border-accent/30",
      icon: (
        <svg className="w-5 h-5 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
  };

  const typeStyles = types[type];

  return (
    <div
      className={`
        ${typeStyles.bg}
        ${isVisible ? "animate-in slide-in-from-right" : "animate-out slide-out-to-right"}
        flex items-center gap-3 px-4 py-3 rounded-xl border ${typeStyles.border}
        shadow-neo backdrop-blur-sm transition-all duration-300
        min-w-[320px] max-w-[420px]
      `}
    >
      {typeStyles.icon}
      <p className="flex-1 text-sm text-foreground">{message}</p>
      {action && (
        <button
          onClick={action.onClick}
          className="text-accent hover:text-accent/80 text-sm font-medium transition-colors"
        >
          {action.label}
        </button>
      )}
      <button
        onClick={() => {
          setIsVisible(false);
          setTimeout(() => onClose?.(id), 300);
        }}
        className="p-1 rounded-lg hover:bg-foreground/10 transition-colors"
        aria-label="Close"
      >
        <svg
          className="w-4 h-4 text-muted"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>
    </div>
  );
};

type ToastContainerProps = {
  toasts: Array<{
    id: string;
    message: string;
    type?: ToastType;
    duration?: number;
    action?: {
      label: string;
      onClick: () => void;
    };
  }>;
  position?: "top-left" | "top-right" | "bottom-left" | "bottom-right" | "top-center" | "bottom-center";
  onClose: (id: string) => void;
};

export const ToastContainer = ({
  toasts,
  position = "top-right",
  onClose,
}: ToastContainerProps) => {
  const positions = {
    "top-left": "top-4 left-4",
    "top-right": "top-4 right-4",
    "bottom-left": "bottom-4 left-4",
    "bottom-right": "bottom-4 right-4",
    "top-center": "top-4 left-1/2 -translate-x-1/2",
    "bottom-center": "bottom-4 left-1/2 -translate-x-1/2",
  };

  return (
    <div className={`fixed ${positions[position]} z-50 flex flex-col gap-3`}>
      {toasts.map((toast) => (
        <Toast key={toast.id} {...toast} onClose={onClose} />
      ))}
    </div>
  );
};

export const useToast = () => {
  const [toasts, setToasts] = useState<ToastContainerProps["toasts"]>([]);

  const showToast = (
    message: string,
    type: ToastType = "info",
    duration = 5000,
    action?: { label: string; onClick: () => void }
  ) => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, message, type, duration, action }]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  return {
    toasts,
    showToast,
    removeToast,
    showSuccess: (message: string, duration?: number) => showToast(message, "success", duration),
    showError: (message: string, duration?: number) => showToast(message, "error", duration),
    showWarning: (message: string, duration?: number) => showToast(message, "warning", duration),
    showInfo: (message: string, duration?: number) => showToast(message, "info", duration),
  };
};