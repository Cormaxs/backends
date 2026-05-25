import {FacturaEmitida} from "../models/index.js";

class FacturaEmitidaRepository{
     // Crea un nuevo usuario en la base de datos
     async create(FacturaEmitidaData) {
        const newFacturaEmitida = new FacturaEmitida(FacturaEmitidaData);
        return await newFacturaEmitida.save();
    }

    async update(id, updateData) {
        return await FacturaEmitida.findByIdAndUpdate(id, updateData, { new: true });
    }

    async delete(id) {
        return await FacturaEmitida.findByIdAndDelete(id);
    } 
    async findById(id) {
        return await FacturaEmitida.findById(id);
    }

    //BUSCA  LAS FACTURAS EMITIDAS
    async findFacturas_repo(options) {
        try {
            const {
                empresaId,
                page = 1,
                pageSize = 10,
                sortBy = 'fechaCreacion',
                sortOrder = 'desc',
                search,
                puntoDeVenta,
                ...filtros
            } = options;
        
            // --- Construcción de la consulta para Mongoose ---
            const query = {
                ...filtros,
                empresa: empresaId,
            };
            
            // Añadir el filtro de puntoDeVenta si existe
            if (puntoDeVenta) {
                query.puntoDeVenta = puntoDeVenta;
            }
    
            // Corrección: Usar la consulta de búsqueda de forma adecuada
            if (search) {
                // El campo fechaEmision es un Date, no se puede buscar con $regex. 
                // Si quieres buscar por fecha, necesitarías un rango de fechas.
                // Para la búsqueda de texto, nos enfocamos en campos de tipo String.
                const searchRegex = { $regex: search, $options: 'i' };
                
                // Agregamos una consulta $or para buscar en múltiples campos
                query.$or = [
                    { numeroComprobanteCompleto: searchRegex },
                    { tipoComprobante: searchRegex },
                    // ✅ Campos del cliente (receptor) están anidados. Usamos la notación de punto.
                    { 'receptor.razonSocial': searchRegex },
                    { 'receptor.cuit': searchRegex },
                ];
            }
        
            // El resto del código para paginación y ordenamiento es el mismo
            const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };
            const skip = (parseInt(page) - 1) * parseInt(pageSize);
        
            const facturas = await FacturaEmitida.find(query)
                .sort(sort)
                .skip(skip)
                .limit(parseInt(pageSize));
        
            const total = await FacturaEmitida.countDocuments(query);
        
            return {
                total: total,
                page: parseInt(page, 10),
                pageSize: parseInt(pageSize, 10),
                data: facturas,
            };
        
        } catch (err) {
            console.error("Error en findFacturas_repo:", err);
            throw new Error("Error en la capa de acceso a datos.");
        }
    }


    //conseguir el ultimo numero de comprobante interno
     async findLastComprobanteInterno(empresaId, puntoDeVentaId) {

        try {
            const lastFactura = await FacturaEmitida.findOne({
                empresa: empresaId,
                puntoDeVenta: puntoDeVentaId
            })
            .sort({ numeroComprobanteInterno: -1 }) // Ordena de forma descendente
            .limit(1) // Limita a un solo resultado (el último)
            .select('numeroComprobanteInterno') // Selecciona solo el campo que te interesa
            .exec(); // Ejecuta la consulta

            // Si se encontró una factura, devuelve su numeroComprobanteInterno,
            // de lo contrario, devuelve 0.
            return lastFactura ? lastFactura.numeroComprobanteInterno : 0;
        } catch (error) {
            console.error("Error al buscar el último comprobante interno por empresa y punto de venta:", error);
            throw error; // Propaga el error para que el controlador lo maneje
        }
    }


    //borrar despues
    async findLastNotaDePedidoInterno(empresaId, puntoDeVentaId, tipoFactura) {
        try {
            const lastNotaDePedido = await FacturaEmitida.findOne({
                empresa: empresaId,
                puntoDeVenta: puntoDeVentaId,
                tipoComprobante: tipoFactura // Filtra específicamente por el tipo
            })
            .sort({ numeroComprobanteInterno: -1 })
            .limit(1)
            .select('numeroComprobanteInterno')
            .exec();
            
            return lastNotaDePedido ? lastNotaDePedido.numeroComprobanteInterno : 0;
        } catch (error) {
            console.error("Error al buscar la última nota de pedido:", error);
            throw error;
        }
    }


    //Buscar numero de comprobante especifico
    async findByDetails(puntoDeVentaId, empresaId, numeroComprobanteInterno) {
        return await FacturaEmitida.findOne({
            puntoDeVenta: puntoDeVentaId,
            empresa: empresaId,
            numeroComprobanteInterno: numeroComprobanteInterno
        });
    }
}

export default new FacturaEmitidaRepository(); 
