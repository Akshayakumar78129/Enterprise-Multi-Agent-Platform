import React, { useState, useEffect, useRef } from 'react';
import styles from './DateRangeFilter.module.css';

const DateRangeFilter = ({ 
  selectedRange = { start: '', end: '' }, 
  onRangeChange, 
  isLoading = false,
  className = '',
  minDate = '2017-01-01',
  maxDate = '2024-12-31'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [tempRange, setTempRange] = useState(selectedRange);
  const [activePreset, setActivePreset] = useState(null);
  const dropdownRef = useRef(null);
  const triggerRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target) &&
          triggerRef.current && !triggerRef.current.contains(event.target)) {
        handleClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Update temp range when selected range changes
  useEffect(() => {
    setTempRange(selectedRange);
  }, [selectedRange]);

  // Handle smooth opening and closing
  const handleToggle = () => {
    if (isOpen) {
      handleClose();
    } else {
      handleOpen();
    }
  };

  const handleOpen = () => {
    setIsAnimating(true);
    setIsOpen(true);
    // Allow animation to complete
    setTimeout(() => setIsAnimating(false), 300);
  };

  const handleClose = () => {
    setIsAnimating(true);
    // Start closing animation
    setTimeout(() => {
      setIsOpen(false);
      setIsAnimating(false);
    }, 200);
  };

  // Date presets
  const presets = [
    {
      id: 'last_7_days',
      label: 'Last 7 Days',
      icon: '📅',
      getRange: () => {
        const end = new Date();
        const start = new Date();
        start.setDate(end.getDate() - 7);
        return {
          start: start.toISOString().split('T')[0],
          end: end.toISOString().split('T')[0]
        };
      }
    },
    {
      id: 'last_30_days',
      label: 'Last 30 Days',
      icon: '📊',
      getRange: () => {
        const end = new Date();
        const start = new Date();
        start.setDate(end.getDate() - 30);
        return {
          start: start.toISOString().split('T')[0],
          end: end.toISOString().split('T')[0]
        };
      }
    },
    {
      id: 'last_90_days',
      label: 'Last 90 Days',
      icon: '📈',
      getRange: () => {
        const end = new Date();
        const start = new Date();
        start.setDate(end.getDate() - 90);
        return {
          start: start.toISOString().split('T')[0],
          end: end.toISOString().split('T')[0]
        };
      }
    },
    {
      id: 'this_year',
      label: 'This Year',
      icon: '🗓️',
      getRange: () => {
        const now = new Date();
        return {
          start: `${now.getFullYear()}-01-01`,
          end: now.toISOString().split('T')[0]
        };
      }
    },
    {
      id: 'last_year',
      label: 'Last Year',
      icon: '📆',
      getRange: () => {
        const now = new Date();
        const lastYear = now.getFullYear() - 1;
        return {
          start: `${lastYear}-01-01`,
          end: `${lastYear}-12-31`
        };
      }
    },
    {
      id: 'all_time',
      label: 'All Available Data',
      icon: '🌐',
      getRange: () => ({
        start: minDate,
        end: maxDate
      })
    }
  ];

  const handlePresetClick = (preset) => {
    const range = preset.getRange();
    setTempRange(range);
    setActivePreset(preset.id);
    onRangeChange(range);
    setIsOpen(false);
  };

  const handleDateChange = (field, value) => {
    const newRange = { ...tempRange, [field]: value };
    setTempRange(newRange);
    setActivePreset(null);
  };

  const handleApply = () => {
    if (tempRange.start && tempRange.end) {
      onRangeChange(tempRange);
      setIsOpen(false);
    }
  };

  const handleClear = () => {
    const clearedRange = { start: '', end: '' };
    setTempRange(clearedRange);
    onRangeChange(clearedRange);
    setActivePreset(null);
  };

  const formatDateRange = () => {
    if (!selectedRange.start || !selectedRange.end) {
      return 'Select date range';
    }
    
    const startDate = new Date(selectedRange.start);
    const endDate = new Date(selectedRange.end);
    
    const formatOptions = { 
      month: 'short', 
      day: 'numeric', 
      year: startDate.getFullYear() !== endDate.getFullYear() ? 'numeric' : undefined 
    };
    
    return `${startDate.toLocaleDateString('en-US', formatOptions)} - ${endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
  };

  const getDaysDifference = () => {
    if (!selectedRange.start || !selectedRange.end) return 0;
    const start = new Date(selectedRange.start);
    const end = new Date(selectedRange.end);
    return Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
  };

  const isValidRange = () => {
    if (!tempRange.start || !tempRange.end) return false;
    return new Date(tempRange.start) <= new Date(tempRange.end);
  };

  return (
    <div className={`${styles.dateRangeFilter} ${className}`}>
      {/* Trigger Button */}
      <button
        ref={triggerRef}
        className={`${styles.trigger} ${isOpen ? styles.active : ''} ${isLoading ? styles.loading : ''}`}
        onClick={handleToggle}
        disabled={isLoading}
      >
        <div className={styles.triggerContent}>
          <div className={styles.triggerIcon}>
            {isLoading ? (
              <div className={styles.spinner} />
            ) : (
              <span>📅</span>
            )}
          </div>
          <div className={styles.triggerText}>
            <span className={styles.triggerLabel}>Date Range</span>
            <span className={styles.triggerValue}>
              {formatDateRange()}
            </span>
          </div>
          <div className={styles.triggerArrow}>
            <svg 
              width="12" 
              height="12" 
              viewBox="0 0 12 12" 
              fill="none"
              className={isOpen ? styles.rotated : ''}
            >
              <path 
                d="M3 4.5L6 7.5L9 4.5" 
                stroke="currentColor" 
                strokeWidth="1.5" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>
        {getDaysDifference() > 0 && (
          <div className={styles.daysBadge}>
            {getDaysDifference()}d
          </div>
        )}
      </button>

      {/* Dropdown Panel with Sliding Animation */}
      {(isOpen || isAnimating) && (
        <div 
          ref={dropdownRef} 
          className={`${styles.dropdown} ${isOpen && !isAnimating ? styles.slideIn : styles.slideOut}`}
        >
          {/* Header */}
          <div className={styles.dropdownHeader}>
            <div className={styles.headerTitle}>
              <span className={styles.headerIcon}>📅</span>
              <span>Select Date Range</span>
            </div>
            <div className={styles.headerStats}>
              {getDaysDifference() > 0 && (
                <span className={styles.statItem}>
                  <span className={styles.statValue}>{getDaysDifference()}</span>
                  <span className={styles.statLabel}>Days Selected</span>
                </span>
              )}
            </div>
          </div>

          {/* Quick Presets */}
          <div className={styles.presetsSection}>
            <div className={styles.presetsHeader}>
              <span className={styles.presetsIcon}>⚡</span>
              <span>Quick Presets</span>
            </div>
            <div className={styles.presetsList}>
              {presets.map((preset) => (
                <button
                  key={preset.id}
                  className={`${styles.presetButton} ${activePreset === preset.id ? styles.active : ''}`}
                  onClick={() => handlePresetClick(preset)}
                >
                  <span className={styles.presetIcon}>{preset.icon}</span>
                  <span className={styles.presetLabel}>{preset.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Custom Date Inputs */}
          <div className={styles.customSection}>
            <div className={styles.customHeader}>
              <span className={styles.customIcon}>🎯</span>
              <span>Custom Range</span>
            </div>
            <div className={styles.dateInputs}>
              <div className={styles.dateInput}>
                <label className={styles.dateLabel}>Start Date</label>
                <input
                  type="date"
                  value={tempRange.start}
                  onChange={(e) => handleDateChange('start', e.target.value)}
                  min={minDate}
                  max={maxDate}
                  className={styles.dateField}
                />
              </div>
              <div className={styles.dateInput}>
                <label className={styles.dateLabel}>End Date</label>
                <input
                  type="date"
                  value={tempRange.end}
                  onChange={(e) => handleDateChange('end', e.target.value)}
                  min={minDate}
                  max={maxDate}
                  className={styles.dateField}
                />
              </div>
            </div>
            {!isValidRange() && tempRange.start && tempRange.end && (
              <div className={styles.validationError}>
                <span className={styles.errorIcon}>⚠️</span>
                End date must be after start date
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className={styles.dropdownFooter}>
            <button
              className={styles.clearButton}
              onClick={handleClear}
              disabled={!selectedRange.start && !selectedRange.end}
            >
              Clear
            </button>
            <button
              className={styles.applyButton}
              onClick={handleApply}
              disabled={!isValidRange()}
            >
              Apply Range
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DateRangeFilter;