import React from 'react';

const StatusBadge = ({ status }) => {
  if (!status) return null;

  const s = status.toUpperCase();
  let className = 'badge ';

  switch (s) {
    case 'APPROVED':
    case 'AVAILABLE':
    case 'COMPLETED':
      className += 'badge-approved';
      break;
    case 'PENDING':
    case 'BOOKED':
      className += 'badge-pending';
      break;
    case 'REJECTED':
    case 'OCCUPIED':
    case 'CANCELLED':
      className += 'badge-rejected';
      break;
    case 'ACTIVE':
      className += 'badge-active';
      break;
    default:
      className += 'badge-pending';
  }

  return <span className={className}>{s}</span>;
};

export default StatusBadge;
