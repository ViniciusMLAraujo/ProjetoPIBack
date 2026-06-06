import Jimp from 'jimp'
import jsQR from 'jsqr'

export async function decodeQRFromBuffer(buffer: Buffer): Promise<string> {
  const image = await Jimp.read(buffer)
  const { data, width, height } = image.bitmap

  // jsQR espera Uint8ClampedArray (RGBA)
  const uint8 = new Uint8ClampedArray(data)
  const code = jsQR(uint8, width, height)

  if (!code) throw new Error('QR Code não encontrado na imagem')
  return code.data
}
