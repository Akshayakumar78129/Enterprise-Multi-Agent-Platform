const { SlowMovingInventoryQueries } = require('./database/queries');

(async () => {
  try {
    const q = new SlowMovingInventoryQueries();
    const opts = await q.getFilterOptions();
    const dateRange = {
      start: opts.dateRange.min_date || '2000-01-01',
      end: opts.dateRange.max_date || new Date().toISOString().slice(0,10)
    };

    console.log('Using date range from DB:', dateRange);

    const kpis = await q.getKPIData({ dateRange });
    console.log('KPI Data:');
    console.log(JSON.stringify(kpis, null, 2));
  } catch (err) {
    console.error('Error running KPIs:', err);
    process.exit(1);
  }
})();
