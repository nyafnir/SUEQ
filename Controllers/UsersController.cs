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

        private byte[] GetSalt()
        {
            // Генерация 128-битной соли с использованием генератора псевдослучайных чисел
            byte[] salt = new byte[128 / 8];
            using var rng = RandomNumberGenerator.Create();
            rng.GetBytes(salt);
            return salt;
        }

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

        public class LoginModel
        {
            public string Email { get; set; }
            public string Password { get; set; }
        }

        public class LoginResult
        {
            public bool Validation { get; set; }
            public string Error { get; set; }
            public string Token { get; set; }
        }

        [AllowAnonymous]
        [HttpGet("login")]
        public async Task<ActionResult<LoginResult>> Login(LoginModel login)
        {
            var findUser = await _context.Users.SingleOrDefaultAsync(user => user.Email == login.Email);
            if (findUser == null)
                return BadRequest(new LoginResult { Validation = false, Error = "User not found." });

            string PasswordHash = ToHash(login.Password, findUser.PasswordSalt);
            if (findUser.PasswordHash != PasswordHash)
                return BadRequest(new LoginResult { Validation = false, Error = "Password are invalid." });

            /*if (!findUser.EmailConfirmed)
                return BadRequest(new LoginResult { Validation = false, Error = "Email not confirmed." });
            */
            var now = DateTime.UtcNow;
            
            var claims = new[] {
                new Claim(JwtRegisteredClaimNames.Sub, $"{findUser.SurName} {findUser.FirstName} {findUser.LastName}"),
                new Claim(JwtRegisteredClaimNames.Email, login.Email),
                new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
                new Claim("UserId", findUser.UserId.ToString())
            };

            // Создаем JWT
            var jwt = new JwtSecurityToken(
                issuer: Configuration["Token:Issuer"],
                audience: Configuration["Token:Audience"],
                notBefore: now,
                claims: claims,
                expires: now.Add(TimeSpan.FromMinutes(Convert.ToDouble(Configuration["Token:Lifetime"]))),
                signingCredentials: new SigningCredentials(new SymmetricSecurityKey(
                    System.Text.Encoding.ASCII.GetBytes(Configuration["Token:Key"])), 
                    SecurityAlgorithms.HmacSha256)
            );

            return Ok(new LoginResult { Validation = true, Token = new JwtSecurityTokenHandler().WriteToken(jwt) });
        }

        public class UserModel
        {
            public string Email { get; set; }
            public string Password { get; set; }
            public string FirstName { get; set; }
            public string SurName { get; set; }
            public string LastName { get; set; }
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
        public async Task<ActionResult> CreateUser(UserModel registration)
        {
            var findEmail = await _context.Users.SingleOrDefaultAsync(user => user.Email == registration.Email);
            if (findEmail != null)
                return BadRequest("Email already exists.");

            var newUser = new User();

            if (!ValidationEmail(registration.Email))
                return BadRequest("Incorrect email!");
            newUser.Email = registration.Email;

            if (
                registration.FirstName == null ||
                registration.SurName == null || 
                registration.LastName == null ||
                !ValidationSizeFIO(registration.FirstName, registration.SurName, registration.LastName)
            )
                return BadRequest("Bad size fields FIO!");

            newUser.FirstName = registration.FirstName;
            newUser.SurName = registration.SurName;
            newUser.LastName = registration.LastName;

            if (!ValidationPassword(registration.Password))
                return BadRequest("Small password! Min size: 3 symbols");

            newUser.PasswordSalt = GetSalt();
            newUser.PasswordHash = ToHash(registration.Password, newUser.PasswordSalt);

            _context.Users.Add(newUser);
            await _context.SaveChangesAsync();
            /*            
            newUser.EmailConfirmed = true;
            string code = manager.GenerateEmailConfirmationToken(newUser.UserId) ;
            string callbackUrl = IdentityHelper.GetUserConfirmationRedirectUrl(code, newUser.UserId, Request);
            manager.SendEmail(newUser.UserId, "Confirm your account", 
                "Please confirm your account by clicking <a href=\"" + callbackUrl + "\">HERE</a>.");
            */
            return Ok("Account created. Confirm email.");
        }

        [HttpGet("info")]
        public async Task<ActionResult<User>> GetUser()
        {
            int id = Convert.ToInt32(HttpContext.User.FindFirst("UserId").Value);
            var user = await _context.Users.FindAsync(id);

            if (user == null)
                return NotFound();

            user.PasswordHash = null;
            user.PasswordSalt = null;

            return user;
        }

        [HttpPut("update")]
        public async Task<IActionResult> UpdateUser(UserModel updateUser)
        {
            int id = Convert.ToInt32(HttpContext.User.FindFirst("UserId").Value);
            var findUser = await _context.Users.FindAsync(id);
            if (findUser == null)
                return BadRequest("User ID not found");

            if (updateUser.Email != null && updateUser.Email != findUser.Email)
            {
                if (!ValidationEmail(updateUser.Email))
                    return BadRequest("Email are invalid!");

                findUser.Email = updateUser.Email;
            }

            if (updateUser.Password != null)
            {
                if (!ValidationPassword(updateUser.Password))
                    return BadRequest("Very small password!");

                findUser.PasswordSalt = GetSalt();
                findUser.PasswordHash = ToHash(updateUser.Password, findUser.PasswordSalt);
            }

            if (!ValidationSizeFIO(updateUser.FirstName, updateUser.SurName, updateUser.LastName))
                return BadRequest("Bad size fields FIO!");

            if (updateUser.FirstName != null)
                findUser.FirstName = updateUser.FirstName;
            if (updateUser.SurName != null)
                findUser.SurName = updateUser.SurName;
            if (updateUser.LastName != null)
                findUser.LastName = updateUser.LastName;

            _context.Entry(findUser).State = EntityState.Modified;
            await _context.SaveChangesAsync();

            return Ok("Account updated.");
        }
        
        [HttpDelete("delete")]
        public async Task<ActionResult> DeleteUser()
        {
            int id = Convert.ToInt32(HttpContext.User.FindFirst("UserId").Value);
            var user = await _context.Users.FindAsync(id);
            if (user == null)
                return NotFound();

            _context.Users.Remove(user);
            await _context.SaveChangesAsync();

            return Ok("Account deleted.");
        }
    }
}
