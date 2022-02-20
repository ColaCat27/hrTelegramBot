module.exports = function date() {
    return new Date().toLocaleString("ru-RU", {timeZone: "Europe/Moscow"});
}