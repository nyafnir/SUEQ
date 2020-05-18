# Server Universal Electronic Queue
Сервер универсальной электронной очереди - WEB API, архитектура: REST, используемая база данных: MYSQL, авторизация по токену: JWT, формат запросов: JSON, доступен SSL (HTTPS), работает с подтверждениями через почту

Содержание
============

<!--ts-->
   * [Проделанная работа](./README.md#План)
   * [Подготовка базы данных](./README.md#База-данных)
   * [Логика API с примерами](./README.md#Логика)
	   * [Пользователи](./README.md#Users)
	   * [Очереди](./README.md#Queues)
	   * [Позиции в очередях](./README.md#Positions)
<!--te-->

План
============

- [x] 1. Создан проект WEB-API с ASP.NET (3.1) и настроен вывод при подключении к корню через браузер
- [x] 2. Создана папка `Models` и созданы сущности (таблицы) по схеме
- [x] 3. Создан класс `SUEQContext` в `Models` и указаны сущности, которые он должен создавать
- [x] 4. Через `NuGet` добавлен `Pomelo.EntityFrameworkCore.MySql` для подключения к БД
- [x] 5. Подключен `MySql` и реализована строка подключения в `ConfigureServices` в `Startup.cs`
- [x] 6. Создана папка `Controllers` и контроллер для сущности пользователя, протестировано с помощью Postman
- [x] 7. Изучены варианты авторизации по звонку, смс и Google+
- [x] 8. Разбор `https` и попытки внедрения в проект. Необходимо изучить сертификаты. Работает через `VS`: нужно открыть `Свойства проекта` - `Отладка` и в самом низу `Включить SSL`, а затем в `appsettings.json` изменить поле `https_port` на порт из свойств проекта (`0` - выключено).
- [x] 9. Изучены варианты и виды аутентификации и примерные варианты реализации
- [x] 11. Все настройки вынесены в `appsettings.JSON` и правильно переподключены к проекту
- [x] 12. Небольшое логгирование включения `SSL` и обращения к корню
- [x] 13. Реализовано хэширование пароля с солью и валидация почты
- [x] 14. Проработана логика сервера (изменялась более чем несколько раз)
- [x] 15. Реализована работа с токеном `JWT`, передаётся как `Bearer` при запросах
- [x] 16. Проработана регистрация и авторизация, протестирована работа токена
- [x] 17. Реализован контроллер управления пользователем (получение, обновление информации и удаление аккаунта)
- [x] 18. Реализован контроллер управления очередями
- [x] 19. Реализован контроллер управления позициями
- [x] 20. Полное тестирование, попытки отсылать неправильные запросы, осмотр ответов. Итог: п.21 и п.22
- [ ] 21. Внедрение рефреш токена
- [ ] 22. Изменить ответы запросов на постоянную форму
- [ ] 23. Добавлено подтверждение регистрации и смена пароля по почте
- [ ] 24. Доработка `HTTPS` (п.8)
- [ ] 25. `Deep Linking` и QR-код

База данных
============

Создание базы данных и предоставление доступа:  
```mysql
CREATE DATABASE DBNAMEHERE;
CREATE USER 'USERNAMEHERE'@'%' IDENTIFIED BY 'USERPASSWORDHERE';
GRANT ALL PRIVILEGES ON DBNAMEHERE.* TO 'USERNAMEHERE'@'%';
FLUSH PRIVILEGES;
```

Логика
============

## Users

### Регистрация  
Отсылаем http://localhost:5433/api/users/registration `POST`
```json
{
  "Email": "local@host.com",
  "Password": "superpassword999",
  "FirstName": "Иван",
  "SurName": "Иванов",
  "LastName": "Иванович"
}  
```  
Получаем: `"Account created."`  
  
### Авторизация  
Отсылаем http://localhost:5433/api/users/login `GET`  
```json
{
	"email": "local@host.com",
	"password": "superpassword999"
}
```  
Получаем:  
```json
{
    "validation": true,
    "error": null,
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiLQmNCy0LDQvdC-0LIg0JLQsNGB0LjQu9C40Lkg0JjQstCw0L3QvtCy0LjRhyIsImVtYWlsIjoibG9jYWxAaG9zdC5jb20iLCJqdGkiOiJjZWEzZDdiMC02Y2RhLTRmMjktODRiZS1jNTAzNTBmY2E4N2EiLCJVc2VySWQiOiI3IiwibmJmIjoxNTg5NzMyMjM5LCJleHAiOjE1ODk4MTg2MzksImlzcyI6IlNVRVEtQVBJIiwiYXVkIjoiVUVRLUNsaWVudCJ9.J3iM_biP-YTEVGua74bfrENcUPxquhBhcl_A7iJW88w"
}
```
Все следующие обращения выполняются с этим токеном по `Auth: Bearer Token`!  
  
### Получение информации о себе  
http://localhost:5433/api/users/info `GET`
```json
{
    "userId": 7,
    "email": "local@host.com",
    "passwordHash": null,
    "passwordSalt": null,
    "firstName": "Иван",
    "surName": "Иванов",
    "lastName": "Иванович",
    "queues": null
}
```  
  
### Обновление информации о себе  
http://localhost:5433/api/users/update `PUT`  
Как при регистрации, но указываем обновляемые поля - почта, пароль, ФИО
```json
{
  "FirstName":"Пётр"
}
```  
Получаем: `"Account updated."`  
  
### Удаление пользователем своего аккаунта  
http://localhost:5433/api/users/delete `DELETE`
Получаем: `"Account deleted."`  
  
## Queues

### Создать очередь  
http://localhost:5433/api/queues/create `POST`  
```json
{
	"Name": "Рыжий заяц",
	"Description": "Кафе открыто с 11:20 до 20:05",
	"Status": true
}
```  
Получаем:  
```json
{
    "queueId": 3,
    "name": "Кафе Рыжий Заяц",
    "description": "Кафе работает с 10 до 18!",
    "status": true,
    "qrCode": "Deep Linking",
    "userId": 1,
    "user": null
}
```  
Данный QR-код должен перенаправлять в наше приложение неся в себе QueueId
  
### Изменить название, описание или статус очереди  
http://localhost:5433/api/queues/update/44 {QueueId=44} `PUT`  
```json
{
	"Name": "Биба и Боба",
	"Description": "Мастерская работает с 13:00 до 00:00",
	"Status": false
}
```  
Получаем: `"Queue updated."`  
  
### Получить информацию об очереди  
http://localhost:5433/api/queues/info/44 {QueueId=44} `GET`  
Получаем: 
```json
{
    "queueId": 3,
    "name": "Кафе Рыжий Заяц",
    "description": "Кафе работает с 10 до 18!",
    "status": true,
    "qrCode": "Deep Linking",
    "userId": 1,
    "user": null
}
```  
  
###  Удалить очередь 
http://localhost:5433/api/queues/delete/44 `DELETE`  
Получаем: `"Queue deleted."`  
  
## Positions

### Встать в очередь  
http://localhost:5433/api/positions/44 `POST`  
Получаем: 
```json
{
	"Id": 101,
	"QueueId": 44,
	"UserId": 7,
	"Place": 1
}
```  
  
### Выйти из очереди  
http://localhost:5433/api/positions/44 `DELETE`  
Получаем: `"Out queue."`  
  
### Удалить стоящего в очереди (владелец)  
http://localhost:5433/api/positions/44/7 {UserId=7} `DELETE`  
Получаем: `"Client removed from queue."`  
  
### Изменить позицию стоящего в очереди (владелец)  
http://localhost:5433/api/positions/44 `PUT`
```json
{
	"UserId": 7,
	"Place": 1
}
```  
Получаем: `"Client in queue on 1 place."`  
  
### Получение информации о пользователях в очереди
http://localhost:5433/api/positions/44 `GET`  
Получаем: 
```json
[{
	"UserId": 7,
	"Place": 2
},
{
	"UserId": 2,
	"Place": 1
}]
```
