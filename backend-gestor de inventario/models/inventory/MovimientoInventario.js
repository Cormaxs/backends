// src/models/MovimientoInventario.js
import mongoose from 'mongoose';

const movimientoInventarioSchema = new mongoose.Schema({
    empresa: { // La empresa a la que pertenece el inventario
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Empresa',
        required: [true, 'El movimiento de inventario debe estar asociado a una empresa.']
    },
    producto: { // Referencia al producto afectado
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: [true, 'El movimiento debe referenciar un producto.']
    },
    tipoMovimiento: { // Ej: 'entrada', 'salida', 'ajuste_positivo', 'ajuste_negativo', 'transferencia_entrada', 'transferencia_salida'
        type: String,
        required: [true, 'El tipo de movimiento es obligatorio.'],
        enum: ['entrada', 'salida', 'ajuste_positivo', 'ajuste_negativo', 'transferencia_entrada', 'transferencia_salida'],
        trim: true
    },
    cantidad: {
        type: Number,
        required: [true, 'La cantidad del movimiento es obligatoria.'],
        min: [0.01, 'La cantidad debe ser mayor a 0.']
    },
    fechaMovimiento: {
        type: Date,
        required: [true, 'La fecha del movimiento es obligatoria.'],
        default: Date.now
    },
    motivo: { // Descripción del motivo del movimiento (ej. "Inventario anual", "Producto dañado", "Recepción de mercadería")
        type: String,
        trim: true
    },
    referenciaDocumento: { // Ej: ID de una factura de compra, número de remito, etc.
        type: String,
        trim: true
    },
    usuarioResponsable: { // Usuario que realizó el movimiento
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // Podría ser un 'User' o un 'Vendedor' dependiendo de quién hace el ajuste
        required: [true, 'El usuario responsable es obligatorio.']
    },
    // Si manejas múltiples almacenes o depósitos
    almacenOrigen: {
        type: String,
        trim: true
    },
    almacenDestino: {
        type: String,
        trim: true
    },
    costoUnitarioMovimiento: { // Costo unitario del producto al momento del movimiento
        type: Number,
        min: [0, 'El costo unitario no puede ser negativo.']
    },
    valorTotalMovimiento: { // Cantidad * CostoUnitario
        type: Number,
        min: [0, 'El valor total del movimiento no puede ser negativo.']
    }
}, {
    timestamps: true
});

const MovimientoInventario = mongoose.model('MovimientoInventario', movimientoInventarioSchema);
export default MovimientoInventario;
