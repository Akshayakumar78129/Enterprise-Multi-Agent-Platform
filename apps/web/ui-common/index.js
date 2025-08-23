// UI Common Components and Utilities
export { default as FloatingAIChat } from './FloatingAIChat';
export { default as FormattedTable, KPICard, DataGrid } from './components/FormattedTable';

// Design system components
import { Card } from './design-system/components/Card';
import { Button } from './design-system/components/Button';
// KpiTile consolidated to single JS implementation
import { KpiTile } from './design-system/components/KpiTile';
import { Select } from './design-system/components/Select';
import { Input } from './design-system/components/Input';
import { Table } from './design-system/components/Table';
import { Tabs } from './design-system/components/Tabs';
import { Toggle } from './design-system/components/Toggle';
import { Checkbox } from './design-system/components/Checkbox';
import { Grid, GridItem } from './design-system/components/Grid';

// Theme
import { useTheme, ThemeProvider } from './design-system/theme';

// AI Interaction components
import { RobotCharacter } from './ai-interaction/RobotCharacter/RobotCharacter';
import { LaserPointer } from './ai-interaction/LaserPointer/LaserPointer';
import { SpeechBubble } from './ai-interaction/SpeechBubble/SpeechBubble';
import { QueryInput } from './QueryInput/QueryInput';

// Export components

// Number formatting utilities
export {
  formatToTwoDecimals,
  formatCurrency,
  formatPercentage,
  formatLargeNumber,
  getTableCellStyles,
  formatTableData,
  getAlignmentClass,
  formatKPIValues
} from './utils/numberFormat';

// AI interaction components
export { default as QueryInput } from './QueryInput/QueryInput';

// Available hooks
export { default as useApiClient } from './hooks/useApiClient'; 