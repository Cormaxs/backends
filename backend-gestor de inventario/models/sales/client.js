// src/models/Client.js
import mongoose from 'mongoose';

const clientSchema = new mongoose.Schema({
    owner: { // Referencia a la empresa a la que pertenece este cliente
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Empresa',
        required: [true, 'El cliente debe pertenecer a una empresa.']
    },
    razonSocial: {
        type: String,
        required: [true, 'La razón social o nombre del cliente es obligatoria.'],
        trim: true
    },
    nombreContacto: { // Para personas de contacto en empresas o nombre y apellido si es persona física
        type: String,
        trim: true
    },
    cuit: { // CUIT, DNI, CUIL, etc.
        type: String,
        trim: true,
        // Puedes añadir un índice compuesto para cuit/dni y owner si lo necesitas único por empresa
        // unique: true, // Si el CUIT/DNI debe ser globalmente único
        // sparse: true // Permite que haya documentos sin CUIT/DNI sin romper la unicidad
    },
    tipoDocumento: { // Código AFIP del tipo de documento (ej. 80 para CUIT, 96 para DNI)
        type: Number
    },
    numeroDocumento: { // Número de documento del receptor
        type: String,
        trim: true
    },
    condicionIVA: {
        type: String,
        required: [true, 'La condición IVA del cliente es obligatoria.'],
        enum: [
            'Responsable Inscripto',
            'Monotributista',
            'Exento',
            'Consumidor Final',
            'Responsable Monotributo',
            'Sujeto Exento',
            'No Responsable'
        ],
        trim: true
    },
    condicionIVACodigo: { // Código AFIP de la condición IVA del receptor
        type: Number,
        required: [true, 'El código de condición IVA del cliente es obligatorio.']
    },
    domicilio: {
        type: String,
        trim: true
    },
    localidad: {
        type: String,
        trim: true
    },
    provincia: {
        type: String,
        trim: true
    },
    codigoPostal: {
        type: String,
        trim: true
    },
    telefono: {
        type: String,
        trim: true
    },
    email: {
        type: String,
        trim: true,
        lowercase: true,
        match: [/.+@.+\..+/, 'Por favor, introduce un correo electrónico válido.'],
        // unique: true, // Si el email del cliente debe ser globalmente único
        sparse: true // Permite que haya documentos sin email sin romper la unicidad
    },
    saldoCuentaCorriente: { // Saldo pendiente del cliente en la cuenta corriente
        type: Number,
        default: 0,
        min: [0, 'El saldo de cuenta corriente no puede ser negativo.'] // Si no permites saldo a favor
    },
    observaciones: {
        type: String,
        trim: true
    },
    activo: { // Indica si el cliente está activo
        type: Boolean,
        default: true
    }
}, {
    timestamps: true // Agrega `createdAt` y `updatedAt`
});

// Índice compuesto para asegurar que el documento sea único por empresa, si es un requisito
clientSchema.index({ numeroDocumento: 1, tipoDocumento: 1, owner: 1 }, { unique: true, sparse: true });
// Si el CUIT/DNI es siempre único para un cliente a nivel global, entonces unique: true sin sparse

const Client = mongoose.model('Client', clientSchema);
export default Client;
