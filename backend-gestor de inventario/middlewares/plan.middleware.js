import { Empresa } from '../models/index.js';
import PlanValidationService from '../services/plan_validation_service.js';

export async function checkPlan(req, res, next) {
    try {
        const empresaId = req.user?.empresa || req.body?.idEmpresa || req.params?.idEmpresa;
        
        if (empresaId) {
            const empresa = await Empresa.findById(empresaId);
            if (empresa) {
                res.locals.userPlan = await PlanValidationService.getPlanoLimites(empresa);
                res.locals.empresaId = empresaId;
                res.locals.empresa = empresa;
                return next();
            }
        }
        
        next();
    } catch (error) {
        console.error("Error en checkPlan middleware:", error);
        next();
    }
}

export async function checkUsageLimits(req, res, next) {
    try {
        const empresaId = res.locals.empresaId;
        if (!empresaId) return next();

        let action = null;
        if (req.path.includes('/emitir')) action = 'emitir_factura_afip'; // Ruta de AFIP
        if (req.path.includes('/tickets/create')) action = 'emitir_ticket'; // Ruta de Tickets internos
        if (req.path.includes('/nota-pedido/create')) action = 'crear_nota_pedido'; // Ruta de Notas de pedido
        if (req.path.includes('/products/add')) action = 'crear_producto';
        if (req.path.includes('/auth/register')) action = 'crear_usuario';
        if (req.path.includes('/point-sales/create')) action = 'crear_punto_venta';
        if (req.path.includes('/cajas/abrirCaja')) action = 'crear_caja';

        if (action) {
            const verificacion = await PlanValidationService.puedoRealizarAccion(empresaId, action);
            if (!verificacion.permitido) {
                return res.status(403).json({ 
                    success: false, 
                    error: verificacion.razon,
                    tipo: 'limite_alcanzado'
                });
            }
        }
        
        next();
    } catch (err) {
        console.error("Error en checkUsageLimits:", err);
        next();
    }
}

export function limitFuncionality(feature) {
    return (req, res, next) => {
        const plan = res.locals.userPlan;
        if (plan && !plan[feature]) return res.status(403).json({ error: 'Funcionalidad no disponible en tu plan' });
        next();
    };
}

export default { checkPlan, checkUsageLimits, limitFuncionality };
