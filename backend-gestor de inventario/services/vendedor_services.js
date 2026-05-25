import VendedorRepository from '../repositories/repo_vendedor.js';
import { registerUser, comparePassword } from '../utils/bcrypt.js';

//vendedor
export async function registerVendedor_services(datos) {
    datos.password = await registerUser(datos.password);
 

    const usuarioCreado = await VendedorRepository.create(datos);

    if (usuarioCreado) {
        return usuarioCreado;
    } else {
        // Esto indica un problema lógico si el repositorio no lanza un error por sí mismo.
        console.error("VendedorRepository.create no lanzó un error, pero no devolvió el usuario creado. Posible problema de lógica en el repositorio.");
        throw new Error("No se pudo completar el registro del usuario por un error interno.");
    }
}

export async function loginVendedor_services(username, password) {
    const existe = await VendedorRepository.findByUsername(username);

    if (!existe) {
        console.error(`Intento de inicio de sesión fallido para el usuario: ${username}. Usuario no encontrado.`);
        throw new Error("Credenciales inválidas."); // Error genérico para seguridad
    }
    const passwordMatch = await comparePassword(password, existe.password);
    if (!passwordMatch) {
        console.error(`Intento de inicio de sesión fallido para el usuario: ${username}. Contraseña incorrecta.`);
        throw new Error("Credenciales inválidas."); // Error genérico para seguridad
    }
    return existe;
}


export async function updateVendedor_services(id, datos) { // Cambiado para recibir 'id' directamente
    if (!id) {
        console.error("Error en updateUser_services: ID de usuario no proporcionado para la actualización.");
        throw new Error("ID de usuario es requerido para la actualización.");
    }

    // Si `datos` incluye `password`, debería hashearse aquí antes de pasar al repositorio.
    if (datos.password) {
        datos.password = await registerUser(datos.password); // Reutilizando la función de hash
    }

    const updatedUser = await VendedorRepository.update(id, datos);
    if (updatedUser) {
        return updatedUser;
    } else {
        // Si el usuario no se encontró, el repositorio devuelve null/undefined.
        console.error(`Error en updateUser_services: No se encontró el usuario con ID ${id} para actualizar o la operación no tuvo efecto.`);
        throw new Error("No se pudo actualizar el usuario. El usuario no existe o no se realizaron cambios.");
    }
}

export async function deleteVendedor_services(id) {
    if (!id) {
        console.error("Error en deleteUser_services: ID de usuario no proporcionado para la eliminación.");
        throw new Error("ID de usuario es requerido para la eliminación.");
    }

    const deletedUser = await VendedorRepository.delete(id);
    if (deletedUser) {

        return deletedUser;
    } else {
        console.error(`Error en deleteUser_services: No se encontró el usuario con ID ${id} para eliminar o ya fue eliminado.`);
        throw new Error("No se pudo eliminar el usuario. El usuario no existe o ya ha sido eliminado.");
    }
}

export async function getVendedorById_services(id) {
    if (!id) {
        throw new Error('ID de vendedor es requerido.');
    }
    return await VendedorRepository.findById(id);
}

export async function getVendedoresByEmpresa_services(idEmpresa, options = {}) {
    if (!idEmpresa) {
        throw new Error('ID de empresa es requerido.');
    }
    return await VendedorRepository.findByEmpresa(idEmpresa, options);
}
