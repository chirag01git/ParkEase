/**
 * Billing logic calculation:
 * Minimum charge: 1 hour.
 * Duration is rounded UP to the nearest hour.
 * Pricing Rules:
 * - CAR: ₹50 for first hour, ₹30 for every additional hour.
 * - BIKE: ₹30 for first hour, ₹20 for every additional hour.
 */
const calculateBilling = (entryTime, exitTime, vehicleType) => {
  const entryDate = new Date(entryTime);
  const exitDate = new Date(exitTime);

  // Difference in milliseconds
  const diffInMs = exitDate.getTime() - entryDate.getTime();

  // If exit is before entry or within 0 ms, treat as minimum 1 hour
  const hoursCalculated = Math.ceil(diffInMs / (1000 * 60 * 60));
  const durationInHours = Math.max(1, hoursCalculated);

  let amount = 0;
  const type = (vehicleType || 'CAR').toUpperCase();

  if (type === 'CAR') {
    const firstHourRate = 50;
    const additionalHourRate = 30;
    amount = firstHourRate + Math.max(0, durationInHours - 1) * additionalHourRate;
  } else {
    // Default to BIKE pricing
    const firstHourRate = 30;
    const additionalHourRate = 20;
    amount = firstHourRate + Math.max(0, durationInHours - 1) * additionalHourRate;
  }

  return {
    duration: durationInHours,
    amount,
  };
};

module.exports = {
  calculateBilling,
};
