import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { X, QrCode, Copy, Check } from 'lucide-react';

const QrModal = ({ booking, isOpen, onClose }) => {
  const [copied, setCopied] = React.useState(false);

  if (!isOpen || !booking) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(booking.qrCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ textAlign: 'center' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <h3 style={{ fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <QrCode size={22} color="#3b82f6" /> Parking Pass QR Ticket
          </h3>
          <button className="btn btn-outline" style={{ padding: '0.3rem 0.5rem' }} onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div style={{ background: '#fff', padding: '1.25rem', borderRadius: '12px', display: 'inline-block', marginBottom: '1rem' }}>
          <QRCodeSVG value={booking.qrCode} size={200} level="H" includeMargin={true} />
        </div>

        <div style={{ background: '#0f172a', padding: '0.85rem', borderRadius: '8px', marginBottom: '1rem', textAlign: 'left', fontSize: '0.85rem' }}>
          <p><strong>Booking ID:</strong> {booking._id}</p>
          <p><strong>Mall:</strong> {booking.mall?.name}</p>
          <p><strong>Slot:</strong> {booking.slot?.slotNumber || 'Allocated'}</p>
          <p><strong>Vehicle:</strong> {booking.vehicleNumber} ({booking.vehicleType})</p>
          <p><strong>Token:</strong> <code style={{ color: '#38bdf8', wordBreak: 'break-all' }}>{booking.qrCode}</code></p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
          <button className="btn btn-secondary" onClick={handleCopy}>
            {copied ? <Check size={16} color="#34d399" /> : <Copy size={16} />}
            {copied ? 'Copied Token!' : 'Copy Token'}
          </button>
          <button className="btn btn-primary" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

export default QrModal;
