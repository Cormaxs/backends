// models/Product.js
import mongoose from 'mongoose';

const ProductSchema = new mongoose.Schema({
    // Referencia a la empresa propietaria del producto
    empresa: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Empresa',
        required: [true, 'Cada producto debe pertenecer a una empresa.']
    },
    puntoVenta: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'PuntoDeVenta',
        required: [false, 'Cada producto debe pertenecer a un punto de venta.']
    },
    // Información básica del producto
    codigoInterno: {
        type: String,
        trim: true,
        // Eliminamos el required para evitar que se guarde como null/vacío si no viene
        required: false,
        default: undefined
    },
    codigoBarra: {
        type: Number,
        // ELIMINADO: 'trim: true' no aplica a campos de tipo Number.
        // ELIMINADO: 'unique: false' aquí no tiene efecto, la unicidad es para índices.
        required: [false, 'El código de barra del producto es obligatorio.']
    },
    producto: {
        type: String,
        required: [true, 'El nombre del producto/servicio es obligatorio.'],
        trim: true,
        minlength: [3, 'El nombre del producto debe tener al menos 3 caracteres.']
    },
    descripcion: {
        type: String,
        trim: true,
        maxlength: [500, 'La descripción no puede exceder los 500 caracteres.'],
        required: [false, 'La descripción del producto es opcional.']
    },
     // DESPUÉS (Forma Correcta ✅):
     marca: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Marca', // Referencia al modelo 'Marca'
        required: false // O true, según tu lógica de negocio
    },
    proveedor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Proveedor',
        required: false
    },
    categoria: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Categoria', // Referencia al modelo 'Categoria'
        required: false 
    },
    unidadMedida: {
        type: String,
        trim: true,
        default: '94',
        required: [false, 'La unidad de medida es opcional.']
    },
    // Medidas y peso
    ancho_cm: { type: Number, min: [0, 'El ancho no puede ser negativo.'], default: 0 },
    alto_cm: { type: Number, min: [0, 'El alto no puede ser negativo.'], default: 0 },
    profundidad_cm: { type: Number, min: [0, 'La profundidad no puede ser negativa.'], default: 0 },
    peso_kg: { type: Number, min: [0, 'El peso no puede ser negativo.'], default: 0 },

    // Precios
    precioCosto: {
        type: Number,
        required: [true, 'El precio de costo es obligatorio.'],
        min: [0, 'El precio de costo no puede ser negativo.']
    },
    precioLista: {
        type: Number,
        min: [0, 'El precio de lista no puede ser negativo.'],
        // Puedes añadir un default aquí si siempre quieres un valor predeterminado, ej: default: 0
        default: 0, // Añadido un valor por defecto para precioLista
        required: [true, 'El precio de lista es obligatorio.']
    },
    alic_IVA: {
        type: Number,
        required: [true, 'La alícuota de IVA es obligatoria.'],
        min: [0, 'La alícuota de IVA no puede ser negativa.'],
        max: [100, 'La alícuota de IVA no puede exceder el 100%.'],
        default: 21
    },
    markupPorcentaje: {
        type: Number,
        min: [0, 'El markup no puede ser negativo.'],
        default: 0,
        required: [false, 'El porcentaje de markup es opcional.']
    },

    // Stock
    stock_disponible: {
        type: Number,
        required: [true, 'El stock disponible es obligatorio.'],
        min: [0, 'El stock no puede ser negativo.'],
        default: 0
    },
    stockMinimo: {
        type: Number,
        min: [0, 'El stock mínimo no puede ser negativo.'],
        default: 0,
        required: [false, 'El stock mínimo es opcional.']
    },
    ubicacionAlmacen: {
        type: String,
        trim: true,
        default: '' // Añadido un valor por defecto para ubicacionAlmacen
    },
    fechaVencimiento: {
        type: Date,
        required: [false, 'La fecha de vencimiento es opcional.'],
        validate: {
            validator: function(value) {
                // Si no hay fecha, es válido. Si hay, debe ser mayor o igual a hoy.
                if (!value) return true;
                return value >= new Date().setHours(0,0,0,0);
            },
            message: 'La fecha de vencimiento no puede ser anterior a la fecha actual.'
        }
    },
    activo: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });

// Pre-save hook para limpiar campos vacíos que pueden entrar en conflicto con índices únicos
ProductSchema.pre('save', function(next) {
    if (this.codigoInterno === "" || this.codigoInterno === null) {
        this.codigoInterno = undefined;
    }
    if (this.codigoBarra === 0 || this.codigoBarra === null) {
        this.codigoBarra = undefined;
    }
    next();
});

// Índice compuesto para asegurar que el código interno sea único por empresa,
// pero permitiendo múltiples productos con codigoInterno: null usando un filtro parcial.
ProductSchema.index(
    { codigoInterno: 1, empresa: 1 },
    { 
        unique: true, 
        name: "idx_codigoInterno_empresa_unique",
        partialFilterExpression: { codigoInterno: { $type: "string" } } 
    }
);
/*usar en db shell mongo compass para poder buscar todo en 1
db.products.createIndex({
    producto: "text",
    descripcion: "text",
    codigoInterno: "text",
    codigoBarra: "text",
    marca: "text",
    categoria: "text"
  })*/
const Product = mongoose.model('Product', ProductSchema);
export default Product;
