import dotenv from 'dotenv';

dotenv.config();

const ADMIN_USERNAME = process.env.ADMIN_USER || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin';

export function adminAuth(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        res.setHeader('WWW-Authenticate', 'Basic realm="Admin Area"');
        return res.status(401).json({ message: 'Autenticación de administrador requerida.' });
    }

    const [type, credentials] = authHeader.split(' ');
    if (type !== 'Basic' || !credentials) {
        return res.status(401).json({ message: 'Encabezado de autenticación inválido.' });
    }

    let decoded;
    try {
        decoded = Buffer.from(credentials, 'base64').toString('utf8');
    } catch (error) {
        return res.status(401).json({ message: 'Credenciales no válidas.' });
    }

    const [username, password] = decoded.split(':');
    if (username !== ADMIN_USERNAME || password !== ADMIN_PASSWORD) {
        return res.status(403).json({ message: 'Credenciales de administrador incorrectas.' });
    }

    next();
}
