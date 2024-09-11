const response = (res, result, status, message) => {
    const resultPrint = {};
    resultPrint.status = status >= 200 && status < 300 ? "Success" : "Error";
    resultPrint.statusCode = status;
    resultPrint.data = result;
    resultPrint.message = message;
    res.status(status).json(resultPrint);
}

const responsecookies = (res, result, status, message, token, options) => {
    const resultPrint = {};
    resultPrint.status = status >= 200 && status < 300 ? "Success" : "Error";
    resultPrint.statusCode = status;
    resultPrint.data = result;
    resultPrint.message = message;
    res.cookie('dans-token', token, options).status(status).json(resultPrint);
}

module.exports = {
    response,
    responsecookies
};
