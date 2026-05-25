// controllers/tu-controlador.js

import { tiendaNube as productoService } from '../../services/up-masivo-db/tienda-nube.js';
import { Empresa, PuntoDeVenta } from '../../models/index.js';
import mongoose from 'mongoose';

export const migrarDb = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No se ha subido ningún archivo.' });
        }

        const { empresaId, puntoVentaId } = req.params;

        if (!empresaId || !puntoVentaId) {
            return res.status(400).json({ message: 'Se requiere el ID de la empresa y del punto de venta para la migración de productos.' });
        }

        if (!mongoose.Types.ObjectId.isValid(empresaId) || !mongoose.Types.ObjectId.isValid(puntoVentaId)) {
            return res.status(400).json({ message: 'IDs de empresa o punto de venta inválidos.' });
        }

        const existingEmpresa = await Empresa.findById(empresaId);
        if (!existingEmpresa) {
            return res.status(404).json({ message: `Empresa con ID ${empresaId} no encontrada.` });
        }
        const existingPuntoVenta = await PuntoDeVenta.findById(puntoVentaId);
        if (!existingPuntoVenta) {
            return res.status(404).json({ message: `Punto de venta con ID ${puntoVentaId} no encontrado.` });
        }

        const { buffer: fileBuffer, originalname: originalFileName, mimetype: fileMimetype } = req.file;

        const result = await productoService(
            fileBuffer,
            originalFileName,
            fileMimetype,
            empresaId,
            puntoVentaId
        );

        res.status(200).json(result);

    } catch (error) {
        console.error("[Controlador] Error en migrarDb:", error);
        
        if (error.message.includes('Tipo de archivo no permitido') || error.message.includes('El archivo está vacío')) {
            return res.status(415).json({ message: error.message });
        }
        if (error.message.includes('No se pudieron procesar productos válidos')) {
            return res.status(422).json({ message: error.message });
        }
        if (error.name === 'ValidationError') {
            const errorsList = Object.keys(error.errors).map(key => error.errors[key].message);
            return res.status(400).json({ message: 'Error de validación de Mongoose.', errors: errorsList });
        }
        if (error.code === 11000) {
            const duplicateKey = Object.keys(error.keyValue)[0];
            return res.status(409).json({ message: `Error de duplicado en el campo '${duplicateKey}'.`, details: error.keyValue });
        }

        res.status(500).json({ message: 'Error interno del servidor.', error: error.message });
    }
};
