// models/PuntoDeVenta.js
import mongoose from 'mongoose';

const puntoVentaSchema = new mongoose.Schema({
    // Referencia a la empresa propietaria de este punto de venta
    empresa: { // Este es el nombre del campo: 'empresa'
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Empresa',
        required: [true, 'El punto de venta debe pertenecer a una empresa.']
    },
    numero: { // El número oficial del punto de venta asignado por AFIP (ej. 1, 2, 10)
        type: Number,
        required: [true, 'El número de punto de venta es obligatorio.'],
        min: [1, 'El número de punto de venta debe ser al menos 1.']
    },
    nombre: {
        type: String,
        trim: true
    },
    activo: {
        type: Boolean,
        default: true
    },
    ultimoCbteAutorizado: {
        type: Number,
        default: 0,
        min: [0, 'El último comprobante autorizado no puede ser negativo.']
    },
    fechaUltimoCbte: {
        type: Date
    },
    direccion: {
        type: String,
        trim: true
    },
    ciudad: { type: String, trim: true },
    provincia: { type: String, trim: true },
    codigoPostal: { type: String, trim: true },
    telefono: { type: String, trim: true }
}, {
    timestamps: true
});

// ---
// ¡¡¡LA CORRECCIÓN ESTÁ AQUÍ!!!
// El índice compuesto debe usar 'empresa: 1', no 'owner: 1'
// ---
puntoVentaSchema.index({ numero: 1, empresa: 1 }, { unique: true }); // <-- ¡CORREGIDO!

const PuntoVenta = mongoose.model('PuntoDeVenta', puntoVentaSchema);
export default PuntoVenta;
