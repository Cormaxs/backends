import mongoose from 'mongoose';
import TicketEmitidoRepository from '../repositories/repo_tikets.js';
import CajaRepository from '../repositories/repo_cajas.js';
import { update_product_ventas_services } from './product_services.js';
import { agregarTransaccionCaja } from './cajas/crud-cajas-services.js';
import { getNextSequence } from './sequence_services.js';

async function buildVentaId(idEmpresa, puntoDeVenta) {
    const { numero, fecha } = await getNextSequence(idEmpresa, 'TICKET', puntoDeVenta || '1');
    return `VK${fecha}-${puntoDeVenta || '1'}-${String(numero).padStart(4, '0')}`;
}

export async function createSaleTicket({
    idEmpresa,
    puntoDeVenta = '1',
    ticketData = {},
    cajaId = null,
    stockUpdate = true,
    registrarCaja = false,
    source = 'MANUAL',
    estadoFactura = 'Aprobada',
    idDbAfip = null,
    userId = null
}) {
    if (!idEmpresa) {
        throw new Error('idEmpresa es requerido para guardar el ticket.');
    }

    // --- Lógica Automática de Caja ---
    let cajaAsociadaId = cajaId;
    
    // Si no se proporcionó cajaId, intentamos buscar una abierta automáticamente
    if (!cajaAsociadaId) {
        const openCaja = await CajaRepository.findOpenCaja(idEmpresa, puntoDeVenta);
        if (openCaja) {
            cajaAsociadaId = openCaja._id;
            registrarCaja = true; // Si la encontramos automáticamente, activamos el registro de la transacción
        }
    } else {
        // Si se proporcionó cajaId manualmente, aseguramos que registrarCaja esté activo
        registrarCaja = true;
    }

    const cleanedTicketData = {
        ...ticketData,
        idEmpresa,
        idDbAfip: idDbAfip || ticketData.idDbAfip || null,
        userId: userId || ticketData.userId || null,
        puntoDeVenta: String(puntoDeVenta || ticketData.puntoDeVenta || '1'),
        cajaId: cajaAsociadaId, // Asignamos la caja encontrada o proporcionada
        ventaId: ticketData.ventaId || (await buildVentaId(idEmpresa, puntoDeVenta || ticketData.puntoDeVenta || '1')),
        fechaHora: ticketData.fechaHora ? new Date(ticketData.fechaHora) : new Date(),
        source,
        estadoFactura,
        items: Array.isArray(ticketData.items) ? ticketData.items : [],
        totales: ticketData.totales || { subtotal: 0, descuento: 0, totalPagar: 0 },
        pago: ticketData.pago || { metodo: 'efectivo', montoRecibido: 0, cambio: 0 },
        cliente: ticketData.cliente || {},
        observaciones: ticketData.observaciones || '',
        cajero: ticketData.cajero || '',
        transaccionId: ticketData.transaccionId || '',
        sucursal: ticketData.sucursal || '',
        pdfPath: ticketData.pdfPath || ''
    };

    if (!cleanedTicketData.numeroComprobanteInterno) {
        const lastComprobanteInterno = await TicketEmitidoRepository.findLastComprobanteInterno(idEmpresa, cleanedTicketData.puntoDeVenta);
        cleanedTicketData.numeroComprobanteInterno = Number(lastComprobanteInterno || 0) + 1;
    }

    // Ya no es necesario este bloque porque lo manejamos arriba
    /*
    if (cajaId && mongoose.Types.ObjectId.isValid(cajaId)) {
        cleanedTicketData.cajaId = cajaId;
    }
    */

    const validStockItems = cleanedTicketData.items.filter(item => item.idProduct || item._id);
    if (stockUpdate && validStockItems.length > 0) {
        await update_product_ventas_services({ items: validStockItems });
    }

    const savedTicket = await TicketEmitidoRepository.create(cleanedTicketData);

    // NOTA: No agregamos la venta como transacción manual en caja.transacciones 
    // para evitar duplicar montos en el resumen de caja, ya que el resumen 
    // suma tanto las transacciones manuales como los tickets asociados por cajaId.

    return savedTicket;
}
