import { CuentaPorPagar } from '../models/index.js';
import mongoose from 'mongoose';

class CuentaPorPagarRepository {
    async create(data) {
        const cuenta = new CuentaPorPagar({
            ...data,
            montoPendiente: data.montoTotal
        });
        return await cuenta.save();
    }

    async findById(id) {
        if (!mongoose.Types.ObjectId.isValid(id)) {
            throw new Error('ID de cuenta por pagar inválido.');
        }
        return await CuentaPorPagar.findById(id).populate('proveedor');
    }

    async findByEmpresa(idEmpresa, options = {}) {
        if (!mongoose.Types.ObjectId.isValid(idEmpresa)) {
            throw new Error('ID de empresa inválido.');
        }
        const { page = 1, limit = 20, estado, search, sortBy = 'fechaEmision', order = 'desc' } = options;
        const query = { empresa: new mongoose.Types.ObjectId(idEmpresa) };

        if (estado) {
            query.estado = estado;
        }

        if (search) {
            const searchRegex = new RegExp(search, 'i');
            query.$or = [
                { descripcion: searchRegex },
                // Para buscar por nombre de proveedor, se necesitaría un $lookup en una pipeline de agregación.
                // Por ahora, la búsqueda se limita a campos directos de CuentaPorPagar.
            ];
        }

        const sortOptions = {};
        if (sortBy) {
            sortOptions[sortBy] = order === 'asc' ? 1 : -1;
        }

        const cuentas = await CuentaPorPagar.find(query)
            .populate('proveedor')
            .sort(sortOptions)
            .skip((Number(page) - 1) * Number(limit))
            .limit(Number(limit));

        const totalDocs = await CuentaPorPagar.countDocuments(query);
        const totalPages = Math.ceil(totalDocs / Number(limit));
        const hasNextPage = Number(page) < totalPages;
        const hasPrevPage = Number(page) > 1;

        return {
            docs: cuentas,
            totalDocs,
            limit: Number(limit),
            page: Number(page),
            totalPages,
            hasNextPage,
            hasPrevPage,
        };
    }

    async findByProveedor(idProveedor, options = {}) {
        if (!mongoose.Types.ObjectId.isValid(idProveedor)) {
            throw new Error('ID de proveedor inválido.');
        }
        const { page = 1, limit = 20 } = options;
        const cuentas = await CuentaPorPagar.find({ proveedor: idProveedor })
            .populate('proveedor')
            .skip((Number(page) - 1) * Number(limit))
            .limit(Number(limit));
        const total = await CuentaPorPagar.countDocuments({ proveedor: idProveedor });
        return { cuentas, pagination: { page: Number(page), limit: Number(limit), total } };
    }

    async update(id, data) {
        if (!mongoose.Types.ObjectId.isValid(id)) {
            throw new Error('ID de cuenta por pagar inválido.');
        }
        return await CuentaPorPagar.findByIdAndUpdate(id, data, { new: true, runValidators: true });
    }

    async delete(id) {
        if (!mongoose.Types.ObjectId.isValid(id)) {
            throw new Error('ID de cuenta por pagar inválido.');
        }
        return await CuentaPorPagar.findByIdAndDelete(id);
    }

    async applyPayment(id, amount) {
        if (!mongoose.Types.ObjectId.isValid(id)) {
            throw new Error('ID de cuenta por pagar inválido.');
        }
        const cuenta = await CuentaPorPagar.findById(id);
        if (!cuenta) {
            throw new Error('Cuenta por pagar no encontrada.');
        }
        const nuevoPendiente = Math.max(0, cuenta.montoPendiente - amount);
        const estado = nuevoPendiente === 0 ? 'pagado' : 'parcial';
        if (cuenta.fechaVencimiento && nuevoPendiente > 0 && cuenta.fechaVencimiento < new Date()) {
            cuenta.estado = 'vencido';
        } else {
            cuenta.estado = estado;
        }
        cuenta.montoPendiente = nuevoPendiente;
        return await cuenta.save();
    }

    async findVencidas(idEmpresa) {
        if (!mongoose.Types.ObjectId.isValid(idEmpresa)) {
            throw new Error('ID de empresa inválido.');
        }
        const hoy = new Date();
        return await CuentaPorPagar.find({
            empresa: idEmpresa,
            fechaVencimiento: { $lte: hoy },
            montoPendiente: { $gt: 0 }
        }).populate('proveedor');
    }

    async findProximas(idEmpresa, dias = 30) {
        if (!mongoose.Types.ObjectId.isValid(idEmpresa)) {
            throw new Error('ID de empresa inválido.');
        }
        const hoy = new Date();
        const proximas = new Date();
        proximas.setDate(hoy.getDate() + dias);
        return await CuentaPorPagar.find({
            empresa: idEmpresa,
            fechaVencimiento: { $gt: hoy, $lte: proximas },
            montoPendiente: { $gt: 0 }
        }).populate('proveedor');
    }
}

export default new CuentaPorPagarRepository();
