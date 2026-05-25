import { PuntoDeVenta } from '../models/index.js'; 

class PuntoDeVentaRepository {
    async addPuntoDeVenta(PuntoDeVentaData) {
        const newPuntoDeVenta = new PuntoDeVenta(PuntoDeVentaData);
        return await newPuntoDeVenta.save();
    }
    async findById(id) {
        return await PuntoDeVenta.findById(id);
    }


   
    async findAll(empresaId, options = {}) {
        // 1. Extraer todos los parámetros posibles de las opciones (paginación y filtros)
        const { 
            page = 1, 
            limit = 10, 
            sortBy, 
            order,
            nombre,      // <-- Filtro nuevo
            provincia,   // <-- Filtro nuevo
            numero       // <-- Filtro nuevo
        } = options;
        
        // 2. Construir la consulta base que siempre se aplicará
        const query = { empresa: empresaId };
    
        // 3. FILTROS DINÁMICOS: Añadir a la consulta solo si los filtros existen
        if (nombre) {
            // Usa una expresión regular para búsqueda case-insensitive y parcial
            query.nombre = new RegExp(nombre, 'i');
        }
    
        if (provincia) {
            // Búsqueda por coincidencia exacta
            query.provincia = provincia;
        }
        
        if (numero) {
            // Búsqueda por coincidencia exacta del número
            query.numero = numero;
        }
    
        // El resto del código funciona igual, pero ahora con el 'query' modificado
        try {
            const totalPuntosDeVenta = await PuntoDeVenta.countDocuments(query);
        
            let puntosDeVentaQuery = PuntoDeVenta.find(query)
                .skip((page - 1) * limit)
                .limit(parseInt(limit));
        
            if (sortBy) {
                const sortOrder = order === 'desc' ? -1 : 1;
                puntosDeVentaQuery = puntosDeVentaQuery.sort({ [sortBy]: sortOrder });
            }
        
            const puntosDeVenta = await puntosDeVentaQuery.exec();
        
            const totalPages = Math.ceil(totalPuntosDeVenta / limit);
            const currentPage = parseInt(page);
        
            return {
                puntosDeVenta,
                pagination: {
                    totalPuntosDeVenta,
                    totalPages,
                    currentPage,
                    limit: parseInt(limit),
                    hasNextPage: currentPage < totalPages,
                    hasPrevPage: currentPage > 1,
                    nextPage: currentPage < totalPages ? currentPage + 1 : null,
                    prevPage: currentPage > 1 ? currentPage - 1 : null,
                }
            };
        } catch (error) {
            console.error("Error en el repositorio al buscar puntos de venta:", error);
            // Lanza el error para que sea capturado por el controlador
            throw new Error("No se pudieron obtener los puntos de venta.");
        }
    }
    

    async updatePuntoDeVenta(id, updateData) {
        return await PuntoDeVenta.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });
    }

    async deletePuntoDeVenta(id) {
        return await PuntoDeVenta.findByIdAndDelete(id);
    }
}

export default new PuntoDeVentaRepository();
