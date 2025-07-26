import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
import io
import base64
from sklearn.ensemble import GradientBoostingRegressor
from sklearn.preprocessing import StandardScaler

def prepare_features(df, feature_cols):
    """Prepare features for the model."""
    X = df[feature_cols].fillna(0).values
    y = df['total_spend'].values
    return X, y

def train_model(X, y, n_estimators=50, learning_rate=0.1, max_depth=3):
    """Train a scikit-learn model."""
    # Scale features
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)
    
    # Train model
    model = GradientBoostingRegressor(
        n_estimators=n_estimators,
        learning_rate=learning_rate,
        max_depth=max_depth,
        random_state=42
    )
    
    model.fit(X_scaled, y)
    return model, scaler

def predict_ltv(model, scaler, X):
    """Make predictions with the trained model."""
    X_scaled = scaler.transform(X)
    return model.predict(X_scaled)

def visualize_predictions(actual, predicted):
    """Create visualizations of the predictions and return as base64 string."""
    # Create figure with subplots
    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(15, 6))
    
    # Scatter plot
    ax1.scatter(actual, predicted, alpha=0.5)
    ax1.plot([actual.min(), actual.max()], [actual.min(), actual.max()], 'r--', lw=2)
    ax1.set_xlabel('Actual Lifetime Value')
    ax1.set_ylabel('Predicted Lifetime Value')
    ax1.set_title('Actual vs Predicted Customer Lifetime Value')
    
    # Distribution plot
    sns.kdeplot(data={'Actual': actual, 'Predicted': predicted}, ax=ax2)
    ax2.set_title('Distribution of Actual and Predicted Values')
    
    # Save plot to bytes buffer
    buf = io.BytesIO()
    plt.savefig(buf, format='png', bbox_inches='tight')
    plt.close()
    buf.seek(0)
    
    # Convert to base64
    img_str = base64.b64encode(buf.read()).decode('utf-8')
    return f"data:image/png;base64,{img_str}" 