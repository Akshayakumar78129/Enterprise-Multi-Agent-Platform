const jwt = require('jsonwebtoken');
const logger = require('../../utils/logger');

// Default roles and permissions
const DEFAULT_ROLES = {
  admin: ['*'], // All permissions
  analyst: ['read:customer', 'read:sales', 'read:inventory', 'read:finance'],
  viewer: ['read:customer', 'read:sales'],
  customer_analyst: ['read:customer'],
  sales_analyst: ['read:sales'],
  inventory_analyst: ['read:inventory'],
  finance_analyst: ['read:finance']
};

// Default users for development (in production, this would come from a database)
const DEFAULT_USERS = {
  'admin@company.com': {
    id: 'admin-001',
    email: 'admin@company.com',
    name: 'Administrator',
    roles: ['admin'],
    active: true
  },
  'analyst@company.com': {
    id: 'analyst-001',
    email: 'analyst@company.com',
    name: 'Data Analyst',
    roles: ['analyst'],
    active: true
  }
};

/**
 * JWT Authentication Middleware
 */
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
  
  // For development, allow bypass with dev token
  const isDev = process.env.NODE_ENV === 'development' || !process.env.NODE_ENV || process.env.NODE_ENV === 'undefined';
  if (isDev && !token) {
    req.user = DEFAULT_USERS['admin@company.com'];
    req.user.permissions = getAllPermissions(req.user.roles);
    return next();
  }
  
  if (!token) {
    logger.warn('Authentication failed: No token provided', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      path: req.path
    });
    
    return res.status(401).json({
      success: false,
      error: {
        message: 'Access token is required',
        code: 'TOKEN_REQUIRED'
      },
      metadata: {
        timestamp: new Date().toISOString()
      }
    });
  }
  
  try {
    const jwtSecret = process.env.JWT_SECRET || 'dev-secret-key';
    const decoded = jwt.verify(token, jwtSecret);
    
    // Get user information (in production, this would be from database)
    const user = DEFAULT_USERS[decoded.email] || decoded;
    
    if (!user || !user.active) {
      logger.warn('Authentication failed: Invalid or inactive user', {
        userId: decoded.id,
        email: decoded.email,
        ip: req.ip
      });
      
      return res.status(401).json({
        success: false,
        error: {
          message: 'Invalid or inactive user',
          code: 'INVALID_USER'
        },
        metadata: {
          timestamp: new Date().toISOString()
        }
      });
    }
    
    // Add user and permissions to request
    req.user = user;
    req.user.permissions = getAllPermissions(user.roles);
    req.token = token;
    
    logger.debug('User authenticated successfully', {
      userId: user.id,
      email: user.email,
      roles: user.roles,
      path: req.path
    });
    
    next();
  } catch (error) {
    logger.warn('Authentication failed: Invalid token', {
      error: error.message,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      path: req.path
    });
    
    return res.status(403).json({
      success: false,
      error: {
        message: 'Invalid or expired token',
        code: 'INVALID_TOKEN'
      },
      metadata: {
        timestamp: new Date().toISOString()
      }
    });
  }
};

/**
 * Role-based authorization middleware
 * @param {Array<string>} allowedRoles - Array of allowed roles
 */
const authorizeRoles = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          message: 'Authentication required',
          code: 'AUTH_REQUIRED'
        }
      });
    }
    
    const userRoles = req.user.roles || [];
    const hasAllowedRole = allowedRoles.some(role => userRoles.includes(role));
    
    if (!hasAllowedRole) {
      logger.warn('Authorization failed: Insufficient role permissions', {
        userId: req.user.id,
        userRoles,
        requiredRoles: allowedRoles,
        path: req.path
      });
      
      return res.status(403).json({
        success: false,
        error: {
          message: 'Insufficient permissions',
          code: 'INSUFFICIENT_PERMISSIONS'
        },
        metadata: {
          timestamp: new Date().toISOString(),
          requiredRoles: allowedRoles
        }
      });
    }
    
    next();
  };
};

/**
 * Permission-based authorization middleware
 * @param {string} requiredPermission - Required permission (e.g., 'read:customer')
 */
const authorizePermission = (requiredPermission) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          message: 'Authentication required',
          code: 'AUTH_REQUIRED'
        }
      });
    }
    
    const userPermissions = req.user.permissions || [];
    const hasPermission = userPermissions.includes('*') || userPermissions.includes(requiredPermission);
    
    if (!hasPermission) {
      logger.warn('Authorization failed: Insufficient permissions', {
        userId: req.user.id,
        userPermissions,
        requiredPermission,
        path: req.path
      });
      
      return res.status(403).json({
        success: false,
        error: {
          message: 'Insufficient permissions',
          code: 'INSUFFICIENT_PERMISSIONS'
        },
        metadata: {
          timestamp: new Date().toISOString(),
          requiredPermission
        }
      });
    }
    
    next();
  };
};

/**
 * API Key authentication middleware
 * Used for service-to-service authentication
 */
const authenticateApiKey = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  
  if (!apiKey) {
    return res.status(401).json({
      success: false,
      error: {
        message: 'API key is required',
        code: 'API_KEY_REQUIRED'
      }
    });
  }
  
  // In production, validate API key against database
  const validApiKeys = (process.env.VALID_API_KEYS || '').split(',');
  
  if (!validApiKeys.includes(apiKey)) {
    logger.warn('API key authentication failed', {
      apiKey: apiKey.substring(0, 8) + '...',
      ip: req.ip,
      path: req.path
    });
    
    return res.status(403).json({
      success: false,
      error: {
        message: 'Invalid API key',
        code: 'INVALID_API_KEY'
      }
    });
  }
  
  // Set service user
  req.user = {
    id: 'api-service',
    type: 'service',
    permissions: ['*'] // Services have full permissions
  };
  
  next();
};

/**
 * Generate JWT token for user
 * @param {Object} user - User object
 * @param {string} expiresIn - Token expiration time
 */
const generateToken = (user, expiresIn = '24h') => {
  const jwtSecret = process.env.JWT_SECRET || 'dev-secret-key';
  
  const payload = {
    id: user.id,
    email: user.email,
    roles: user.roles,
    iat: Math.floor(Date.now() / 1000)
  };
  
  return jwt.sign(payload, jwtSecret, { expiresIn });
};

/**
 * Get all permissions for given roles
 * @param {Array<string>} roles - User roles
 * @returns {Array<string>} All permissions
 */
const getAllPermissions = (roles) => {
  const permissions = new Set();
  
  for (const role of roles) {
    const rolePermissions = DEFAULT_ROLES[role] || [];
    rolePermissions.forEach(permission => permissions.add(permission));
  }
  
  return Array.from(permissions);
};

/**
 * Audit logging middleware
 * Logs all authenticated requests for security auditing
 */
const auditLog = (req, res, next) => {
  const originalSend = res.send;
  
  res.send = function(data) {
    // Log the request/response for audit
    logger.info('API Request Audit', {
      userId: req.user?.id,
      userEmail: req.user?.email,
      method: req.method,
      path: req.path,
      query: req.query,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      statusCode: res.statusCode,
      timestamp: new Date().toISOString()
    });
    
    originalSend.call(this, data);
  };
  
  next();
};

/**
 * Authentication route for testing
 */
const authRoutes = (app) => {
  // Login endpoint for development
  app.post('/api/v1/auth/login', (req, res) => {
    const { email, password } = req.body;
    
    // In production, validate against database with proper password hashing
    const user = DEFAULT_USERS[email];
    
    if (!user || !user.active) {
      return res.status(401).json({
        success: false,
        error: {
          message: 'Invalid credentials',
          code: 'INVALID_CREDENTIALS'
        }
      });
    }
    
    // In development, any password works
    if (process.env.NODE_ENV !== 'development' && password !== 'password') {
      return res.status(401).json({
        success: false,
        error: {
          message: 'Invalid credentials',
          code: 'INVALID_CREDENTIALS'
        }
      });
    }
    
    const token = generateToken(user);
    
    res.json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          roles: user.roles,
          permissions: getAllPermissions(user.roles)
        }
      },
      metadata: {
        timestamp: new Date().toISOString()
      }
    });
  });
  
  // Token validation endpoint
  app.get('/api/v1/auth/me', authenticateToken, (req, res) => {
    res.json({
      success: true,
      data: {
        user: {
          id: req.user.id,
          email: req.user.email,
          name: req.user.name,
          roles: req.user.roles,
          permissions: req.user.permissions
        }
      },
      metadata: {
        timestamp: new Date().toISOString()
      }
    });
  });
};

module.exports = {
  authenticateToken,
  authorizeRoles,
  authorizePermission,
  authenticateApiKey,
  generateToken,
  getAllPermissions,
  auditLog,
  authRoutes,
  DEFAULT_ROLES,
  DEFAULT_USERS
};