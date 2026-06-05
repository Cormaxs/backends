import mongoose from 'mongoose';

const sequenceSchema = new mongoose.Schema({
    idEmpresa: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Empresa',
        required: true
    },
    tipo: {
        type: String,
        required: true,
        enum: ['TICKET', 'NOTA_PEDIDO']
    },
    puntoDeVenta: {
        type: String,
        required: true
    },
    ultimoNumero: {
        type: Number,
        default: 0
    },
    fechaUltimoReinicio: {
        type: String, // Formato YYYYMMDD para reinicio diario si es necesario
        required: true
    }
}, { timestamps: true });

// Índice compuesto para búsqueda rápida y unicidad
sequenceSchema.index({ idEmpresa: 1, tipo: 1, puntoDeVenta: 1, fechaUltimoReinicio: 1 }, { unique: true });

const Sequence = mongoose.model('Sequence', sequenceSchema);

export default Sequence;
