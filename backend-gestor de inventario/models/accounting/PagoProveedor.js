import mongoose from 'mongoose';

const pagoProveedorSchema = new mongoose.Schema({
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
    cuentaPorPagar: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'CuentaPorPagar'
    },
    montoPagado: {
        type: Number,
        required: [true, 'El monto pagado es obligatorio.'],
        min: [0, 'El monto pagado no puede ser negativo.']
    },
    metodoPago: {
        type: String,
        trim: true,
        default: 'Efectivo'
    },
    fechaPago: {
        type: Date,
        default: () => new Date()
    },
    observaciones: {
        type: String,
        trim: true
    }
}, { timestamps: true });

const PagoProveedor = mongoose.model('PagoProveedor', pagoProveedorSchema);
export default PagoProveedor;
