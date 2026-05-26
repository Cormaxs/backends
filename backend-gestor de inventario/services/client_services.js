import Client from '../models/sales/client.js';

/**
 * Crea un nuevo cliente
 */
export async function createClient_service(clientData) {
    try {
        const newClient = new Client(clientData);
        return await newClient.save();
    } catch (error) {
        throw error;
    }
}

/**
 * Obtiene un cliente por su ID
 */
export async function getClientById_service(id) {
    try {
        return await Client.findById(id);
    } catch (error) {
        throw error;
    }
}

/**
 * Obtiene todos los clientes de una empresa con filtros opcionales
 */
export async function getClientsByEmpresa_service(idEmpresa, options = {}) {
    try {
        const { page = 1, limit = 10, sortBy = 'razonSocial', order = 'asc', search } = options;

        const query = { owner: idEmpresa, activo: true };
        
        if (search) {
            query.$or = [
                { razonSocial: { $regex: search, $options: 'i' } },
                { numeroDocumento: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } }
            ];
        }

        const totalClients = await Client.countDocuments(query);
        const clients = await Client.find(query)
            .sort({ [sortBy]: order === 'asc' ? 1 : -1 })
            .skip((page - 1) * limit)
            .limit(limit);

        const pagination = {
            totalItems: totalClients,
            currentPage: parseInt(page),
            limit: parseInt(limit),
            totalPages: Math.ceil(totalClients / limit),
            hasNextPage: (page * limit) < totalClients,
            hasPrevPage: page > 1,
        };

        return { clients, pagination };
    } catch (error) {
        throw error;
    }
}

/**
 * Actualiza un cliente
 */
export async function updateClient_service(id, updateData) {
    try {
        return await Client.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });
    } catch (error) {
        throw error;
    }
}

/**
 * Desactiva un cliente (soft delete)
 */
export async function deleteClient_service(id) {
    try {
        return await Client.findByIdAndUpdate(id, { activo: false }, { new: true });
    } catch (error) {
        throw error;
    }
}
