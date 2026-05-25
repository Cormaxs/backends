import { PagoProveedor } from '../models/index.js';
import mongoose from 'mongoose';

class PagoProveedorRepository {
    async create(data) {
        const pago = new PagoProveedor(data);
        return await pago.save();
    }

    async findByEmpresa(idEmpresa, options = {}) {
        if (!mongoose.Types.ObjectId.isValid(idEmpresa)) {
            throw new Error('ID de empresa inválido.');
        }
        const { page = 1, limit = 20 } = options;
        const pagos = await PagoProveedor.find({ empresa: idEmpresa })
            .populate('proveedor')
            .populate('cuentaPorPagar')
            .skip((Number(page) - 1) * Number(limit))
            .limit(Number(limit))
            .sort({ fechaPago: -1 });
        const total = await PagoProveedor.countDocuments({ empresa: idEmpresa });
        return { pagos, pagination: { page: Number(page), limit: Number(limit), total } };
    }

    async findByProveedor(idProveedor, options = {}) {
        if (!mongoose.Types.ObjectId.isValid(idProveedor)) {
            throw new Error('ID de proveedor inválido.');
        }
        const { page = 1, limit = 20 } = options;
        const pagos = await PagoProveedor.find({ proveedor: idProveedor })
            .populate('proveedor')
            .populate('cuentaPorPagar')
            .skip((Number(page) - 1) * Number(limit))
            .limit(Number(limit))
            .sort({ fechaPago: -1 });
        const total = await PagoProveedor.countDocuments({ proveedor: idProveedor });
        return { pagos, pagination: { page: Number(page), limit: Number(limit), total } };
    }
}

export default new PagoProveedorRepository();
