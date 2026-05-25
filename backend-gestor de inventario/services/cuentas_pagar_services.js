import CuentaPorPagarRepository from '../repositories/repo_cuentas_pagar.js';
import PagoProveedorRepository from '../repositories/repo_pago_proveedor.js';
import ProveedorRepository from '../repositories/repo_proveedor.js';

export async function createCuentaPorPagar_service(data) {
    const cuenta = await CuentaPorPagarRepository.create(data);
    if (cuenta && cuenta.montoTotal) {
        await ProveedorRepository.adjustSaldo(cuenta.proveedor, cuenta.montoTotal);
    }
    return cuenta;
}

export async function getCuentasPorPagarByEmpresa_service(idEmpresa, options = {}) {
    return await CuentaPorPagarRepository.findByEmpresa(idEmpresa, options);
}

export async function getCuentasPorPagarByProveedor_service(idProveedor, options = {}) {
    return await CuentaPorPagarRepository.findByProveedor(idProveedor, options);
}

export async function updateCuentaPorPagar_service(id, data) {
    return await CuentaPorPagarRepository.update(id, data);
}

export async function deleteCuentaPorPagar_service(id) {
    return await CuentaPorPagarRepository.delete(id);
}

export async function recordPagoProveedor_service(data) {
    const pagoCreado = await PagoProveedorRepository.create(data);
    if (pagoCreado && pagoCreado.montoPagado) {
        await ProveedorRepository.adjustSaldo(pagoCreado.proveedor, -pagoCreado.montoPagado);
        if (pagoCreado.cuentaPorPagar) {
            await CuentaPorPagarRepository.applyPayment(pagoCreado.cuentaPorPagar, pagoCreado.montoPagado);
        }
    }
    return pagoCreado;
}

export async function getPagosByEmpresa_service(idEmpresa, options = {}) {
    return await PagoProveedorRepository.findByEmpresa(idEmpresa, options);
}

export async function getPagosByProveedor_service(idProveedor, options = {}) {
    return await PagoProveedorRepository.findByProveedor(idProveedor, options);
}

export async function getCuentasPendientesVencidas_service(idEmpresa) {
    return await CuentaPorPagarRepository.findVencidas(idEmpresa);
}

export async function getCuentasPendientesProximas_service(idEmpresa, query = {}) {
    const { dias = 30 } = query;
    return await CuentaPorPagarRepository.findProximas(idEmpresa, Number(dias));
}
