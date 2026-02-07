
// src/utils/formatCurrency.js
export const formatCurrency = (amount) => {
    const numericAmount = Number(amount);
    if (isNaN(numericAmount)) {
        return '₹ 0.00';
    }

    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(numericAmount).replace('₹', '₹ '); // Ensure space if needed, though default usually has it or not depending on browser. 
    // actually 'en-IN' usually formats as "₹ 1,234.00" or "₹1,234.00". 
    // Let's stick to standard output first.
};
