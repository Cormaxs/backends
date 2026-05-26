import AfipCredencialesService from '../../services/backend-afip/credenciales.service.js';


const afipCredencialesService = new AfipCredencialesService();


export default class CreateCredencialesControllers{

    async generarKeyCsr(req, res) {
        
        try{
            // Extraer id y datos del cuerpo de la petición
            const { id, datos } = req.body;
            
            if (!id || !datos) {
                return res.status(400).json({ message: "Faltan parámetros requeridos (id o datos)" });
            }

            const resultado = await afipCredencialesService.generarKeyCsr(datos, id);
            res.json(resultado);
        }catch(error){
            console.error("Error en generarKeyCsr:", error);
            res.status(500).json({message: error.message || "Error al generar las credenciales"});
        }
    }


    async guardarCRT(req, res) {
        
        try{
            const { id, certificado } = req.body;

            if (!id || !certificado) {
                return res.status(400).json({ message: "Faltan parámetros requeridos (id o certificado)" });
            }

            const resultado = await afipCredencialesService.guardarCrt(id, certificado);
            res.json(resultado);
        }catch(error){
            console.error("Error en guardarCRT:", error);
            res.status(500).json({message: error.message || "Error al guardar el certificado"});
        }
    }


//token de acceso wsfe
    async obtenerTA(req, res) {
        
        try{
            //pasar todos los datos completos al otro backend
           const {id, cuit, servicio} = req.body;
            const resultado = await afipCredencialesService.obtenerTA(id, cuit, servicio);
            //guardar el _id devuelto para tener los datos fiscales, guardar en propietario la referencia l id
            res.json(resultado);
        }catch(error){
            console.error(error);
            res.status(500).json({message: "Error al obtener ticket de acceso"});
        }
    }


    async obtenerTApadron(req, res) {
        try{
            //pasar todos los datos completos al otro backend
           const {id, cuit, servicio} = req.body;
            const resultado = await afipCredencialesService.obtenerTaPadron(id, cuit, servicio);
            //guardar el _id devuelto para tener los datos fiscales, guardar en propietario la referencia l id
            res.json(resultado);
        }catch(error){
            console.error(error);
            res.status(500).json({message: "Error al obtener ticket de acceso"});
        }
    }

    async verificarAccesos(req, res) {
        try{
            //pasar todos los datos completos al otro backend
           const {id, cuit, servicio} = req.body;
            const resultado = await afipCredencialesService.verificarAccesos(id, cuit, servicio);
            //guardar el _id devuelto para tener los datos fiscales, guardar en propietario la referencia l id
            res.json(resultado);
        }catch(error){
            console.error(error);
            res.status(500).json({message: "Error al obtener ticket de acceso"});
        }
    }


    async consultarCuitAfip(req, res) {
        try{
            //pasar todos los datos completos al otro backend
           const {id, cuit, cuitAConsultar, servicio} = req.body;
            const resultado = await afipCredencialesService.consultarCuitAfip(id, cuit, cuitAConsultar,servicio);
            //guardar el _id devuelto para tener los datos fiscales, guardar en propietario la referencia l id
            res.json(resultado);
        }catch(error){
            console.error(error);
            res.status(500).json({message: "Error al obtener ticket de acceso"});
        }
    }
}
