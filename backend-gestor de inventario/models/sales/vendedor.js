import mongoose from 'mongoose';

const vendedorSchema = new mongoose.Schema({
    // Credenciales de acceso del vendedor
    username: {
        type: String,
        required: [true, 'El nombre de usuario es obligatorio.'],
        unique: true, // Cada vendedor debe tener un username único globalmente
        trim: true,
        lowercase: true,
        minlength: [4, 'El nombre de usuario debe tener al menos 4 caracteres.']
    },
    password: { // Aquí guardaremos el hash de la contraseña del vendedor
        type: String,
        required: [true, 'La contraseña es obligatoria.'],
        minlength: [4, 'La contraseña debe tener al menos 4 caracteres.']
    },
    email: {
        type: String,
        required: [true, 'El correo electrónico es obligatorio.'],
        unique: true, // Cada vendedor debe tener un email único globalmente
        trim: true,
        lowercase: true,
        match: [/.+@.+\..+/, 'Por favor, introduce un correo electrónico válido.']
    },
    
    // Referencia a la Empresa a la que pertenece el vendedor
    empresa: { // 'owner' ahora representa la empresa a la que pertenece el vendedor
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Empresa', // ¡CORRECCIÓN APLICADA! Referencia al modelo 'Empresa'
        required: [true, 'Cada vendedor debe estar asociado a una empresa propietaria.']
    },
    

    // Información del rol del vendedor dentro de esa empresa
    rol: {
        type: String,
        // Roles específicos para la operación de ventas
        enum: ['administrador_ventas', 'vendedor_activo', 'supervisor_ventas', 'solo_reportes'],
        default: 'vendedor_activo',
        required: [true, 'El rol del vendedor es obligatorio.']
    },

    // Puntos de venta asignados al vendedor
    puntosVentaAsignados: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'PuntoDeVenta' // Referencia al modelo de PuntoDeVenta
        }
    ],

    // Datos personales del vendedor
    nombre: {
        type: String,
        trim: true,
        required: [true, 'El nombre del vendedor es obligatorio.'] // El nombre de una persona que vende suele ser obligatorio
    },
    apellido: {
        type: String,
        trim: true,
        required: [true, 'El apellido del vendedor es obligatorio.'] // El apellido de una persona que vende suele ser obligatorio
    },
    telefono: { // Nuevo: Teléfono de contacto del vendedor
        type: String,
        trim: true
    },
    dni: { // Nuevo: DNI del vendedor (útil para identificación interna)
        type: String,
        trim: true,
        unique: true, // DNI debería ser único globalmente
        sparse: true // Permite que haya documentos sin DNI sin romper la unicidad
    },
    activo: { // Indica si la cuenta del vendedor está activa
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

const Vendedor = mongoose.model('Vendedor', vendedorSchema);

export default Vendedor;
