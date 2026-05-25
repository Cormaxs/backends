import ParametrosAfip from '../../services/backend-afip/parametros.service.js';


const parametros = new ParametrosAfip();


export default class ParametrosControllersAfip{

 async tipoComprobante(req, res) {
    
    try{
        //pasar todos los datos completos al otro backend
        const {id, cuit, servicio} = req.body;
        const resultado = await parametros.tipoComprobante(id, cuit, servicio);
        //guardar el _id devuelto para tener los datos fiscales, guardar en propietario la referencia l id
        res.json(resultado);
    }catch(error){
        console.error(error);
        res.status(500).json({message: "Error al crear el usuario"});
    }
}


async tipoConcepto(req, res) {
    
    try{
        //pasar todos los datos completos al otro backend
        const {id, cuit, servicio} = req.body;
        const resultado = await parametros.tipoConcepto(id, cuit, servicio);
        //guardar el _id devuelto para tener los datos fiscales, guardar en propietario la referencia l id
        res.json(resultado);
    }catch(error){
        console.error(error);
        res.status(500).json({message: "Error al crear el usuario"});
    }
}


async tipodni(req, res) {
    
    try{
        //pasar todos los datos completos al otro backend
        const {id, cuit, servicio} = req.body;
        const resultado = await parametros.tipodni(id, cuit, servicio);
        //guardar el _id devuelto para tener los datos fiscales, guardar en propietario la referencia l id
        res.json(resultado);
    }catch(error){
        console.error(error);
        res.status(500).json({message: "Error al crear el usuario"});
    }
}



async tipoiva(req, res) {
    
    try{
        //pasar todos los datos completos al otro backend
        const {id, cuit, servicio} = req.body;
        const resultado = await parametros.tipoiva(id, cuit, servicio);
        //guardar el _id devuelto para tener los datos fiscales, guardar en propietario la referencia l id
        res.json(resultado);
    }catch(error){
        console.error(error);
        res.status(500).json({message: "Error al crear el usuario"});
    }
}



async tipomoneda(req, res) {
    
    try{
        //pasar todos los datos completos al otro backend
        const {id, cuit, servicio} = req.body;
        const resultado = await parametros.tipomoneda(id, cuit, servicio);
        //guardar el _id devuelto para tener los datos fiscales, guardar en propietario la referencia l id
        res.json(resultado);
    }catch(error){
        console.error(error);
        res.status(500).json({message: "Error al crear el usuario"});
    }
}


async ultCbteAfip(req, res) {
    
    try{
        //pasar todos los datos completos al otro backend
        const {id, cuit, servicio, puntoVenta, tipoComprobante} = req.body;
        const resultado = await parametros.ultCbteAfip(id, cuit, servicio, puntoVenta, tipoComprobante);
        //guardar el _id devuelto para tener los datos fiscales, guardar en propietario la referencia l id
        res.json(resultado);
    }catch(error){
        console.error(error);
        res.status(500).json({message: "Error al crear el usuario"});
    }
}

}

