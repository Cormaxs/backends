import Ticket from '../../models/sales/tikets-emitidos.js';
import { createSaleTicket } from '../../services/ticket_services.js';

export async function syncSales(req, res) {
    try {
        const { sales } = req.body;
        if (!Array.isArray(sales)) return res.status(400).json({ message: 'sales must be an array' });

        let sincronizadas = 0;
        let errores = 0;
        const detalles = [];

        for (const s of sales) {
            try {
                if (!s.ventaId) throw new Error('ventaId requerido');

                // idempotencia: si ya existe, saltar
                const existe = await Ticket.findOne({ ventaId: s.ventaId });
                if (existe) {
                    detalles.push({ ventaId: s.ventaId, status: 'skipped', reason: 'already_exists' });
                    continue;
                }

                const ticketData = {
                    ventaId: s.ventaId,
                    numeroComprobanteInterno: s.numeroComprobanteInterno || 0,
                    fechaHora: s.fechaHora ? new Date(s.fechaHora) : new Date(),
                    tipoComprobante: s.tipoComprobante || 'RECIBO',
                    numeroComprobante: s.numeroComprobante || '',
                    items: s.items || [],
                    totales: s.totales || { subtotal: 0, descuento: 0, totalPagar: 0 },
                    pago: s.pago || { metodo: 'efectivo', montoRecibido: 0, cambio: 0 },
                    cliente: s.cliente || {},
                    observaciones: s.observaciones || '',
                    cajero: s.cajero || '',
                    transaccionId: s.transaccionId || '',
                    sucursal: s.sucursal || '',
                    pdfPath: s.pdfPath || '',
                    source: 'OFFLINE',
                    estadoFactura: 'Aprobada'
                };

                await createSaleTicket({
                    idEmpresa: s.idEmpresa,
                    puntoDeVenta: s.puntoDeVenta || s.puntoVenta || '1',
                    ticketData,
                    cajaId: s.cajaId || null,
                    stockUpdate: true,
                    registrarCaja: !!s.cajaId,
                    source: 'OFFLINE',
                    estadoFactura: 'Aprobada'
                });

                sincronizadas++;
                detalles.push({ ventaId: s.ventaId, status: 'ok' });
            } catch (err) {
                errores++;
                detalles.push({ ventaId: s?.ventaId || null, status: 'error', reason: err.message });
            }
        }

        res.json({ sincronizadas, errores, detalles });
    } catch (err) {
        console.error('syncSales error', err);
        res.status(500).json({ message: 'Error syncing sales', error: err.message });
    }
}

export default { syncSales };
