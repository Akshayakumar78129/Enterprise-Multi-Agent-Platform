import dynamic from 'next/dynamic';
import React from 'react';

// Import Plotly with SSR disabled to prevent "self is not defined" errors
const Plot = dynamic(() => import('react-plotly.js'), { ssr: false });

export interface ClientSidePlotProps {
  data: any[];
  layout?: Partial<Plotly.Layout>;
  config?: Partial<Plotly.Config>;
  style?: React.CSSProperties;
  className?: string;
  onClick?: (event: any) => void;
  onHover?: (event: any) => void;
  onUnhover?: (event: any) => void;
  onSelected?: (event: any) => void;
  onDeselect?: (event: any) => void;
}

/**
 * ClientSidePlot - A wrapper around the Plotly component that ensures it's only rendered client-side
 * Use this component to prevent the "self is not defined" error in SSR (server-side rendering)
 */
export const ClientSidePlot: React.FC<ClientSidePlotProps> = (props) => {
  return <Plot {...props} />;
};

export default ClientSidePlot; 