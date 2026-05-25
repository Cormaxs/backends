import {loginUser_services, registerUser_services, updateUser_services, deleteUser_services, get_user_id} from '../../services/auth_services.js';
//import {create_user_folder} from '../../services/create-directories/create_folder.js';


export async function login(req, res) {
  try {
      const { username, password } = req.body;
      const user = await loginUser_services(username, password);
      return res.status(200).json(user); // O un token JWT aquí
  } catch (error) {
      console.error(`Error en el controlador login: ${error.message}`);
      return res.status(401).json({ error: "Usuario o contraseña incorrectos." });
  }
}
 
export async function register(req, res) {
  try {
      const datos = req.body;
      const creado = await registerUser_services(datos);
      // Si el usuario se creó, intenta crear la carpeta
        if (creado) {
            // Aquí podrías llamar a create_user_folder(creado.id) si quieres crear una carpeta para el usuario
            return res.status(201).json({ message: "Usuario registrado correctamente.", user: creado });
        }
      return res.status(400).json({ error: "No se pudo completar el registro del usuario." });
  } catch (error) {
      console.error(`Error en el controlador register para '${req.body.username || "desconocido"}':`, error.message);
      if (error.message.includes("El nombre de usuario ya está en uso.")) {
          return res.status(409).json({ error: error.message }); // 409 Conflict
      } else if (error.message) {
          return res.status(409).json({ error: "El correo electronico ya esta en uso" });
      } else {
          return res.status(500).json({ error: "Error desconocido al registrar el usuario. Inténtalo de nuevo más tarde." });
      }
  }
}

export async function update(req, res) {
  try {
      const idUser = req.params.idUser; 
      const datos = req.body;
      const actualizados = await updateUser_services(idUser, datos);
      if (!actualizados) {
          return res.status(404).json({ error: "Usuario no encontrado para actualizar." });
      }
      return res.status(200).json({ message: "Usuario actualizado correctamente.", user: actualizados });
  } catch (error) {
      console.error(`Error en el controlador update para idUser ${req.params.idUser || 'desconocido'}:`, error.message);
      if (error.message.includes("ID de usuario es requerido")) {
          return res.status(400).json({ error: error.message });
      } else if (error.message.includes("No se pudo actualizar el usuario. El usuario no existe o no se realizaron cambios.")) {
          return res.status(404).json({ error: error.message }); // Podría ser 404 si el servicio indica que no existe
      } else {
          return res.status(500).json({ error: "No se pudo actualizar el usuario debido a un error interno." });
      }
  }
}

export async function deleteUser(req, res) {
  try {
      const id = req.params.id;
      const eliminado = await deleteUser_services(id);
      if (!eliminado) {
          return res.status(404).json({ error: "Usuario no encontrado para eliminar." });
      }
      return res.status(200).json({ message: "Usuario eliminado correctamente.", user: eliminado });
  } catch (error) {
      console.error(`Error en el controlador deleteUser para ID ${req.params.id || 'desconocido'}:`, error.message);
      if (error.message.includes("ID de usuario es requerido")) {
          return res.status(400).json({ error: error.message });
      } else if (error.message.includes("No se pudo eliminar el usuario. El usuario no existe o ya ha sido eliminado.")) {
          return res.status(404).json({ error: error.message }); // Podría ser 404
      } else {
          return res.status(500).json({ error: "No se pudo eliminar el usuario debido a un error interno." });
      }
  }
}

export async function getUserId(req, res){
  try{
    const {id} = req.body;
    const result = await get_user_id(id);
    if(result){
       return res.status(200).send({result});
    } return res.status(404).send({error: "Usuario no encontrado"});

  }catch(err){
    console.error("Error al obtener el usuario por ID:", err);
    res.status(500).send({ error: "Error interno del servidor al obtener el usuario" });
  }
}


