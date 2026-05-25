import mongoose from 'mongoose';

const cuentaPorPagarSchema = new mongoose.Schema({
    proveedor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Proveedor',
        required: [true, 'El proveedor asociado es obligatorio.']
    },
    empresa: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Empresa',
        required: [true, 'La empresa asociada es obligatoria.']
    },
    descripcion: {
        type: String,
        trim: true,
        default: ''
    },
    montoTotal: {
        type: Number,
        required: [true, 'El monto total es obligatorio.'],
        min: [0, 'El monto total no puede ser negativo.']
    },
    montoPendiente: {
        type: Number,
        required: true,
        min: [0, 'El monto pendiente no puede ser negativo.']
    },
    estado: {
        type: String,
        enum: ['pendiente', 'parcial', 'pagado', 'vencido'],
        default: 'pendiente'
    },
    fechaEmision: {
        type: Date,
        default: () => new Date()
    },
    fechaVencimiento: {
        type: Date,
        required: [true, 'La fecha de vencimiento es obligatoria.']
    },
    documentoProveedor: {
        type: String,
        trim: true
    }
}, { timestamps: true });

const CuentaPorPagar = mongoose.model('CuentaPorPagar', cuentaPorPagarSchema);
export default CuentaPorPagar;
