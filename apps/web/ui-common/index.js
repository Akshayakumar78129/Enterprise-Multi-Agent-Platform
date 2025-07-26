import ComponentDemo from './design-system/ComponentDemo';

// Design system components
import { Card } from './design-system/components/Card';
import { Button } from './design-system/components/Button';
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
export {
  // Demo
  ComponentDemo,
  
  // Design system components
  Card,
  Button,
  KpiTile,
  Select,
  Input,
  Table,
  Tabs,
  Toggle,
  Checkbox,
  Grid,
  GridItem,
  
  // Theme
  useTheme,
  ThemeProvider,
  
  // AI Interaction components
  RobotCharacter,
  LaserPointer,
  SpeechBubble,
  QueryInput,
};

// Default export for the component demo
export default ComponentDemo; 