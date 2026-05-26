import { add_product_services, update_product_services, delete_product_services, 
    get_product_by_id_services, get_all_products_services, 
    get_all_products_company_services, get_product_codBarra_services,
    delete_product_all_services, get_all_category_company_services,
    get_all_marca_company_services, get_product_agotados_services, get_product_stock_bajo_services, get_products_vencidos_services, get_products_por_vencer_services, get_total_inventario_services, get_movimientos_producto_services, ingresar_mercaderia_services, deleted_marca_company_services, deleted_categoria_company_services,
    create_or_update_categoria_services, create_or_update_marca_services, search, export_products_data } from '../../services/product_services.js'; // Asegúrate de importar todas las funciones de servicio necesarias
import * as XLSX from 'xlsx';



export async function add_product(req, res) {
    try {
        const productData = req.body; 
        const newProduct = await add_product_services(productData);
        if(newProduct){
          return res.status(201).json(newProduct);  
        }
        return res.status(400).json({ error: "No se pudo agregar el producto. Verifica los datos proporcionados." }); // 400 Bad Request
        
    } catch (error) {
        console.error("Error en add_product (controlador):", error.message);
        if (error.message.includes("ya existe") || error.message.includes("duplicate key")) {
            return res.status(409).json({ error: "El producto con este nombre o ID ya existe." }); // 409 Conflict
        } else if (error.message.includes("datos inválidos") || error.message.includes("validación")) {
            return res.status(400).json({ error: "Datos de producto inválidos. Por favor, verifica la información." }); // 400 Bad Request
        }
        return res.status(500).json({ error: "No se pudo agregar el producto debido a un error interno del servidor." });
    }
}



export async function update_product(req, res) {
    try {
        const productId = req.params.id;
        const updateData = req.body; 

        const updatedProduct = await update_product_services(productId, updateData);
        if (!updatedProduct) {
            return res.status(404).json({ error: "Producto no encontrado para actualizar." });
        }
        return res.status(200).json(updatedProduct);
    } catch (error) {
        console.error("Error en update_product (controlador):", error.message);

        if (error.message.includes("ID no proporcionado")) {
            return res.status(400).json({ error: "ID del producto es requerido para la actualización." }); 
        } else if (error.message.includes("no encontrado para actualizar") || error.message.includes("no existe")) {
            return res.status(404).json({ error: "El producto especificado no fue encontrado." }); 
        } else if (error.message.includes("datos inválidos") || error.message.includes("validación")) {
            return res.status(400).json({ error: "Datos de actualización inválidos. Por favor, verifica la información." });
        }
        return res.status(500).json({ error: "No se pudo actualizar el producto debido a un error interno del servidor." });
    }
}


export async function delete_product(req, res) {
    try {
        const productId = req.params.productId;
        const deletedProduct = await delete_product_services(productId);
        if (!deletedProduct) {
            return res.status(404).json({ error: "Producto no encontrado para eliminar." }); // 404 Not Found
        }
        return res.status(200).json({ message: "Producto eliminado correctamente.", product: deletedProduct });
    } catch (error) {
        console.error("Error en delete_product (controlador):", error.message);
        if (error.message.includes("ID no proporcionado")) {
            return res.status(400).json({ error: "ID del producto es requerido para la eliminación." }); // 400 Bad Request
        } else if (error.message.includes("no encontrado para eliminar") || error.message.includes("no existe")) {
            return res.status(404).json({ error: "El producto especificado no fue encontrado." }); // 404 Not Found
        }
        return res.status(500).json({ error: "No se pudo eliminar el producto debido a un error interno del servidor." });
    }
}

export async function delete_product_all(req, res) {
    try {
        const { idEmpresa } = req.params;
        if (!idEmpresa) {
            return res.status(400).json({ error: "El ID de la empresa es requerido." });
        }

        // Llama al servicio para ejecutar la lógica
        const resultado = await delete_product_all_services(idEmpresa);

        // Envía una respuesta exitosa, informando cuántos productos se eliminaron.
        // Incluso si se eliminaron 0, la operación fue exitosa.
        return res.status(200).json({
            message: `Operación completada. Se eliminaron ${resultado.deletedCount} productos.`,
            deletedCount: resultado.deletedCount
        });

    } catch (error) {
        console.error("Error en el controlador delete_product_all:", error.message);
        // Error genérico para cualquier problema en la base de datos.
        return res.status(500).json({ error: "No se pudieron eliminar los productos debido a un error interno." });
    }
}

export async function get_product_by_id(req, res) {
    try {
        const productId = req.params.id;
        const product = await get_product_by_id_services(productId);

        if (!product) {
            return res.status(404).json({ error: "Producto no encontrado." });
        }
        return res.status(200).json(product);
    } catch (error) {
        console.error("Error en get_product_by_id (controlador):", error.message);
        if (error.message.includes("ID no proporcionado") || error.message.includes("ID inválido")) {
            return res.status(400).json({ error: "ID de producto inválido o no proporcionado." });
        }
        return res.status(500).json({ error: "Error interno del servidor al obtener el producto." });
    }
}


export async function get_all_products(req, res) {
    try {
        const { page, limit, category } = req.query; 

        const products = await get_all_products_services({ page, limit, category });

        if (!products || products.length === 0) {
            return res.status(204).json({ message: "No hay productos disponibles." });
        }

        return res.status(200).json(products);
    } catch (error) {
        console.error("Error en get_all_products (controlador):", error.message);
        return res.status(500).json({ error: "Error interno del servidor al obtener la lista de productos." });
    }
}


export async function get_all_products_company_controllers(req, res) {
    try {
        const { page, limit, category, product, marca, puntoVenta } = req.query;
        // Cambiamos 'id' a 'company_id' para mayor claridad, asumiendo que tu ruta es algo como /products/company/:company_id
        const { id } = req.params; 
        const products = await get_all_products_company_services( 
            id, // Pasamos el ID de la empresa al servicio
            page, 
            limit, 
            category,
            product, 
            marca,
            puntoVenta
        );

        if (!products || products.length === 0) {
            return res.status(204).json({ message: "No hay productos disponibles para esta empresa." });
        }

        return res.status(200).json(products);
    } catch (error) {
        console.error("Error en get_all_products_company (controlador):", error.message);
        // Puedes ser más específico en el error si 'error' tiene un código/mensaje de error más detallado
        return res.status(500).json({ error: "Error interno del servidor al obtener los productos de la empresa." });
    }
}


export async function get_all_category_company_controllers(req, res) {
    try {
        const { idEmpresa } = req.params;
        const { page, limit, sortBy, order, search } = req.query;

        const options = { page, limit, sortBy, order, search };
        const categories = await get_all_category_company_services(idEmpresa, options);

        if (!categories || categories.categories.length === 0) {
            return res.status(204).json({ message: "No hay categorías disponibles para esta empresa." });
        }

        return res.status(200).json(categories);
    } catch (error) {
        console.error("Error en get_all_category_company_controllers (controlador):", error.message);
        return res.status(500).json({ error: "Error interno del servidor al obtener las categorías de la empresa." });
    }
}



export async function get_all_marca_company_controllers(req, res) {
    try {
        const { idEmpresa } = req.params;
        const { page, limit, sortBy, order, search } = req.query;

        const options = { page, limit, sortBy, order, search };
        const marcas = await get_all_marca_company_services(idEmpresa, options);

        if (!marcas || marcas.marcas.length === 0) {
            return res.status(204).json({ message: "No hay marcas disponibles para esta empresa." });
        }

        return res.status(200).json(marcas);
    } catch (error) {
        console.error("Error en get_all_marca_company_controllers (controlador):", error.message);
        return res.status(500).json({ error: "Error interno del servidor al obtener las marcas de la empresa." });
    }
}


export async function delete_marca_controllers(req, res) {
    try {
        const { marca, idEmpresa } = req.params;

        const respuesta = await deleted_marca_company_services(marca, idEmpresa);
        
        res.status(200).json(respuesta);

    } catch (err) {
        console.error("Error en delete_marca_controllers (controlador):", err.message);
        return res.status(500).json({ error: "Error interno del servidor al eliminar la marca." });
    }
}

export async function delete_categoria_controllers(req, res) {
    try {
        const { categoria, idEmpresa } = req.params;

        const respuesta = await deleted_categoria_company_services(categoria, idEmpresa);
        
        res.status(200).json(respuesta);

    } catch (err) {
        console.error("Error en delete_categoria_controllers (controlador):", err.message);
        // ✅ CORRECCIÓN: El mensaje de error ahora es específico de "categoría"
        return res.status(500).json({ error: "Error interno del servidor al eliminar la categoría." });
    }
}


export async function get_product_codBarra(req, res){
    try{
        const {idEmpresa, puntoVenta, codBarra} = req.params;
        const encontrado = await get_product_codBarra_services(idEmpresa, puntoVenta, codBarra);
        res.send(encontrado)
    }catch(err){

    }
}

export async function get_product_agotados(req, res){
    try{
        const {idEmpresa, idPuntoVenta} = req.params;

        const respuesta = await get_product_agotados_services(idEmpresa, idPuntoVenta, req.query)
        res.send(respuesta)
    }catch(err){
        console.error("Error en get_product_agotados (controlador):", err.message);
        return res.status(500).json({ error: "Error interno del servidor al obtener productos agotados." });
    }
}

export async function get_product_stock_bajo(req, res){
    try{
        const {idEmpresa, idPuntoVenta} = req.params;
        const respuesta = await get_product_stock_bajo_services(idEmpresa, idPuntoVenta, req.query)
        res.send(respuesta)
    }catch(err){
        console.error("Error en get_product_stock_bajo (controlador):", err.message);
        return res.status(500).json({ error: "Error interno del servidor al obtener productos con stock bajo." });
    }
}

export async function get_products_vencidos(req, res) {
    try {
        const { idEmpresa, idPuntoVenta } = req.params;
        const respuesta = await get_products_vencidos_services(idEmpresa, idPuntoVenta);
        res.send(respuesta);
    } catch (err) {
        console.error("Error en get_products_vencidos (controlador):", err.message);
        return res.status(500).json({ error: "Error interno del servidor al obtener productos vencidos." });
    }
}

export async function get_products_por_vencer(req, res) {
    try {
        const { idEmpresa, idPuntoVenta } = req.params;
        const days = Number(req.query.days) || 30;
        const respuesta = await get_products_por_vencer_services(idEmpresa, idPuntoVenta, days, req.query.page, req.query.limit);
        res.send(respuesta);
    } catch (err) {
        console.error("Error en get_products_por_vencer (controlador):", err.message);
        return res.status(500).json({ error: "Error interno del servidor al obtener productos próximos a vencer." });
    }
}

export async function get_totalInventario(req, res){
    try{
        const {idEmpresa, idPuntoVenta} = req.params;

        const respuesta = await get_total_inventario_services(idEmpresa, idPuntoVenta)
        res.send(respuesta)
    }catch(err){
        console.error("Error en get_product_agotados (controlador):", err.message);
        return res.status(500).json({ error: "Error interno del servidor al obtener productos agotados." });
    }
}

// Export CSV/XLSX

export async function exportCsv(req, res) {
    try {
        const options = { empresaId: req.query.empresa, puntoVentaId: req.query.puntoVenta };
        const data = await export_products_data(options);
        const headers = Object.keys(data[0] || {});
        const csv = [headers.join(',')].concat(data.map(r => headers.map(h => `"${String(r[h] ?? '')}"`).join(','))).join('\n');
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', 'attachment; filename="products.csv"');
        res.send(csv);
    } catch (err) {
        console.error('exportCsv =>', err);
        res.status(500).json({ error: 'Error exporting CSV' });
    }
}

export async function exportXlsx(req, res) {
    try {
        const options = { empresaId: req.query.empresa, puntoVentaId: req.query.puntoVenta };
        const data = await export_products_data(options);
        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Productos');
        const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename="products.xlsx"');
        res.send(buf);
    } catch (err) {
        console.error('exportXlsx =>', err);
        res.status(500).json({ error: 'Error exporting XLSX' });
    }
}


export const create_or_update_marca_controllers = async (req, res) => {
    try {
        const { nombreNuevo, idEmpresa, nombreAntiguo } = req.body;
        if (!nombreNuevo || !idEmpresa) {
            return res.status(400).json({ error: "El nombre de la marca y el ID de la empresa son obligatorios." });
        }

        const marca = await create_or_update_marca_services(nombreNuevo, idEmpresa, nombreAntiguo, descripcion);
        
        const message = nombreAntiguo
            ? `Marca '${nombreAntiguo}' actualizada a '${nombreNuevo}' exitosamente.`
            : `Marca '${nombreNuevo}' creada exitosamente.`;

        res.status(200).json({
            message,
            marca,
        });
    } catch (error) {
        console.error("Error en create_or_update_marca_controllers:", error.message);
        res.status(500).json({ error: "Error interno del servidor al procesar la marca." });
    }
};

export const create_or_update_categoria_controllers = async (req, res) => {
    try {
        const { nombreNuevo, idEmpresa, nombreAntiguo, descripcion } = req.body;

        if (!nombreNuevo || !idEmpresa) {
            return res.status(400).json({ error: "El nombre de la categoría y el ID de la empresa son obligatorios." });
        }

        const categoria = await create_or_update_categoria_services(nombreNuevo, idEmpresa, nombreAntiguo, descripcion);

        const message = nombreAntiguo
            ? `Categoría '${nombreAntiguo}' actualizada a '${nombreNuevo}' exitosamente.`
            : `Categoría '${nombreNuevo}' creada exitosamente.`;

        res.status(200).json({
            message,
            categoria,
        });
    } catch (error) {
        console.error("Error en create_or_update_categoria_controllers:", error.message);
        res.status(500).json({ error: "Error interno del servidor al procesar la categoría." });
    }
};


//buscador completo
export async function searchProductos(req, res) {
    try {
      const { q, empresa, puntoVenta, page = 1, limit = 10 } = req.query;
      // Validar que empresa existe
      if (!empresa) {
        return res.status(400).json({ error: 'El parámetro empresa es obligatorio' });
      }
  
      const result = await search({
        searchTerm: q,
        empresaId: empresa,
        puntoVentaId: puntoVenta,
        page: parseInt(page),
        limit: parseInt(limit)
      });
  
      res.json(result);
    } catch (error) {
      console.error('Error en búsqueda de productos:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
}

export async function get_movimientos_producto(req, res) {
     try {
         const { idProducto } = req.params;
         const result = await get_movimientos_producto_services(idProducto, req.query);
         res.json(result);
     } catch (error) {
         console.error('Error al obtener movimientos del producto:', error);
         res.status(500).json({ error: 'Error interno del servidor al obtener movimientos.' });
     }
 }

 export async function ingresar_mercaderia(req, res) {
    try {
        const result = await ingresar_mercaderia_services(req.body);
        res.json({ success: true, message: "Mercadería ingresada y stock actualizado.", data: result });
    } catch (error) {
        console.error('Error al ingresar mercadería:', error);
        res.status(500).json({ success: false, error: 'Error interno al procesar el ingreso.' });
    }
 }
