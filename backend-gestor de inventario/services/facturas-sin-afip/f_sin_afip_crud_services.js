// services/facturas-sin-afip/f_sin_afip_crud_services.js
import { createTicketSinAfip as generatePdfTicket } from './create-tiket/estructura-tiket.js';
import fs from 'fs';
import path from 'path';
import { update_product_ventas_services } from "../product_services.js";
import TicketEmitidoRepository from '../../repositories/repo_tikets.js';
import { createSaleTicket } from '../ticket_services.js';

export async function createSinAfip(datos, idUsuario, idEmpresa, datosEmpresa) {
    // 1. Validar serie
    const serieComprobante = datos.numeroComprobante && datos.numeroComprobante.trim() !== '' 
        ? datos.numeroComprobante 
        : '0001'; 

    // 2. Restar productos
    await update_product_ventas_services(datos); 

    // 3. Configuración de rutas (Ruta absoluta para evitar errores de servidor)
    const projectRoot = path.resolve();
    const userTicketsDir = path.join(projectRoot, 'raiz-users', idUsuario, 'tickets');
    await fs.promises.mkdir(userTicketsDir, { recursive: true });

    const padNumber = (num, length) => String(num).padStart(length, '0');

    // 4. Parseo de fecha: soporta ISO y formato `DD/MM/YYYY [ ,] HH:MM:SS`
    let parsedFechaHora = new Date();
    if (datos.fechaHora) {
        try {
            const raw = String(datos.fechaHora).trim();

            // Si parece ISO (contiene 'T') o un timestamp numérico, intentar parseo directo
            if (/\d{4}-\d{2}-\d{2}T/.test(raw) || /^\d+$/.test(raw)) {
                const d = new Date(raw);
                if (!isNaN(d.getTime())) parsedFechaHora = d;
            } else {
                // Intentar formato DD/MM/YYYY[ ,] HH:MM:SS
                const cleanDateStr = raw.replace(',', '').trim();
                const parts = cleanDateStr.split(' ');
                const fechaStr = parts[0] || '';
                const horaStr = parts[1] || '00:00:00';
                const fechaParts = fechaStr.split('/');
                const dia = String(fechaParts[0] || '1').padStart(2, '0');
                const mes = String(fechaParts[1] || '1').padStart(2, '0');
                const anio = String(fechaParts[2] || new Date().getFullYear());
                const tempDate = new Date(`${anio}-${mes}-${dia}T${horaStr}`);
                if (!isNaN(tempDate.getTime())) parsedFechaHora = tempDate;
            }
        } catch (err) {
            console.warn('No se pudo parsear datos.fechaHora, usando ahora:', err?.message || err);
        }
    }

    const puntoDeVentaActual = datos.puntoDeVenta;

    // 5. Generar numeroComprobanteInterno
    const lastComprobanteInterno = await TicketEmitidoRepository.findLastComprobanteInterno(idEmpresa, puntoDeVentaActual) || 0;
    const nextComprobanteInterno = lastComprobanteInterno + 1;

    // 6. Generar ventaId
    const formattedDateForVentaId = `${parsedFechaHora.getFullYear()}${padNumber(parsedFechaHora.getMonth() + 1, 2)}${padNumber(parsedFechaHora.getDate(), 2)}`;
    const lastVentaId = await TicketEmitidoRepository.findLastVentaId(idEmpresa, puntoDeVentaActual);
    
    let nextVentaIdConsecutive = 1;
    if (lastVentaId) {
        const parts = lastVentaId.split('-');
        if (parts.length === 3 && parts[0].includes(formattedDateForVentaId)) {
            nextVentaIdConsecutive = parseInt(parts[2], 10) + 1;
        }
    }
    const nextVentaId = `VK${formattedDateForVentaId}-${puntoDeVentaActual}-${padNumber(nextVentaIdConsecutive, 4)}`;

    // 7. Generar numeroComprobante
    const lastNumeroComprobante = await TicketEmitidoRepository.findLastNumeroComprobante(idEmpresa, puntoDeVentaActual, serieComprobante);
    let nextComprobanteNumero = 1;
    if (lastNumeroComprobante) {
        const parts = lastNumeroComprobante.split('-');
        if (parts.length === 2) {
            nextComprobanteNumero = parseInt(parts[1], 10) + 1;
        }
    }
    const nextNumeroComprobante = `${serieComprobante}-${padNumber(nextComprobanteNumero, 8)}`;

    // 8. Generar PDF y guardar archivo
    const updatedDatosForPdf = {
        ...datos,
        fechaHora: parsedFechaHora.toLocaleString('es-AR'),
        ventaId: nextVentaId,
        numeroComprobante: nextNumeroComprobante
    };
    
    const pdfBuffer = await generatePdfTicket(updatedDatosForPdf, datosEmpresa);
    const ticketFilePath = path.join(userTicketsDir, `${nextVentaId}.pdf`);
    
    await fs.promises.writeFile(ticketFilePath, pdfBuffer);

    // 9. Guardar en Base de Datos
    const ticketDataForDB = {
        ...datos,
        idEmpresa,
        puntoDeVenta: puntoDeVentaActual,
        numeroComprobanteInterno: nextComprobanteInterno,
        pdfPath: ticketFilePath,
        ventaId: nextVentaId,
        fechaHora: parsedFechaHora,
        numeroComprobante: nextNumeroComprobante,
        source: 'INTERNAL',
        estadoFactura: 'Aprobada'
    };

    const savedTicketInDB = await createSaleTicket({
        idEmpresa,
        puntoDeVenta: puntoDeVentaActual,
        ticketData: ticketDataForDB,
        stockUpdate: false,
        registrarCaja: !!datos.cajaId,
        cajaId: datos.cajaId,
        source: 'INTERNAL',
        estadoFactura: 'Aprobada'
    });

    // Retornamos la ruta física y los metadatos. 
    // El controlador usará esto con res.sendFile()
    return {
        message: "Ticket generado exitosamente.",
        pdfFilePath: ticketFilePath, // Ruta para que el controlador sirva el archivo
        databaseRecordId: savedTicketInDB._id,
        ventaId: nextVentaId,
        numeroComprobante: nextNumeroComprobante
    };
}

//busca los tickets en comprobantes
export async function getTiketsCompanyServices(idEmpresa, options) {
    return TicketEmitidoRepository.findByEmpresaId(idEmpresa, options);
}
