import { Router } from "express";
import CreateCredencialesControllers from '../../../../controllers/backend-afip/credenciales.controller.js';

const credenciales = Router();
const createCredencialesControllers = new CreateCredencialesControllers();

//generar KEY y CSR
credenciales.post("/generar", createCredencialesControllers.generarKeyCsr);
//guardar certificado de afip
credenciales.post("/guardarCRT", createCredencialesControllers.guardarCRT);
//obtener TA wsfe
credenciales.post("/obtenerTA", createCredencialesControllers.obtenerTA);
//obtener TA ws_sr_padron_a5
credenciales.post("/obtenerTApadron", createCredencialesControllers.obtenerTApadron);
//verificar acceso afip TAs
credenciales.post("/verificarAcceso", createCredencialesControllers.verificarAccesos);
//consultar cuit
credenciales.post("/consultarCuit", createCredencialesControllers.consultarCuitAfip);
export default credenciales;
