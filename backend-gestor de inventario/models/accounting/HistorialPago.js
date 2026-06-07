import mongoose from 'mongoose';

const historialPagoSchema = new mongoose.Schema({
    empresa: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Empresa',
        required: true
    },
    plan: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Plan',
        required: true
    },
    monto: {
        type: Number,
        required: true
    },
    moneda: {
        type: String,
        default: 'ARS'
    },
    fechaPago: {
        type: Date,
        default: Date.now
    },
    periodoInicio: {
        type: Date,
        required: true
    },
    periodoFin: {
        type: Date,
        required: true
    },
    metodoPago: {
        type: String,
        // Eliminamos el enum rígido para permitir mayor flexibilidad con MP
        default: 'otro'
    },
    referenciaPago: {
        type: String // ID de transacción de MP, etc.
    },
    detallesMP: {
        type: Object // Guardar status, payment_type, etc.
    },
    estado: {
        type: String,
        enum: ['completado', 'pendiente', 'fallido', 'reembolsado'],
        default: 'completado'
    },
    comprobanteUrl: {
        type: String
    }
}, {
    timestamps: true
});

const HistorialPago = mongoose.model('HistorialPago', historialPagoSchema);
export default HistorialPago;
