// repositories/repo_tikets.js
import { Ticket } from "../models/index.js";
import mongoose from 'mongoose';

class TicketEmitidoRepository {
    async create(ticketData) {
        if (ticketData.idEmpresa && !mongoose.Types.ObjectId.isValid(ticketData.idEmpresa)) {
            throw new Error('ID de empresa inválido para la creación del ticket.');
        }
        const newTicketEmitido = new Ticket(ticketData);
        return await newTicketEmitido.save();
    }

    async update(id, updateData) {
        if (!mongoose.Types.ObjectId.isValid(id)) {
            throw new Error('ID de ticket inválido para la actualización.');
        }
        return await Ticket.findByIdAndUpdate(id, updateData, { new: true });
    }

    async delete(id) {
        if (!mongoose.Types.ObjectId.isValid(id)) {
            throw new Error('ID de ticket inválido para la eliminación.');
        }
        return await Ticket.findByIdAndDelete(id);
    }

    //busca tickets por id
    async findById(id) {
        if (!mongoose.Types.ObjectId.isValid(id)) {
            throw new Error('ID de ticket inválido para la búsqueda.');
        }
        return await Ticket.findById(id);
    }

    async findLastComprobanteInterno(idEmpresa, puntoDeVenta) {
        try {
            if (!mongoose.Types.ObjectId.isValid(idEmpresa)) {
                throw new Error('ID de empresa inválido para buscar el último comprobante interno.');
            }
            const lastTicket = await Ticket.findOne({
                idEmpresa: idEmpresa,
                puntoDeVenta: puntoDeVenta
            })
            .sort({ numeroComprobanteInterno: -1 })
            .limit(1)
            .select('numeroComprobanteInterno')
            .exec();

            return lastTicket ? lastTicket.numeroComprobanteInterno : 0;
        } catch (error) {
            console.error("Error al buscar el último comprobante interno:", error);
            throw error;
        }
    }

    //busca la ultima venta
    async findLastVentaId(idEmpresa, puntoDeVenta) {
        try {
            if (!mongoose.Types.ObjectId.isValid(idEmpresa)) {
                throw new Error('ID de empresa inválido para buscar el último ventaId.');
            }

            const lastTicket = await Ticket.findOne({
                idEmpresa: idEmpresa,
                puntoDeVenta: puntoDeVenta
            })
            .sort({ ventaId: -1 })
            .limit(1)
            .select('ventaId')
            .exec();

            return lastTicket ? lastTicket.ventaId : null;
        } catch (error) {
            console.error("Error al buscar el último ventaId:", error);
            throw error;
        }
    }
    //busca el ultimo comprobante
    async findLastNumeroComprobante(idEmpresa, puntoDeVenta) {
        try {
            if (!mongoose.Types.ObjectId.isValid(idEmpresa)) {
                throw new Error('ID de empresa inválido para buscar el último numeroComprobante.');
            }

            const lastTicket = await Ticket.findOne({
                idEmpresa: idEmpresa,
                puntoDeVenta: puntoDeVenta
            })
            .sort({ numeroComprobante: -1 })
            .limit(1)
            .select('numeroComprobante')
            .exec();

            return lastTicket ? lastTicket.numeroComprobante : null;
        } catch (error) {
            console.error("Error al buscar el último numeroComprobante:", error);
            throw error;
        }
    }

    //busca por punto de venta
    async findByDetails(puntoDeVenta, idEmpresa, numeroComprobanteInterno) {
        if (!mongoose.Types.ObjectId.isValid(idEmpresa)) {
            throw new Error('ID de empresa inválido para buscar por detalles.');
        }

        return await Ticket.findOne({
            puntoDeVenta: puntoDeVenta,
            idEmpresa: idEmpresa,
            numeroComprobanteInterno: numeroComprobanteInterno
        });
    }

   //busca tickets por ID de empresa con paginación y ordenamiento
   async findByEmpresaId(idEmpresa, options = {}) {
    // Validar el ID de la empresa
    if (!mongoose.Types.ObjectId.isValid(idEmpresa)) {
        throw new Error('ID de empresa inválido para la búsqueda por empresa.');
    }

    // 1. OBTENER OPCIONES
    const { page = 1, limit = 10, sortBy, order, search, puntoventa } = options;
    
    // ✅ 2. CONSTRUIR LA CONSULTA BASE CON `$and`
    // Se inicia la consulta con el operador $and para combinar múltiples condiciones.
    const query = {
        $and: [
            { idEmpresa: idEmpresa } // El filtro de empresa siempre es obligatorio
        ]
    };

    // ✅ 3. AÑADIR FILTRO OPCIONAL POR `puntoventa`
    // Si se proporciona un `puntoventa` específico, se añade como una condición más.
    if (puntoventa && mongoose.Types.ObjectId.isValid(puntoventa)) {
        // Asumiendo que el campo en tu schema se llama `puntoDeVenta`
        query.$and.push({ puntoDeVenta: puntoventa });
    }

    // 4. AÑADIR LÓGICA DE BÚSQUEDA GENERAL SI EXISTE `search`
    if (search) {
        const searchConditions = [];
        const searchRegex = { $regex: search, $options: 'i' };

        // Añadir condiciones para los campos de texto
        searchConditions.push({ puntoDeVenta: searchRegex });
        searchConditions.push({ ventaId: searchRegex });
        searchConditions.push({ numeroComprobante: searchRegex });
        searchConditions.push({ cajero: searchRegex });
        
        // --- Búsqueda por fecha ---
        const date = new Date(search);
        if (!isNaN(date.getTime())) {
            const startOfDay = new Date(date.setHours(0, 0, 0, 0));
            const endOfDay = new Date(date.setHours(23, 59, 59, 999));
            
            searchConditions.push({
                fechaHora: {
                    $gte: startOfDay,
                    $lte: endOfDay
                }
            });
        }
        
        // La condición $or se añade al array $and principal
        query.$and.push({ $or: searchConditions });
    }

    // 5. EJECUTAR CONSULTAS (el resto del código no cambia)
    const totalTickets = await Ticket.countDocuments(query);

    let ticketsQuery = Ticket.find(query)
        .sort({ fechaHora: -1 })
        .skip((page - 1) * limit)
        .limit(parseInt(limit));

    if (sortBy) {
        const sortOrder = order === 'desc' ? -1 : 1;
        ticketsQuery = ticketsQuery.sort({ [sortBy]: sortOrder });
    }

    const tickets = await ticketsQuery.exec();
    
    // 6. CALCULAR PAGINACIÓN Y DEVOLVER
    const totalPages = Math.ceil(totalTickets / limit);
    const currentPage = parseInt(page);
    const hasNextPage = currentPage < totalPages;
    const hasPrevPage = currentPage > 1;

    return {
        tickets,
        pagination: {
            totalTickets,
            totalPages,
            currentPage,
            limit: parseInt(limit),
            hasNextPage,
            hasPrevPage,
            nextPage: hasNextPage ? currentPage + 1 : null,
            prevPage: hasPrevPage ? currentPage - 1 : null,
        }
    };
}

}

export default new TicketEmitidoRepository();
