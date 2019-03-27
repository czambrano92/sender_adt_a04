let controllerBuscador = require('./buscador-mensaje')
let controllerConstructor = require('./constructor')
var orden = "start";
//inicia lector
function start(req, res) {
    orden = "start"
    reader(() => { });
    res.send({ status: "INICIANDO LECTURA ADT_A04" })
}
//detiene lector
function stop(req, res) {
    orden = "stop"
    reader(() => { });
    res.send({ status: "DETENIENDO LECTURA ADT_A04" })
}

//lector
function reader() {
    //procesos a ejecutar :
    new Promise((resolver, rechazar) => {
        console.log('en reader')
        if (orden == "start") {
            controllerBuscador.buscarMensajePendiente((mensajePendiente) => {
                resolver(mensajePendiente);
            })
        } else {
            resolver(null);
        }
    }).then((mensajePendiente) => {
        console.log('en mensaje pendiente')
        return new Promise((resolver, rechazar) => {
            if (mensajePendiente != null) {
                controllerConstructor.generadorMensaje(mensajePendiente, (ok) => {
                    resolver(ok)
                })
            } else {
                resolver(false)
            }

        })
    })
        .then(() => {
            //ENVIAR MENSAJE Y UPDATEAR ESTADO DE ESTE
            //ESPERAR RESPUESTA Y DEFINIR ESTADO FINAL DEL MENSAJE
        })
        .then((estadoTraspaso) => {
            //cada dos segundos vuelve a leer  
            continuar()
        }).catch(error => {
            console.log("error catch")
            console.log(error)
            continuar()
        })
}

function continuar() {
    if (orden == "start") {
        console.log("LECTOR trabajando")
        setTimeout(() => {
            reader()
        }, 2000);
    } else {
        console.log("*******************************************************************");
        console.log("LECTOR detenido")
        console.log("para iniciar : /start");
        console.log("para detener : /stop");
    }
}

module.exports = {
    start,
    stop
}