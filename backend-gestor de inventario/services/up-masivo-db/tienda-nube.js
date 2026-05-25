// services/up-masivo-db/tienda-nube.js

import * as XLSX from 'xlsx';
import mongoose from 'mongoose';
import productoRepository from '../../repositories/repo_up_masiva_db.js';

// Funciones auxiliares (mantienen su lógica)
const safeNumber = (value, defaultValue = 0) => {
    const num = Number(value);
    if (isNaN(num)) return defaultValue;
    if (num < 0) return 0;
    return num;
};

const getColumnValue = (rowObj, columnNames) => {
    for (const name of columnNames) {
        if (rowObj[name] !== undefined) {
            return rowObj[name];
        }
    }
    return undefined;
};

const processProductData = (row, empresaId, puntoVentaId, rowNumber) => {
    const errors = [];
    
    // Obtenemos los valores brutos del archivo
    const productoNombre = String(getColumnValue(row, ['Nombre']) || '').trim(); 
    const categoriaNombre = String(getColumnValue(row, ['Categorias', 'categoria']) || '').trim();
    const marcaNombre = String(getColumnValue(row, ['Marca']) || '').trim();
    const precioCosto = safeNumber(getColumnValue(row, ['precio', 'Precio']));
    const alic_IVA = safeNumber(getColumnValue(row, ['aliciva', 'AlicIVA', 'IVA']), 21);
    const stock_disponible = safeNumber(getColumnValue(row, ['stock', 'Stock']));

    // Validaciones críticas
    if (!productoNombre || productoNombre.length < 3) errors.push(`'producto' (Nombre) es obligatorio y debe tener al menos 3 caracteres.`);
    if (!categoriaNombre || categoriaNombre.length < 2) errors.push(`'categoria' (Categorias) es obligatoria y debe tener al menos 2 caracteres.`);
    if (isNaN(precioCosto) || precioCosto < 0) errors.push(`'precioCosto' (Precio) es obligatorio y debe ser un número no negativo.`);
    if (isNaN(alic_IVA) || alic_IVA < 0 || alic_IVA > 100) errors.push(`'alic_IVA' es obligatoria y debe ser un número entre 0 y 100.`);
    if (isNaN(stock_disponible)) errors.push(`'stock_disponible' (Stock) es obligatorio y debe ser un número.`);

    if (errors.length > 0) {
        return { product: null, errors: `Fila ${rowNumber}: ${errors.join('; ')}. Datos originales: ${JSON.stringify(row)}` };
    }

    const newProductData = {
        empresa: new mongoose.Types.ObjectId(empresaId),
        puntoVenta: puntoVentaId ? new mongoose.Types.ObjectId(puntoVentaId) : undefined,
        codigoInterno: String(getColumnValue(row, ['codigointerno', 'Identificador de URL']) || '0').trim(),
        codigoBarra: safeNumber(getColumnValue(row, ['SKU'])),
        producto: productoNombre,
        descripcion: String(getColumnValue(row, ['Descripcion']) || '').trim(),
        marca: marcaNombre,
        categoria: categoriaNombre,
        unidadMedida: String(getColumnValue(row, ['unidadmedida', 'UnidadMedida']) || '94').trim(),
        ancho_cm: safeNumber(getColumnValue(row, ['ancho', 'Ancho'])),
        alto_cm: safeNumber(getColumnValue(row, ['alto', 'Alto'])),
        profundidad_cm: safeNumber(getColumnValue(row, ['profundidad', 'Profundidad'])),
        peso_kg: safeNumber(getColumnValue(row, ['pesokg', 'Peso'])),
        precioCosto: precioCosto,
        precioLista: safeNumber(getColumnValue(row, ['preciolista', 'PrecioLista'])),
        alic_IVA: alic_IVA,
        markupPorcentaje: safeNumber(getColumnValue(row, ['markupporcentaje', 'MarkupPorcentaje']), 0),
        stock_disponible: stock_disponible,
        stockMinimo: safeNumber(getColumnValue(row, ['stockminimo', 'StockMinimo']), 0),
        ubicacionAlmacen: String(getColumnValue(row, ['ubicacionalmacen', 'UbicacionAlmacen']) || '').trim(),
        activo: (getColumnValue(row, ['activo', 'Mostrar en tienda']) !== undefined && String(getColumnValue(row, ['activo', 'Mostrar en tienda'])).toLowerCase() === 'no') ? false : true,
    };

    if (newProductData.precioLista === 0 || newProductData.precioLista === undefined) {
        newProductData.precioLista = newProductData.precioCosto;
    }

    return { product: newProductData, errors: null };
};

/**
 * Servicio para la migración de productos desde un archivo de Excel/CSV de Tienda Nube.
 */
export async function tiendaNube(fileBuffer, originalFileName, fileMimetype, empresaId, puntoVentaId) {

    let jsonData;

    try {
        if (fileMimetype.includes('spreadsheetml.sheet') || fileMimetype.includes('ms-excel') || fileMimetype.includes('csv')) {
            const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            jsonData = XLSX.utils.sheet_to_json(worksheet);
        } else {
            throw new Error('Tipo de archivo no permitido. Solo se aceptan archivos Excel (.xlsx, .xls) o CSV (.csv).');
        }
    } catch (parseError) {
        throw new Error(`Error al leer el archivo: ${parseError.message}`);
    }


    if (jsonData.length === 0) {
        throw new Error('El archivo está vacío o no contiene datos procesables. Por favor, asegúrate de que el archivo no esté vacío y los encabezados sean correctos.');
    }

    const productsToInsert = [];
    const validationErrors = [];
    const createdCategoriesCache = {};
    const createdBrandsCache = {};

    for (let i = 0; i < jsonData.length; i++) {
        const row = jsonData[i];
        const rowNumber = i + 2;

        const { product, errors } = processProductData(row, empresaId, puntoVentaId, rowNumber);

        if (product) {
            if (product.marca) {
                if (!createdBrandsCache[product.marca]) {
                    createdBrandsCache[product.marca] = await productoRepository.findOrCreateMarcaId(product.marca, empresaId);
                }
                product.marca = createdBrandsCache[product.marca];
            } else {
                product.marca = undefined;
            }

            if (product.categoria) {
                if (!createdCategoriesCache[product.categoria]) {
                    createdCategoriesCache[product.categoria] = await productoRepository.findOrCreateCategoriaId(product.categoria, empresaId);
                }
                product.categoria = createdCategoriesCache[product.categoria];
            } else {
                product.categoria = undefined;
            }
            
            productsToInsert.push(product);
        } else if (errors) {
            validationErrors.push(errors);
        }
    }


    if (productsToInsert.length === 0) {
        throw new Error('No se pudieron procesar productos válidos para insertar. Revisa los errores de validación.');
    }

    const { successfulInsertsCount, dbInsertErrors } = await productoRepository.insertManyProducts(productsToInsert);

    return {
        message: `Migración de productos finalizada.`,
        totalRecordsInFile: jsonData.length,
        recordsAttemptedToInsert: productsToInsert.length,
        recordsProcessedSuccessfully: successfulInsertsCount,
        validationErrors: validationErrors,
        dbInsertErrors: dbInsertErrors,
    };
}
