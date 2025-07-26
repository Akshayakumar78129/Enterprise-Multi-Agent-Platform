import React from 'react';
import { KPI } from '../../types';
import KpiTile from 'ui-common/design-system/components/KpiTile';
import { Grid } from 'ui-common/design-system/components/Grid';

interface BehaviourKpiTilesProps {
  kpis: KPI | null;
}

const BehaviourKpiTiles: React.FC<BehaviourKpiTilesProps> = ({ kpis }) => {
  if (!kpis) return null;
  return (
    <Grid columns={5} gap={24} style={{ marginBottom: 24 }}>
      <KpiTile
        label="Avg Purchase Interval"
        value={kpis.avgPurchaseInterval.toFixed(1) + ' days'}
        color="cyan"
      />
      <KpiTile
        label="Avg Order Value"
        value={`$${kpis.avgOrderValue.toFixed(2)}`}
        color="magenta"
      />
      <KpiTile
        label="Category Diversity"
        value={kpis.categoryDiversity.toFixed(1)}
        color="navy"
      />
      <KpiTile
        label="Channel Mix"
        value={kpis.dominantChannel}
        subtitle={kpis.dominantChannelPct.toFixed(1) + '%'}
        color="cyan"
      />
      <KpiTile
        label="Churn Risk"
        value={kpis.churnRiskPct.toFixed(1) + '%'}
        color="magenta"
      />
    </Grid>
  );
};

export default BehaviourKpiTiles; 