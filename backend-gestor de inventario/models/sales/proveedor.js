import mongoose from 'mongoose';

const contactoSchema = new mongoose.Schema({
    telefono: { type: String, trim: true },
    email: { type: String, trim: true, lowercase: true, match: [/.+@.+\..+/, 'Por favor, introduce un correo válido.'] },
    direccion: { type: String, trim: true },
    cuit: { type: String, trim: true }
}, { _id: false });

const proveedorSchema = new mongoose.Schema({
    nombre: {
        type: String,
        required: [true, 'El nombre del proveedor es obligatorio.'],
        trim: true
    },
    empresa: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Empresa',
        required: [true, 'La empresa del proveedor es obligatoria.']
    },
    contacto: contactoSchema,
    terminosPago: {
        type: String,
        default: '30 días'
    },
    saldoCuentaCorriente: {
        type: Number,
        default: 0,
        min: [0, 'El saldo no puede ser negativo.']
    },
    activo: {
        type: Boolean,
        default: true
    },
    notas: {
        type: String,
        trim: true
    }
}, { timestamps: true });

proveedorSchema.index({ empresa: 1, nombre: 1 }, { unique: true });

const Proveedor = mongoose.model('Proveedor', proveedorSchema);
export default Proveedor;
