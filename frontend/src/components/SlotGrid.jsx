import React from 'react';
import { Car, Bike, ShieldAlert } from 'lucide-react';

const SlotGrid = ({ slots }) => {
  if (!slots || slots.length === 0) {
    return (
      <div className="alert alert-info" style={{ marginTop: '1rem' }}>
        <ShieldAlert size={18} /> No parking slots configured yet.
      </div>
    );
  }

  return (
    <div className="slot-grid">
      {slots.map((slot) => {
        const isAvailable = slot.status === 'AVAILABLE';
        return (
          <div
            key={slot._id || slot.slotNumber}
            className={`slot-box ${slot.status}`}
            title={`Slot: ${slot.slotNumber} | Status: ${slot.status} | Vehicle: ${slot.vehicleType}`}
          >
            <div style={{ marginBottom: '0.2rem' }}>
              {slot.vehicleType === 'BIKE' ? <Bike size={20} /> : <Car size={20} />}
            </div>
            <div className="slot-num">{slot.slotNumber}</div>
            <div className="slot-type">{slot.vehicleType}</div>
          </div>
        );
      })}
    </div>
  );
};

export default SlotGrid;
