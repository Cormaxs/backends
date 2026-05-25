import {
    createCuentaPorPagar_service,
    getCuentasPorPagarByEmpresa_service,
    getCuentasPorPagarByProveedor_service,
    updateCuentaPorPagar_service,
    deleteCuentaPorPagar_service,
    recordPagoProveedor_service,
    getPagosByEmpresa_service,
    getPagosByProveedor_service,
    getCuentasPendientesVencidas_service,
    getCuentasPendientesProximas_service
} from '../../services/cuentas_pagar_services.js';

export async function createCuentaPorPagar(req, res) {
    try {
        const cuenta = await createCuentaPorPagar_service(req.body);
        return res.status(201).json(cuenta);
    } catch (error) {
        console.error('Error al crear cuenta por pagar:', error);
        return res.status(500).json({ error: 'Error interno al crear la cuenta por pagar.' });
    }
}

export async function getCuentasPorPagarByEmpresa(req, res) {
    try {
        const cuentas = await getCuentasPorPagarByEmpresa_service(req.params.idEmpresa, req.query);
        return res.status(200).json(cuentas);
    } catch (error) {
        console.error('Error al obtener cuentas por pagar:', error);
        return res.status(500).json({ error: 'Error interno al obtener las cuentas por pagar.' });
    }
}

export async function getCuentasPorPagarByProveedor(req, res) {
    try {
        const cuentas = await getCuentasPorPagarByProveedor_service(req.params.idProveedor, req.query);
        return res.status(200).json(cuentas);
    } catch (error) {
        console.error('Error al obtener cuentas por proveedor:', error);
        return res.status(500).json({ error: 'Error interno al obtener las cuentas por proveedor.' });
    }
}

export async function updateCuentaPorPagar(req, res) {
    try {
        const cuenta = await updateCuentaPorPagar_service(req.params.id, req.body);
        if (!cuenta) {
            return res.status(404).json({ error: 'Cuenta por pagar no encontrada.' });
        }
        return res.status(200).json(cuenta);
    } catch (error) {
        console.error('Error al actualizar cuenta por pagar:', error);
        return res.status(500).json({ error: 'Error interno al actualizar la cuenta por pagar.' });
    }
}

export async function deleteCuentaPorPagar(req, res) {
    try {
        const cuenta = await deleteCuentaPorPagar_service(req.params.id);
        if (!cuenta) {
            return res.status(404).json({ error: 'Cuenta por pagar no encontrada.' });
        }
        return res.status(200).json({ message: 'Cuenta por pagar eliminada correctamente.', cuenta });
    } catch (error) {
        console.error('Error al eliminar cuenta por pagar:', error);
        return res.status(500).json({ error: 'Error interno al eliminar la cuenta por pagar.' });
    }
}

export async function recordPagoProveedor(req, res) {
    try {
        const pago = await recordPagoProveedor_service(req.body);
        return res.status(201).json(pago);
    } catch (error) {
        console.error('Error al registrar pago de proveedor:', error);
        return res.status(500).json({ error: 'Error interno al registrar el pago de proveedor.' });
    }
}

export async function getPagosByEmpresa(req, res) {
    try {
        const pagos = await getPagosByEmpresa_service(req.params.idEmpresa, req.query);
        return res.status(200).json(pagos);
    } catch (error) {
        console.error('Error al obtener pagos de proveedores:', error);
        return res.status(500).json({ error: 'Error interno al obtener pagos de proveedores.' });
    }
}

export async function getPagosByProveedor(req, res) {
    try {
        const pagos = await getPagosByProveedor_service(req.params.idProveedor, req.query);
        return res.status(200).json(pagos);
    } catch (error) {
        console.error('Error al obtener pagos por proveedor:', error);
        return res.status(500).json({ error: 'Error interno al obtener pagos por proveedor.' });
    }
}

export async function getCuentasPendientesVencidas(req, res) {
    try {
        const cuentas = await getCuentasPendientesVencidas_service(req.params.idEmpresa);
        return res.status(200).json(cuentas);
    } catch (error) {
        console.error('Error al obtener cuentas vencidas:', error);
        return res.status(500).json({ error: 'Error interno al obtener cuentas vencidas.' });
    }
}

export async function getCuentasPendientesProximas(req, res) {
    try {
        const cuentas = await getCuentasPendientesProximas_service(req.params.idEmpresa, req.query);
        return res.status(200).json(cuentas);
    } catch (error) {
        console.error('Error al obtener cuentas próximas a vencer:', error);
        return res.status(500).json({ error: 'Error interno al obtener cuentas próximas a vencer.' });
    }
}
