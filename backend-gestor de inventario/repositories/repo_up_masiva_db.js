// repositories/repo_up_masiva_db.js

import { Product, Marca, Categoria } from '../models/index.js';

class ProductoRepository {

    /**
     * Busca una categoría existente por nombre y empresa. Si no existe, la crea.
     * @param {string} nombre - El nombre de la categoría.
     * @param {string} empresaId - El ID de la empresa.
     * @returns {Promise<string>} El ID de la categoría (existente o recién creada).
     */
    async findOrCreateCategoriaId(nombre, empresaId) {
        if (!nombre || typeof nombre !== 'string') return null;
        
        let categoria = await Categoria.findOne({ nombre: nombre.trim(), empresa: empresaId });
        if (!categoria) {
            categoria = new Categoria({ nombre: nombre.trim(), empresa: empresaId });
            await categoria.save();
        }
        return categoria._id;
    }

    /**
     * Busca una marca existente por nombre y empresa. Si no existe, la crea.
     * @param {string} nombre - El nombre de la marca.
     * @param {string} empresaId - El ID de la empresa.
     * @returns {Promise<string>} El ID de la marca (existente o recién creada).
     */
    async findOrCreateMarcaId(nombre, empresaId) {
        if (!nombre || typeof nombre !== 'string') return null;
        
        let marca = await Marca.findOne({ nombre: nombre.trim(), empresa: empresaId });
        if (!marca) {
            marca = new Marca({ nombre: nombre.trim(), empresa: empresaId });
            await marca.save();
        }
        return marca._id;
    }

    /**
     * Inserta múltiples productos en la base de datos.
     * Maneja errores de inserción masiva y duplicados.
     * @param {Array<object>} productsToInsert - Array de objetos de datos de producto.
     * @returns {object} Objeto con el conteo de inserciones exitosas y errores de DB.
     */
    async insertManyProducts(productsToInsert) {
        let successfulInsertsCount = 0;
        let dbInsertErrors = [];

        try {
            const result = await Product.insertMany(productsToInsert, { ordered: false });
            successfulInsertsCount = result.length;
        } catch (dbError) {
            console.error("[Repo DB] Error durante la inserción masiva en DB:", dbError);
            if (dbError.code === 11000 && dbError.writeErrors) {
                dbInsertErrors = dbError.writeErrors.map(err => ({
                    index: err.index,
                    code: err.code,
                    message: err.errmsg || err.message,
                    op: err.op,
                }));
                successfulInsertsCount = dbError.result && dbError.result.nInserted ? dbError.result.nInserted : 0;
                console.warn(`[Repo DB] Se insertaron ${successfulInsertsCount} productos exitosamente. ${dbInsertErrors.length} fallaron debido a errores de DB (ej. duplicados).`);
            } else {
                throw dbError;
            }
        }
        return { successfulInsertsCount, dbInsertErrors };
    }
}

export default new ProductoRepository();
