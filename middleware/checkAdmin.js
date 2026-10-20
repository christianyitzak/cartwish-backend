const checkAdmin = (req, res, next) => {
    if (!req.user || req.user.role !== 'admin') {
        return res.status(401).json({
            mesage: 'Access denied: admin only!'
        });
    };

    next();
};

module.exports = checkAdmin;