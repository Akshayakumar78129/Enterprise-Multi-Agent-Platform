import React, { useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { ClientSidePlot } from './ClientSidePlot';
import { Card } from '../../../../../../ui-common/design-system/components/Card';
import { useTheme } from '../../../../../../ui-common/design-system/theme';
import { Slider } from '../../../../../../ui-common/design-system/components/Slider';
import { selectProductAssociations, selectLoading } from '../../state/transactionSlice';
import { useChartConfigs } from '../../utils/chartHelpers';

interface NetworkNode {
  id: string;
  label: string;
  size: number;
  color: string;
  x: number;
  y: number;
}

interface NetworkEdge {
  source: string;
  target: string;
  value: number;
  width: number;
}

export interface ProductAssociationNetworkProps {
  height?: number;
  width?: number;
  onNodeClick?: (product: string) => void;
}

export const ProductAssociationNetwork: React.FC<ProductAssociationNetworkProps> = ({
  height = 400,
  width = 500,
  onNodeClick
}) => {
  const theme = useTheme();
  const { networkGraphLayout, colorScales } = useChartConfigs();
  const productAssociations = useSelector(selectProductAssociations);
  const loading = useSelector(selectLoading);
  const [strengthThreshold, setStrengthThreshold] = useState(1.5);
  
  const { nodes, edges, nodeData, edgeData } = useMemo(() => {
    if (!productAssociations || productAssociations.length === 0) {
      return { nodes: [], edges: [], nodeData: {}, edgeData: [] };
    }
    
    // Filter by association strength
    const filteredAssociations = productAssociations.filter(
      assoc => assoc.lift >= strengthThreshold
    );
    
    // Extract all unique products
    const allProducts = new Set<string>();
    filteredAssociations.forEach(assoc => {
      assoc.antecedents.forEach(p => allProducts.add(p));
      assoc.consequents.forEach(p => allProducts.add(p));
    });
    
    // Create a map to count product occurrences
    const productCounts: Record<string, number> = {};
    filteredAssociations.forEach(assoc => {
      assoc.antecedents.forEach(p => {
        productCounts[p] = (productCounts[p] || 0) + 1;
      });
      assoc.consequents.forEach(p => {
        productCounts[p] = (productCounts[p] || 0) + 1;
      });
    });
    
    // Generate random positions for nodes (in a circular layout)
    const nodes: NetworkNode[] = [];
    const nodeData: Record<string, NetworkNode> = {};
    
    Array.from(allProducts).forEach((product, index) => {
      const angle = (2 * Math.PI * index) / allProducts.size;
      const radius = 0.8;
      const x = radius * Math.cos(angle);
      const y = radius * Math.sin(angle);
      
      // Size based on occurrence count (min 10, max 30)
      const size = Math.min(10 + productCounts[product] * 3, 30);
      
      // Assign a color from the gradient
      const colorIndex = Math.floor((index / allProducts.size) * colorScales.normalGradient.length);
      const color = colorScales.normalGradient[colorIndex] || theme.colors.electricCyan;
      
      const node: NetworkNode = {
        id: product,
        label: product,
        size,
        color,
        x,
        y
      };
      
      nodes.push(node);
      nodeData[product] = node;
    });
    
    // Create edges
    const edges: NetworkEdge[] = [];
    
    filteredAssociations.forEach(assoc => {
      assoc.antecedents.forEach(source => {
        assoc.consequents.forEach(target => {
          const edge: NetworkEdge = {
            source,
            target,
            value: assoc.lift,
            width: 1 + assoc.lift / 2
          };
          edges.push(edge);
        });
      });
    });
    
    // Create Plotly trace data
    // Node trace
    const nodeX = nodes.map(node => node.x);
    const nodeY = nodes.map(node => node.y);
    const nodeLabels = nodes.map(node => node.label);
    const nodeSizes = nodes.map(node => node.size);
    const nodeColors = nodes.map(node => node.color);
    
    // Edge traces
    const edgeData = edges.map((edge, index) => {
      const sourceNode = nodeData[edge.source];
      const targetNode = nodeData[edge.target];
      
      return {
        type: 'scatter',
        mode: 'lines',
        x: [sourceNode.x, targetNode.x],
        y: [sourceNode.y, targetNode.y],
        line: {
          width: edge.width,
          color: theme.colors.electricCyanDark,
          opacity: 0.6
        },
        hoverinfo: 'text',
        text: `${edge.source} → ${edge.target}<br>Lift: ${edge.value.toFixed(2)}`,
        showlegend: false
      };
    });
    
    return { 
      nodes,
      edges, 
      nodeData: {
        type: 'scatter',
        mode: 'markers+text',
        x: nodeX,
        y: nodeY,
        text: nodeLabels,
        textposition: 'bottom center',
        textfont: {
          family: theme.typography.fontFamily,
          color: theme.colors.cloudWhite,
          size: 10
        },
        marker: {
          size: nodeSizes,
          color: nodeColors,
          line: {
            width: 1,
            color: theme.colors.graphiteDark
          }
        },
        hoverinfo: 'text',
        hovertext: nodeLabels.map(
          (label, i) => `${label}<br>Connections: ${productCounts[label]}`
        ),
        name: 'Products'
      },
      edgeData
    };
  }, [productAssociations, strengthThreshold, theme, colorScales]);
  
  const handleClick = (event: any) => {
    if (onNodeClick && event.points && event.points[0]) {
      const point = event.points[0];
      const textLabel = point.text;
      if (textLabel) {
        onNodeClick(textLabel);
      }
    }
  };
  
  return (
    <Card 
      title="Product Association Network"
      isLoading={loading}
      elevation="md"
    >
      <div style={{ marginBottom: theme.spacing[3], padding: `0 ${theme.spacing[4]}px` }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          marginBottom: theme.spacing[2]
        }}>
          <span style={{ 
            color: theme.colors.cloudWhite, 
            fontSize: theme.typography.fontSize.sm 
          }}>
            Association Strength
          </span>
          <span style={{ 
            color: theme.colors.cloudWhite, 
            fontSize: theme.typography.fontSize.sm 
          }}>
            {strengthThreshold.toFixed(1)}
          </span>
        </div>
        <div style={{ padding: `0 ${theme.spacing[1]}px` }}>
          <input
            type="range"
            min="1"
            max="5"
            step="0.1"
            value={strengthThreshold}
            onChange={(e) => setStrengthThreshold(parseFloat(e.target.value))}
            style={{
              width: '100%',
              accentColor: theme.colors.electricCyan,
              backgroundColor: theme.colors.graphiteDark,
              height: '4px',
              borderRadius: '2px'
            }}
          />
        </div>
      </div>
      
      {productAssociations && productAssociations.length > 0 && (
        <ClientSidePlot
          data={[...edgeData, nodeData]}
          layout={{
            ...networkGraphLayout,
            height,
            width,
            title: `${edges.length} associations between ${nodes.length} products`
          }}
          onClick={handleClick}
        />
      )}
    </Card>
  );
}; 