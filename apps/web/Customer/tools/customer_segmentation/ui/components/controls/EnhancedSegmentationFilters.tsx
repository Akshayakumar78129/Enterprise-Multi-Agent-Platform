import React from 'react';
import { motion } from 'framer-motion';
import { segmentationTheme } from '../../styles/theme';

interface EnhancedSegmentationFiltersProps {
  regions: string[];
  segments: Array<string | number>;
  value: {
    region?: string;
    segment?: string | number;
    dateRange?: string;
  };
  onChange: (filters: any) => void;
}

const EnhancedSegmentationFilters: React.FC<EnhancedSegmentationFiltersProps> = ({
  regions,
  segments,
  value,
  onChange,
}) => {
  const dateRanges = [
    { value: '7d', label: 'Last 7 Days' },
    { value: '30d', label: 'Last 30 Days' },
    { value: '90d', label: 'Last Quarter' },
    { value: '1y', label: 'Last Year' },
    { value: 'all', label: 'All Time' },
  ];

  const handleRegionChange = (region: string) => {
    onChange({
      ...value,
      region: value.region === region ? undefined : region,
    });
  };

  const handleSegmentChange = (segment: string | number) => {
    onChange({
      ...value,
      segment: value.segment === segment ? undefined : segment,
    });
  };

  const handleDateRangeChange = (range: string) => {
    onChange({
      ...value,
      dateRange: range,
    });
  };

  const clearFilters = () => {
    onChange({});
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: segmentationTheme.spacing.lg,
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <h3 style={{
          fontSize: '16px',
          fontWeight: '600',
          color: segmentationTheme.colors.textPrimary,
        }}>
          Filters & Controls
        </h3>
        {(value.region || value.segment || value.dateRange) && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={clearFilters}
            style={{
              background: `${segmentationTheme.colors.error}20`,
              border: `1px solid ${segmentationTheme.colors.error}40`,
              borderRadius: segmentationTheme.borderRadius.md,
              color: segmentationTheme.colors.error,
              padding: '6px 12px',
              fontSize: '12px',
              cursor: 'pointer',
              transition: segmentationTheme.animation.fast,
            }}
          >
            Clear All
          </motion.button>
        )}
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: segmentationTheme.spacing.lg,
      }}>
        {/* Region Filter */}
        <div>
          <label style={{
            display: 'block',
            fontSize: '13px',
            color: segmentationTheme.colors.textTertiary,
            marginBottom: segmentationTheme.spacing.sm,
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
          }}>
            Region
          </label>
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: segmentationTheme.spacing.xs,
          }}>
            {regions.map((region) => (
              <motion.button
                key={region}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleRegionChange(region)}
                style={{
                  background: value.region === region
                    ? segmentationTheme.gradients.primary
                    : 'rgba(255, 255, 255, 0.05)',
                  border: `1px solid ${
                    value.region === region
                      ? segmentationTheme.colors.accentCyan
                      : 'rgba(255, 255, 255, 0.1)'
                  }`,
                  borderRadius: segmentationTheme.borderRadius.md,
                  color: segmentationTheme.colors.textPrimary,
                  padding: '8px 16px',
                  fontSize: '13px',
                  cursor: 'pointer',
                  transition: segmentationTheme.animation.fast,
                }}
              >
                {region}
              </motion.button>
            ))}
          </div>
        </div>

        {/* Segment Filter */}
        <div>
          <label style={{
            display: 'block',
            fontSize: '13px',
            color: segmentationTheme.colors.textTertiary,
            marginBottom: segmentationTheme.spacing.sm,
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
          }}>
            Segment
          </label>
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: segmentationTheme.spacing.xs,
          }}>
            {segments.map((segment) => (
              <motion.button
                key={segment}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleSegmentChange(segment)}
                style={{
                  background: value.segment === segment
                    ? segmentationTheme.gradients.primary
                    : 'rgba(255, 255, 255, 0.05)',
                  border: `1px solid ${
                    value.segment === segment
                      ? segmentationTheme.colors.accentCyan
                      : 'rgba(255, 255, 255, 0.1)'
                  }`,
                  borderRadius: segmentationTheme.borderRadius.md,
                  color: segmentationTheme.colors.textPrimary,
                  padding: '8px 16px',
                  fontSize: '13px',
                  cursor: 'pointer',
                  transition: segmentationTheme.animation.fast,
                  display: 'flex',
                  alignItems: 'center',
                  gap: segmentationTheme.spacing.xs,
                }}
              >
                <div style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: `${segmentationTheme.colors[`segment${segment}` as keyof typeof segmentationTheme.colors] || segmentationTheme.colors.accentCyan}`,
                }} />
                Segment {segment}
              </motion.button>
            ))}
          </div>
        </div>

        {/* Date Range Filter */}
        <div>
          <label style={{
            display: 'block',
            fontSize: '13px',
            color: segmentationTheme.colors.textTertiary,
            marginBottom: segmentationTheme.spacing.sm,
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
          }}>
            Time Period
          </label>
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: segmentationTheme.spacing.xs,
          }}>
            {dateRanges.map((range) => (
              <motion.button
                key={range.value}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleDateRangeChange(range.value)}
                style={{
                  background: value.dateRange === range.value
                    ? segmentationTheme.gradients.primary
                    : 'rgba(255, 255, 255, 0.05)',
                  border: `1px solid ${
                    value.dateRange === range.value
                      ? segmentationTheme.colors.accentCyan
                      : 'rgba(255, 255, 255, 0.1)'
                  }`,
                  borderRadius: segmentationTheme.borderRadius.md,
                  color: segmentationTheme.colors.textPrimary,
                  padding: '8px 16px',
                  fontSize: '13px',
                  cursor: 'pointer',
                  transition: segmentationTheme.animation.fast,
                }}
              >
                {range.label}
              </motion.button>
            ))}
          </div>
        </div>
      </div>

      {/* Active Filters Display */}
      {(value.region || value.segment || value.dateRange) && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          style={{
            display: 'flex',
            gap: segmentationTheme.spacing.sm,
            flexWrap: 'wrap',
            paddingTop: segmentationTheme.spacing.md,
            borderTop: `1px solid rgba(255, 255, 255, 0.1)`,
          }}
        >
          <span style={{
            fontSize: '12px',
            color: segmentationTheme.colors.textTertiary,
            marginRight: segmentationTheme.spacing.sm,
          }}>
            Active Filters:
          </span>
          {value.region && (
            <div style={{
              background: `${segmentationTheme.colors.accentCyan}20`,
              border: `1px solid ${segmentationTheme.colors.accentCyan}40`,
              borderRadius: segmentationTheme.borderRadius.sm,
              padding: '4px 8px',
              fontSize: '11px',
              color: segmentationTheme.colors.accentCyan,
              display: 'flex',
              alignItems: 'center',
              gap: segmentationTheme.spacing.xs,
            }}>
              Region: {value.region}
              <button
                onClick={() => handleRegionChange(value.region!)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: segmentationTheme.colors.accentCyan,
                  cursor: 'pointer',
                  padding: 0,
                  fontSize: '14px',
                }}
              >
                ×
              </button>
            </div>
          )}
          {value.segment && (
            <div style={{
              background: `${segmentationTheme.colors.accentPurple}20`,
              border: `1px solid ${segmentationTheme.colors.accentPurple}40`,
              borderRadius: segmentationTheme.borderRadius.sm,
              padding: '4px 8px',
              fontSize: '11px',
              color: segmentationTheme.colors.accentPurple,
              display: 'flex',
              alignItems: 'center',
              gap: segmentationTheme.spacing.xs,
            }}>
              Segment: {value.segment}
              <button
                onClick={() => handleSegmentChange(value.segment!)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: segmentationTheme.colors.accentPurple,
                  cursor: 'pointer',
                  padding: 0,
                  fontSize: '14px',
                }}
              >
                ×
              </button>
            </div>
          )}
          {value.dateRange && (
            <div style={{
              background: `${segmentationTheme.colors.success}20`,
              border: `1px solid ${segmentationTheme.colors.success}40`,
              borderRadius: segmentationTheme.borderRadius.sm,
              padding: '4px 8px',
              fontSize: '11px',
              color: segmentationTheme.colors.success,
              display: 'flex',
              alignItems: 'center',
              gap: segmentationTheme.spacing.xs,
            }}>
              Period: {dateRanges.find(r => r.value === value.dateRange)?.label}
              <button
                onClick={() => onChange({ ...value, dateRange: undefined })}
                style={{
                  background: 'none',
                  border: 'none',
                  color: segmentationTheme.colors.success,
                  cursor: 'pointer',
                  padding: 0,
                  fontSize: '14px',
                }}
              >
                ×
              </button>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
};

export default EnhancedSegmentationFilters;