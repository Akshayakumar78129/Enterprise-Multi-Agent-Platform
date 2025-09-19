import React from 'react';
import { Menu } from 'lucide-react';

interface NavigationToggleProps {
  onClick: () => void;
}

const NavigationToggle: React.FC<NavigationToggleProps> = ({ onClick }) => {
  return (
    <button
      onClick={onClick}
      className="fixed top-4 left-4 z-40 p-2 bg-surface border border-border rounded-lg hover:bg-accent/10 transition-all shadow-lg"
      aria-label="Toggle navigation menu"
    >
      <Menu className="w-6 h-6 text-foreground" />
    </button>
  );
};

export default NavigationToggle;
