import EmpresaRepository from "../repositories/repo_company.js";
import PlanValidationService from './plan_validation_service.js';

export async function register_company(datos) {
    const usuarioCreado = await EmpresaRepository.create(datos);
    if (usuarioCreado) {
        return usuarioCreado;
    } else {
        console.error("EmpresaRepository.create no lanzó un error, pero no devolvió el usuario creado. Posible problema de lógica en el repositorio.");
        throw new Error("No se pudo completar el registro del usuario por un error interno en la base de datos.");
    }
}

export async function update_company(id, datos) {
    const companyUpdated = await EmpresaRepository.update(id, datos);
    if (companyUpdated) {
        return companyUpdated;
    } else {
        console.error("EmpresaRepository.update no encontró la empresa o no devolvió los datos actualizados.");
        throw new Error("No se pudo actualizar la empresa. Es posible que el ID no exista o hubo un problema interno.");
    }
}

export async function delete_company(id) {
    const result = await EmpresaRepository.delete(id);
    if (result) {
        return { message: "Empresa eliminada exitosamente." };
    }  return("No se pudo eliminar la empresa. Es posible que el ID no exista.");
}

export async function get_company(id) {
    const result = await EmpresaRepository.findById(id);
    if (result) {
        return result;
    }  return("No se pudo encontrar la empresa. Es posible que el ID no exista.");
}

export async function get_company_all() {
    const result = await EmpresaRepository.find_All();
    if (result) {
        return result;
    }  return("No se pudo encontrar la empresa. Es posible que el ID no exista.");
}

export async function get_company_plan_status(id) {
    const resumen = await PlanValidationService.getResumenCompleto(id);
    if (!resumen) {
        throw new Error("No se pudo obtener el resumen del plan.");
    }
    return resumen;
}
