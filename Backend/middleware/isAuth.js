import jwt from "jsonwebtoken";

const isAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const bearerToken = authHeader && authHeader.startsWith("Bearer ") ? authHeader.split(" ")[1] : null;
    const token = req.cookies?.token || bearerToken || req.headers?.token;

    if (!token) {
      return res.status(401).json({ message: 'Token not found' });
    }

    const verifyToken = await jwt.verify(token, process.env.JWT_SECRET);
    req.userId = verifyToken.userId;

    next();
  } catch (error) {
    console.error("isAuth error:", error.message);
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

export default isAuth;
