import {User} from '../models/index.js';


class UserRepository {
    // Busca un usuario por su nombre de usuario
    async findByUsername(username) {
        return await User.findOne({ username });
    }

    // Crea un nuevo usuario en la base de datos
    async create(userData) {
        const newUser = new User(userData);
        return await newUser.save();
    }

    // Busca un usuario por su ID
    async findById(id) {
        return await User.findById(id);
    }
    

    // Actualiza un usuario
    async update(id, updateData) {
        return await User.findByIdAndUpdate(id, updateData, { new: true });
    }

    // Elimina un usuario
    async delete(id) {
        return await User.findByIdAndDelete(id);
    }
    async deleteUserAndProducts(id) {
        // Aquí podrías implementar la lógica para eliminar un usuario y sus productos asociados
        // Por ejemplo, si tienes un modelo de Producto que tiene una referencia al usuario
        // await Product.deleteMany({ userId: id });
        return await User.findByIdAndDelete(id);
    }

   
}


export default new UserRepository();
