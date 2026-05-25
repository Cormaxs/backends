import mongoose from 'mongoose';

const CategoriaSchema = new mongoose.Schema({
    nombre: {
        type: String,
        required: [true, 'El nombre de la categoría es obligatorio.'],
        trim: true
    },
    descripcion: {
        type: String,
        trim: true,
        default: ''
    },
    empresa: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Empresa',
        required: true
    },
    // Pro Tip (Opcional pero muy útil para el futuro):
    // Permite crear sub-categorías (ej. Ropa > Remeras > Manga Corta)
    padre: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Categoria',
        default: null
    }
}, { timestamps: true });

// Índice para asegurar que una empresa no tenga dos categorías con el mismo nombre
CategoriaSchema.index({ empresa: 1, nombre: 1 }, { unique: true });

const Categoria = mongoose.model('Categoria', CategoriaSchema);
export default Categoria;
