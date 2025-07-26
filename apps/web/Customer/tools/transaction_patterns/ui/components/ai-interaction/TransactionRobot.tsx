import React, { useState, useRef, useEffect } from 'react';
import { RobotCharacter } from '../../../../../../ui-common/ai-interaction/RobotCharacter/RobotCharacter';
import { SpeechBubble } from '../../../../../../ui-common/ai-interaction/SpeechBubble/SpeechBubble';
import { LaserPointer } from '../../../../../../ui-common/ai-interaction/LaserPointer/LaserPointer';
import { useTheme } from '../../../../../../ui-common/design-system/theme';

interface TransactionRobotProps {
  initialPosition?: { x: number; y: number };
  isDraggable?: boolean;
}

type RobotState = 'idle' | 'thinking' | 'speaking' | 'pointing';

export const TransactionRobot: React.FC<TransactionRobotProps> = ({
  initialPosition = { x: 20, y: 20 },
  isDraggable = true
}) => {
  const theme = useTheme();
  const [position, setPosition] = useState(initialPosition);
  const [robotState, setRobotState] = useState<RobotState>('idle');
  const [message, setMessage] = useState<string | null>(null);
  const [targetElement, setTargetElement] = useState<any>(null);
  const robotRef = useRef<HTMLDivElement>(null);
  
  // Handle dragging
  const handleDragEnd = (newPosition: { x: number; y: number }) => {
    setPosition(newPosition);
  };
  
  // Example methods that would be called from other components
  const pointToElement = (element: HTMLElement, explanation: string) => {
    if (element) {
      setTargetElement(element);
      setMessage(explanation);
      setRobotState('pointing');
    }
  };
  
  const showThinking = (thinkingMessage: string = 'Analyzing transactions...') => {
    setMessage(thinkingMessage);
    setRobotState('thinking');
    setTargetElement(null);
  };
  
  const speak = (speechContent: string) => {
    setMessage(speechContent);
    setRobotState('speaking');
    setTargetElement(null);
  };
  
  const resetState = () => {
    setRobotState('idle');
    setMessage(null);
    setTargetElement(null);
  };
  
  // Expose methods for parent components
  React.useImperativeHandle(
    robotRef,
    () => ({
      pointToElement,
      showThinking,
      speak,
      resetState
    })
  );
  
  // Render speech bubble based on state
  const renderSpeechBubble = () => {
    if (!message) return null;
    
    return (
      <SpeechBubble
        message={message}
        position={{ x: position.x + 70, y: position.y }}
        isThinking={robotState === 'thinking'}
        autoClose={robotState !== 'pointing'}
        onClose={() => {
          if (robotState !== 'pointing') {
            setMessage(null);
            setRobotState('idle');
          }
        }}
      />
    );
  };
  
  // Render laser pointer if pointing
  const renderLaserPointer = () => {
    if (robotState !== 'pointing' || !targetElement) return null;
    
    return (
      <LaserPointer
        origin={{ x: position.x + 30, y: position.y + 20 }}
        target={targetElement}
        color={theme.colors.electricCyan}
        width={2}
        pulsing={true}
      />
    );
  };
  
  return (
    <>
      <RobotCharacter
        initialPosition={position}
        state={robotState}
        isDraggable={isDraggable}
        onDragEnd={handleDragEnd}
        laserTarget={targetElement}
        laserColor={theme.colors.electricCyan}
        message={message}
      />
      {renderSpeechBubble()}
      {renderLaserPointer()}
    </>
  );
}; 