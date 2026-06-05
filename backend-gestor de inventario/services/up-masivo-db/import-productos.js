import * as XLSX from 'xlsx';
import mongoose from 'mongoose';
import productoRepository from '../../repositories/repo_up_masiva_db.js';

/**
 * Normaliza y valida un número de forma segura.
 */
const parseSafeNumber = (value, defaultValue = 0) => {
    if (value === undefined || value === null || value === '') return defaultValue;
    const num = Number(value);
    return isNaN(num) ? defaultValue : (num < 0 ? 0 : num);
};

/**
 * Busca un valor en una fila probando múltiples nombres de columna posibles (alias).
 */
const findValueByAlias = (row, aliases) => {
    for (const alias of aliases) {
        // Normalizamos el nombre de la columna para facilitar la búsqueda
        const foundKey = Object.keys(row).find(key => 
            key.toLowerCase().trim() === alias.toLowerCase().trim()
        );
        if (foundKey !== undefined && row[foundKey] !== undefined) {
            return row[foundKey];
        }
    }
    return undefined;
};

/**
 * Procesa una fila del Excel y la convierte a formato de base de datos.
 */
const processRowToProduct = (row, empresaId, puntoVentaId, rowNumber) => {
    const errors = [];
    
    // 1. Obtención de datos con Alias (Soporta múltiples nombres de columna)
    const nombre = String(findValueByAlias(row, ['Producto', 'Nombre', 'Articulo', 'Item']) || '').trim();
    const precioCosto = findValueByAlias(row, ['Precio Costo', 'Costo', 'PrecioCompra', 'precio_costo']);
    const precioLista = findValueByAlias(row, ['Precio Venta', 'Precio Lista', 'Precio', 'precio_lista']);
    const stock = findValueByAlias(row, ['Stock', 'Cantidad', 'Disponible', 'stock_disponible']);
    const iva = findValueByAlias(row, ['IVA', 'Alicuota IVA', 'Alic_IVA']) || 21;
    
    const categoria = String(findValueByAlias(row, ['Categoria', 'Rubro', 'Seccion']) || '').trim();
    const marca = String(findValueByAlias(row, ['Marca', 'Fabricante']) || '').trim();
    const codigoBarra = findValueByAlias(row, ['Codigo Barra', 'EAN', 'SKU', 'codigo_barra']);
    const codigoInterno = String(findValueByAlias(row, ['Codigo Interno', 'ID', 'Ref', 'codigo_interno']) || '').trim();
    const descripcion = String(findValueByAlias(row, ['Descripcion', 'Detalle']) || '').trim();

    // 2. Validaciones Obligatorias (Según el Modelo Product)
    if (!nombre || nombre.length < 3) {
        errors.push(`El nombre del producto es obligatorio (mín. 3 caracteres).`);
    }
    if (precioCosto === undefined || isNaN(Number(precioCosto))) {
        errors.push(`El Precio Costo es obligatorio y debe ser un número.`);
    }
    if (stock === undefined || isNaN(Number(stock))) {
        errors.push(`El Stock es obligatorio y debe ser un número.`);
    }

    if (errors.length > 0) {
        return { 
            product: null, 
            error: `Fila ${rowNumber}: ${errors.join(' ')}` 
        };
    }

    // 3. Construcción del objeto final
    const productData = {
        empresa: new mongoose.Types.ObjectId(empresaId),
        puntoVenta: puntoVentaId ? new mongoose.Types.ObjectId(puntoVentaId) : undefined,
        producto: nombre,
        precioCosto: parseSafeNumber(precioCosto),
        precioLista: parseSafeNumber(precioLista) || parseSafeNumber(precioCosto), // Si no hay lista, usamos costo
        stock_disponible: parseSafeNumber(stock),
        alic_IVA: parseSafeNumber(iva, 21),
        categoria: categoria || undefined, // Guardamos temporalmente el nombre para el cache
        marca: marca || undefined,
        codigoBarra: codigoBarra ? Number(codigoBarra) : undefined,
        codigoInterno: codigoInterno || undefined,
        descripcion: descripcion || undefined,
        activo: true
    };

    return { product: productData, error: null };
};

/**
 * Servicio principal de importación masiva.
 */
export async function importarProductos(fileBuffer, originalFileName, fileMimetype, empresaId, puntoVentaId) {
    let jsonData;

    // 1. Lectura del archivo
    try {
        const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: "" });
    } catch (parseError) {
        throw new Error(`Error al leer el archivo Excel/CSV: ${parseError.message}`);
    }

    if (!jsonData || jsonData.length === 0) {
        throw new Error('El archivo está vacío.');
    }

    const productsToInsert = [];
    const validationErrors = [];
    const cache = { categorias: {}, marcas: {} };

    // 2. Procesamiento de filas
    for (let i = 0; i < jsonData.length; i++) {
        const rowNumber = i + 2;
        const { product, error } = processRowToProduct(jsonData[i], empresaId, puntoVentaId, rowNumber);

        if (error) {
            validationErrors.push(error);
            continue;
        }

        // Resolver IDs de Categoría y Marca con Cache para eficiencia
        if (product.categoria) {
            if (!cache.categorias[product.categoria]) {
                cache.categorias[product.categoria] = await productoRepository.findOrCreateCategoriaId(product.categoria, empresaId);
            }
            product.categoria = cache.categorias[product.categoria];
        }

        if (product.marca) {
            if (!cache.marcas[product.marca]) {
                cache.marcas[product.marca] = await productoRepository.findOrCreateMarcaId(product.marca, empresaId);
            }
            product.marca = cache.marcas[product.marca];
        }

        productsToInsert.push(product);
    }

    if (productsToInsert.length === 0) {
        return {
            success: false,
            message: 'No se encontraron productos válidos para importar.',
            validationErrors
        };
    }

    // 3. Inserción Masiva
    const { successfulInsertsCount, dbInsertErrors } = await productoRepository.insertManyProducts(productsToInsert);

    return {
        success: true,
        message: `Importación finalizada.`,
        totalEnArchivo: jsonData.length,
        procesados: productsToInsert.length,
        exitosos: successfulInsertsCount,
        erroresValidacion: validationErrors,
        erroresDB: dbInsertErrors
    };
}
