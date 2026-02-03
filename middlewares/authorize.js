const User = require('../models/userModel');

const authorize = (roles = []) => {
    return async (req, res, next) => {
        try {
            const user = await User.findById(req.userId);
            
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }

            // Check if user role is in allowed roles
            if (!roles.includes(user.role)) {
                return res.status(403).json({
                    success: false,
                    message: `Access forbidden. Required role: ${roles.join(' or ')}`
                });
            }

            // Add user role to request for later use
            req.userRole = user.role;
            req.userData = user;
            next();
        } catch (error) {
            console.error('Authorization error:', error);
            return res.status(500).json({
                success: false,
                message: 'Authorization error'
            });
        }
    };
};

module.exports = authorize;