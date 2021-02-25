const qrcode = require('qrcode');
const { server } = require('../config');

//#region Вспомогательные функции

const getQueueQrCode = async (queueId) => {
    return await qrcode.toDataURL(
        `http://${server.address}:${server.port}/api/v2/queues?id=${queueId}`
    );
};

//#endregion
