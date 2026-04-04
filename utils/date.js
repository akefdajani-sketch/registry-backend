function toISODate(date) {
  return new Date(date).toISOString().slice(0, 10);
}

function addMonths(date, months) {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

function monthLabel(date) {
  return new Date(date).toLocaleString('en-US', { month: 'long', year: 'numeric' });
}

module.exports = { toISODate, addMonths, monthLabel };
