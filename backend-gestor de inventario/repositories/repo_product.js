import { Product, Marca, Categoria, MovimientoInventario } from '../models/index.js';
import mongoose from 'mongoose';

class ProductRepository {
    // Agrega un nuevo producto
    async addProduct(productData) {
        const newProduct = new Product(productData);
        return await newProduct.save();
    }

    async findOrCreateCategoriaId(nombre, empresaId) {
        let categoria = await Categoria.findOne({ nombre: nombre, empresa: empresaId });
        if (!categoria) {
            categoria = new Categoria({ nombre: nombre, empresa: empresaId });
            await categoria.save();
        }
        return categoria._id;
    }

    async findOrCreateMarcaId(nombre, empresaId) {
        let marca = await Marca.findOne({ nombre: nombre, empresa: empresaId });
        if (!marca) {
            marca = new Marca({ nombre: nombre, empresa: empresaId });
            await marca.save();
        }
        return marca._id;
    }

    //busca un producto por ID
    async findById(id) {
        return await Product.findById(id).populate('categoria').populate('marca');
    }

    //busca todos los productos de todas las empresas
    async findAll(options = {}) {
        let { page = 1, limit = 10, category, sortBy, order, empresaId, puntoVentaId } = options;
        const query = {};

        if (empresaId) {
            query.empresa = empresaId;
        }

        if (puntoVentaId) {
            query.puntoVenta = puntoVentaId;
        }

        if (category) {
            query.category = category;
        }

        const totalProducts = await Product.countDocuments(query);
        const currentPage = parseInt(page) || 1;
        limit = parseInt(limit);

        let productsQuery = Product.find(query).populate('categoria').populate('marca');

        if (sortBy) {
            const sortOrder = order === 'desc' ? -1 : 1;
            productsQuery = productsQuery.sort({ [sortBy]: sortOrder });
        }

        if (limit > 0) {
            productsQuery = productsQuery.skip((currentPage - 1) * limit).limit(limit);
        }

        const products = await productsQuery.exec();

        const pagination = {
            totalProducts,
            currentPage,
            limit: limit > 0 ? limit : totalProducts,
            totalPages: limit > 0 ? Math.max(1, Math.ceil(totalProducts / limit)) : 1,
            hasNextPage: limit > 0 ? currentPage * limit < totalProducts : false,
            hasPrevPage: limit > 0 ? currentPage > 1 : false,
            nextPage: limit > 0 ? (currentPage * limit < totalProducts ? currentPage + 1 : null) : null,
            prevPage: limit > 0 ? (currentPage > 1 ? currentPage - 1 : null) : null,
        };

        return {
            products,
            pagination,
        };
    }
    
    // --- FUNCIÓN MODIFICADA PARA BUSCAR SIN ERRORES ---
    async get_products_company(company_id, page = 1, limit = 10, category, producto, marca, puntoVenta, sortBy, order) {
        page = parseInt(page);
        limit = parseInt(limit);

        if (isNaN(page) || page < 1) { page = 1; }
        if (isNaN(limit) || limit < 1) { limit = 10; }

        const query = { empresa: company_id };

        try {
            // 1. Convertir los nombres de marca y categoría a sus respectivos IDs
            let categoryId = null;
            if (category) {
                const foundCategory = await Categoria.findOne({ nombre: category, empresa: company_id });
                if (foundCategory) {
                    categoryId = foundCategory._id;
                    query.categoria = categoryId;
                }
            }

            let marcaId = null;
            if (marca) {
                const foundMarca = await Marca.findOne({ nombre: marca, empresa: company_id });
                if (foundMarca) {
                    marcaId = foundMarca._id;
                    query.marca = marcaId;
                }
            }

            if (puntoVenta) {
                query.puntoVenta = puntoVenta;
            }

            // 2. Manejar la búsqueda avanzada de texto
            if (producto) {
                const searchWords = producto.trim().split(/\s+/);
                
                // Construir un array de condiciones para el $and
                const andConditions = searchWords.map(word => {
                    const regex = new RegExp(word, 'i');
                    return {
                        $or: [
                            { producto: regex },
                            { descripcion: regex },
                            // Aquí usamos el ID para la búsqueda, si se encontró
                            ...(categoryId ? [{ categoria: categoryId }] : []),
                            ...(marcaId ? [{ marca: marcaId }] : []),
                        ]
                    };
                });
                
                // Combinar la query existente con las condiciones de búsqueda
                query.$and = andConditions;
            }

            const totalProducts = await Product.countDocuments(query);
            let productsQuery = Product.find(query)
                .populate('categoria', 'nombre')
                .populate('marca', 'nombre');

            if (sortBy) {
                const sortOrder = order === 'desc' ? -1 : 1;
                productsQuery = productsQuery.sort({ [sortBy]: sortOrder });
            }

            const products = await productsQuery
                .skip((page - 1) * limit)
                .limit(limit)
                .lean()
                .exec();

            const formattedProducts = products.map(p => ({
                ...p,
                marca: p.marca ? p.marca.nombre : null,
                categoria: p.categoria ? p.categoria.nombre : null,
            }));

            const totalPages = Math.ceil(totalProducts / limit);
            const hasNextPage = page < totalPages;
            const hasPrevPage = page > 1;
            const nextPage = hasNextPage ? page + 1 : null;
            const prevPage = hasPrevPage ? page - 1 : null;

            return {
                products: formattedProducts,
                pagination: {
                    totalProducts,
                    currentPage: page,
                    totalPages,
                    limit,
                    hasNextPage,
                    hasPrevPage,
                    nextPage,
                    prevPage,
                },
            };
        } catch (error) {
            console.error("Error al obtener productos de la empresa:", error);
            throw new Error("No se pudieron obtener los productos de la empresa en este momento.");
        }
    }
    // --- FIN DE LA FUNCIÓN MODIFICADA ---

    // Actualiza un producto específico por ID
    async updateProduct(id, updateData) {
        return await Product.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });
    }

    //actualiza stock de productos al venderlos
    async updateProductVentas(productsToUpdate) {
        try {
            const updatedProducts = [];
            for (const productInfo of productsToUpdate) {
                const { id, cantidadARestar } = productInfo;
                const product = await Product.findById(id);

                if (!product) {
                    throw new Error(`Producto con ID ${id} no encontrado. No se pudo procesar la venta.`);
                }

                const stockResultante = product.stock_disponible - cantidadARestar;
                if (stockResultante < -10) {
                    throw new Error(
                        `No hay suficiente stock para el producto "${product.descripcion}" (ID: ${id}). ` +
                        `Stock actual: ${product.stock_disponible}. Cantidad solicitada: ${cantidadARestar}.`
                    );
                }
                const updatedProduct = await Product.findByIdAndUpdate(
                    id,
                    { $inc: { stock_disponible: -cantidadARestar } },
                    { new: true, runValidators: true }
                );
                if (!updatedProduct) {
                    throw new Error(`Producto con ID ${id} no se pudo actualizar después de la validación inicial.`);
                }
                updatedProducts.push(updatedProduct);
            }
            return updatedProducts;
        } catch (error) {
            console.error('Error al actualizar el producto(s) y restar stock:', error);
            throw error;
        }
    }

    //elimina producto por ID
    async deleteProduct(id) {
        return await Product.findByIdAndDelete(id);
    }

    async deleteProductAll(idEmpresa) {
        const resultado = await Product.deleteMany({ empresa: idEmpresa });
        return resultado;
    }

    //busca por codigo de barras
    async findByBarcode(idEmpresa, puntoVenta, codBarra) {
        try {
            const query = {
                empresa: idEmpresa,
                puntoVenta: puntoVenta,
                codigoBarra: codBarra
            };
            const resivido = await Product.findOne(query);
            return resivido;
        } catch (err) {
            console.error(err)
        }
    }

    async get_category_empresa(idEmpresa, options = {}) {
        if (!idEmpresa) {
            throw new Error("El ID de la empresa es requerido.");
        }
        const { page = 1, limit = 10, sortBy = 'nombre', order = 'asc', search } = options;

        const query = { empresa: idEmpresa };
        if (search) {
            query.nombre = new RegExp(search, 'i');
        }

        try {
            const totalCategories = await Categoria.countDocuments(query);
            const categoriesQuery = Categoria.find(query)
                .sort({ [sortBy]: order === 'asc' ? 1 : -1 })
                .skip((page - 1) * limit)
                .limit(limit)
                .lean();

            const categories = await categoriesQuery.exec();

            const pagination = {
                totalItems: totalCategories,
                currentPage: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(totalCategories / limit),
                hasNextPage: (page * limit) < totalCategories,
                hasPrevPage: page > 1,
            };

            return { categories, pagination };
        } catch (error) {
            console.error("Error al obtener las categorías de la empresa:", error);
            throw new Error("No se pudieron obtener las categorías en este momento.");
        }
    }

    async get_marca_empresa(idEmpresa, options = {}) {
        if (!idEmpresa) {
            throw new Error("El ID de la empresa es requerido.");
        }
        const { page = 1, limit = 10, sortBy = 'nombre', order = 'asc', search } = options;

        const query = { empresa: idEmpresa };
        if (search) {
            query.nombre = new RegExp(search, 'i');
        }

        try {
            const totalMarcas = await Marca.countDocuments(query);
            const marcasQuery = Marca.find(query)
                .sort({ [sortBy]: order === 'asc' ? 1 : -1 })
                .skip((page - 1) * limit)
                .limit(limit)
                .lean();

            const marcas = await marcasQuery.exec();

            const pagination = {
                totalItems: totalMarcas,
                currentPage: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(totalMarcas / limit),
                hasNextPage: (page * limit) < totalMarcas,
                hasPrevPage: page > 1,
            };

            return { marcas, pagination };
        } catch (error) {
            console.error("Error al obtener las marcas de la empresa:", error);
            throw new Error("No se pudieron obtener las marcas en este momento.");
        }
    }

    async verificarMarcaExistente(nombreMarca, idEmpresa) {
        const existente = await Marca.findOne({ nombre: nombreMarca, empresa: idEmpresa });
        return existente
    }
    
    async verificarCategoriaExistente(nombreCategoria, idEmpresa) {
        const existente = await Categoria.findOne({ nombre: nombreCategoria, empresa: idEmpresa });
        return existente
    }

    async deleteMarca(idMarca, idEmpresa) {
        // La consulta del repositorio DEBE usar el ID (idMarca)
        const desvinculacionResult = await Product.updateMany(
            { empresa: idEmpresa, marca: idMarca },
            { $unset: { marca: "" } }
        );

        const eliminacionMarcaResult = await Marca.deleteOne({ _id: idMarca, empresa: idEmpresa });

        return {
            message: 'Operación finalizada.',
            productos_modificados: desvinculacionResult.modifiedCount,
            marcas_eliminadas: eliminacionMarcaResult.deletedCount,
        };
    }

    async deleteCategoria(idCategoria, idEmpresa) {
        // La consulta del repositorio DEBE usar el ID (idCategoria)
        const desvinculacionResult = await Product.updateMany(
            { empresa: idEmpresa, categoria: idCategoria },
            { $unset: { categoria: "" } }
        );

        // ✅ CORRECCIÓN: Se usa el modelo Categoria para la eliminación
        const eliminacionCategoriaResult = await Categoria.deleteOne({ _id: idCategoria, empresa: idEmpresa });

        // ✅ CORRECCIÓN: Se modifican las variables y mensajes de retorno
        return {
            message: 'Operación finalizada.',
            productos_modificados: desvinculacionResult.modifiedCount,
            categorias_eliminadas: eliminacionCategoriaResult.deletedCount,
        };
    }

    async getProductAgotados(idEmpresa, puntoDeVenta, page = 1, limit = 10) {
        try {
            if (!mongoose.Types.ObjectId.isValid(idEmpresa)) {
                throw new Error('ID de empresa inválido.');
            }
            const filtro = {
                empresa: new mongoose.Types.ObjectId(idEmpresa),
                stock_disponible: { $lte: 0 }
            };
            if (puntoDeVenta && mongoose.Types.ObjectId.isValid(puntoDeVenta)) {
                filtro.puntoVenta = new mongoose.Types.ObjectId(puntoDeVenta);
            }
            const [totalDocs, docs] = await Promise.all([
                Product.countDocuments(filtro),
                Product.find(filtro)
                    .sort({ stock_disponible: 1, producto: 1 })
                    .limit(Number(limit))
                    .skip((Number(page) - 1) * Number(limit))
                    .lean()
            ]);

            const totalPages = Math.ceil(totalDocs / limit);

            return {
                docs,
                totalDocs,
                limit: Number(limit),
                totalPages,
                page: Number(page),
                hasNextPage: Number(page) < totalPages,
                hasPrevPage: Number(page) > 1,
            };

        } catch (error) {
            console.error("Error en MetricasRepository.getProductAgotados:", error);
            throw error;
        }
    }

    async getProductsStockBajo(idEmpresa, puntoDeVenta, page = 1, limit = 10) {
        try {
            if (!mongoose.Types.ObjectId.isValid(idEmpresa)) {
                throw new Error('ID de empresa inválido.');
            }
            const filtro = {
                empresa: new mongoose.Types.ObjectId(idEmpresa),
                $expr: {
                    $and: [
                        { $gt: ["$stockMinimo", 0] },
                        { $lte: ["$stock_disponible", "$stockMinimo"] },
                        { $gt: ["$stock_disponible", 0] }
                    ]
                }
            };
            if (puntoDeVenta && mongoose.Types.ObjectId.isValid(puntoDeVenta)) {
                filtro.puntoVenta = new mongoose.Types.ObjectId(puntoDeVenta);
            }
            const [totalDocs, docs] = await Promise.all([
                Product.countDocuments(filtro),
                Product.find(filtro)
                    .sort({ stock_disponible: 1, producto: 1 })
                    .limit(Number(limit))
                    .skip((Number(page) - 1) * Number(limit))
                    .lean()
            ]);

            const totalPages = Math.ceil(totalDocs / limit);

            return {
                docs,
                totalDocs,
                limit: Number(limit),
                totalPages,
                page: Number(page),
                hasNextPage: Number(page) < totalPages,
                hasPrevPage: Number(page) > 1,
            };

        } catch (error) {
            console.error("Error en ProductRepository.getProductsStockBajo:", error);
            throw error;
        }
    }

    async getProductsVencidos(idEmpresa, puntoDeVenta, page = 1, limit = 20) {
        try {
            if (!mongoose.Types.ObjectId.isValid(idEmpresa)) {
                throw new Error('ID de empresa inválido.');
            }
            const hoy = new Date();
            const filtro = {
                empresa: new mongoose.Types.ObjectId(idEmpresa),
                fechaVencimiento: { $lte: hoy }
            };
            if (puntoDeVenta && mongoose.Types.ObjectId.isValid(puntoDeVenta)) {
                filtro.puntoVenta = new mongoose.Types.ObjectId(puntoDeVenta);
            }
            const [totalDocs, docs] = await Promise.all([
                Product.countDocuments(filtro),
                Product.find(filtro)
                    .sort({ fechaVencimiento: 1, producto: 1 })
                    .limit(Number(limit))
                    .skip((Number(page) - 1) * Number(limit))
                    .lean()
            ]);

            return {
                docs,
                totalDocs,
                limit: Number(limit),
                totalPages: Math.ceil(totalDocs / limit),
                page: Number(page),
                hasNextPage: Number(page) < Math.ceil(totalDocs / limit),
                hasPrevPage: Number(page) > 1,
            };
        } catch (error) {
            console.error('Error en ProductRepository.getProductsVencidos:', error);
            throw error;
        }
    }

    async getProductsPorVencer(idEmpresa, puntoDeVenta, dias = 30, page = 1, limit = 20) {
        try {
            if (!mongoose.Types.ObjectId.isValid(idEmpresa)) {
                throw new Error('ID de empresa inválido.');
            }
            const hoy = new Date();
            const rango = new Date();
            rango.setDate(hoy.getDate() + Number(dias));
            const filtro = {
                empresa: new mongoose.Types.ObjectId(idEmpresa),
                fechaVencimiento: { $gt: hoy, $lte: rango }
            };
            if (puntoDeVenta && mongoose.Types.ObjectId.isValid(puntoDeVenta)) {
                filtro.puntoVenta = new mongoose.Types.ObjectId(puntoDeVenta);
            }
            const [totalDocs, docs] = await Promise.all([
                Product.countDocuments(filtro),
                Product.find(filtro)
                    .sort({ fechaVencimiento: 1, producto: 1 })
                    .limit(Number(limit))
                    .skip((Number(page) - 1) * Number(limit))
                    .lean()
            ]);

            return {
                docs,
                totalDocs,
                limit: Number(limit),
                totalPages: Math.ceil(totalDocs / limit),
                page: Number(page),
                hasNextPage: Number(page) < Math.ceil(totalDocs / limit),
                hasPrevPage: Number(page) > 1,
            };
        } catch (error) {
            console.error('Error en ProductRepository.getProductsPorVencer:', error);
            throw error;
        }
    }

    async priceInventario(idEmpresa, puntoDeVenta) {
        try {
            if (!mongoose.Types.ObjectId.isValid(idEmpresa)) {
                throw new Error('ID de empresa inválido.');
            }
            const matchFilter = {
                empresa: new mongoose.Types.ObjectId(idEmpresa),
                stock_disponible: { $gt: 0 }
            };
            if (puntoDeVenta && mongoose.Types.ObjectId.isValid(puntoDeVenta)) {
                matchFilter.puntoVenta = new mongoose.Types.ObjectId(puntoDeVenta);
            }
            const resultadoAgregacion = await Product.aggregate([
                { $match: matchFilter },
                {
                    $group: {
                        _id: null,
                        valorTotal: { $sum: { $multiply: ["$stock_disponible", "$precioCosto"] } }
                    }
                }
            ]);

            const valorTotalInventario = resultadoAgregacion.length > 0 ? resultadoAgregacion[0].valorTotal : 0;
            return {
                valorTotalInventario: valorTotalInventario
            };

        } catch (error) {
            console.error("Error en MetricasRepository.priceInventario:", error);
            throw error;
        }
    }




    async createOrUpdateCategoria(nombreNuevo, idEmpresa, nombreAntiguo = null, descripcion = '') {
        if (!nombreNuevo || !idEmpresa) {
            throw new Error("El nombre de la categoría y el ID de la empresa son obligatorios.");
        }
        
        // La consulta usa el nombreAntiguo para encontrar el documento.
        // Si no se proporciona, busca por el nombreNuevo.
        const query = { empresa: idEmpresa, nombre: nombreAntiguo || nombreNuevo };
        const update = {
            nombre: nombreNuevo.trim(),
            descripcion: descripcion || ''
        };
        
        const categoria = await Categoria.findOneAndUpdate(
            query,
            update,
            { new: true, upsert: true, runValidators: true }
        );
        return categoria;
    }

   
    async createOrUpdateMarca(nombreNuevo, idEmpresa, nombreAntiguo = null, descripcion = '') {
        if (!nombreNuevo || !idEmpresa) {
            throw new Error("El nombre de la marca y el ID de la empresa son obligatorios.");
        }

        const query = { empresa: idEmpresa, nombre: nombreAntiguo || nombreNuevo };
        const update = {
            nombre: nombreNuevo.trim(),
            descripcion: descripcion || ''
        };

        const marca = await Marca.findOneAndUpdate(
            query,
            update,
            { new: true, upsert: true, runValidators: true }
        );
        return marca;
    }

    async getMovimientosProducto(idProducto, page = 1, limit = 20) {
        try {
            const query = { producto: new mongoose.Types.ObjectId(idProducto) };
            const [totalDocs, docs] = await Promise.all([
                MovimientoInventario.countDocuments(query),
                MovimientoInventario.find(query)
                    .populate('usuarioResponsable', 'nombre email')
                    .sort({ fechaMovimiento: -1 })
                    .limit(Number(limit))
                    .skip((Number(page) - 1) * Number(limit))
                    .lean()
            ]);

            return {
                docs,
                totalDocs,
                limit: Number(limit),
                totalPages: Math.ceil(totalDocs / limit),
                page: Number(page)
            };
        } catch (error) {
            console.error("Error en ProductRepository.getMovimientosProducto:", error);
            throw error;
        }
    }

    async registrarMovimiento(datos) {
        const movimiento = new MovimientoInventario(datos);
        return await movimiento.save();
    }



    //buscador completo
    async searchProducts({ searchTerm, empresaId, puntoVentaId, page = 1, limit = 10 }) {
        try {
          const filter = { empresa: new mongoose.Types.ObjectId(empresaId) };
      
          if (puntoVentaId && mongoose.Types.ObjectId.isValid(puntoVentaId)) {
            filter.puntoVenta = new mongoose.Types.ObjectId(puntoVentaId);
          }
      
          let query;
          let total;
      
          if (searchTerm && searchTerm.trim() !== '') {
            const term = searchTerm.trim();
      
            // Si el término es muy corto (menos de 3 caracteres), usamos regex para búsqueda parcial
            // Ajusta el umbral según necesites (puedes usar siempre regex si prefieres)
            if (term.length < 3) {
              const regex = new RegExp(term, 'i'); // 'i' para insensible a mayúsculas
              const regexFilter = {
                ...filter,
                $or: [
                  { producto: regex },
                  { descripcion: regex },
                  { codigoInterno: regex }
                  // No incluyas campos numéricos como codigoBarra a menos que sean string
                ]
              };
      
              query = Product.find(regexFilter).sort({ producto: 1 }); // orden alfabético
              total = await Product.countDocuments(regexFilter);
            } else {
              // Búsqueda de texto con índice $text (más eficiente para términos largos)
              query = Product.find(
                { $text: { $search: term }, ...filter },
                { score: { $meta: 'textScore' } }
              ).sort({ score: { $meta: 'textScore' } });
      
              total = await Product.countDocuments({
                $text: { $search: term },
                ...filter
              });
            }
          } else {
            // Sin término de búsqueda: devuelve todos ordenados por fecha
            query = Product.find(filter).sort({ createdAt: -1 });
            total = await Product.countDocuments(filter);
          }
      
          const productos = await query
            .skip((page - 1) * limit)
            .limit(limit)
            .lean();
      
          return {
            productos,
            pagination: {
              page,
              limit,
              total,
              pages: Math.ceil(total / limit)
            }
          };
        } catch (error) {
          console.error('Error en ProductRepository.searchProducts:', error);
          throw error;
        }
      }


}

export default new ProductRepository();
