import { Proveedor } from '../models/index.js';
import mongoose from 'mongoose';

class ProveedorRepository {
    async create(data) {
        const proveedor = new Proveedor(data);
        return await proveedor.save();
    }

    async findById(id) {
        if (!mongoose.Types.ObjectId.isValid(id)) {
            throw new Error('ID de proveedor inválido.');
        }
        return await Proveedor.findById(id);
    }

    async findByEmpresa(idEmpresa, options = {}) {
        if (!mongoose.Types.ObjectId.isValid(idEmpresa)) {
            throw new Error('ID de empresa inválido.');
        }
        const { page = 1, limit = 20, activo, search, sortBy = 'razonSocial', order = 'asc' } = options;
        const query = { empresa: new mongoose.Types.ObjectId(idEmpresa) };

        if (activo !== undefined) {
            query.activo = activo === 'true' || activo === true;
        }

        if (search) {
            const searchRegex = new RegExp(search, 'i');
            query.$or = [
                { razonSocial: searchRegex },
                { nombreContacto: searchRegex },
                { cuit: searchRegex },
                { email: searchRegex },
                { telefono: searchRegex },
            ];
        }

        const sortOptions = {};
        if (sortBy) {
            sortOptions[sortBy] = order === 'asc' ? 1 : -1;
        }

        const proveedores = await Proveedor.find(query)
            .sort(sortOptions)
            .skip((Number(page) - 1) * Number(limit))
            .limit(Number(limit));

        const totalDocs = await Proveedor.countDocuments(query);
        const totalPages = Math.ceil(totalDocs / Number(limit));
        const hasNextPage = Number(page) < totalPages;
        const hasPrevPage = Number(page) > 1;

        return {
            docs: proveedores,
            totalDocs,
            limit: Number(limit),
            page: Number(page),
            totalPages,
            hasNextPage,
            hasPrevPage,
        };
    }

    async update(id, data) {
        if (!mongoose.Types.ObjectId.isValid(id)) {
            throw new Error('ID de proveedor inválido.');
        }
        return await Proveedor.findByIdAndUpdate(id, data, { new: true, runValidators: true });
    }

    async delete(id) {
        if (!mongoose.Types.ObjectId.isValid(id)) {
            throw new Error('ID de proveedor inválido.');
        }
        return await Proveedor.findByIdAndDelete(id);
    }

    async adjustSaldo(idProveedor, delta) {
        if (!mongoose.Types.ObjectId.isValid(idProveedor)) {
            throw new Error('ID de proveedor inválido.');
        }
        const proveedor = await Proveedor.findById(idProveedor);
        if (!proveedor) {
            throw new Error('Proveedor no encontrado.');
        }
        const nuevoSaldo = Math.max(0, proveedor.saldoCuentaCorriente + Number(delta));
        proveedor.saldoCuentaCorriente = nuevoSaldo;
        return await proveedor.save();
    }
}

export default new ProveedorRepository();
