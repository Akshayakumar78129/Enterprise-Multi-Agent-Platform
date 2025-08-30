import React from 'react';
import styles from './FilterLoadingOverlay.module.css';

const FilterLoadingOverlay = ({ 
  isVisible = false,
  message = 'Applying filters...', 
  progress = 0,
  showProgress = false,
  onCancel = null,
  className = ''
}) => {
  if (!isVisible) return null;
  
  return (
    <div className={`${styles.filterLoadingOverlay} ${className}`}>
      <div className={styles.overlayBackground} />
      
      <div className={styles.loadingContent}>
        {/* Loading Animation */}
        <div className={styles.loadingAnimation}>
          <div className={styles.spinner}>
            <div className={styles.spinnerRing}></div>
            <div className={styles.spinnerRing}></div>
            <div className={styles.spinnerRing}></div>
          </div>
          
          {/* Floating Icons */}
          <div className={styles.floatingIcons}>
            <span className={styles.floatingIcon} style={{ '--delay': '0s' }}>🎯</span>
            <span className={styles.floatingIcon} style={{ '--delay': '0.5s' }}>📦</span>
            <span className={styles.floatingIcon} style={{ '--delay': '1s' }}>📅</span>
            <span className={styles.floatingIcon} style={{ '--delay': '1.5s' }}>🔍</span>
          </div>
        </div>

        {/* Loading Message */}
        <div className={styles.loadingMessage}>
          <h3 className={styles.messageTitle}>{message}</h3>
          <p className={styles.messageSubtitle}>
            Processing your filter selections and updating visualizations
          </p>
        </div>

        {/* Progress Bar */}
        {showProgress && (
          <div className={styles.progressContainer}>
            <div className={styles.progressBar}>
              <div 
                className={styles.progressFill}
                style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
              />
            </div>
            <div className={styles.progressText}>
              {Math.round(progress)}% Complete
            </div>
          </div>
        )}

        {/* Loading Steps */}
        <div className={styles.loadingSteps}>
          <div className={styles.step}>
            <div className={styles.stepIcon}>✓</div>
            <span className={styles.stepText}>Validating filters</span>
          </div>
          <div className={styles.step}>
            <div className={styles.stepIcon}>⏳</div>
            <span className={styles.stepText}>Querying database</span>
          </div>
          <div className={styles.step}>
            <div className={styles.stepIcon}>⏳</div>
            <span className={styles.stepText}>Processing data</span>
          </div>
          <div className={styles.step}>
            <div className={styles.stepIcon}>⏳</div>
            <span className={styles.stepText}>Updating charts</span>
          </div>
        </div>

        {/* Cancel Button */}
        {onCancel && (
          <button 
            className={styles.cancelButton}
            onClick={onCancel}
          >
            <span className={styles.cancelIcon}>✕</span>
            Cancel
          </button>
        )}

        {/* Loading Tips */}
        <div className={styles.loadingTips}>
          <div className={styles.tipIcon}>💡</div>
          <div className={styles.tipText}>
            <strong>Pro Tip:</strong> Use multiple filters to drill down into specific customer segments and product categories for deeper insights.
          </div>
        </div>
      </div>
    </div>
  );
};

export default FilterLoadingOverlay;