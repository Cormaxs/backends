// models/Empresa.js
import mongoose from 'mongoose';

const empresaSchema = new mongoose.Schema({
    nombreEmpresa: {
        type: String,
        required: [true, 'El nombre de la empresa es obligatorio.'],
        trim: true
    },
    razonSocial: { // Nuevo: A menudo diferente del nombre de fantasía
        type: String,
        trim: true,
        required:[false, "la razon social no es obligatoria"]
    },
    cuit: {
        type: String,
        required: [false, 'El CUIT no es obligatorio.'],
        unique: false, // CUIT debe ser único para cada empresa
        trim: true,
        match: /^\d{2}-\d{8}-\d{1}$/
    },
    iibb: { type: String, trim: true },
    fechaInicioActividades: { type: Date, required: [false, 'La fecha de inicio de actividades es obligatoria.'] },
    condicionIVA: {
        type: String,
        required: [false, 'La condición frente al IVA no es obligatoria.'],
        enum: ['Responsable Inscripto', 'Monotributista', 'Exento', 'Consumidor Final', 'Responsable Monotributo', 'Sujeto Exento', 'No Responsable'],
        trim: true
    },
    actividadAFIP: { type: String, trim: true }, // Código CIIU
    metodoContabilidad: {
        type: String,
        enum: ['Contado', 'Devengado'],
        default: 'Contado',
        required: [false, 'El método de contabilidad no es obligatorio.']
    },
    mesInicioFiscal: { type: Number, min: 1, max: 12, default: 1 },
    telefonoContacto: { type: String, trim: true }, // Teléfono general de contacto
    numeroWhatsapp: { type: String, trim: true }, // Whatsapp específico
    emailContacto: { // Nuevo: Email general de la empresa
        type: String,
        trim: true,
        match: [/.+@.+\..+/, 'Por favor, introduce un correo electrónico de contacto válido.']
    },
    pais: { type: String, required: [false, 'El país es obligatorio.'], trim: true, default: 'Argentina' },
    provincia: { type: String, required: [false, 'La provincia es obligatoria.'], trim: true },
    ciudad: { type: String, required: [false, 'La ciudad es obligatoria.'], trim: true },
    codigoPostal: { type: String, required: [false, 'El código postal es obligatorio.'], trim: true },
    direccion: { type: String, required: [false, 'La dirección es obligatoria.'], trim: true }, // Dirección fiscal
    zonaHoraria: { type: String, required: [false, 'La zona horaria es obligatoria.'], default: 'America/Argentina/Catamarca' },
    monedaDefault: { type: String, required: [false, 'La moneda predeterminada es obligatoria.'], default: 'PES' },
    
    // Certificados AFIP (pueden ir aquí si son por empresa)
    certificadoDigital: { type: String, required: false }, // Ruta o referencia al archivo .crt
    clavePrivada: { type: String, required: false }, // Ruta o referencia al archivo .key
    // Podrías guardar la fecha de vencimiento del certificado
    fechaVencimientoCertificado: { type: Date }, 
    // Otros datos de AFIP (ej. ID de ambiente, clave WSFE)
    ambienteAFIP: { // Nuevo: 'PRODUCCION' o 'HOMOLOGACION'
        type: String,
        enum: ['PRODUCCION', 'HOMOLOGACION'],
        default: 'HOMOLOGACION' // Mejor empezar en homologación para pruebas
    },
    idDbAfip: {type: String, required: false} // Nuevo: ID de la empresa en la base de datos de AFIP, si es necesario para integraciones
}, {
    timestamps: true
});

const Empresa = mongoose.model('Empresa', empresaSchema);
export default Empresa;
