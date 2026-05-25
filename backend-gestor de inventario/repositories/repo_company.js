import {Empresa} from "../models/index.js";

class EmpresaRepository{
     // Crea un nuevo usuario en la base de datos
     async create(empresaData) {
        const newEmpresa = new Empresa(empresaData);
        const guardada = await newEmpresa.save();
        return guardada;
    }

    async update(id, updateData) {
        return await Empresa.findByIdAndUpdate(id, updateData, { new: true });
    }

    async delete(id) {
        return await Empresa.findByIdAndDelete(id);
    } 
    async findById(id) {
        return await Empresa.findById(id);
    }

    async find_All(options = {}) {
        const { page = 1, limit = 10, sortBy, order } = options; // Añadimos opciones para sortBy y order
        const query = {}; // Por ahora, la consulta está vacía, pero podrías añadir filtros si los necesitas
    
        // 1. Obtener el total de compañías que coinciden con la consulta
        const totalCompanies = await Empresa.countDocuments(query);
    
        let companiesQuery = Empresa.find(query)
                                   .skip((page - 1) * limit)
                                   .limit(parseInt(limit));
    
        // Opcional: Añadir lógica de ordenamiento si la necesitas
        if (sortBy) {
            const sortOrder = order === 'desc' ? -1 : 1;
            companiesQuery = companiesQuery.sort({ [sortBy]: sortOrder });
        }
    
        const companies = await companiesQuery.exec();
    
        // 2. Calcular la información de paginación
        const totalPages = Math.ceil(totalCompanies / limit);
        const currentPage = parseInt(page);
        const hasNextPage = currentPage < totalPages;
        const hasPrevPage = currentPage > 1;
        const nextPage = hasNextPage ? currentPage + 1 : null;
        const prevPage = hasPrevPage ? currentPage - 1 : null;
    
        // 3. Devolver las compañías y la información de paginación
        return {
            companies,
            pagination: {
                totalCompanies,
                totalPages,
                currentPage,
                limit: parseInt(limit),
                hasNextPage,
                hasPrevPage,
                nextPage,
                prevPage,
            }
        };
    }
}

export default new EmpresaRepository(); 
