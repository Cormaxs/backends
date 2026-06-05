import { Plan } from '../models/index.js';
import PLANES_STATIC from '../config/planes.js';

export const seedPlans = async () => {
    try {
        const count = await Plan.countDocuments();
        if (count === 0) {
            console.log('🌱 Sembrando planes en la base de datos...');
            const planesToInsert = Object.entries(PLANES_STATIC).map(([slug, data]) => ({
                nombre: data.nombre,
                slug: slug,
                productosLimite: data.productosLimite,
                usuariosLimite: data.usuariosLimite,
                facturasMensualesLimite: data.facturasMenu || 0,
                ticketsMensualesLimite: data.ticketsLimite || 0,
                notasPedidoMensualesLimite: data.notasPedidoLimite || 0,
                puntosVentaLimite: data.puntosVentaLimite,
                cajasLimite: data.cajasLimite,
                exportXlsx: data.exportXlsx,
                soportePrioritario: data.soportePrioritario,
                precio: data.precio,
                periodo: data.periodo || 'mes',
                activo: true
            }));

            await Plan.insertMany(planesToInsert);
            console.log('✅ Planes sembrados exitosamente.');
        }
    } catch (error) {
        console.error('❌ Error sembrando planes:', error);
    }
};
