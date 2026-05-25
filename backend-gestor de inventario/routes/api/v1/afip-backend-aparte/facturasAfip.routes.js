import { Router } from "express";
import FacturasAfip from '../../../../controllers/backend-afip/facturasAfip.controller.js';

const facturasAfip = Router();
const facturasAfipController = new FacturasAfip();

//obtener el tipo de comprobante con numero, factura A 001, factura B 003, etc
facturasAfip.post("/emitir", facturasAfipController.emitirFacturas);

//recuperar Factura
facturasAfip.get("/recuperar/:idFactura", facturasAfipController.recuperar);

//reintentar factura
facturasAfip.post("/reintentar/:factura", facturasAfipController.reintentar);

//buscador de facturas
facturasAfip.get("/buscar", facturasAfipController.buscar);

//recuperar CAE desde afip
facturasAfip.post("/recCae", facturasAfipController.recCae);

//anular facturas
facturasAfip.post("/anular", facturasAfipController.anular);

export default facturasAfip;
