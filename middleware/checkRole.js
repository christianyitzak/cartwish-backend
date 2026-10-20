const checkRole = (role) => (req, res, next) => {
    if (!req.user || req.user.role !== role) {
        return res.status(401).json({
            mesage: `Access denied: ${role} only!`
        });
    };

    next();
};

module.exports = checkRole;