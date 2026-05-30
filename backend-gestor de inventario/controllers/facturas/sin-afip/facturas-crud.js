import path from "path";
import fs from "fs";
import { createSinAfip, getTiketsCompanyServices, getTicketByIdService } from "../../../services/facturas-sin-afip/f_sin_afip_crud_services.js";
import { createNotaPedidoService, getNotasPedidoByEmpresaService, updateNotaPedidoStatusService, facturarNotaPedidoService, updateNotaPedidoDataService } from "../../../services/nota_pedido_services.js";
import { get_company } from "../../../services/company_services.js";

export async function sinAfip(req, res) {
    try {
        const { datos, idEmpresa } = req.body;
        const { idUser } = req.params;

        if (!datos || !Array.isArray(datos.items)) {
            return res.status(400).json({
                success: false,
                message: 'Payload inválido: se requieren datos y elementos de ticket.'
            });
        }

        const datosEmpresa = await get_company(idEmpresa);
        if (!datosEmpresa) {
            return res.status(404).json({
                success: false,
                message: 'Empresa no encontrada.'
            });
        }

        const datosLimpios = {
            ...datos,
            items: datos.items.map(item => ({
                ...item,
                descripcion: item.descripcion || item.nombre || 'Sin descripción',
                codigo: item.codigo || 'SIN-CODIGO'
            }))
        };

        const resultadoTicket = await createSinAfip(datosLimpios, idUser, idEmpresa, datosEmpresa);
        const pdfFilePath = path.resolve(resultadoTicket.pdfFilePath);

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${resultadoTicket.ventaId}.pdf"`);

        return res.sendFile(pdfFilePath);
    } catch (err) {
        console.error("Error en el controlador sinAfip:", err);
        return res.status(500).json({
            success: false,
            message: "Ocurrió un error interno al procesar el ticket.",
            error: err.message
        });
    }
}

export async function getTiketsCompany(req, res) {
    try {
        const { idEmpresa } = req.params;
        const options = req.query;

        const resultado = await getTiketsCompanyServices(idEmpresa, options);

        // Mapear para asegurar que el frontend reciba lo que espera
        // GenericTable espera data.data y data.paginacion
        return res.status(200).json({
            success: true,
            data: resultado.tickets,
            paginacion: {
                page: resultado.pagination.currentPage,
                total: resultado.pagination.totalTickets,
                limit: resultado.pagination.limit,
                totalPages: resultado.pagination.totalPages
            }
        });
    } catch (err) {
        console.error("Error en el controlador getTiketsCompany:", err);
        return res.status(500).json({
            success: false,
            message: "Ocurrió un error interno al obtener los tickets.",
            error: err.message
        });
    }
}

export async function getTicketPdf(req, res) {
    try {
        const { idTicket } = req.params;
        const ticket = await getTicketByIdService(idTicket);
        
        if (!ticket || !ticket.pdfPath) {
            return res.status(404).json({
                success: false,
                message: 'Ticket o PDF no encontrado.'
            });
        }

        // El pdfPath guardado puede ser una ruta absoluta de Windows.
        // res.sendFile necesita una ruta válida.
        const pdfFilePath = path.normalize(ticket.pdfPath);
        
        if (!fs.existsSync(pdfFilePath)) {
            console.error("Archivo no encontrado en:", pdfFilePath);
            return res.status(404).json({
                success: false,
                message: 'El archivo físico del PDF no existe en el servidor.'
            });
        }

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename="${ticket.ventaId}.pdf"`);
        return res.sendFile(pdfFilePath);
    } catch (err) {
        console.error("Error en getTicketPdf:", err);
        return res.status(500).json({
            success: false,
            message: "Error al recuperar el PDF del ticket.",
            error: err.message
        });
    }
}

export async function getNotaPedidoPdf(req, res) {
    try {
        const { idNota } = req.params;
        const { NotaPedido } = await import('../../../models/index.js');
        const nota = await NotaPedido.findById(idNota);
        
        if (!nota || !nota.pdfPath) {
            return res.status(404).json({
                success: false,
                message: 'Nota de pedido o PDF no encontrado.'
            });
        }

        const pdfFilePath = path.normalize(nota.pdfPath);
        
        if (!fs.existsSync(pdfFilePath)) {
            return res.status(404).json({
                success: false,
                message: 'El archivo físico del PDF no existe.'
            });
        }

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename="${nota.pedidoId}.pdf"`);
        return res.sendFile(pdfFilePath);
    } catch (err) {
        console.error("Error en getNotaPedidoPdf:", err);
        return res.status(500).json({
            success: false,
            message: "Error al recuperar el PDF de la nota de pedido.",
            error: err.message
        });
    }
}

// --- NOTAS DE PEDIDO ---

export async function createNotaPedido(req, res) {
    try {
        const resultado = await createNotaPedidoService(req.body);
        return res.status(201).json({
            success: true,
            data: resultado
        });
    } catch (err) {
        console.error("Error en createNotaPedido:", err);
        return res.status(500).json({
            success: false,
            message: "Error al crear la nota de pedido.",
            error: err.message
        });
    }
}

export async function getNotasPedido(req, res) {
    try {
        const { idEmpresa } = req.params;
        const options = req.query;
        const resultado = await getNotasPedidoByEmpresaService(idEmpresa, options);
        return res.status(200).json({
            success: true,
            data: resultado.notas,
            paginacion: resultado.pagination
        });
    } catch (err) {
        console.error("Error en getNotasPedido:", err);
        return res.status(500).json({
            success: false,
            message: "Error al obtener las notas de pedido.",
            error: err.message
        });
    }
}

export async function updateNotaPedidoStatus(req, res) {
    try {
        const { idNota } = req.params;
        const { estado, idUsuario, idEmpresa } = req.body;
        
        // Obtener datos de la empresa para el PDF (si se aprueba)
        const datosEmpresa = await get_company(idEmpresa);

        const resultado = await updateNotaPedidoStatusService(idNota, estado, idUsuario, datosEmpresa);
        return res.status(200).json({
            success: true,
            data: resultado
        });
    } catch (err) {
        console.error("Error en updateNotaPedidoStatus:", err);
        return res.status(500).json({
            success: false,
            message: "Error al actualizar el estado de la nota de pedido.",
            error: err.message
        });
    }
}

export async function updateNotaPedidoData(req, res) {
    try {
        const { idNota } = req.params;
        const nuevosDatos = req.body;
        const resultado = await updateNotaPedidoDataService(idNota, nuevosDatos);
        return res.status(200).json({
            success: true,
            data: resultado,
            message: "Nota de pedido actualizada correctamente."
        });
    } catch (err) {
        console.error("Error en updateNotaPedidoData:", err);
        return res.status(500).json({
            success: false,
            message: err.message || "Error al actualizar la nota de pedido.",
        });
    }
}

export async function facturarNotaPedido(req, res) {
    try {
        const { idNota } = req.params;
        const { idUsuario, idEmpresa, tipoFacturacion, afipData } = req.body;
        
        // Obtener datos de la empresa
        const datosEmpresa = await get_company(idEmpresa);

        const resultado = await facturarNotaPedidoService(idNota, idUsuario, idEmpresa, datosEmpresa, { tipoFacturacion, afipData });
        
        return res.status(200).json({
            success: true,
            data: resultado,
            message: "Nota de pedido facturada con éxito."
        });
    } catch (err) {
        console.error("Error en facturarNotaPedido:", err);
        return res.status(500).json({
            success: false,
            message: "Error al facturar la nota de pedido.",
            error: err.message
        });
    }
}

