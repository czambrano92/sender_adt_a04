var hl7 = require('simple-hl7');
var env = require('../env_util')
var db = require('../pg-con')
var request = require('request')
// Variables utilizadas en este controlador
var ENV = require('../env_util')
var serverIP = ENV.SERVIP;
var util = require('./util')

//test
function test(req, res) {
    var mensajeJSON = {}

    new Promise((resolver, rechazar) => {
        buscarPersona('0000020191', (persona) => {
            console.log(persona)
            mensajeJSON.idpersona = persona.id_persona
            mensajeJSON.nombrecompleto = persona.nombres + " " + persona.primer_apellido + " " + persona.segundo_apellido
            mensajeJSON.documento = persona.run + '-' + persona.digito_verificador
            mensajeJSON.sexo = (persona.sexo_cod == '01' ? 'M' : (persona.sexo_cod == '02' ? 'F' : 'D'))
            mensajeJSON.direccion = persona.catalogo_direccion[0].nombre_via;
            mensajeJSON.comunacodigo = persona.catalogo_direccion[0].comuna_codigo;
            mensajeJSON.paiscod = persona.pais_cod;

            resolver(true)
        })
    })
        .then(() => {
            return new Promise((resolver, rechazar) => {
                util.buscarComunaById(mensajeJSON.comunacodigo, (comuna) => {
                    mensajeJSON.comunadescripcion = comuna.comunadesc
                    resolver(true)
                })
            })
        })
        .then(() => {
            return new Promise((resolver, rechazar) => {
                util.buscarPaisById(mensajeJSON.paiscod, (pais) => {
                    mensajeJSON.pais = pais.glosa.substring(0, 2)
                    resolver(true)
                })
            })
        })
        .then(() => {
            return new Promise((resolver, rechazar) => {
                util.fechaString((fecha) => {
                    mensajeJSON.fechaString = fecha
                    resolver(true)
                })
            })
        })
        .then(() => {
            return new Promise((resolver, rechazar) => {
                var msg = new hl7.Message(
                    "HIS",
                    "HBL",
                    "CARESTREAM",
                    "RIS-CSH",
                    mensajeJSON.fechaString,
                    "",
                    ["ADT", "A04"], //This field has 2 components
                    "121",
                    "P",
                    "2.5"
                );

                msg.addSegment('PID',
                    "",
                    "",
                    [mensajeJSON.idpersona, "", "", "", "CSH"],
                    [mensajeJSON.documento, "CSH~0", "", "", "CSH"],
                    mensajeJSON.nombrecompleto + "^ADT 1",
                    "",
                    20011220,
                    mensajeJSON.sexo,
                    "",
                    "",
                    [mensajeJSON.direccion, "", mensajeJSON.comunadescripcion, "", "", mensajeJSON.pais],
                    7776622, //preguntar
                    ["", "", "", "", "", "", ""],
                    ["", "", "", "", "", "", ""],
                    "",
                    "",
                    "",
                    "F^A", // preguntar
                    ""
                )
                resolver(true)
            })
        })
        .then(() => {
            res.send(mensajeJSON)
        })
}

function senderhl7(req, res) {

    /*crear "cliente" 
    es quien tiene los datos hacia donde se enviará mensaje hl7 */
    var client = hl7.Server.createTcpClient('localhost', 7777);

    /* msg
    mensaje quien lleva los datos del paciente */
    var msg = new hl7.Message(
        "HIS",
        "HBL",
        "CARESTREAM",
        "RIS-CSH",
        "20170116112629",
        "",
        ["ADT", "A04"], //This field has 2 components
        "121",
        "P",
        "2.5"
    );
    msg.addSegment('PID',
        "",
        "",
        [3085590, "", "", "", "CSH"],
        ["28998112-8", "CSH~0", "", "", "CSH"],
        "PACIENTE PRUEBA ^ADT 1",
        "",
        20011220,
        "M",
        "",
        "",
        ["FIDEL OTEIZA", "", "SANTIAGO", "", "", "CH"],
        7776622,
        ["", "", "", "", "", "", ""],
        ["", "", "", "", "", "", ""],
        "",
        "",
        "",
        "F^A",
        ""
    )

    let mensaje_texto = JSON.stringify(msg);
    let pk = Date().toString();

    /* registrar mensaje generado sin enviar 
    en base de datos para llevar control */
    // db.none('INSERT INTO main_hl7.main_saliente(' +
    //     'id_main_saliente,fecha_generado, fecha_completado, mensaje_hl7, ack_completado, estado_general, codigo_emisor, codigo_receptor) ' +
    //     ' VALUES ($1, $2, $3, $4, $5, $6, $7,$8); ', [
    //         pk,
    //         new Date(),
    //         null,
    //         msg,
    //         null,
    //         false,
    //         '01',
    //         '02'
    //     ]);

    console.log('******sending message*****')

    /* enviar mensaje */
    client.send(msg, function (err, ack) {
        if (ack) {
            console.log('******ack received*****')
            console.log(ack.log());
            //editar registro bd de mensaje para notificar correcto ack
        } else {
            if (err) {
                console.log('***error***')
                console.log(err)
                //editar notificando error en mensaje
            }
        }

    });

    res.send({ status: 'ok' })
}

function generadorMensaje(mensajePendiente, callback) {
    new Promise((resolver, rechazar) => {
        //BUSCAR PERSONA
        let datos = mensajePendiente.mensaje_datos_json
        buscarPersona(datos.id_persona, (persona) => {
            resolver(persona)
        });
    })
        .then((persona) => {
            return Promise((resolver, rechazar) => {
                //ARMAR MENSAJE
                armarMensaje(persona, (msgHL7) => {
                    callback(msgHL7)
                });
            })
        })
        .then((msgHL7)=>{
            //INSERTAR EN BASE DE DATOS Y CAMBIAR ESTADO DE MENSAJE
        })
        .then(()=>{
            //RESPONDER CALLBACK
        })
        .catch(() => {
            //registrar error
            callback(msgHL7)
        })
}

function buscarPersona(id_paciente, callback) {
    console.log('en buscar persona')
    new Promise((resolver, rechazar) => {
        proToken((token) => {
            let tokenOk = null;
            tokenOk = token
            resolver(tokenOk)
        })
    })
        .then((tokenOk) => {
            console.log('consultapersona')
            var url_idpersona = serverIP + ':' + "3714/persona/" + id_paciente;
            var headersMDB = {
                'User-Agent': 'Super Agent/0.0.1',
                'Content-Type': 'application/x-www-form-urlencoded',
                'x-access-token': tokenOk
            }
            var optionsMDB = {
                url: url_idpersona,
                method: 'GET',
                headers: headersMDB,
                timeout: 1500
            }
            request(optionsMDB, url_idpersona, function (error, response, body) { })
                .on('data', function (data) {
                    let dataParser = JSON.parse(data)
                    let persona = dataParser.persona;
                    callback(persona)
                }).on('error', () => {
                    callback(null)
                })
        }).catch((error) => {
            console.log('catch promise')
            console.log(error)
            callback(null)
        });
}

function proToken(callback) {
    var headers = {
        'User-Agent': 'Super Agent/0.0.1',
        'Content-Type': 'application/x-www-form-urlencoded'
    }
    var options = {
        url: serverIP + ':' + '3714/authenticate',
        method: 'POST',
        headers: headers,
        timeout: 1000,
        form: { 'rut': '18062538-0', 'clave': '123456' }
    }
    console.log('antes de request token')
    console.log(options)
    request(options, function (error, response, body) { }).on('data', function (data) {
        console.log('token ok')
        let dataParser = JSON.parse(data)
        let token = dataParser.token
        callback(token)
    }).on('error', () => {
        console.log('catch token')
        callback(null)
    })

}

function armarMensaje(persona, callback) {
    var mensajeJSON = {}

    new Promise((resolver, rechazar) => {
        //setea valores de persona listos
        mensajeJSON.idpersona = persona.id_persona
        mensajeJSON.nombrecompleto = persona.nombres + " " + persona.primer_apellido + " " + persona.segundo_apellido
        mensajeJSON.documento = persona.run + '-' + persona.digito_verificador
        mensajeJSON.sexo = (persona.sexo_cod == '01' ? 'M' : (persona.sexo_cod == '02' ? 'F' : 'D'))
        mensajeJSON.direccion = persona.catalogo_direccion[0].nombre_via;
        mensajeJSON.comunacodigo = persona.catalogo_direccion[0].comuna_codigo;
        mensajeJSON.paiscod = persona.pais_cod;
        resolver(true)
    })
        .then(() => {
            //busca comuna
            return new Promise((resolver, rechazar) => {
                util.buscarComunaById(mensajeJSON.comunacodigo, (comuna) => {
                    mensajeJSON.comunadescripcion = comuna.comunadesc
                    resolver(true)
                })
            })
        })
        .then(() => {
            //busca pais
            return new Promise((resolver, rechazar) => {
                util.buscarPaisById(mensajeJSON.paiscod, (pais) => {
                    mensajeJSON.pais = pais.glosa.substring(0, 2)
                    resolver(true)
                })
            })
        })
        .then(() => {
            //fecha en string y solo numeros
            return new Promise((resolver, rechazar) => {
                util.fechaString((fecha) => {
                    mensajeJSON.fechaString = fecha
                    resolver(true)
                })
            })
        })
        .then(() => {
            //arma mensaje
            return new Promise((resolver, rechazar) => {
                var msgHL7 = new hl7.Message(
                    "HIS",
                    "HBL",
                    "CARESTREAM",
                    "RIS-CSH",
                    mensajeJSON.fechaString,
                    "",
                    ["ADT", "A04"], //This field has 2 components
                    "121",
                    "P",
                    "2.5"
                );

                msgHL7.addSegment('PID',
                    "",
                    "",
                    [mensajeJSON.idpersona, "", "", "", "CSH"],
                    [mensajeJSON.documento, "CSH~0", "", "", "CSH"],
                    mensajeJSON.nombrecompleto + "^ADT 1",
                    "",
                    20011220,
                    mensajeJSON.sexo,
                    "",
                    "",
                    [mensajeJSON.direccion, "", mensajeJSON.comunadescripcion, "", "", mensajeJSON.pais],
                    7776622, //preguntar
                    ["", "", "", "", "", "", ""],
                    ["", "", "", "", "", "", ""],
                    "",
                    "",
                    "",
                    "F^A", // preguntar
                    ""
                )
                resolver(msgHL7)
            })
        })
        .then((msgHL7) => {
            callback(msgHL7)
        })
}
module.exports = {
    senderhl7,
    generadorMensaje,
    test
}