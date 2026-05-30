import { NotaPedido, User } from '../models/index.js';
import ProductRepository from '../repositories/repo_product.js';
import { update_product_ventas_services } from './product_services.js';
import { createTicketSinAfip as generatePdfTicket } from './facturas-sin-afip/create-tiket/estructura-tiket.js';
import FacturasAfipService from './backend-afip/facturasAfip.service.js';
import { createSaleTicket } from './ticket_services.js';
import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';

const facturasAfipService = new FacturasAfipService();

export async function createNotaPedidoService(datos) {
    const { idEmpresa, idUsuario, items, totales, pago, cliente, observaciones, puntoDeVenta, vendedor, tipoComprobante } = datos;

    // 1. Generar pedidoId único
    const now = new Date();
    const formattedDate = `${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}`;
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    const pedidoId = `NP${formattedDate}-${random}`;

    // 2. Descontar stock inmediatamente
    await update_product_ventas_services({ items });

    // 3. Crear Nota de Pedido
    const nuevaNota = new NotaPedido({
        idEmpresa,
        idUsuario,
        puntoDeVenta,
        pedidoId,
        items,
        totales,
        pago,
        cliente,
        observaciones,
        vendedor,
        tipoComprobante: tipoComprobante || 'Nota de Pedido',
        estado: 'PENDIENTE'
    });

    return await nuevaNota.save();
}

export async function getNotasPedidoByEmpresaService(idEmpresa, options = {}) {
    const { page = 1, limit = 10, status } = options;
    const query = { idEmpresa };
    if (status) query.estado = status;

    const total = await NotaPedido.countDocuments(query);
    const notas = await NotaPedido.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(parseInt(limit))
        .populate('idUsuario', 'username');

    return {
        notas,
        pagination: {
            total,
            page: parseInt(page),
            limit: parseInt(limit),
            totalPages: Math.ceil(total / limit)
        }
    };
}

export async function updateNotaPedidoStatusService(idNota, nuevoEstado, idUsuario, datosEmpresa) {
    const nota = await NotaPedido.findById(idNota);
    if (!nota) throw new Error("Nota de pedido no encontrada.");

    // Si se cancela, devolver el stock
    if (nuevoEstado === 'CANCELADO' && nota.estado === 'PENDIENTE') {
        const productsToReturn = nota.items.map(item => ({
            id: item.idProduct,
            cantidadADevolver: item.cantidad
        }));
        await ProductRepository.returnProductStock(productsToReturn);
    }

    // Si se aprueba (ENTREGADO), generar el PDF
    if (nuevoEstado === 'ENTREGADO' && nota.estado === 'PENDIENTE') {
        const projectRoot = path.resolve();
        const userTicketsDir = path.join(projectRoot, 'raiz-users', idUsuario.toString(), 'tickets');
        await fs.promises.mkdir(userTicketsDir, { recursive: true });

        const updatedDatosForPdf = {
            ventaId: nota.pedidoId,
            fechaHora: nota.fechaHora.toLocaleString('es-AR'),
            puntoDeVenta: nota.puntoDeVenta,
            items: nota.items.map(it => ({
                descripcion: it.descripcion,
                cantidad: it.cantidad,
                precioUnitario: it.precioUnitario,
                totalItem: it.totalItem,
                codigo: it.codigo,
                alicuotaIVA: 21,
                importeIVA: 0
            })),
            totales: nota.totales,
            pago: nota.pago || { metodo: 'Contado', montoRecibido: nota.totales.totalPagar, cambio: 0 },
            cliente: nota.cliente,
            vendedor: nota.vendedor,
            tipoComprobante: 'Nota de Pedido'
        };

        const pdfBuffer = await generatePdfTicket(updatedDatosForPdf, datosEmpresa);
        const pdfFileName = `${nota.pedidoId}.pdf`;
        const pdfFilePath = path.join(userTicketsDir, pdfFileName);
        
        await fs.promises.writeFile(pdfFilePath, pdfBuffer);
        nota.pdfPath = pdfFilePath;
    }

    nota.estado = nuevoEstado;
    return await nota.save();
}

export async function updateNotaPedidoDataService(idNota, nuevosDatos) {
    const nota = await NotaPedido.findById(idNota);
    if (!nota) throw new Error("Nota de pedido no encontrada.");
    if (nota.estado !== 'PENDIENTE') throw new Error("Solo se pueden editar notas de pedido en estado PENDIENTE.");

    // Manejar cambios de stock si los items cambiaron
    if (nuevosDatos.items) {
        // 1. Devolver stock anterior
        const productsToReturn = nota.items.map(item => ({
            id: item.idProduct,
            cantidadADevolver: item.cantidad
        }));
        await ProductRepository.returnProductStock(productsToReturn);

        // 2. Descontar stock nuevo
        await update_product_ventas_services({ items: nuevosDatos.items });
        
        nota.items = nuevosDatos.items;
    }

    // Actualizar otros campos permitidos
    if (nuevosDatos.cliente) nota.cliente = nuevosDatos.cliente;
    if (nuevosDatos.observaciones !== undefined) nota.observaciones = nuevosDatos.observaciones;
    if (nuevosDatos.totales) nota.totales = nuevosDatos.totales;
    if (nuevosDatos.pago) nota.pago = nuevosDatos.pago;
    if (nuevosDatos.vendedor) nota.vendedor = nuevosDatos.vendedor;
    if (nuevosDatos.puntoDeVenta) nota.puntoDeVenta = nuevosDatos.puntoDeVenta;

    return await nota.save();
}

export async function facturarNotaPedidoService(idNota, idUsuario, idEmpresa, datosEmpresa, options = {}) {
    const { tipoFacturacion = 'TICKET', afipData = {} } = options;
    const nota = await NotaPedido.findById(idNota);
    if (!nota) throw new Error("Nota de pedido no encontrada.");
    if (nota.estado === 'FACTURADO') throw new Error("Esta nota ya ha sido facturada.");
    if (nota.estado === 'CANCELADO') throw new Error("No se puede facturar una nota cancelada.");

    // 1. Devolver el stock temporalmente (porque el proceso de facturación lo volverá a descontar)
    const productsToReturn = nota.items.map(item => ({
        id: item.idProduct,
        cantidadADevolver: item.cantidad
    }));
    await ProductRepository.returnProductStock(productsToReturn);

    let result;

    if (tipoFacturacion === 'AFIP') {
        // Lógica para Factura AFIP
        const { idDbAfip, cuit, servicio } = afipData;
        
        // Mapeo de condición IVA string a ID numérico para AFIP
        let condicionIVAReceptor = 5; // Por defecto Consumidor Final
        const condicionStr = String(nota.cliente?.condicionIVA || '').toUpperCase();
        if (condicionStr.includes('INSCRIPTO')) condicionIVAReceptor = 1;
        else if (condicionStr.includes('MONOTRIBUTO')) condicionIVAReceptor = 6;
        else if (condicionStr.includes('EXENTO')) condicionIVAReceptor = 4;

        // Preparar objeto factura para AFIP
        const facturaAfip = {
            puntoVenta: nota.puntoDeVenta,
            tipoComprobante: Number(afipData.tipoComprobante) || 11, // C por defecto
            concepto: 1, // Productos
            docTipo: nota.cliente?.tipoDocumento || 99,
            docNro: nota.cliente?.dniCuit || 0,
            condicionIVAReceptor, // Agregamos el ID numérico
            cbteDesde: 0, // El backend AFIP lo calcula
            cbteHasta: 0,
            cbteFch: new Date().toISOString().split('T')[0].replace(/-/g, ''),
            fecha: new Date().toISOString().split('T')[0].replace(/-/g, ''), // Duplicamos para el validador
            importeTotal: nota.totales.totalPagar,
            importeNoGravado: 0,
            importeNeto: nota.totales.subtotal,
            importeExento: 0,
            importeTributos: 0,
            importeIVA: 0,
            moneda: 'PES',
            cotizacion: 1,
            formaPago: nota.pago?.metodo || 'Contado',
            items: nota.items.map(it => ({
                codigo: it.codigo,
                descripcion: it.descripcion,
                cantidad: it.cantidad,
                precioUnitario: it.precioUnitario,
                precioNeto: it.precioUnitario, // Agregamos precioNeto para el repository
                alicuotaIVA: 21,
                importeIVA: 0,
                subtotal: it.totalItem
            })),
            cliente: {
                nombre: nota.cliente?.nombre || 'Consumidor Final',
                dniCuit: nota.cliente?.dniCuit || '',
                condicionIVA: nota.cliente?.condicionIVA || 'Consumidor Final'
            },
            observaciones: nota.observaciones,
            cajero: nota.vendedor
        };

        // Emitir en AFIP
        const pdfBuffer = await facturasAfipService.emitirFacturas(idDbAfip, cuit, servicio, facturaAfip);

        // Registrar en DB local (Factura + Ticket de venta)
        // Usamos una lógica similar a la de facturasAfip.controller.js
        const { Ticket } = await import('../models/index.js');
        
        // Mapeo de etiqueta para tipo de comprobante
        const tipoLabel = facturaAfip.tipoComprobante === 1 ? 'A' : (facturaAfip.tipoComprobante === 6 ? 'B' : 'C');

        // createSaleTicket ya maneja la creación y el descuento de stock si stockUpdate: true
        // Pero necesitamos construir el ticketData primero
        const ticketData = {
            idEmpresa,
            puntoDeVenta: nota.puntoDeVenta,
            ventaId: `AFIP-${Date.now()}`,
            fechaHora: new Date(),
            tipoComprobante: `Factura ${tipoLabel}`,
            numeroComprobante: '', // Se llenará después o el servicio lo hace
            items: facturaAfip.items.map(it => ({
                idProduct: nota.items.find(ni => ni.codigo === it.codigo)?.idProduct,
                codigo: it.codigo,
                descripcion: it.descripcion,
                cantidad: it.cantidad,
                precioUnitario: it.precioUnitario,
                totalItem: it.subtotal
            })),
            totales: nota.totales,
            pago: nota.pago || { metodo: 'Contado', montoRecibido: nota.totales.totalPagar, cambio: 0 },
            cliente: nota.cliente,
            vendedor: nota.vendedor,
            source: 'AFIP'
        };

        result = await createSaleTicket({
            idEmpresa,
            puntoDeVenta: nota.puntoDeVenta,
            ticketData,
            cajaId: null, // Podríamos pasarlo si quisiéramos
            stockUpdate: true,
            registrarCaja: true,
            source: 'AFIP',
            estadoFactura: 'Aprobada'
        });

    } else {
        // Lógica para Ticket Interno (Existente)
        const { createSinAfip } = await import('./facturas-sin-afip/f_sin_afip_crud_services.js');
        
        const ticketData = {
            items: nota.items.map(it => ({
                idProduct: it.idProduct,
                descripcion: it.descripcion,
                codigo: it.codigo,
                cantidad: it.cantidad,
                precioUnitario: it.precioUnitario,
                totalItem: it.totalItem,
                alicuotaIVA: 21,
                importeIVA: 0
            })),
            totales: nota.totales,
            pago: nota.pago || {
                metodo: 'Contado',
                montoRecibido: nota.totales.totalPagar,
                cambio: 0
            },
            cliente: nota.cliente,
            puntoDeVenta: nota.puntoDeVenta,
            cajero: nota.vendedor,
            vendedor: nota.vendedor,
            tipoComprobante: 'Ticket',
            source: 'INTERNAL'
        };

        result = await createSinAfip(ticketData, idUsuario.toString(), idEmpresa.toString(), datosEmpresa);
    }

    // 3. Marcar nota como FACTURADA y referenciar el resultado
    nota.estado = 'FACTURADO';
    nota.idTicketGenerado = result._id;
    await nota.save();

    return result;
}
