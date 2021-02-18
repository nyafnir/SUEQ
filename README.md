# SUEQ | Server Universal Electronic Queue

Сервер универсальной электронной очереди

<p>
<img src="https://img.shields.io/github/package-json/v/NyafiRawr/SUEQ" alt="GitHub package.json version" />
<a href="https://github.com/NyafiRawr/SUEQ/pulls"><img src="https://img.shields.io/github/issues-pr/NyafiRawr/SUEQ" alt="GitHub pull requests" /></a>
<p/><p>
<p/>


Содержание
============

<!--ts-->
   * [Как запустить?](./README.md#Инструкция-по-запуску)
   * [Как создать базу данных и её пользователя в MySQL?](./README.md#Создание-базы-данных-в-MySQL)
   * [Маршруты по которым можно общаться с сервером](./README.md#Маршруты)
<!--te-->

Инструкция по запуску
============

1. Скачиваем репозиторий
2. Настраиваем `.env.example`, а затем сохраняем как `.env`
3. Устанавливаем окружение [Node JS](https://nodejs.org/ru/download/)
4. Открываем консоль в папке с приложением и устанавливаем зависимости: `npm i`
5. Запускаем приложение: `npm run start`

Создание базы данных в MySQL
============

На вашем MySQL сервере выполните команды по следующему шаблону:
```mysql
CREATE DATABASE `моя-база`;
CREATE USER 'КрутойПользователь'@'%' IDENTIFIED BY 'КрутойПароль';
GRANT ALL PRIVILEGES ON `моя-база`.* TO `КрутойПользователь`@'%';
FLUSH PRIVILEGES;
```

Маршруты
============

## /
Перенаправляет на **/api/v2**
## /api/v2
Главный маршрут для всех запросов. Прямое обращение перенаправляет в этот репозиторий, чтобы вы могли увидеть список существующих маршрутов. Пример api-ссылки для регистрации с использованием главного маршрута: **/api/v2/users/registration**