import { Router } from "express";
import ParametrosControllersAfip from '../../../../controllers/backend-afip/parametros.controller.js';

const parametros = Router();
const parametrosControllersAfip = new ParametrosControllersAfip();

//obtener el tipo de comprobante con numero, factura A 001, factura B 003, etc
parametros.post("/tipoComprobante", parametrosControllersAfip.tipoComprobante);

//tipo de concepto
parametros.post("/tipoConcepto", parametrosControllersAfip.tipoConcepto);
//tipo de documento
parametros.post("/tipodni", parametrosControllersAfip.tipodni);
//tipos iva
parametros.post("/tipoiva", parametrosControllersAfip.tipoiva);
//tipo moneda
parametros.post("/tipomoneda", parametrosControllersAfip.tipomoneda);
//ultimo comprobante desde afip
parametros.post("/ultCbteAfip", parametrosControllersAfip.ultCbteAfip);
export default parametros;
