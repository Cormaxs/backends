import {User} from '../models/index.js';


class UserRepository {
    // Busca un usuario por su nombre de usuario
    async findByUsername(username) {
        return await User.findOne({ username });
    }

    // Crea un nuevo usuario en la base de datos
    async create(UserData) {
        const newUser = new User(UserData); 
        
        return await newUser.save();
    }

    // Busca un usuario por su ID
    async findById(id) {
        return await User.findById(id);
    }

    async findByEmpresa(empresaId, options = {}) {
        const { page = 1, limit = 20, activo } = options;
        const query = { empresa: empresaId };
        if (activo !== undefined) {
            query.activo = activo === 'true' || activo === true;
        }
        const vendors = await User.find(query)
            .skip((Number(page) - 1) * Number(limit))
            .limit(Number(limit));
        const total = await User.countDocuments(query);
        return { vendors, pagination: { page: Number(page), limit: Number(limit), total } };
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
        // await Product.deleteMany({ UserId: id });
        return await User.findByIdAndDelete(id);
    }

   
}


export default new UserRepository();
