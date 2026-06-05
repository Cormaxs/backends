import mongoose from 'mongoose';

const planSchema = new mongoose.Schema({
    nombre: {
        type: String,
        required: true,
        unique: true
    },
    slug: {
        type: String,
        required: true,
        unique: true // 'free', 'basico', etc.
    },
    productosLimite: {
        type: Number,
        default: 0
    },
    usuariosLimite: {
        type: Number,
        default: 0
    },
    facturasMensualesLimite: {
        type: Number,
        default: 0 // Facturas AFIP
    },
    ticketsMensualesLimite: {
        type: Number,
        default: 0 // Tickets internos
    },
    notasPedidoMensualesLimite: {
        type: Number,
        default: 0 // Notas de pedido
    },
    puntosVentaLimite: {
        type: Number,
        default: 0
    },
    cajasLimite: {
        type: Number,
        default: 0
    },
    exportXlsx: {
        type: Boolean,
        default: false
    },
    soportePrioritario: {
        type: Boolean,
        default: false
    },
    precio: {
        type: Number,
        default: 0
    },
    periodo: {
        type: String,
        enum: ['mes', 'año', 'unico', null],
        default: null
    },
    descripcion: {
        type: String
    },
    features: [String], // Lista de características adicionales
    activo: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

const Plan = mongoose.model('Plan', planSchema);
export default Plan;
