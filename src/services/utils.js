// Приведение секунд к виду: H ч? M мин? S сек
const secondsFormattedHMS = (seconds) => {
    if (seconds > 3600) {
        const hours = Math.trunc(seconds / 3600);
        const minutes = Math.trunc((seconds - hours * 3600) / 60);
        if (minutes) {
            return `${hours} ч ${minutes} мин`;
        }
        return `${hours} ч`;
    }
    if (seconds > 60) {
        return `${Math.trunc(seconds / 60)} мин`;
    }
    return `${seconds} сек`;
};

module.exports = {
    secondsFormattedHMS,
};
