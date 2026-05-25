import { Router } from "express";
import AfipControllers from '../../../../controllers/backend-afip/usuarios.controller.js';

const usuario = Router();
const afipControllers = new AfipControllers();

//crear usuario, pasar datos de la empresa, fiscales, de contacto y personalizacion
usuario.post("/crearCompanyAfip", afipControllers.crearCompany);

//
usuario.post("/updateCompany/:idEmpresa", afipControllers.editarCompany);

//obtener ultimo comprobante db local
usuario.post("/comprobantes/ultimodb", afipControllers.ultimoComprobanteLocal)

//obtener ultimo comprobante desde afip
usuario.post("/comprobantes/ultimoafip", afipControllers.ultimoComprobanteAfip)

//crear o actualizar contador 
usuario.post("/comprobantes/contador", afipControllers.updateContador)
//listar puntos e venta del usuario por ultimo comprobante 
usuario.get("/comprobantes/listar/:idUser", afipControllers.listarTodosLosNumeros)
//actualizar numero especifico de comprobante
usuario.post("/comprobantes/actualizar", afipControllers.actualizarNumero)
//sincronizar ultimos comprobantes con afip
usuario.post("/comprobantes/sincronizar", afipControllers.sincronizarContadorDB)
//obtener proximo comprobante local db
usuario.post("/comprobantes/proximo", afipControllers.proximoComprobante)
//incrementar contador reservar numero db
usuario.post("/comprobantes/reservar", afipControllers.reservarNumero)
//eliminar punto de venta de ultimo numero emitido
usuario.delete("/comprobantes/eliminar", afipControllers.eliminarPuntodeventaComprbantes)
//obtener datos de usuario de ultimos comprobantes
usuario.get("/comprobantes/:idUser", afipControllers.obtenerDatosDelUsuarioComprobantes)

//obtener datos de la empresa afip
usuario.get("/empresa/:idEmpresa", afipControllers.obtenerDatosDeEmpresa)
//obtener datos de la empresa afip por id del propietario
usuario.get("/empresaId/:idEmpresa", afipControllers.obtenerDatosDeEmpresa)

export default usuario;
