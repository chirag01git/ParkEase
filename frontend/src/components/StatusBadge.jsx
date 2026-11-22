import React from 'react';

const StatusBadge = ({ status }) => {
  if (!status) return null;

  const s = status.toUpperCase();
  let className = 'badge ';

  switch (s) {
    case 'APPROVED':
    case 'AVAILABLE':
    case 'COMPLETED':
    case 'PAID':
    case 'PAYMENT_PAID':
      className += 'badge-approved';
      break;
    case 'PENDING':
    case 'BOOKED':
    case 'PAYMENT_PENDING':
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

  const labels = {
    PAYMENT_PENDING: 'PAYMENT DUE',
    PAYMENT_PAID: 'PAID · RELEASE DUE',
  };
  return <span className={className}>{labels[s] || s}</span>;
};

export default StatusBadge;
