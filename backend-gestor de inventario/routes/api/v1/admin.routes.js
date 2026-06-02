import { Router } from 'express';
import { adminAuth } from '../../../middlewares/admin_auth.js';
import {
    getAdminCompaniesSummary,
    getAdminCompanyDetails,
    getAdminCompanyProducts,
    getAdminCompanyTickets,
    getAdminCompanyFacturas,
    getAdminCompanyNotasPedido,
    getAdminCompanyCajas,
    getAdminCompanyPuntosVenta,
    getAdminCompanyPagosProveedor,
    getAdminCompanyCuentasPagar,
    getAdminUsers,
    getCompanyPlanInfo,
    getCompanyPlanLimits
} from '../../../controllers/admin/admin_controller.js';

const adminRoutes = Router();

adminRoutes.use(adminAuth);

// Resumen de empresas
adminRoutes.get('/companies', getAdminCompaniesSummary);

// Detalles de empresa
adminRoutes.get('/company/:id', getAdminCompanyDetails);

// Datos específicos de empresa
adminRoutes.get('/company/:id/products', getAdminCompanyProducts);
adminRoutes.get('/company/:id/tickets', getAdminCompanyTickets);
adminRoutes.get('/company/:id/facturas', getAdminCompanyFacturas);
adminRoutes.get('/company/:id/notas-pedido', getAdminCompanyNotasPedido);
adminRoutes.get('/company/:id/cajas', getAdminCompanyCajas);
adminRoutes.get('/company/:id/puntos-venta', getAdminCompanyPuntosVenta);
adminRoutes.get('/company/:id/pagos-proveedor', getAdminCompanyPagosProveedor);
adminRoutes.get('/company/:id/cuentas-pagar', getAdminCompanyCuentasPagar);

// Usuarios
adminRoutes.get('/users', getAdminUsers);

// Plan de la empresa
adminRoutes.get('/company/:id/plan', getCompanyPlanInfo);
adminRoutes.get('/company/:id/plan-limits', getCompanyPlanLimits);

export default adminRoutes;
