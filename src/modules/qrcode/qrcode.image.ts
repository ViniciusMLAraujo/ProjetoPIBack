import Jimp from 'jimp'
import jsQR from 'jsqr'

/**
 * Decodifica um QR Code a partir de um buffer de imagem (JPEG/PNG).
 *
 * Tenta primeiro na imagem original. Se falhar, reprocessa com
 * aumento de contraste + grayscale para melhorar a leitura de
 * fotos tiradas em condições de iluminação variável (tela de celular).
 */
export async function decodeQRFromBuffer(buffer: Buffer): Promise<string> {
  if (!buffer || buffer.length === 0) {
    throw new Error('Buffer de imagem vazio')
  }

  let image: Jimp
  try {
    image = await Jimp.read(buffer)
  } catch (err: any) {
    throw new Error(`Falha ao decodificar imagem: ${err.message}`)
  }

  // Tentativa 1: imagem original
  const result1 = tryDecode(image)
  if (result1) return result1

  // Tentativa 2: grayscale + contraste alto (ajuda com reflexo de tela)
  const enhanced = image.clone().grayscale().contrast(0.5)
  const result2 = tryDecode(enhanced)
  if (result2) return result2

  // Tentativa 3: redimensiona para 400px (QR pequeno ou muito grande)
  const resized = image.clone().scaleToFit(400, 400).grayscale().contrast(0.3)
  const result3 = tryDecode(resized)
  if (result3) return result3

  throw new Error('QR Code não encontrado na imagem. Verifique iluminação e enquadramento.')
}

function tryDecode(image: Jimp): string | null {
  const { data, width, height } = image.bitmap
  const uint8 = new Uint8ClampedArray(data)
  const code = jsQR(uint8, width, height, {
    inversionAttempts: 'attemptBoth', // tenta leitura normal e invertida
  })
  return code ? code.data : null
}
