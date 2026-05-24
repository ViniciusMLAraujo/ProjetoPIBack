const mqtt = require('mqtt')

const client = mqtt.connect('mqtt://localhost:1883')

const payload = JSON.stringify({
  token: 'uuid-qualquer',
  studentId: 'id-qualquer',
  deviceId: 'catraca-01'
})

client.on('connect', () => {
  console.log('Conectado. Publicando...')
  client.publish('catraca/scan', payload, { qos: 1 }, (err) => {
    if (err) console.error('Erro:', err)
    else console.log('Publicado:', payload)
    client.end()
  })
})