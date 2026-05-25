import { registerUser, comparePassword } from '../utils/bcrypt.js';
import UserRepository from '../repositories/repo_auth.js';


export async function loginUser_services(username, password) {
    const existe = await UserRepository.findByUsername(username);
   
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

export async function registerUser_services(datos) {
    datos.password = await registerUser(datos.password);
    

    const usuarioCreado = await UserRepository.create(datos);
    if (usuarioCreado) {
       
        return usuarioCreado;
    } else {
        // Esto indica un problema lógico si el repositorio no lanza un error por sí mismo.
        console.error("UserRepository.create no lanzó un error, pero no devolvió el usuario creado. Posible problema de lógica en el repositorio.");
        throw new Error("No se pudo completar el registro del usuario por un error interno.");
    }
}

export async function updateUser_services(id, datos) { // Cambiado para recibir 'id' directamente
    if (!id) {
        console.error("Error en updateUser_services: ID de usuario no proporcionado para la actualización.");
        throw new Error("ID de usuario es requerido para la actualización.");
    }

    // Si `datos` incluye `password`, debería hashearse aquí antes de pasar al repositorio.
    if (datos.password) {
        datos.password = await registerUser(datos.password); // Reutilizando la función de hash
    }

    const updatedUser = await UserRepository.update(id, datos);
    if (updatedUser) {
        return updatedUser;
    } else {
        // Si el usuario no se encontró, el repositorio devuelve null/undefined.
        console.error(`Error en updateUser_services: No se encontró el usuario con ID ${id} para actualizar o la operación no tuvo efecto.`);
        throw new Error("No se pudo actualizar el usuario. El usuario no existe o no se realizaron cambios.");
    }
}

export async function deleteUser_services(id) {
    if (!id) {
        console.error("Error en deleteUser_services: ID de usuario no proporcionado para la eliminación.");
        throw new Error("ID de usuario es requerido para la eliminación.");
    }

    const deletedUser = await UserRepository.delete(id);
    if (deletedUser) {
       
        return deletedUser;
    } else {
        // Si el usuario no se encontró, el repositorio devuelve null/undefined.
        console.error(`Error en deleteUser_services: No se encontró el usuario con ID ${id} para eliminar o ya fue eliminado.`);
        throw new Error("No se pudo eliminar el usuario. El usuario no existe o ya ha sido eliminado.");
    }
}

export async function get_user_id(id){
    const result = await UserRepository.findById(id);
    if(result){
        return result;
    }return false;
}





//creo una clase para verificar si el usuario ya existe, puedo usarla instancia de UserRepository
class AuthService {
    constructor() {
        this.UserRepository = UserRepository; // Asigna la instancia del repositorio
    }

    async UserExist(username) {
        const existe = await this.UserRepository.findByUsername(username);
        return existe ? true : false;
    }
}

export default new AuthService(); // Exporta una instancia de la clase AuthService
