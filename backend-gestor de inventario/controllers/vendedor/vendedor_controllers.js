import { registerVendedor_services, loginVendedor_services, updateVendedor_services, deleteVendedor_services, getVendedorById_services, getVendedoresByEmpresa_services } from '../../services/vendedor_services.js';

export async function registerVendedor(req, res) {
    try {
        const creado = await registerVendedor_services(req.body);
        if (creado) {
            return res.status(201).json({ message: "Empleado creado exitosamente", creado });
        }
    } catch (err) {
        if (err.code === 11000) {
            const campoDuplicado = Object.keys(err.keyValue)[0];
            const valorDuplicado = err.keyValue[campoDuplicado];
            const mensaje = `El ${campoDuplicado} '${valorDuplicado}' ya está en uso.`;
            return res.status(409).json({ message: mensaje });
        }
        console.error("Error no controlado al crear el vendedor:", err);
        return res.status(500).json({ message: "Error interno del servidor. Por favor, contacte a soporte." });
    }
}

export async function loginVendedor(req, res) {
    try {
        const { username, password } = req.body;
        const user = await loginVendedor_services(username, password);
        return res.status(200).json(user);
    } catch (error) {
        console.error(`Error en el controlador login: ${error.message}`);
        return res.status(401).json({ error: "Usuario o contraseña incorrectos." });
    }
}

export async function updateVendedor(req, res) {
    try {
        const id = req.params.id;
        const datos = req.body;
        const actualizados = await updateVendedor_services(id, datos);
        if (!actualizados) {
            return res.status(404).json({ error: "Usuario no encontrado para actualizar." });
        }
        return res.status(200).json({ message: "Usuario actualizado correctamente.", user: actualizados });
    } catch (error) {
        console.error(`Error en el controlador update para ID ${req.params.id || 'desconocido'}:`, error.message);
        if (error.message.includes("ID de usuario es requerido")) {
            return res.status(400).json({ error: error.message });
        } else if (error.message.includes("No se pudo actualizar el usuario. El usuario no existe o no se realizaron cambios.")) {
            return res.status(404).json({ error: error.message });
        } else {
            return res.status(500).json({ error: "No se pudo actualizar el usuario debido a un error interno." });
        }
    }
}

export async function deleteVendedor(req, res) {
    try {
        const id = req.params.id;
        const eliminado = await deleteVendedor_services(id);
        if (!eliminado) {
            return res.status(404).json({ error: "Usuario no encontrado para eliminar." });
        }
        return res.status(200).json({ message: "Usuario eliminado correctamente.", user: eliminado });
    } catch (error) {
        console.error(`Error en el controlador deleteUser para ID ${req.params.id || 'desconocido'}:`, error.message);
        if (error.message.includes("ID de usuario es requerido")) {
            return res.status(400).json({ error: error.message });
        } else if (error.message.includes("No se pudo eliminar el usuario. El usuario no existe o ya ha sido eliminado.")) {
            return res.status(404).json({ error: error.message });
        } else {
            return res.status(500).json({ error: "No se pudo eliminar el usuario debido a un error interno." });
        }
    }
}

export async function getVendedorById(req, res) {
    try {
        const vendedor = await getVendedorById_services(req.params.id);
        if (!vendedor) {
            return res.status(404).json({ error: 'Vendedor no encontrado.' });
        }
        return res.status(200).json(vendedor);
    } catch (error) {
        console.error('Error al obtener vendedor:', error);
        return res.status(500).json({ error: 'Error interno al obtener el vendedor.' });
    }
}

export async function getVendedoresByEmpresa(req, res) {
    try {
        const vendedores = await getVendedoresByEmpresa_services(req.params.idEmpresa, req.query);
        return res.status(200).json(vendedores);
    } catch (error) {
        console.error('Error al obtener vendedores de la empresa:', error);
        return res.status(500).json({ error: 'Error interno al obtener vendedores.' });
    }
}

