import { Router } from "express";
import {sinAfip, getTiketsCompany, getTicketPdf, createNotaPedido, getNotasPedido, updateNotaPedidoStatus, facturarNotaPedido, getNotaPedidoPdf, updateNotaPedidoData} from "../../../controllers/facturas/sin-afip/facturas-crud.js";

const facturas_sin_afip = Router();

facturas_sin_afip.post("/create/:idUser",sinAfip )
facturas_sin_afip.get("/get/all/:idEmpresa",getTiketsCompany);
facturas_sin_afip.get("/pdf/:idTicket", getTicketPdf);

// Notas de Pedido
facturas_sin_afip.post("/nota-pedido", createNotaPedido);
facturas_sin_afip.get("/nota-pedido/:idEmpresa", getNotasPedido);
facturas_sin_afip.put("/nota-pedido/:idNota/status", updateNotaPedidoStatus);
facturas_sin_afip.put("/nota-pedido/:idNota/data", updateNotaPedidoData);
facturas_sin_afip.post("/nota-pedido/:idNota/facturar", facturarNotaPedido);
facturas_sin_afip.get("/nota-pedido/pdf/:idNota", getNotaPedidoPdf);

export default facturas_sin_afip;
