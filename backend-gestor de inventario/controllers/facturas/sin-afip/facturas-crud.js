import path from "path";
import { createSinAfip, getTiketsCompanyServices } from "../../../services/facturas-sin-afip/f_sin_afip_crud_services.js";
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

        const resultadoTicket = await getTiketsCompanyServices(idEmpresa, options);

        return res.status(200).json({
            success: true,
            data: resultadoTicket
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

