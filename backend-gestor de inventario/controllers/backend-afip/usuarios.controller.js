import AfipUsers from '../../services/backend-afip/usuarios.service.js';


const afipUsers = new AfipUsers();


export default class AfipControllers{

 async crearCompany(req, res) {
    
    try{
        //pasar todos los datos completos al otro backend
        const {empresa, idPropietario, iduser} = req.body;
        const resultado = await afipUsers.createCompany(empresa, idPropietario, iduser);
        //guardar el _id devuelto para tener los datos fiscales, guardar en propietario la referencia l id
        res.json(resultado);
    }catch(error){
        console.error(error);
        res.status(500).json({message: "Error al crear el usuario"});
    }
}


async editarCompany(req, res) {
    
    try{
        //pasar todos los datos completos al otro backend
      
       const empresa = req.body; //no descomprimir {}
       const {idEmpresa} = req.params;
        const resultado = await afipUsers.editarCompany(empresa, idEmpresa);
        //guardar el _id devuelto para tener los datos fiscales, guardar en propietario la referencia l id
        res.json(resultado);
    }catch(error){
        console.error(error);
        res.status(500).json({message: "Error al actualizar datos "});
    }
}

    async ultimoComprobanteLocal(req, res){
        try{
            const resultado = await afipUsers.ultimoComprobanteLocal(req.body)
            res.send(resultado);
        }catch(error){
            console.error("Error en ultimoComprobanteLocal:", error);
            res.status(500).json({ message: "Error al obtener último comprobante local" });
        }
    }

    async ultimoComprobanteAfip(req, res){
        try{
            const resultado = await afipUsers.ultimoComprobanteAfip(req.body)
            res.send(resultado);
        }catch(error){
            console.error("Error en ultimoComprobanteAfip:", error);
            res.status(500).json({ message: "Error al obtener último comprobante AFIP" });
        }
    }


    async updateContador(req, res){
        try{
            const resultado = await afipUsers.updateContador(req.body)
            res.send(resultado);
        }catch(error){
            console.error("Error en updateContador:", error);
            res.status(500).json({ message: "Error al actualizar contador" });
        }
    }

    async listarTodosLosNumeros(req, res){
        try{
            const {idUser} = req.params;
            const resultado = await afipUsers.listarPuntosDeVenta(idUser)
            res.send(resultado);
        }catch(error){
            console.error("Error en listarTodosLosNumeros:", error);
            res.status(500).json({ message: "Error al listar números" });
        }
    }

    async actualizarNumero(req, res){
        try{
            const resultado = await afipUsers.actualizarNumero(req.body)
            res.send(resultado);
        }catch(error){
            console.error("Error en actualizarNumero:", error);
            res.status(500).json({ message: "Error al actualizar número" });
        }
    }

    async sincronizarContadorDB(req, res){
        try{
            const resultado = await afipUsers.sincronizarContadorDB(req.body)
            res.send(resultado);
        }catch(error){
            console.error("Error en sincronizarContadorDB:", error);
            res.status(500).json({ message: "Error al sincronizar contador" });
        }
    }

    async proximoComprobante(req, res){
        try{
            const resultado = await afipUsers.proximoComprobante(req.body)
            res.send(resultado);
        }catch(error){
            console.error("Error en proximoComprobante:", error);
            res.status(500).json({ message: "Error al obtener próximo comprobante" });
        }
    }

    async reservarNumero(req, res){
        try{
            const resultado = await afipUsers.reservarNumero(req.body)
            res.send(resultado);
        }catch(error){
            console.error("Error en reservarNumero:", error);
            res.status(500).json({ message: "Error al reservar número" });
        }
    }

    async eliminarPuntodeventaComprbantes(req, res){
        try{
            const resultado = await afipUsers.eliminarPuntodeventaComprbantes(req.body)
            res.send(resultado);
        }catch(error){
            console.error("Error en eliminarPuntodeventaComprbantes:", error);
            res.status(500).json({ message: "Error al eliminar comprobantes de punto de venta" });
        }
    }

    async obtenerDatosDelUsuarioComprobantes(req, res){
        try{
            const {idUser} = req.params;
            const resultado = await afipUsers.obtenerDatosDelUsuarioComprobantes(idUser)
            res.send(resultado);
        }catch(error){
            console.error("Error en obtenerDatosDelUsuarioComprobantes:", error);
            res.status(500).json({ message: "Error al obtener datos de comprobantes del usuario" });
        }
    }

    async obtenerDatosDeEmpresa(req, res){
        try{
            const {idEmpresa} = req.params;
            const resultado = await afipUsers.obtenerDatosDeEmpresa(idEmpresa)
            res.send(resultado);
        }catch(error){
            console.error("Error en obtenerDatosDeEmpresa:", error);
            res.status(500).json({ message: "Error al obtener datos de la empresa" });
        }
    }
 }
