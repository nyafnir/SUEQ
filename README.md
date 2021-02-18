# SUEQ | Server Universal Electronic Queue

Сервер универсальной электронной очереди

<p>
<img src="https://img.shields.io/github/package-json/v/NyafiRawr/SUEQ" alt="GitHub package.json version" />
<a href="https://github.com/NyafiRawr/SUEQ/pulls"><img src="https://img.shields.io/github/issues-pr/NyafiRawr/SUEQ" alt="GitHub pull requests" /></a>
<p/><p>
<p/>

# Содержание

<!--ts-->

- [Как запустить?](./README.md#Инструкция-по-запуску)
- [Как создать базу данных и её пользователя в MySQL?](./README.md#Создание-базы-данных-в-MySQL)
- [Маршруты по которым можно общаться с сервером](./README.md#Маршруты)
<!--te-->

# Инструкция по запуску

1. Скачиваем репозиторий
2. Настраиваем `.env.example`, а затем сохраняем как `.env`
3. Устанавливаем окружение [Node JS](https://nodejs.org/ru/download/)
4. Открываем консоль в папке с приложением и устанавливаем зависимости: `npm i`
5. Запускаем приложение: `npm run start`

# Создание базы данных в MySQL

На вашем MySQL сервере выполните команды по следующему шаблону:

```mysql
CREATE DATABASE `моя-база`;
CREATE USER 'КрутойПользователь'@'%' IDENTIFIED BY 'КрутойПароль';
GRANT ALL PRIVILEGES ON `моя-база`.* TO `КрутойПользователь`@'%';
FLUSH PRIVILEGES;
```

Таблицы будут созданы автоматический

# Маршруты

Запросы на сервер выполняются в формате JSON. Отвечает сервер в этом же формате.

## /

Перенаправляет на **/api**

## /api

Перенаправляет в репозиторий

## /api/v2

Главный маршрут для всех запросов. Пример api-ссылки для регистрации с использованием главного маршрута: **/api/v2/user/registration**

# User

## `POST` /user/registration

Регистрация пользователя
Поле | Пример значения
------------ | -------------
email | test1@host.com
password | КрутойПароль1
surname | Кочергин
firstname | Василий
lastname | Леонидович

## `GET` /user/login

Авторизация
Поле | Пример значения
------------ | -------------
email | test1@host.com
password | КрутойПароль1

## `POST` /user/refresh

Обновление токенов
Поле | Пример значения
------------ | -------------
tokenaccess | последний_токен_доступа
tokenrefresh | последний_токен_обновления_токена_доступа

## `POST` /user/forgot-password?email=local@host.com

На почту local@host.com будет отправлена ссылка для сброса пароля

## `GET` /user/info

Получение информации о себе

## `PUT` /user/update

Обновление информации о себе
Поле | Пример значения
------------ | -------------
email | test2@host.com
password | КрутойПароль2
surname | Чайковский
firstname | Пётр
lastname | Владимирович

## `DELETE` /user/delete

Удаление своего аккаунта
- Вы будете удалены из всех очередей
- Очереди созданные вами будут удалены

# Queues

## `POST` /queues/create

Создать очередь
В ответе вы получите QR-код, который является Bitmap в byte[] и содержит ссылку вида: `.../queues/{QueueId}`

## `PUT` /queues/update/44

Изменить название, описание или статус очереди с ID 44

## `GET` /queues/info/44

Получить информацию об очереди с ID 44

## `DELETE` /queues/delete/44

Удалить очередь с ID 44

# Positions

## `POST` /positions/44

Встать в очередь с ID 44

## `DELETE` /positions/44

Выйти из очереди с ID 44

## `DELETE` /positions/44/7

Удалить пользователя с ID 7 стоящего в очереди с ID 44 (владелец очереди)

## `PUT` /positions/44

Изменить позицию стоящего в очереди с ID 44 (владелец)

## `GET` /positions/44

Получение информации о пользователях в очереди с ID 44
