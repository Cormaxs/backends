import { Sequence } from '../models/index.js';

/**
 * Obtiene el siguiente número de secuencia para una empresa, tipo y punto de venta.
 * El contador se reinicia diariamente si se usa el formato YYYYMMDD.
 */
export async function getNextSequence(idEmpresa, tipo, puntoDeVenta) {
    const now = new Date();
    const formattedDate = `${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}`;

    const sequence = await Sequence.findOneAndUpdate(
        { 
            idEmpresa, 
            tipo, 
            puntoDeVenta: String(puntoDeVenta),
            fechaUltimoReinicio: formattedDate
        },
        { $inc: { ultimoNumero: 1 } },
        { 
            new: true, 
            upsert: true, 
            setDefaultsOnInsert: true 
        }
    );

    return {
        numero: sequence.ultimoNumero,
        fecha: formattedDate
    };
}
