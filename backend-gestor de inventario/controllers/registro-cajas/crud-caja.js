import {abrirCajaServices, cerrarCajaServices, agregarTransaccionCaja, getCajaById, getCajasByIdEmpresa} from "../../services/cajas/crud-cajas-services.js";
import CajaRepository from "../../repositories/repo_cajas.js";



export async function abrirCaja(req, res){
    try{
        const abierta = await abrirCajaServices(req.body);
        return res.status(201).json({ message: 'Caja abierta correctamente', data: abierta });
    }catch(err){
        console.error('Error al abrir caja:', err);
        return res.status(500).json({ message: err.message || 'Error al abrir la caja', error: err });
    }
}

export async function cerrarCaja(req, res){
    const {idCaja} = req.params;
    const {montoFinalReal} = req.body;  
    const montoFinalRealNumber = parseFloat(montoFinalReal);
    req.body.montoFinalReal = montoFinalRealNumber; // Aseguramos que sea un número
    try{
        const cerrada = await cerrarCajaServices(idCaja ,req.body);
        return res.status(200).json({ message: 'Caja cerrada correctamente', data: cerrada });
    }catch(err){
        console.error('Error al cerrar caja:', err);
        return res.status(500).json({ message: err.message || 'Error al cerrar la caja', error: err });
    }
}


    export async function agregarTransaccionCajaController(req, res) {
        try {
            const { idCaja } = req.params; // ID de la caja a la que se agrega la transacción
            const transaccionData = req.body; // { tipo, monto, descripcion, referencia? }
    
            const cajaActualizada = await agregarTransaccionCaja(idCaja, transaccionData);
            res.status(200).json({
                message: "Transacción registrada exitosamente.",
                caja: cajaActualizada
            });
        } catch (err) {
            console.error("Error en agregarTransaccionCajaController:", err.message);
            res.status(err.message.includes('inválido') || err.message.includes('encontrada') || err.message.includes('cerrada') || err.message.includes('positivo') ? 400 : 500).json({
                message: "Error al registrar la transacción.",
                error: err.message
            });
        }
    }
    
    // Opcional: Controlador para obtener una caja específica (útil para ver su estado actual)
    export async function getCajaByIdController(req, res) {
        try {
            const { idCaja } = req.params; // ID de la caja a obtener
            const encontrada = await getCajaById(idCaja);
            res.status(200).json(encontrada);
        } catch (err) {
            console.error("Error en getCajaByIdController:", err.message);
            res.status(err.message.includes('inválido') ? 400 : 500).json({
                message: "Error al obtener la caja.",
                error: err.message
            });
        }
    }

    //obtiene todas las cajas de la empresa
    export async function getCajaByIdEmpresaController(req, res) {
        try {
            const { idEmpresa } = req.params; // ID de la caja a obtener
            const filtros = req.query;
            
            const encontrada = await getCajasByIdEmpresa(idEmpresa, filtros);
            res.status(200).json(encontrada);
        } catch (err) {
            console.error("Error en getCajaByIdController:", err.message);
            res.status(err.message.includes('inválido') ? 400 : 500).json({
                message: "Error al obtener la caja.",
                error: err.message
            });
        }
    }

    export async function getResumenCajaController(req, res) {
        try {
            const { idCaja } = req.params;
            const resumen = await CajaRepository.getResumenCaja(idCaja);
            res.status(200).json(resumen);
        } catch (err) {
            console.error("Error en getResumenCajaController:", err.message);
            res.status(500).json({ message: "Error al obtener resumen de caja", error: err.message });
        }
    }
