import bcrypt from 'bcrypt';

// Función para hashear una contraseña
async function hashPassword(password) {
    try {
        const saltRounds = 12;
        const salt = await bcrypt.genSalt(saltRounds);

        // Hashea la contraseña con el salt
        const hashedPassword = await bcrypt.hash(password, salt);
        return hashedPassword;
    } catch (error) {
        console.error("Error al hashear la contraseña:", error);
        throw new Error("No se pudo hashear la contraseña.");
    }
}

export async function comparePassword(plainPassword, hashedPassword) {
    try {
        const isMatch = await bcrypt.compare(plainPassword, hashedPassword);
        return isMatch;
    } catch (error) {
        console.error("Error al comparar la contraseña:", error.message);
        throw new Error("Fallo al comparar la contraseña.");
    }
}


//haseha la password
export async function registerUser(plainPassword) {
    try {
        return await hashPassword(plainPassword);
    } catch (error) {
        console.error("Error en el registro del usuario:", error.message);
        throw new Error("Error al registrar el usuario.");
    }
}
