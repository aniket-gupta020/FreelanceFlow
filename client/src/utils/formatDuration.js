
/**
 * Formats decimal hours into a "H hr M min" string.
 * Example: 2.5 -> "2 hr 30 min"
 * Example: 0.1 -> "0 hr 6 min"
 * Example: 1.0 -> "1 hr 0 min"
 * 
 * @param {number} totalHours - The duration in decimal hours
 * @returns {string} - Formatted string
 */
export const formatDuration = (totalHours) => {
    if (isNaN(totalHours) || totalHours < 0) return "0 hr 0 min";

    const hours = Math.floor(totalHours);
    const minutes = Math.round((totalHours - hours) * 60);

    // Handle edge case where rounding minutes makes it 60
    if (minutes === 60) {
        return `${hours + 1} hr 0 min`;
    }

    return `${hours} hr ${minutes} min`;
};
