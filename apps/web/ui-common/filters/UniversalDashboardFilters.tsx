import React, { useState, useEffect } from 'react';
import { Calendar, Filter, RefreshCw, X, Check, ChevronDown, ChevronUp } from 'lucide-react';

export interface FilterConfig {
  type: 'date' | 'select' | 'multiselect' | 'search' | 'range' | 'toggle';
  label: string;
  key: string;
  placeholder?: string;
  options?: { value: string; label: string }[];
  defaultValue?: any;
  min?: number;
  max?: number;
  icon?: React.ReactNode;
}

export interface UniversalFiltersProps {
  filters: FilterConfig[];
  onFilterChange: (filters: Record<string, any>) => void;
  onReset?: () => void;
  title?: string;
  compact?: boolean;
  className?: string;
}

const UniversalDashboardFilters: React.FC<UniversalFiltersProps> = ({
  filters,
  onFilterChange,
  onReset,
  title = 'Filters',
  compact = false,
  className = ''
}) => {
  const [filterValues, setFilterValues] = useState<Record<string, any>>({});
  const [pendingFilters, setPendingFilters] = useState<Record<string, any>>({});
  const [isExpanded, setIsExpanded] = useState(!compact);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    // Initialize with default values
    const defaults: Record<string, any> = {};
    filters.forEach(filter => {
      if (filter.defaultValue !== undefined) {
        defaults[filter.key] = filter.defaultValue;
      }
    });
    setFilterValues(defaults);
    setPendingFilters(defaults);
  }, [filters]);

  const handleFilterChange = (key: string, value: any) => {
    const newValues = { ...pendingFilters, [key]: value };
    setPendingFilters(newValues);
    setHasChanges(JSON.stringify(newValues) !== JSON.stringify(filterValues));
  };

  const handleApplyFilters = () => {
    setFilterValues(pendingFilters);
    onFilterChange(pendingFilters);
    setHasChanges(false);
  };

  const handleCancelChanges = () => {
    setPendingFilters(filterValues);
    setHasChanges(false);
  };

  const handleReset = () => {
    const defaults: Record<string, any> = {};
    filters.forEach(filter => {
      if (filter.defaultValue !== undefined) {
        defaults[filter.key] = filter.defaultValue;
      }
    });
    setFilterValues(defaults);
    setPendingFilters(defaults);
    onFilterChange(defaults);
    setHasChanges(false);
    if (onReset) onReset();
  };

  const renderFilter = (filter: FilterConfig) => {
    const value = pendingFilters[filter.key];

    switch (filter.type) {
      case 'date':
        return (
          <div className="filter-date">
            <label>{filter.label}</label>
            <div className="date-inputs">
              <input
                type="date"
                value={value?.startDate || ''}
                onChange={(e) => handleFilterChange(filter.key, { ...value, startDate: e.target.value })}
                placeholder="Start date"
              />
              <span className="date-separator">to</span>
              <input
                type="date"
                value={value?.endDate || ''}
                onChange={(e) => handleFilterChange(filter.key, { ...value, endDate: e.target.value })}
                placeholder="End date"
              />
            </div>
          </div>
        );

      case 'select':
        return (
          <div className="filter-select">
            <label>{filter.label}</label>
            <select
              value={value || ''}
              onChange={(e) => handleFilterChange(filter.key, e.target.value)}
            >
              <option value="">{filter.placeholder || 'All'}</option>
              {filter.options?.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        );

      case 'multiselect':
        return (
          <div className="filter-multiselect">
            <label>{filter.label}</label>
            <div className="multiselect-container">
              {filter.options?.map(option => (
                <label key={option.value} className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={value?.includes(option.value) || false}
                    onChange={(e) => {
                      const currentValues = value || [];
                      if (e.target.checked) {
                        handleFilterChange(filter.key, [...currentValues, option.value]);
                      } else {
                        handleFilterChange(filter.key, currentValues.filter((v: string) => v !== option.value));
                      }
                    }}
                  />
                  <span>{option.label}</span>
                </label>
              ))}
            </div>
          </div>
        );

      case 'search':
        return (
          <div className="filter-search">
            <label>{filter.label}</label>
            <input
              type="text"
              value={value || ''}
              onChange={(e) => handleFilterChange(filter.key, e.target.value)}
              placeholder={filter.placeholder || 'Search...'}
            />
          </div>
        );

      case 'range':
        return (
          <div className="filter-range">
            <label>{filter.label}</label>
            <div className="range-inputs">
              <input
                type="number"
                value={value?.min || ''}
                onChange={(e) => handleFilterChange(filter.key, { ...value, min: e.target.value })}
                placeholder={`Min ${filter.min || ''}`}
                min={filter.min}
                max={filter.max}
              />
              <span className="range-separator">-</span>
              <input
                type="number"
                value={value?.max || ''}
                onChange={(e) => handleFilterChange(filter.key, { ...value, max: e.target.value })}
                placeholder={`Max ${filter.max || ''}`}
                min={filter.min}
                max={filter.max}
              />
            </div>
          </div>
        );

      case 'toggle':
        return (
          <div className="filter-toggle">
            <label className="toggle-label">
              <input
                type="checkbox"
                checked={value || false}
                onChange={(e) => handleFilterChange(filter.key, e.target.checked)}
              />
              <span className="toggle-slider"></span>
              <span className="toggle-text">{filter.label}</span>
            </label>
          </div>
        );

      default:
        return null;
    }
  };

  const activeFiltersCount = Object.keys(filterValues).filter(key => {
    const value = filterValues[key];
    const filter = filters.find(f => f.key === key);
    if (!filter) return false;
    
    if (filter.type === 'multiselect') return value?.length > 0;
    if (filter.type === 'date') return value?.startDate || value?.endDate;
    if (filter.type === 'range') return value?.min || value?.max;
    return value !== filter.defaultValue && value !== '' && value !== undefined;
  }).length;

  const pendingChangesCount = Object.keys(pendingFilters).filter(key => {
    const value = pendingFilters[key];
    const filter = filters.find(f => f.key === key);
    if (!filter) return false;
    
    if (filter.type === 'multiselect') return value?.length > 0;
    if (filter.type === 'date') return value?.startDate || value?.endDate;
    if (filter.type === 'range') return value?.min || value?.max;
    return value !== filter.defaultValue && value !== '' && value !== undefined;
  }).length;

  return (
    <div className={`universal-filters ${className} ${hasChanges ? 'has-changes' : ''}`}>
      <div className="filters-header">
        <div className="filters-title">
          <Filter size={20} />
          <span>{title}</span>
          {activeFiltersCount > 0 && (
            <span className="active-count">{activeFiltersCount}</span>
          )}
          {hasChanges && (
            <span className="pending-changes">{pendingChangesCount} pending</span>
          )}
        </div>
        <div className="filters-actions">
          <button
            className="filter-toggle-btn"
            onClick={() => setIsExpanded(!isExpanded)}
            aria-label={isExpanded ? 'Collapse filters' : 'Expand filters'}
          >
            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            {isExpanded ? 'Hide' : 'Show'} Filters
          </button>
        </div>
      </div>

      {isExpanded && (
        <>
          <div className="filters-content">
            {filters.map(filter => (
              <div key={filter.key} className="filter-item">
                {filter.icon && <div className="filter-icon">{filter.icon}</div>}
                {renderFilter(filter)}
              </div>
            ))}
          </div>
          
          <div className="filters-footer">
            <div className="footer-left">
              {activeFiltersCount > 0 && (
                <button className="filter-reset-btn" onClick={handleReset}>
                  <RefreshCw size={14} />
                  Reset All
                </button>
              )}
            </div>
            <div className="footer-right">
              {hasChanges && (
                <button className="filter-cancel-btn" onClick={handleCancelChanges}>
                  <X size={14} />
                  Cancel
                </button>
              )}
              <button 
                className={`filter-apply-btn ${hasChanges ? 'has-changes' : ''}`}
                onClick={handleApplyFilters}
                disabled={!hasChanges}
              >
                <Check size={14} />
                Apply Filters
              </button>
            </div>
          </div>
        </>
      )}

      <style jsx>{`
        .universal-filters {
          background: linear-gradient(135deg, rgba(30, 39, 56, 0.95) 0%, rgba(26, 35, 50, 0.95) 100%);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(0, 224, 255, 0.15);
          border-radius: 16px;
          padding: 0;
          margin-bottom: 24px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.05);
          transition: all 0.3s ease;
          overflow: hidden;
        }

        .universal-filters.has-changes {
          border-color: rgba(0, 224, 255, 0.3);
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4), 
                      0 0 40px rgba(0, 224, 255, 0.1),
                      inset 0 1px 0 rgba(255, 255, 255, 0.05);
        }

        .filters-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 20px;
          background: rgba(0, 0, 0, 0.2);
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        }

        .filters-title {
          display: flex;
          align-items: center;
          gap: 10px;
          color: #f7f9fb;
          font-size: 16px;
          font-weight: 600;
        }

        .filters-title svg {
          color: #00e0ff;
        }

        .active-count {
          background: linear-gradient(135deg, #00e0ff 0%, #00b8d4 100%);
          color: #0a1224;
          padding: 3px 10px;
          border-radius: 20px;
          font-size: 11px;
          font-weight: 700;
          box-shadow: 0 2px 8px rgba(0, 224, 255, 0.3);
        }

        .pending-changes {
          background: linear-gradient(135deg, #ffd600 0%, #ff9800 100%);
          color: #0a1224;
          padding: 3px 10px;
          border-radius: 20px;
          font-size: 11px;
          font-weight: 700;
          box-shadow: 0 2px 8px rgba(255, 214, 0, 0.3);
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }

        .filters-actions {
          display: flex;
          gap: 12px;
        }

        .filter-toggle-btn {
          background: rgba(0, 224, 255, 0.1);
          border: 1px solid rgba(0, 224, 255, 0.2);
          color: #00e0ff;
          padding: 8px 14px;
          border-radius: 8px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 6px;
          transition: all 0.3s ease;
          font-size: 13px;
          font-weight: 500;
        }

        .filter-toggle-btn:hover {
          background: rgba(0, 224, 255, 0.15);
          border-color: rgba(0, 224, 255, 0.3);
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0, 224, 255, 0.2);
        }

        .filters-content {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 24px;
          padding: 24px;
          background: rgba(0, 0, 0, 0.1);
        }

        .filter-item {
          display: flex;
          align-items: flex-start;
          gap: 8px;
        }

        .filter-icon {
          color: #00e0ff;
          margin-top: 28px;
        }

        .filters-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 24px;
          background: rgba(0, 0, 0, 0.2);
          border-top: 1px solid rgba(255, 255, 255, 0.05);
        }

        .footer-left,
        .footer-right {
          display: flex;
          gap: 12px;
          align-items: center;
        }

        .filter-reset-btn,
        .filter-cancel-btn,
        .filter-apply-btn {
          padding: 10px 18px;
          border-radius: 8px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 6px;
          transition: all 0.3s ease;
          font-size: 13px;
          font-weight: 600;
          border: 1px solid transparent;
        }

        .filter-reset-btn {
          background: rgba(255, 82, 82, 0.1);
          border-color: rgba(255, 82, 82, 0.2);
          color: #ff5252;
        }

        .filter-reset-btn:hover {
          background: rgba(255, 82, 82, 0.15);
          border-color: rgba(255, 82, 82, 0.3);
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(255, 82, 82, 0.2);
        }

        .filter-cancel-btn {
          background: rgba(255, 255, 255, 0.05);
          border-color: rgba(255, 255, 255, 0.1);
          color: #b8c5d6;
        }

        .filter-cancel-btn:hover {
          background: rgba(255, 255, 255, 0.08);
          border-color: rgba(255, 255, 255, 0.15);
          color: #f7f9fb;
        }

        .filter-apply-btn {
          background: linear-gradient(135deg, rgba(0, 224, 255, 0.1) 0%, rgba(0, 184, 212, 0.1) 100%);
          border-color: rgba(0, 224, 255, 0.2);
          color: #00e0ff;
        }

        .filter-apply-btn.has-changes {
          background: linear-gradient(135deg, #00e0ff 0%, #00b8d4 100%);
          color: #0a1224;
          font-weight: 700;
          box-shadow: 0 4px 16px rgba(0, 224, 255, 0.3);
        }

        .filter-apply-btn:not(:disabled):hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(0, 224, 255, 0.4);
        }

        .filter-apply-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        label {
          display: block;
          color: #b8c5d6;
          font-size: 11px;
          font-weight: 600;
          margin-bottom: 8px;
          text-transform: uppercase;
          letter-spacing: 0.8px;
        }

        input[type="text"],
        input[type="date"],
        input[type="number"],
        select {
          width: 100%;
          background: rgba(10, 18, 36, 0.7);
          border: 1px solid rgba(255, 255, 255, 0.08);
          color: #f7f9fb;
          padding: 10px 14px;
          border-radius: 8px;
          font-size: 14px;
          transition: all 0.3s ease;
        }

        input[type="text"]:focus,
        input[type="date"]:focus,
        input[type="number"]:focus,
        select:focus {
          outline: none;
          border-color: #00e0ff;
          background: rgba(10, 18, 36, 0.9);
          box-shadow: 0 0 0 3px rgba(0, 224, 255, 0.1), 0 2px 8px rgba(0, 224, 255, 0.2);
        }

        select option {
          background: #0a1224;
          color: #f7f9fb;
          padding: 8px;
        }

        .date-inputs,
        .range-inputs {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .date-separator,
        .range-separator {
          color: #00e0ff;
          font-size: 14px;
          font-weight: 600;
          opacity: 0.6;
        }

        .multiselect-container {
          max-height: 140px;
          overflow-y: auto;
          background: rgba(10, 18, 36, 0.7);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 8px;
          padding: 12px;
        }

        .multiselect-container::-webkit-scrollbar {
          width: 6px;
        }

        .multiselect-container::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 3px;
        }

        .multiselect-container::-webkit-scrollbar-thumb {
          background: rgba(0, 224, 255, 0.3);
          border-radius: 3px;
        }

        .multiselect-container::-webkit-scrollbar-thumb:hover {
          background: rgba(0, 224, 255, 0.5);
        }

        .checkbox-label {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 6px 8px;
          cursor: pointer;
          color: #b8c5d6;
          font-size: 13px;
          border-radius: 6px;
          transition: all 0.2s ease;
        }

        .checkbox-label:hover {
          background: rgba(0, 224, 255, 0.05);
          color: #f7f9fb;
        }

        input[type="checkbox"] {
          width: 18px;
          height: 18px;
          accent-color: #00e0ff;
          cursor: pointer;
          border-radius: 4px;
        }

        .toggle-label {
          display: flex;
          align-items: center;
          gap: 12px;
          cursor: pointer;
          padding: 8px;
          border-radius: 8px;
          transition: background 0.2s ease;
        }

        .toggle-label:hover {
          background: rgba(0, 224, 255, 0.05);
        }

        .toggle-slider {
          position: relative;
          width: 48px;
          height: 26px;
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 13px;
          transition: all 0.3s ease;
        }

        .toggle-label input:checked + .toggle-slider {
          background: linear-gradient(135deg, #00e0ff 0%, #00b8d4 100%);
          border-color: transparent;
          box-shadow: 0 2px 8px rgba(0, 224, 255, 0.3);
        }

        .toggle-slider::after {
          content: '';
          position: absolute;
          top: 3px;
          left: 3px;
          width: 18px;
          height: 18px;
          background: #f7f9fb;
          border-radius: 50%;
          transition: transform 0.3s ease;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }

        .toggle-label input:checked + .toggle-slider::after {
          transform: translateX(22px);
        }

        .toggle-label input {
          display: none;
        }

        .toggle-text {
          color: #f7f9fb;
          font-size: 13px;
          font-weight: 500;
        }

        /* Enhanced focus states */
        input:focus-visible,
        select:focus-visible,
        button:focus-visible {
          outline: 2px solid #00e0ff;
          outline-offset: 2px;
        }

        /* Smooth animations */
        * {
          transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
        }

        @media (max-width: 768px) {
          .filters-content {
            grid-template-columns: 1fr;
            padding: 16px;
          }

          .filters-footer {
            flex-direction: column;
            gap: 12px;
          }

          .footer-left,
          .footer-right {
            width: 100%;
            justify-content: center;
          }
        }
      `}</style>
    </div>
  );
};

export default UniversalDashboardFilters;