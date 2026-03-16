// Middleware check (Example logic)
export const allowRoles = (...roles) => {
    return (req, res, next) => {
        // Frontend headers se role nikalna
        const userRole = req.headers.role;

        if (!roles.includes(userRole)) {
            return res.status(403).json({ message: "Access Denied: Role mismatch" });
        }
        next();
    };
};
