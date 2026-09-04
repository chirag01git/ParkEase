const QRCode = require('qrcode');
const crypto = require('crypto');

const generateQRToken = () => {
  return `PE-${crypto.randomBytes(8).toString('hex')}-${Date.now()}`;
};

const generateQRDataUrl = async (text) => {
  try {
    return await QRCode.toDataURL(text, {
      errorCorrectionLevel: 'H',
      margin: 2,
      width: 256,
    });
  } catch (error) {
    console.error('Error generating QR Code Data URL:', error);
    throw new Error('Failed to generate QR Code');
  }
};

module.exports = {
  generateQRToken,
  generateQRDataUrl,
};
