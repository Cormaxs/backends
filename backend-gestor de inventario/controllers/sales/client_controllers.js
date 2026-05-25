import {
    createClient_service,
    getClientById_service,
    getClientsByEmpresa_service,
    updateClient_service,
    deleteClient_service
} from '../../services/client_services.js';

export async function createClient(req, res) {
    try {
        const client = await createClient_service(req.body);
        return res.status(201).json({
            success: true,
            data: client
        });
    } catch (error) {
        console.error('Error al crear cliente:', error);
        if (error.code === 11000) {
            return res.status(409).json({ success: false, error: 'Ya existe un cliente con ese documento para esta empresa.' });
        }
        return res.status(500).json({ success: false, error: 'Error interno al crear el cliente.' });
    }
}

export async function getClientById(req, res) {
    try {
        const client = await getClientById_service(req.params.id);
        if (!client) {
            return res.status(404).json({ success: false, error: 'Cliente no encontrado.' });
        }
        return res.status(200).json({
            success: true,
            data: client
        });
    } catch (error) {
        console.error('Error al obtener cliente:', error);
        return res.status(500).json({ success: false, error: 'Error interno al obtener el cliente.' });
    }
}

export async function getClientsByEmpresa(req, res) {
    try {
        const { idEmpresa } = req.params;
        const clients = await getClientsByEmpresa_service(idEmpresa, req.query);
        return res.status(200).json({
            success: true,
            data: clients
        });
    } catch (error) {
        console.error('Error al obtener clientes de la empresa:', error);
        return res.status(500).json({ success: false, error: 'Error interno al obtener clientes.' });
    }
}

export async function updateClient(req, res) {
    try {
        const client = await updateClient_service(req.params.id, req.body);
        if (!client) {
            return res.status(404).json({ success: false, error: 'Cliente no encontrado para actualizar.' });
        }
        return res.status(200).json({
            success: true,
            data: client
        });
    } catch (error) {
        console.error('Error al actualizar cliente:', error);
        return res.status(500).json({ success: false, error: 'Error interno al actualizar el cliente.' });
    }
}

export async function deleteClient(req, res) {
    try {
        const client = await deleteClient_service(req.params.id);
        if (!client) {
            return res.status(404).json({ success: false, error: 'Cliente no encontrado para eliminar.' });
        }
        return res.status(200).json({
            success: true,
            message: 'Cliente desactivado correctamente.',
            data: client
        });
    } catch (error) {
        console.error('Error al eliminar cliente:', error);
        return res.status(500).json({ success: false, error: 'Error interno al eliminar el cliente.' });
    }
}
