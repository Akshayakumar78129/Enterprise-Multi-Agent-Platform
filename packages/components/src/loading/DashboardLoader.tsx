import React from 'react';
import './DashboardLoader.css';

export interface DashboardLoaderProps {
  /** Optional message to display below the loader */
  message?: string;
  /** Optional title for the dashboard being loaded */
  title?: string;
  /** Size of the loader: small, medium, large, or fullscreen */
  size?: 'small' | 'medium' | 'large' | 'fullscreen';
  /** Custom className for additional styling */
  className?: string;
  /** Show a progress bar instead of spinner */
  showProgress?: boolean;
  /** Progress percentage (0-100) when showProgress is true */
  progress?: number;
}

export const DashboardLoader: React.FC<DashboardLoaderProps> = ({
  message,
  title = "Loading...",
  size = 'fullscreen',
  className = '',
  showProgress = false,
  progress = 0
}) => {
  const sizeClasses = {
    small: 'dashboard-loader-small',
    medium: 'dashboard-loader-medium',
    large: 'dashboard-loader-large',
    fullscreen: 'dashboard-loader-fullscreen'
  };

  return (
    <div className={`dashboard-loader ${sizeClasses[size]} ${className}`}>
      <div className="dashboard-loader-container">
        {/* Title */}
        <h2 className="dashboard-loader-title">{title}</h2>

        {/* Spinner or Progress Bar */}
        {showProgress ? (
          <div className="dashboard-loader-progress">
            <div className="dashboard-loader-progress-bar">
              <div
                className="dashboard-loader-progress-fill"
                style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
              />
            </div>
            <span className="dashboard-loader-progress-text">{Math.round(progress)}%</span>
          </div>
        ) : (
          <div className="dashboard-loader-spinner">
            <div className="dashboard-loader-spinner-ring"></div>
            <div className="dashboard-loader-spinner-ring dashboard-loader-spinner-ring-2"></div>
            <div className="dashboard-loader-spinner-ring dashboard-loader-spinner-ring-3"></div>
            <div className="dashboard-loader-dots">
              <span className="dashboard-loader-dot"></span>
              <span className="dashboard-loader-dot"></span>
              <span className="dashboard-loader-dot"></span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Skeleton Loader for partial loading states
export interface SkeletonLoaderProps {
  /** Number of skeleton items to show */
  count?: number;
  /** Type of skeleton: card, table, chart, or text */
  type?: 'card' | 'table' | 'chart' | 'text';
  /** Custom className */
  className?: string;
}

export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  count = 1,
  type = 'card',
  className = ''
}) => {
  const skeletonItems = Array.from({ length: count }, (_, i) => i);

  const renderSkeleton = (index: number) => {
    switch (type) {
      case 'card':
        return (
          <div key={index} className="skeleton-card">
            <div className="skeleton-card-header">
              <div className="skeleton-line skeleton-title"></div>
            </div>
            <div className="skeleton-card-body">
              <div className="skeleton-line"></div>
              <div className="skeleton-line skeleton-short"></div>
              <div className="skeleton-line"></div>
            </div>
          </div>
        );

      case 'table':
        return (
          <div key={index} className="skeleton-table">
            <div className="skeleton-table-row skeleton-table-header">
              <div className="skeleton-line skeleton-cell"></div>
              <div className="skeleton-line skeleton-cell"></div>
              <div className="skeleton-line skeleton-cell"></div>
              <div className="skeleton-line skeleton-cell"></div>
            </div>
            {Array.from({ length: 5 }, (_, j) => (
              <div key={j} className="skeleton-table-row">
                <div className="skeleton-line skeleton-cell"></div>
                <div className="skeleton-line skeleton-cell"></div>
                <div className="skeleton-line skeleton-cell"></div>
                <div className="skeleton-line skeleton-cell"></div>
              </div>
            ))}
          </div>
        );

      case 'chart':
        return (
          <div key={index} className="skeleton-chart">
            <div className="skeleton-chart-header">
              <div className="skeleton-line skeleton-title"></div>
              <div className="skeleton-line skeleton-subtitle"></div>
            </div>
            <div className="skeleton-chart-body">
              <div className="skeleton-chart-bars">
                {Array.from({ length: 6 }, (_, j) => (
                  <div
                    key={j}
                    className="skeleton-chart-bar"
                    style={{ height: `${Math.random() * 60 + 20}%` }}
                  ></div>
                ))}
              </div>
            </div>
          </div>
        );

      case 'text':
      default:
        return (
          <div key={index} className="skeleton-text">
            <div className="skeleton-line"></div>
            <div className="skeleton-line skeleton-short"></div>
            <div className="skeleton-line"></div>
            <div className="skeleton-line skeleton-medium"></div>
          </div>
        );
    }
  };

  return (
    <div className={`skeleton-loader ${className}`}>
      {skeletonItems.map(renderSkeleton)}
    </div>
  );
};

// Page-level loader wrapper
export interface PageLoaderProps {
  /** Whether the page is loading */
  isLoading: boolean;
  /** Children to render when not loading */
  children: React.ReactNode;
  /** Optional loader props */
  loaderProps?: Omit<DashboardLoaderProps, 'size'>;
  /** Minimum loading time in ms to prevent flashing */
  minLoadTime?: number;
}

export const PageLoader: React.FC<PageLoaderProps> = ({
  isLoading,
  children,
  loaderProps = {},
  minLoadTime = 500
}) => {
  const [showLoader, setShowLoader] = React.useState(isLoading);
  const loadStartTime = React.useRef<number>(Date.now());

  React.useEffect(() => {
    if (isLoading) {
      loadStartTime.current = Date.now();
      setShowLoader(true);
    } else {
      // Calculate remaining time to meet minimum load time
      const elapsedTime = Date.now() - loadStartTime.current;
      const remainingTime = Math.max(0, minLoadTime - elapsedTime);

      // Hide loader after minimum time
      setTimeout(() => {
        setShowLoader(false);
      }, remainingTime);
    }
  }, [isLoading, minLoadTime]);

  return (
    <>
      {/* Always render children */}
      <div className={showLoader ? 'dashboard-content-blur' : ''}>
        {children}
      </div>

      {/* Show loader overlay when loading */}
      {showLoader && (
        <div className="dashboard-loader-overlay">
          <div className="dashboard-loader-modal">
            <DashboardLoader size="medium" {...loaderProps} />
          </div>
        </div>
      )}
    </>
  );
};

export default DashboardLoader;