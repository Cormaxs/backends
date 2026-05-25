import {
    createProveedor_service,
    getProveedorById_service,
    getProveedoresByEmpresa_service,
    updateProveedor_service,
    deleteProveedor_service
} from '../../services/proveedor_services.js';

export async function createProveedor(req, res) {
    try {
        const proveedor = await createProveedor_service(req.body);
        return res.status(201).json(proveedor);
    } catch (error) {
        console.error('Error al crear proveedor:', error);
        if (error.message.includes('duplicate key')) {
            return res.status(409).json({ error: 'El proveedor ya existe para esta empresa.' });
        }
        return res.status(500).json({ error: 'Error interno al crear el proveedor.' });
    }
}

export async function getProveedorById(req, res) {
    try {
        const proveedor = await getProveedorById_service(req.params.id);
        if (!proveedor) {
            return res.status(404).json({ error: 'Proveedor no encontrado.' });
        }
        return res.status(200).json(proveedor);
    } catch (error) {
        console.error('Error al obtener proveedor:', error);
        return res.status(500).json({ error: 'Error interno al obtener el proveedor.' });
    }
}

export async function getProveedoresByEmpresa(req, res) {
    try {
        const proveedores = await getProveedoresByEmpresa_service(req.params.idEmpresa, req.query);
        return res.status(200).json(proveedores);
    } catch (error) {
        console.error('Error al obtener proveedores de la empresa:', error);
        return res.status(500).json({ error: 'Error interno al obtener proveedores.' });
    }
}

export async function updateProveedor(req, res) {
    try {
        const proveedor = await updateProveedor_service(req.params.id, req.body);
        if (!proveedor) {
            return res.status(404).json({ error: 'Proveedor no encontrado para actualizar.' });
        }
        return res.status(200).json(proveedor);
    } catch (error) {
        console.error('Error al actualizar proveedor:', error);
        return res.status(500).json({ error: 'Error interno al actualizar el proveedor.' });
    }
}

export async function deleteProveedor(req, res) {
    try {
        const proveedor = await deleteProveedor_service(req.params.id);
        if (!proveedor) {
            return res.status(404).json({ error: 'Proveedor no encontrado para eliminar.' });
        }
        return res.status(200).json({ message: 'Proveedor eliminado correctamente.', proveedor });
    } catch (error) {
        console.error('Error al eliminar proveedor:', error);
        return res.status(500).json({ error: 'Error interno al eliminar el proveedor.' });
    }
}
