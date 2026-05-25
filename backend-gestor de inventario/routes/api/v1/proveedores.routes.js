import { Router } from 'express';
import {
    createProveedor,
    getProveedorById,
    getProveedoresByEmpresa,
    updateProveedor,
    deleteProveedor
} from '../../../controllers/proveedores/proveedor_controllers.js';

const proveedoresRoutes = Router();

proveedoresRoutes.post('/create', createProveedor);
proveedoresRoutes.get('/get/all/:idEmpresa', getProveedoresByEmpresa);
proveedoresRoutes.get('/get/:id', getProveedorById);
proveedoresRoutes.post('/update/:id', updateProveedor);
proveedoresRoutes.delete('/delete/:id', deleteProveedor);

export default proveedoresRoutes;
