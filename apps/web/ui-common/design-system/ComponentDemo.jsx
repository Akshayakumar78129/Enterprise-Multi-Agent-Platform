import React, { useState } from 'react';
import { useTheme } from './theme';
import { Card } from './components/Card';
import { Button } from './components/Button';
import { KpiTile } from './components/KpiTile';
import { Select } from './components/Select';
import { Input } from './components/Input';
import { Table } from './components/Table';
import { Tabs } from './components/Tabs';
import { Toggle } from './components/Toggle';
import { Checkbox } from './components/Checkbox';
import { Grid, GridItem } from './components/Grid';
import { RobotCharacter } from '../ai-interaction/RobotCharacter/RobotCharacter';
import { LaserPointer } from '../ai-interaction/LaserPointer/LaserPointer';
import { SpeechBubble } from '../ai-interaction/SpeechBubble/SpeechBubble';
import { QueryInput } from '../QueryInput/QueryInput';

/**
 * ComponentDemo
 * 
 * A demo page showcasing all Enterprise IQ UI components with dummy data.
 */
const ComponentDemo = () => {
  const theme = useTheme();
  
  // State
  const [toggleState, setToggleState] = useState(false);
  const [checkbox1, setCheckbox1] = useState(false);
  const [checkbox2, setCheckbox2] = useState(true);
  const [selectedTab, setSelectedTab] = useState('tab1');
  const [inputValue, setInputValue] = useState('');
  const [selectValue, setSelectValue] = useState(null);
  const [robotPosition, setRobotPosition] = useState({ x: 100, y: 100 });
  const [showLaser, setShowLaser] = useState(false);
  const [showSpeechBubble, setShowSpeechBubble] = useState(false);
  const [speechBubbleText, setSpeechBubbleText] = useState('');
  const [laserTarget, setLaserTarget] = useState({ x: 400, y: 300 });
  
  // Options for select dropdown
  const selectOptions = [
    { value: 'option1', label: 'Option 1' },
    { value: 'option2', label: 'Option 2' },
    { value: 'option3', label: 'Option 3' },
  ];
  
  // Tabs data
  const tabsData = [
    { id: 'tab1', label: 'Dashboard', content: <div>Dashboard Content</div> },
    { id: 'tab2', label: 'Analytics', content: <div>Analytics Content</div> },
    { id: 'tab3', label: 'Settings', content: <div>Settings Content</div> },
  ];
  
  // Table data
  const tableColumns = [
    { key: 'id', title: 'ID', width: '80px' },
    { key: 'name', title: 'Name' },
    { key: 'value', title: 'Value', align: 'right' },
    { key: 'status', title: 'Status' },
  ];
  
  const tableData = [
    { id: 1, name: 'Product A', value: '$1,200', status: 'Active' },
    { id: 2, name: 'Product B', value: '$850', status: 'Inactive' },
    { id: 3, name: 'Product C', value: '$2,400', status: 'Active' },
  ];
  
  // Container style
  const containerStyle = {
    backgroundColor: theme.colors.midnightNavy,
    minHeight: '100vh',
    padding: theme.spacing[6],
    color: theme.colors.cloudWhite,
    position: 'relative',
  };
  
  // Section style
  const sectionStyle = {
    marginBottom: theme.spacing[8],
  };
  
  // Section title style
  const sectionTitleStyle = {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.semibold,
    marginBottom: theme.spacing[4],
  };
  
  // Handle robot drag end
  const handleRobotDragEnd = (position) => {
    setRobotPosition(position);
  };
  
  // Handle query submit
  const handleQuerySubmit = (query) => {
    setSpeechBubbleText(query);
    setShowSpeechBubble(true);
    
    // Simulate response
    setTimeout(() => {
      setShowSpeechBubble(false);
      setTimeout(() => {
        setShowLaser(true);
        
        // Turn off the laser after 3 seconds
        setTimeout(() => {
          setShowLaser(false);
        }, 3000);
      }, 500);
    }, 2000);
  };
  
  return (
    <div style={containerStyle}>
      <h1 style={{ fontSize: theme.typography.fontSize.xxl, marginBottom: theme.spacing[6] }}>
        Enterprise IQ UI Component Demo
      </h1>
      
      {/* Cards Section */}
      <div style={sectionStyle}>
        <h2 style={sectionTitleStyle}>Cards</h2>
        <Grid columns={3} spacing="lg">
          <GridItem>
            <Card title="Default Card" subtitle="Card subtitle">
              <p>This is a default card with title and subtitle.</p>
            </Card>
          </GridItem>
          <GridItem>
            <Card title="Card with Actions" actions={<Button size="sm">Action</Button>}>
              <p>This card has an action button in the header.</p>
            </Card>
          </GridItem>
          <GridItem>
            <Card variant="interactive" title="Interactive Variant">
              <p>This is a card with interactive variant.</p>
            </Card>
          </GridItem>
        </Grid>
      </div>
      
      {/* Buttons Section */}
      <div style={sectionStyle}>
        <h2 style={sectionTitleStyle}>Buttons</h2>
        <Card>
          <Grid columns={4} spacing="md">
            <GridItem>
              <Button variant="primary">Primary</Button>
            </GridItem>
            <GridItem>
              <Button variant="secondary">Secondary</Button>
            </GridItem>
            <GridItem>
              <Button variant="primary">Primary Alt</Button>
            </GridItem>
            <GridItem>
              <Button variant="secondary">Secondary Alt</Button>
            </GridItem>
            <GridItem>
              <Button variant="primary" size="sm">Small</Button>
            </GridItem>
            <GridItem>
              <Button variant="primary" size="md">Medium</Button>
            </GridItem>
            <GridItem>
              <Button variant="primary" size="lg">Large</Button>
            </GridItem>
            <GridItem>
              <Button variant="primary" disabled>Disabled</Button>
            </GridItem>
          </Grid>
        </Card>
      </div>
      
      {/* KPI Tiles Section */}
      <div style={sectionStyle}>
        <h2 style={sectionTitleStyle}>KPI Tiles</h2>
        <Grid columns={4} spacing="md">
          <GridItem>
            <KpiTile 
              value={1254} 
              label="Total Customers" 
              trend="12%" 
              trendDirection="up-good"
            />
          </GridItem>
          <GridItem>
            <KpiTile 
              value="$45,800" 
              label="Revenue" 
              trend="5.2%" 
              trendDirection="up-good"
            />
          </GridItem>
          <GridItem>
            <KpiTile 
              value={87} 
              label="New Orders" 
              trend="3%" 
              trendDirection="down-bad"
            />
          </GridItem>
          <GridItem>
            <KpiTile 
              value="98.2%" 
              label="Customer Satisfaction" 
              trend="0.5%" 
              trendDirection="up-good"
            />
          </GridItem>
        </Grid>
      </div>
      
      {/* Form Controls Section */}
      <div style={sectionStyle}>
        <h2 style={sectionTitleStyle}>Form Controls</h2>
        <Card>
          <Grid columns={2} spacing="lg">
            <GridItem>
              <h3 style={{ marginBottom: theme.spacing[3] }}>Input</h3>
              <Input 
                label="Text Input"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Enter text..."
                fullWidth
              />
              <div style={{ marginTop: theme.spacing[4] }}>
                <Input 
                  label="Disabled Input"
                  value="Disabled value"
                  disabled
                  fullWidth
                />
              </div>
              <div style={{ marginTop: theme.spacing[4] }}>
                <Input 
                  label="Input with Error"
                  value="Error value"
                  error="This field is required"
                  fullWidth
                />
              </div>
            </GridItem>
            <GridItem>
              <h3 style={{ marginBottom: theme.spacing[3] }}>Select</h3>
              <Select
                label="Dropdown"
                options={selectOptions}
                value={selectValue}
                onChange={setSelectValue}
                placeholder="Select an option..."
                fullWidth
              />
              <div style={{ marginTop: theme.spacing[4] }}>
                <h3 style={{ marginBottom: theme.spacing[3] }}>Toggle & Checkbox</h3>
                <div style={{ marginBottom: theme.spacing[3] }}>
                  <Toggle 
                    checked={toggleState} 
                    onChange={setToggleState} 
                    label="Toggle Switch"
                  />
                </div>
                <div style={{ marginBottom: theme.spacing[3] }}>
                  <Checkbox 
                    checked={checkbox1} 
                    onChange={setCheckbox1} 
                    label="Checkbox Option 1"
                  />
                </div>
                <div>
                  <Checkbox 
                    checked={checkbox2} 
                    onChange={setCheckbox2} 
                    label="Checkbox Option 2"
                  />
                </div>
              </div>
            </GridItem>
          </Grid>
        </Card>
      </div>
      
      {/* Table Section */}
      <div style={sectionStyle}>
        <h2 style={sectionTitleStyle}>Table</h2>
        <Card>
          <Table
            columns={tableColumns}
            data={tableData}
            onRowClick={(row) => console.log('Row clicked:', row)}
          />
        </Card>
      </div>
      
      {/* Tabs Section */}
      <div style={sectionStyle}>
        <h2 style={sectionTitleStyle}>Tabs</h2>
        <Card>
          <Tabs
            tabs={tabsData}
            activeTab={selectedTab}
            onChange={setSelectedTab}
          />
        </Card>
      </div>
      
      {/* AI Interaction Components Section */}
      <div style={sectionStyle}>
        <h2 style={sectionTitleStyle}>AI Interaction Components</h2>
        <Card>
          <p style={{ marginBottom: theme.spacing[4] }}>
            Type a query below to see the AI interaction components in action:
          </p>
          <div style={{ maxWidth: '500px', marginBottom: theme.spacing[6] }}>
            <QueryInput onSubmit={handleQuerySubmit} />
          </div>
          
          <div style={{ height: '400px', position: 'relative', border: `1px solid ${theme.colors.graphiteLight}`, borderRadius: theme.borderRadius.md }}>
            <RobotCharacter
              initialPosition={robotPosition}
              state={showLaser ? 'pointing' : (showSpeechBubble ? 'speaking' : 'idle')}
              laserTarget={laserTarget}
              message={speechBubbleText}
              laserColor="green"
              isVisible={true}
              className="robot-character"
            />
            
            {showSpeechBubble && (
              <SpeechBubble 
                message={speechBubbleText}
                positionCoords={{ 
                  x: robotPosition.x + 60, 
                  y: robotPosition.y - 60 
                }}
                isThinking={false}
                position="right"
                autoClose={true}
                closeDuration={5000}
                onClose={() => setShowSpeechBubble(false)}
              />
            )}
            
            {showLaser && (
              <LaserPointer
                origin={{ 
                  x: robotPosition.x + 30, 
                  y: robotPosition.y + 20 
                }}
                target={laserTarget}
                color={theme.colors.electricCyan}
                pulsing={true}
                width={3}
              />
            )}
            
            <div 
              style={{ 
                position: 'absolute', 
                top: laserTarget.y - 20, 
                left: laserTarget.x - 20,
                width: '40px',
                height: '40px',
                backgroundColor: theme.colors.electricCyan,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: theme.colors.midnightNavy,
                fontWeight: 'bold',
              }}
            >
              ?
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default ComponentDemo; 