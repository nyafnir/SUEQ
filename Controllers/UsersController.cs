using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SUEQ_API.Models;
using Microsoft.Extensions.Configuration;
using System.ComponentModel.DataAnnotations;
// Хэширование пароля
using System.Security.Cryptography;
using Microsoft.AspNetCore.Cryptography.KeyDerivation;
// Использование токена
using System.IdentityModel.Tokens.Jwt;
using Microsoft.IdentityModel.Tokens;
using System.Security.Claims;
// Проверка почты
using SUEQ_API.Services;

namespace SUEQ_API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class UsersController : ControllerBase
    {
        private readonly SUEQContext _context;
        private readonly IConfiguration Configuration;
        public UsersController(SUEQContext context, IConfiguration configuration)
        {
            _context = context;
            Configuration = configuration;
        }
        // Генератор рефреш токена
        public string GetRefreshToken()
        {
            var randomNumber = new byte[32];
            using var rng = RandomNumberGenerator.Create();
            rng.GetBytes(randomNumber);
            return Convert.ToBase64String(randomNumber);
        }
        // Запись токенов в бд
        public async Task<string> RecordTokens(int userId, string accessToken, string refreshToken)
        {
            var tokensRecord = await _context.Refreshs.FindAsync(userId);
            if (tokensRecord == null)
            {
                _context.Refreshs.Add(new Refresh
                {
                    UserId = userId,
                    AccessToken = accessToken,
                    RefreshToken = refreshToken,
                    AtCreated = DateTime.Now
                });
            }
            else
            {
                tokensRecord.AccessToken = accessToken;
                tokensRecord.RefreshToken = refreshToken;
                tokensRecord.AtCreated = DateTime.Now;
                _context.Entry(tokensRecord).State = EntityState.Modified;
            }
            await _context.SaveChangesAsync();

            Startup.Storage.Store(Convert.ToString(userId), accessToken);
            Startup.Storage.Persist();
            
            return refreshToken;
        }
        // Соль для хэширования
        private byte[] GetSalt()
        {
            // Генерация 128-битной соли с использованием генератора псевдослучайных чисел
            byte[] salt = new byte[128 / 8];
            using var rng = RandomNumberGenerator.Create();
            rng.GetBytes(salt);
            return salt;
        }
        // Хэширование пароля
        private string ToHash(string password, byte[] salt)
        {
            // Извлечение 256-битного подключа (используется HMACSHA1 с 10,000 итераций)
            string hashed = Convert.ToBase64String(
                KeyDerivation.Pbkdf2(
                    password: password,
                    salt: salt,
                    prf: KeyDerivationPrf.HMACSHA1,
                    iterationCount: 10000,
                    numBytesRequested: 256 / 8
                )
            );
            return hashed;
        }
        // Генератор токена доступа (jwt - json web token)
        public string GetAccessToken(User user)
        {
            var now = DateTime.UtcNow;

            // Создаем JWT
            var jwt = new JwtSecurityToken(
                issuer: Configuration["Token:Issuer"],
                audience: Configuration["Token:Audience"],
                notBefore: now,
                claims: new[] {
                    new Claim(JwtRegisteredClaimNames.Sub, user.UserId.ToString()),
                    new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
                    new Claim(JwtRegisteredClaimNames.Iat, now.ToString(), ClaimValueTypes.Integer64),
                    new Claim("UserId", user.UserId.ToString())
                },
                expires: now.Add(TimeSpan.FromMinutes(Convert.ToDouble(Configuration["Token:AccessExpireMinutes"]))),
                signingCredentials: new SigningCredentials(new SymmetricSecurityKey(
                    System.Text.Encoding.ASCII.GetBytes(Configuration["Token:Key"])),
                    SecurityAlgorithms.HmacSha256)
            );
            return new JwtSecurityTokenHandler().WriteToken(jwt);
        }
        // Авторизация получение рефреш токена и токена доступа
        [AllowAnonymous]
        [HttpGet("login")]
        public async Task<ActionResult<ResponseWithTokenAndUser>> Login(LoginModel login)
        {
            var user = await _context.Users.SingleOrDefaultAsync(u => u.Email == login.Email);
            if (user == null)
                return BadRequest(new Response
                {
                    Code = 422,
                    DevMessage = "User not found.", 
                    UserMessage = "Пользователя с такой почтой не существует!"
                });

            string PasswordHash = ToHash(login.Password, user.PasswordSalt);
            if (user.PasswordHash != PasswordHash)
                return BadRequest(new Response {
                    Code = 422,
                    DevMessage = "Password are invalid.",
                    UserMessage = "Неправильный пароль!"
                });
            
            if (!user.EmailConfirmed)
                return BadRequest(new Response
                {
                    Code = 422,
                    DevMessage = "Email not confirmed.",
                    UserMessage = "Необходимо подтвердить почту, пройдя по ссылке в сообщении, которое было Вам отправлено после регистрации!"
                });
            
            var accessToken = GetAccessToken(user);
            var refreshToken = GetRefreshToken();

            await RecordTokens(user.UserId, accessToken, refreshToken);

            return Ok(new ResponseWithTokenAndUser
            {
                Code = 200,
                DevMessage = "Got your tokens.",
                UserMessage = "Авторизация прошла успешно!",
                User = new UserModel(user),
                AccessToken = accessToken,
                RefreshToken = refreshToken
            });
        }
        // Обновление токена доступа через рефреш токен
        [AllowAnonymous]
        [HttpPost("refresh")]
        public async Task<ActionResult<ResponseWithTokenAndUser>> Refresh(TokensModel tokens)
        {
            var refreshRecord = await _context.Refreshs.SingleOrDefaultAsync(r => 
                r.AccessToken == tokens.AccessToken && r.RefreshToken == tokens.RefreshToken);
            if (refreshRecord == null)
                return BadRequest(new Response
                {
                    Code = 422,
                    DevMessage = "Pair tokens are invalid.",
                    UserMessage = "Пара токенов доступа и обновления не найдена или неправильна, попробуйте перезайти!"
                });

            var refreshExpireMinutes = Convert.ToDouble(Configuration["Token:RefreshExpireMinutes"]);
            if (refreshRecord.AtCreated.AddMinutes(refreshExpireMinutes) <= DateTime.Now)
                return BadRequest(new Response
                {
                    Code = 422,
                    DevMessage = "Refresh token are expired.",
                    UserMessage = "Ваш токен обновления истёк, пожалуйста, перезайдите!"
                });
            
            var user = await _context.Users.FindAsync(refreshRecord.UserId);

            var newAccessToken = GetAccessToken(user);
            var newRefreshToken = GetRefreshToken();

            await RecordTokens(refreshRecord.UserId, newAccessToken, newRefreshToken);

            return Ok(new ResponseWithTokenAndUser
            {
                Code = 200,
                DevMessage = "Got your updated tokens.",
                UserMessage = "Обновление токенов доступа и обновления прошло успешно!",
                AccessToken = newAccessToken,
                RefreshToken = newRefreshToken
            });
        }

        private bool ValidationSizeFIO(string first = null, string sur = null, string last = null)
        {
            if (last == null && sur == null && first == null)
                return true;

            if (first != null)
                if (first.Length < 2)
                    return false;

            if (sur != null)
                if (sur.Length < 3)
                    return false;

            if (last != null)
                if (last.Length < 3)
                    return false;

            return true;
        }

        private bool ValidationEmail(string email)
        {
            if (new EmailAddressAttribute().IsValid(email))
                return true;
            else
                return false;
        }

        private bool ValidationPassword(string password)
        {
            if (password.Length >= 3)
                return true;
            else
                return false;
        }

        [AllowAnonymous]
        [HttpPost("registration")]
        public async Task<ActionResult<ResponseWithUser>> CreateUser(UserModel registration)
        {
            var isEmailExist = await _context.Users.AnyAsync(u => u.Email == registration.Email);
            if (isEmailExist)
                return BadRequest(new Response
                {
                    Code = 422,
                    DevMessage = "Email already exists.",
                    UserMessage = "Такой электронный почтовый адрес уже используется!"
                }); 

            if (!ValidationEmail(registration.Email))
                return BadRequest(new Response
                {
                    Code = 422,
                    DevMessage = "Incorrect email.",
                    UserMessage = "Указанный электронный почтовый адрес определен как не существующий!"
                }); 

            if (
                registration.FirstName == null ||
                registration.SurName == null || 
                registration.LastName == null ||
                !ValidationSizeFIO(registration.FirstName, registration.SurName, registration.LastName)
            )
                return BadRequest(new Response
                {
                    Code = 422,
                    DevMessage = "Bad size fields FIO.",
                    UserMessage = "Имя должно содержать не меньше 2 букв, а фамилия и отчество не меньше 3!"
                });

            if (!ValidationPassword(registration.Password))
                return BadRequest(new Response
                {
                    Code = 422,
                    DevMessage = "Small password! Min size: 3 symbols.",
                    UserMessage = "Пароль слишком короткий, минимальный размер 3 символа!"
                });

            var salt = GetSalt();
            var newUser = new User
            {
                Email = registration.Email,
                FirstName = registration.FirstName,
                SurName = registration.SurName,
                LastName = registration.LastName,
                PasswordSalt = salt,
                PasswordHash = ToHash(registration.Password, salt),
                EmailConfirmed = false
            };

            _context.Users.Add(newUser);
            await _context.SaveChangesAsync();

            // Отправляем сообщение
            string linkWithCode = Guid.NewGuid().ToString(); // TODO: LINK
            var message = new EmailService.ModelMessage
            {
                ToName = newUser.FirstName,
                ToEmail = newUser.Email,
                Text = $"{newUser.SurName} {newUser.FirstName} {newUser.LastName}, перейдите по ссылке, чтобы закончить регистрацию : {linkWithCode}",
                Html = "Пожалуйста подтвердите Ваш аккаунт, чтобы закончить регистрацию, нажав по ссылке: <a href=\"" + linkWithCode + "\">нажмите сюда</a><br/>"
            };
            await EmailService.SendMail(message);
            
            return Ok(new ResponseWithUser
            {
                Code = 200,
                DevMessage = "Account created. Confirm email.",
                UserMessage = "Аккаунт создан! Подтвердите почту перейдя по ссылке отправленной в письме.",
                User = new UserModel(newUser)
            });
        }

        [HttpGet("confirm/email")]
        public async Task<ActionResult<Response>> ConfirmEmail(string userId, string code)
        {
            var user = await _context.Users.FindAsync(userId);
            
            if (user == null)
                return BadRequest(UserNotFoundById());

            if (user.EmailConfirmed)
                return BadRequest(new Response
                {
                    Code = 422,
                    DevMessage = "Email already confirmed.",
                    UserMessage = "Электронный почтовый адрес уже подтвержден!"
                });

            if (code != "0") // TODO: ГДЕ ХРАНИТЬ?
                return BadRequest(new Response
                {
                    Code = 422,
                    DevMessage = "Code invalid.",
                    UserMessage = "Неправильный код!"
                });

            user.EmailConfirmed = true;
            _context.Entry(user).State = EntityState.Modified;
            await _context.SaveChangesAsync();

            return Ok(new Response
            {
                Code = 200,
                DevMessage = "Account confirmed.",
                UserMessage = "Аккаунт подтвержден! Вернитесь в приложение и попробуйте зайти."
            });
        }

        [HttpGet("forgot/password")]
        public void ForgotPassword()
        {
            return; // TODO: RESET PASSWORD
        }

        [HttpGet("info")]
        public async Task<ActionResult<ResponseWithUser>> GetUser()
        {
            int id = Convert.ToInt32(HttpContext.User.FindFirst("UserId").Value);
            var user = await _context.Users.FindAsync(id);

            return Ok(new ResponseWithUser
            {
                Code = 200,
                DevMessage = "Got your account.",
                UserMessage = "Информация об аккаунте получена!",
                User = new UserModel(user)
            });
        }

        [HttpPut("update")]
        public async Task<ActionResult<ResponseWithUser>> UpdateUser(UserModel updateUser)
        {
            int id = Convert.ToInt32(HttpContext.User.FindFirst("UserId").Value);
            var user = await _context.Users.FindAsync(id);

            if (updateUser.Email != null && updateUser.Email != user.Email)
            {
                if (!ValidationEmail(updateUser.Email))
                    return BadRequest(new Response
                    {
                        Code = 422,
                        DevMessage = "Email are invalid.",
                        UserMessage = "Такого электронного почтового адреса не существует!"
                    });
                user.Email = updateUser.Email;
            }

            if (updateUser.Password != null)
            {
                if (!ValidationPassword(updateUser.Password))
                    return BadRequest(new Response
                    {
                        Code = 422,
                        DevMessage = "Very small password.",
                        UserMessage = "Пароль не может быть меньше 3 символов!"
                    });
                user.PasswordSalt = GetSalt();
                user.PasswordHash = ToHash(updateUser.Password, user.PasswordSalt);
            }

            if (!ValidationSizeFIO(updateUser.FirstName, updateUser.SurName, updateUser.LastName))
                return BadRequest(new Response
                {
                    Code = 422,
                    DevMessage = "Bad size fields FIO.",
                    UserMessage = "Имя должно содержать не меньше 2 букв, а фамилия и отчество не меньше 3!"
                });

            if (updateUser.FirstName != null)
                user.FirstName = updateUser.FirstName;
            if (updateUser.SurName != null)
                user.SurName = updateUser.SurName;
            if (updateUser.LastName != null)
                user.LastName = updateUser.LastName;

            _context.Entry(user).State = EntityState.Modified;
            await _context.SaveChangesAsync();

            return Ok(new ResponseWithUser
            {
                Code = 200,
                DevMessage = "Account updated.",
                UserMessage = "Указанная информация об аккаунте была обновлена!",
                User = new UserModel(user)
            });
        }
        
        [HttpDelete("delete")]
        public async Task<ActionResult<ResponseWithUser>> DeleteUser()
        {
            int id = Convert.ToInt32(HttpContext.User.FindFirst("UserId").Value);
            var user = await _context.Users.FindAsync(id);

            _context.Users.Remove(user);
            await _context.SaveChangesAsync();

            return Ok(new ResponseWithUser
            {
                Code = 200,
                DevMessage = "Account deleted.",
                UserMessage = "Аккаунт удален!"
            });
        }

        [HttpDelete("logout")]
        public async Task<ActionResult<ResponseWithUser>> Logout()
        {
            int userId = Convert.ToInt32(HttpContext.User.FindFirst("UserId").Value);

            var refresh = await _context.Refreshs.FindAsync(userId);
            _context.Refreshs.Remove(refresh);
            await _context.SaveChangesAsync();

            Startup.Storage.Store(Convert.ToString(userId), "");
            Startup.Storage.Persist();

            return Ok(new ResponseWithUser
            {
                Code = 200,
                DevMessage = "Logout.",
                UserMessage = "Успешный выход!"
            });
        }

        private static Response UserNotFoundById()
        {
            return new ResponseWithUser
            {
                Code = 422,
                DevMessage = "User not found by ID.",
                UserMessage = "Пользователь не найден!"
            };
        }
    }
}
