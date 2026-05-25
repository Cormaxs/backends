import { Router } from 'express';
import {
    createCuentaPorPagar,
    getCuentasPorPagarByEmpresa,
    getCuentasPorPagarByProveedor,
    updateCuentaPorPagar,
    deleteCuentaPorPagar,
    recordPagoProveedor,
    getPagosByEmpresa,
    getPagosByProveedor,
    getCuentasPendientesVencidas,
    getCuentasPendientesProximas
} from '../../../controllers/proveedores/cuentas_pagar_controllers.js';

const cuentasPagarRoutes = Router();

cuentasPagarRoutes.post('/create', createCuentaPorPagar);
cuentasPagarRoutes.get('/get/all/:idEmpresa', getCuentasPorPagarByEmpresa);
cuentasPagarRoutes.get('/get/proveedor/:idProveedor', getCuentasPorPagarByProveedor);
cuentasPagarRoutes.post('/update/:id', updateCuentaPorPagar);
cuentasPagarRoutes.delete('/delete/:id', deleteCuentaPorPagar);

cuentasPagarRoutes.post('/payment', recordPagoProveedor);
cuentasPagarRoutes.get('/payments/:idEmpresa', getPagosByEmpresa);
cuentasPagarRoutes.get('/payments/proveedor/:idProveedor', getPagosByProveedor);
cuentasPagarRoutes.get('/due/vencidas/:idEmpresa', getCuentasPendientesVencidas);
cuentasPagarRoutes.get('/due/proximas/:idEmpresa', getCuentasPendientesProximas);

export default cuentasPagarRoutes;
