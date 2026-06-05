import mongoose from 'mongoose';

const itemSchema = new mongoose.Schema({
    idProduct: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
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
    tipoDocumento: { type: Number },
    condicionIVA: { type: String },
}, { _id: false });

const notaPedidoSchema = new mongoose.Schema({
    idEmpresa: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Empresa',
        required: true,
        index: true
    },
    // ID redundante para facilitar la vinculación con el microservicio de AFIP si existe
    idDbAfip: {
        type: String,
        index: true
    },
    puntoDeVenta: { type: String, required: true },
    idUsuario: { type: mongoose.Schema.Types.ObjectId, ref: 'Users-logins', required: true },
    
    pedidoId: { type: String, required: true, unique: true },
    fechaHora: { type: Date, default: Date.now },
    tipoComprobante: { type: String, default: 'Nota de Pedido' },
    
    items: [itemSchema],
    totales: { type: totalesSchema, required: true },
    pago: { type: pagoSchema },
    
    cliente: { type: clienteSchema },
    observaciones: { type: String },
    vendedor: { type: String },
    
    estado: {
        type: String,
        enum: ['PENDIENTE', 'PREPARADO', 'ENTREGADO', 'FACTURADO', 'CANCELADO'],
        default: 'PENDIENTE'
    },
    
    // Referencia al ticket/factura generado a partir de esta nota
    idTicketGenerado: { type: mongoose.Schema.Types.ObjectId, ref: 'Ticket' },
    
    pdfPath: { type: String, required: false, default: '' },
}, {
    timestamps: true
});

const NotaPedido = mongoose.model('NotaPedido', notaPedidoSchema);
export default NotaPedido;
