import PLANES from '../config/planes.js';

// Simple in-memory usage counters (replace with DB for production)
const usageCounters = new Map();

export function checkPlan(req, res, next) {
    // attach a default plan to res.locals
    // In real app, resolve user's company plan from DB (req.user or req.company)
    res.locals.userPlan = PLANES.free;
    next();
}

export function checkUsageLimits(req, res, next) {
    try {
        // MODO DESARROLLO/TESTEO: Desactivamos el límite temporalmente
        // Simplemente dejamos pasar la petición al siguiente controlador
        return next();

        /* --- Lógica pausada temporalmente ---
        const userKey = (req.session && req.session.user && req.session.user.id) || req.ip || 'anon';
        const plan = res.locals.userPlan || PLANES.free;
        if (plan.ventas_mes && plan.ventas_mes > 0) {
            const now = new Date();
            const monthKey = `${userKey}:${now.getUTCFullYear()}:${now.getUTCMonth()}`;
            const count = usageCounters.get(monthKey) || 0;
            if (count >= plan.ventas_mes) {
                return res.status(429).json({ error: 'Límite de uso del plan alcanzado' });
            }
            usageCounters.set(monthKey, count + 1);
        }
        next();
        -------------------------------------- */
    } catch (err) {
        next();
    }
}

export function limitFuncionality(feature) {
    return (req, res, next) => {
        const plan = res.locals.userPlan || PLANES.free;
        if (!plan[feature]) return res.status(403).json({ error: 'Funcionalidad no disponible en tu plan' });
        next();
    };
}

export default { checkPlan, checkUsageLimits, limitFuncionality };
