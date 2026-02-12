
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

    const totalSeconds = Math.round(totalHours * 3600);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (seconds > 0) {
        return `${hours} hr ${minutes} min ${seconds} sec`;
    }

    return `${hours} hr ${minutes} min`;
};
