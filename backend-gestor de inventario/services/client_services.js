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
export async function getClientsByEmpresa_service(idEmpresa, filters = {}) {
    try {
        const query = { owner: idEmpresa, activo: true };
        
        if (filters.search) {
            query.$or = [
                { razonSocial: { $regex: filters.search, $options: 'i' } },
                { numeroDocumento: { $regex: filters.search, $options: 'i' } },
                { email: { $regex: filters.search, $options: 'i' } }
            ];
        }

        return await Client.find(query).sort({ razonSocial: 1 });
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
