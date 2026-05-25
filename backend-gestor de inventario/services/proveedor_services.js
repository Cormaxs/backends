import ProveedorRepository from '../repositories/repo_proveedor.js';

export async function createProveedor_service(data) {
    return await ProveedorRepository.create(data);
}

export async function getProveedorById_service(id) {
    return await ProveedorRepository.findById(id);
}

export async function getProveedoresByEmpresa_service(idEmpresa, options = {}) {
    return await ProveedorRepository.findByEmpresa(idEmpresa, options);
}

export async function updateProveedor_service(id, data) {
    return await ProveedorRepository.update(id, data);
}

export async function deleteProveedor_service(id) {
    return await ProveedorRepository.delete(id);
}
