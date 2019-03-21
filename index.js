let app = require('./app')
let env = require('./env_util')
let db = require('./pg-promise/pg-con')

db.db.connect()
.then(()=>{
    console.log('conexion bd exitosa')
    app.listen(env.puerto, function () {
        //confirma funcionamiento en consola
        console.log(`API SENDER ADT-A04 FUNCIONANDO EN HTTP://${env.servidor_api}:${env.puerto}`);
    });
})
.catch(()=>{
    console.log('conexion bd fallida')
})


