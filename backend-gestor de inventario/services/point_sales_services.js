import PuntoDeVentaRepository from '../repositories/repo_point_sales.js';

export async function create_point_sales_services(data) {
    return await PuntoDeVentaRepository.addPuntoDeVenta(data);
}

export async function get_point_sales_services(id, options) {
    return await PuntoDeVentaRepository.findAll(id, options);
}

export async function get_point_sale_by_id_services(id) {
    return await PuntoDeVentaRepository.findById(id);
}

export async function update_point_sale_services(id, updateData) {
    return await PuntoDeVentaRepository.updatePuntoDeVenta(id, updateData);
}

export async function delete_point_sale_services(id) {
    return await PuntoDeVentaRepository.deletePuntoDeVenta(id);
}

