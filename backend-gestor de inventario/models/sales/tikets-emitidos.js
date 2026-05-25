// models/Ticket.js (O el archivo donde defines tu esquema de Ticket)
import mongoose from 'mongoose';

// Asegúrate de que estos sub-esquemas estén definidos si los usas
// Puedes ponerlos en el mismo archivo o importarlos si son muy grandes
const itemSchema = new mongoose.Schema({
    codigo: { type: String, required: true },
    descripcion: { type: String, required: true },
    cantidad: { type: Number, required: true, min: 0 },
    precioUnitario: { type: Number, required: true, min: 0 },
    totalItem: { type: Number, required: true, min: 0 },
}, { _id: false });

const totalesSchema = new mongoose.Schema({
    subtotal: { type: Number, required: true, min: 0 },
    descuento: { type: Number, default: 0, min: 0 },
    totalPagar: { type: Number, required: true, min: 0 },
}, { _id: false });

const pagoSchema = new mongoose.Schema({
    metodo: { type: String, required: true },
    montoRecibido: { type: Number, min: 0 },
    cambio: { type: Number, min: 0 },
}, { _id: false });

const clienteSchema = new mongoose.Schema({
    nombre: { type: String },
    dniCuit: { type: String },
    condicionIVA: { type: String },
}, { _id: false });

// --- Esquema Principal del Ticket ---
const ticketSchema = new mongoose.Schema({
    // REFERENCIAS CLAVE
    idEmpresa: { // Este es el nombre que usarás en el modelo y las queries
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Empresa', // Asegúrate de tener un modelo 'Empresa'
        required: true,
        index: true
    },
    // El nombre del campo `puntoDeVenta` coincide con el que viene en `datos`
    // y se usa en las queries del repositorio.
    puntoDeVenta: { type: String, required: true },

    // Este campo es inferido por tu repositorio (findLastComprobanteInterno)
    // y no está en tus 'datos' de PDF, por lo que lo generaremos.
    numeroComprobanteInterno: {
        type: Number,
        required: true,
        default: 0, // Un valor por defecto, aunque se sobrescribirá
        index: true // Es crucial para la búsqueda del último número
    },

    // CAMPOS PRINCIPALES DEL TICKET
    ventaId: { type: String, required: true, unique: true },
    fechaHora: { type: Date, required: true }, // Se espera Date. Aquí no pondría default: Date.now si el dato original ya lo trae.
    tipoComprobante: { type: String, required: true },
    numeroComprobante: { type: String, required: true }, // El número visible en el PDF

    // CONTENIDO DEL TICKET
    items: [itemSchema],
    totales: { type: totalesSchema, required: true },
    pago: { type: pagoSchema, required: true },

    // CAMPOS OPCIONALES/ADICIONALES
    cliente: { type: clienteSchema },
    observaciones: { type: String },
    cajero: { type: String },
    transaccionId: { type: String },
    sucursal: { type: String },

    cajaId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Caja'
    },
    source: {
        type: String,
        enum: ['AFIP', 'OFFLINE', 'INTERNAL', 'MANUAL'],
        default: 'MANUAL'
    },
    estadoFactura: {
        type: String,
        enum: ['Aprobada', 'Rechazada', 'Pendiente'],
        default: 'Aprobada'
    },

    // CAMPO PARA LA RUTA DEL PDF GENERADO
    pdfPath: { type: String, required: false, default: '' },

}, {
    timestamps: true // Añade `createdAt` y `updatedAt` automáticamente
});

// Asegúrate de que el nombre del modelo sea 'Ticket'
const Ticket = mongoose.model('Ticket', ticketSchema);
export default Ticket;
