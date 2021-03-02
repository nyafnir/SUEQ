/* eslint-disable no-irregular-whitespace */
const config = require('../config');

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

const template = (body) => `
<!DOCTYPE html>
<html>

<head>
    <meta charset="utf-8">
    <title>Письмо от UEQ</title>
    <style>
        body {
            margin: 0;
            padding: 0;
            width: 100%;
            height: 100%;
        }

        .form {
            display: flex;
            justify-content: center;
            flex-direction: column;
            margin: 48px auto 0 auto;
        }

        .coolButton {
            border-radius: 6px;
            border-width: 2px;
            border-color: #000;
            background-color: #fff;
            padding: 12px 27px;
            font-weight: bold;
            font-size: 16px;
            cursor: pointer;
        }

        .coolButton:hover {
            background-color: #efefef;
        }

        .coolButton:active {
            background-color: #bfbfbf;
        }

        .container {
            width: 650px;
            display: flex;
            justify-content: center;
            flex-direction: column;
            margin: 0 auto;
        }

        .logo {
            font-family: Comic Sans MS, cursive;
            font-size: 21px;
        }

        .title {
            text-align: center;
            font-size: 24px;
            font-family: arial;
            margin-top: 40px;
        }

        .message {
            text-align: center;
            font-size: 17px;
            font-family: arial;
            margin-top: 40px;
        }

        .line {
            border-top: 1px solid #DEDEDE;
            background-color: #fc9;
            margin: 48px 11% 0 11%;
        }

        .footer {
            text-align: center;
            margin-top: 32px;
            padding: 0 11%;
            color: #999999;
            font-size: 14px;
            font-family: arial;
        }

    </style>
</head>

<body>
    <div class="container">
        <h3>
            <span class="logo">
                <strong>
                    UEQ
                </strong>
            </span>
        </h3>

        ${body}
        
        <div class="line"></div>


        <span class="footer">
            Universal Electronic Queue - это система очередей для различных заведений, представленная в электронном виде она не требует для владельцев заведний установки очень затратных и крупногабаритных автоматов и экранов контроля очередей, а так же позволяет клиентам в удобстве знать их место и время в очереди, используя это они могут не тратить время в ожидании, а, например, прогуляться с пользой для здоровья.
        </span>
    </div>
</body>

</html>
`;

exports.registrationConfirm = (url) =>
    template(`
        <span class="title">
            <strong>
                Подтверждение почтового адреса
            </strong>
        </span>

        <span class="message">
            У вас ${secondsFormattedHMS(
                config.tokens.emailConfirmedTimeout / 1000
            )}, иначе аккаунт будет удален!
        </span>

        <div class="form">
            <a href="${url}"><input class="coolButton" type="submit" value="Подтвердить почту" /></a>
        </div>
`);

exports.forgotPassword = (url) =>
    template(`
        <span class="title">
            <strong>
                Сброс пароля
            </strong>
        </span>

        <span class="message">
            У вас ${secondsFormattedHMS(
                config.tokens.passwordResetTimeout / 1000
            )}, иначе ссылка перестанет работать!
        </span>

        <div class="form">
            <a href="${url}"><input class="coolButton" type="submit" value="Новый пароль" /></a>
        </div>
`);

exports.resetPassword = (password) =>
    template(`
        <span class="title">
            <strong>
                Пароль сброшен
            </strong>
        </span>

        <span class="message">
            Рекомендуем поменять его на более сложный для безопасности аккаунта!
        </span>

        <div class="form">
            ${password}
        </div>
`);

exports.deleteAccount = (url) =>
    template(`
        <span class="title">
            <strong>
                Восстановление аккаунта
            </strong>
        </span>

        <span class="message">
        У вас ${secondsFormattedHMS(
            config.tokens.accountRescueTimeout / 1000
        )}, иначе аккаунт уже будет безвозвратно удален!
        </span>

        <div class="form">
            <a href="${url}"><input class="coolButton" type="submit" value="Восстановить аккаунт" /></a>
        </div>
`);
