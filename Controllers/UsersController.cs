using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SUEQ_API.Models;
using Microsoft.Extensions.Configuration;
// Хэширование пароля
using System.Security.Cryptography;
using Microsoft.AspNetCore.Cryptography.KeyDerivation;
// Использование токена
using System.IdentityModel.Tokens.Jwt;
using Microsoft.IdentityModel.Tokens;
using System.Security.Claims;
// Проверка почты
using System.ComponentModel.DataAnnotations;

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
        public async Task<string> GenerateRefreshToken(int userId)
        {
            var randomNumber = new byte[32];
            using var rng = RandomNumberGenerator.Create();
            rng.GetBytes(randomNumber);
            string refreshToken = Convert.ToBase64String(randomNumber);

            var refreshRecord = await _context.Refreshs.FindAsync(userId);
            if (refreshRecord == null)
            {
                _context.Refreshs.Add(new Refresh { 
                    UserId = userId, 
                    RefreshToken = refreshToken
                });
            }
            else
            {
                refreshRecord.RefreshToken = refreshToken;
                _context.Entry(refreshRecord).State = EntityState.Modified;
            }
            await _context.SaveChangesAsync();

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
        // Генератор токена доступа
        public JwtSecurityToken GetJwt(User user)
        {
            var now = DateTime.UtcNow;

            var claims = new[] {
                new Claim(JwtRegisteredClaimNames.Sub, $"{user.SurName} {user.FirstName} {user.LastName}"),
                new Claim(JwtRegisteredClaimNames.Email, user.Email),
                new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
                new Claim("UserId", user.UserId.ToString())
            };

            // Создаем JWT
            var jwt = new JwtSecurityToken(
                issuer: Configuration["Token:Issuer"],
                audience: Configuration["Token:Audience"],
                notBefore: now,
                claims: claims,
                expires: now.Add(TimeSpan.FromMinutes(Convert.ToDouble(Configuration["Token:TokenMinutes"]))),
                signingCredentials: new SigningCredentials(new SymmetricSecurityKey(
                    System.Text.Encoding.ASCII.GetBytes(Configuration["Token:Key"])),
                    SecurityAlgorithms.HmacSha256)
            );
            return jwt;
        }
        // Авторизация получение рефреш токена и токена доступа
        [AllowAnonymous]
        [HttpGet("login")]
        public async Task<ActionResult<ResponseWithToken>> Login(LoginModel login)
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
            /*
            if (!findUser.EmailConfirmed)
                return BadRequest(new ResponseWithToken {
                    Code = 422,
                    DevMessage = "Email not confirmed.",
                    UserMessage = "Необходимо подтвердить почту, пройдя по ссылке в сообщении, которое было Вам отправлено после регистрации!"
                });
            */
            var jwt = GetJwt(user);

            var refreshToken = await GenerateRefreshToken(user.UserId);

            return Ok(new ResponseWithToken
            {
                Code = 200,
                DevMessage = "Take your token.",
                UserMessage = "Авторизация прошла успешно!",
                User = new UserModel(user),
                AccessToken = new JwtSecurityTokenHandler().WriteToken(jwt),
                RefreshToken = refreshToken
            });
        }
        // Обновление токена доступа через рефреш токен
        [HttpPost("refresh")]
        public async Task<ActionResult<ResponseWithToken>> Refresh(string token, string refreshToken)
        {
            int userId = Convert.ToInt32(HttpContext.User.FindFirst("UserId").Value);

            var refreshRecord = await _context.Refreshs.FindAsync(userId);
            if (refreshRecord == null || refreshRecord.RefreshToken != refreshToken)
                return BadRequest(new Response
                {
                    Code = 422,
                    DevMessage = "Refresh token are invalid.",
                    UserMessage = "Ваш токен обновления не найден или неправильный, попробуйте перезайти!"
                });

            var newRefreshToken = await GenerateRefreshToken(userId);

            var user = await _context.Users.FindAsync(userId);
            var jwt = GetJwt(user);

            return Ok(new ResponseWithToken
            {
                Code = 200,
                DevMessage = "Got your tokens.",
                UserMessage = "Авторизация прошла успешно!",
                AccessToken = new JwtSecurityTokenHandler().WriteToken(jwt),
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
                PasswordHash = ToHash(registration.Password, salt)
            };

            _context.Users.Add(newUser);
            await _context.SaveChangesAsync();
            /*
            newUser.EmailConfirmed = true;
            string code = manager.GenerateEmailConfirmationToken(newUser.UserId) ;
            string callbackUrl = IdentityHelper.GetUserConfirmationRedirectUrl(code, newUser.UserId, Request);
            manager.SendEmail(newUser.UserId, "Confirm your account", 
                "Please confirm your account by clicking <a href=\"" + callbackUrl + "\">HERE</a>.");
            */
            return Ok(new ResponseWithUser
            {
                Code = 200,
                DevMessage = "Account created. Confirm email.",
                UserMessage = "Аккаунт создан! Подтвердите почту перейдя по ссылке отправленной в письме.",
                User = new UserModel(newUser)
            });
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

        private static Response UserNotFoundById()
        {
            return new ResponseWithUser
            {
                Code = 422,
                DevMessage = "User not found by ID.",
                UserMessage = "Пользователь не найден, пожалуйста, попробуйте перезайти!"
            };
        }
    }
}
