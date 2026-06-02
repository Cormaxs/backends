import AdminRepository from '../repositories/repo_admin.js';

export async function get_admin_companies_summary() {
    return await AdminRepository.getCompaniesSummary();
}

export async function get_admin_company_details(id) {
    return await AdminRepository.getCompanyDetails(id);
}

export async function get_admin_company_products(id) {
    return await AdminRepository.getCompanyProducts(id);
}

export async function get_admin_company_tickets(id) {
    return await AdminRepository.getCompanyTickets(id);
}

export async function get_admin_company_facturas(id) {
    return await AdminRepository.getCompanyFacturas(id);
}

export async function get_admin_company_notas_pedido(id) {
    return await AdminRepository.getCompanyNotasPedido(id);
}

export async function get_admin_company_cajas(id) {
    return await AdminRepository.getCompanyCajas(id);
}

export async function get_admin_company_puntos_venta(id) {
    return await AdminRepository.getCompanyPuntosVenta(id);
}

export async function get_admin_company_pagos_proveedor(id) {
    return await AdminRepository.getCompanyPagosProveedor(id);
}

export async function get_admin_company_cuentas_pagar(id) {
    return await AdminRepository.getCompanyCuentasPagar(id);
}

export async function get_admin_users() {
    return await AdminRepository.getAllUsers();
}
