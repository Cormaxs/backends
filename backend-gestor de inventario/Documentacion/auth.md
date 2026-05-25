# TODO RELACIONADO A AUTENTICACION

## Endpoints  

POST
Reciben los usuarios, datos : username , password, email, ect.  

```bash
/auth/register
```

Recibe un JSON

```bash
{
    "username": "Facturita",
    "password": "FacturitaRica@"
}
```

----------------------------------------------------

POST  
Recibe los datos : username , password.  

```bash
/auth/login
```

Recibe un JSON  

```bash
{
    "username": "Facturita",
    "password": "FacturitaRica@"
}
```  

----------------------------------------------------

POST  
Recib los datos del usuario, puedo mandar solo los que quiero cambiar, los que no mande no se cambian.  

```bash
/auth/update
```

ejemplo  

```bash
{
    "username": "Facturita12"
}
```  

----------------------------------------------------

DELETE  
Recibe el _id del usuario a eliminar.  

```bash
/auth/delete
```

ejemplo  

```bash
{
    "_id": "6844917754c23c79e50a3c99"
}
```  

----------------------------------------------------
