using System;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
// Подключение базы данных
using Microsoft.EntityFrameworkCore;
using SUEQ_API.Models;
// Настройки и переменная настроек для appsettings
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
// Логгирование
using Microsoft.Extensions.Logging;
// JWT аутентификация
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Threading.Tasks;
using Hanssens.Net;
using System.IdentityModel.Tokens.Jwt;

namespace SUEQ_API
{
    public class Startup
    {
        public static IConfiguration Configuration;
        public static LocalStorage Storage;
        public Startup(IConfiguration configuration)
        {
            Configuration = configuration;
            using (Storage = new LocalStorage(new LocalStorageConfiguration()
            {
                // EnableEncryption = false,
                // EncryptionSalt = "LocalStorage",
                AutoLoad = true,
                AutoSave = false,
                Filename = "SUEQ-API.LOCALSTORAGE"
            })) { };
        }

        private int https_port;
        public static bool ssl;
        
        private bool CustomLifetimeValidator(DateTime? notBefore, DateTime? expires, SecurityToken token, TokenValidationParameters @params)
        {
            if (expires != null)
            {
                return expires < DateTime.Now;
            }

            return false;
        }

        private static Task AdditionalValidation(TokenValidatedContext context)
        {
            var userId = context.Principal.FindFirst("UserId").Value;
            if (userId == null)
                context.Fail("User not found");

            // Предоставляем доступ только записанным пользователям
            string lastAccessToken;
            try
            { 
                lastAccessToken = Storage.Get<string>(userId); 
            }
            catch
            { 
                context.Fail("User not authenticated");
                return Task.CompletedTask;
            }
            // Предоставляем доступ только по последнему токену доступа
            var token = new JwtSecurityTokenHandler().WriteToken(context.SecurityToken);
            lastAccessToken = lastAccessToken.Remove(lastAccessToken.LastIndexOf('.') + 1);
            if (lastAccessToken != token)
            {
                context.Fail("Token Expired");
            }
            return Task.CompletedTask;
        }

        public void ConfigureServices(IServiceCollection services)
        {
            // Получение параметров httpS
            https_port = Convert.ToInt32(Configuration["https_port"]);
            ssl = https_port != 0;
            // Настройка передаваемого заголовка STS
            services.AddHsts(options =>
            {
                options.Preload = true; // Загружается заранее
                options.IncludeSubDomains = true; // Включает поддомены
                options.MaxAge = TimeSpan.FromDays(30); // Пусть срок жизни 30 дней
            });
            // Настройка переадресации
            services.AddHttpsRedirection(options =>
            {
                options.RedirectStatusCode = StatusCodes.Status307TemporaryRedirect; // Статус принимаемый по умолчанию
                options.HttpsPort = https_port; // Диапазон существующих портов вписывается в int32
            });
            // Регистрируем наш контекст базы данных в зависимостях
            services.AddDbContext<SUEQContext>(options => {
                options.UseMySql(
                    $"server={Configuration["DataBase:Host"]};" +
                    $"database={Configuration["DataBase:Name"]};" +
                    $"port={Configuration["DataBase:Port"]};" +
                    $"uid={Configuration["DataBase:User"]};" +
                    $"password={Configuration["DataBase:Password"]};"
                );
            });
            // Включаем JWT
            services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
                    .AddJwtBearer(options =>
                    {
                        options.SaveToken = true;
                        options.RequireHttpsMetadata = ssl;
                        options.TokenValidationParameters = new TokenValidationParameters
                        {
                            // Проверяем издателя
                            ValidateIssuer = true,
                            // Указываем где он
                            ValidIssuer = Configuration["Token:Issuer"],

                            // Проверяем потребителя
                            ValidateAudience = true,
                            // Указываем где он
                            ValidAudience = Configuration["Token:Audience"],
                            // Проверяем срок жизни
                            ValidateLifetime = true,
                            LifetimeValidator = CustomLifetimeValidator,
                            // Проверяем ключ
                            ValidateIssuerSigningKey = true,
                            // Вытягиваем и указываем преобразованный ключ
                            IssuerSigningKey = new SymmetricSecurityKey(
                                System.Text.Encoding.ASCII.GetBytes(Configuration["Token:Key"])),
                            // Устранение перекоса часов (иначе +5 минут к expires)
                            ClockSkew = TimeSpan.Zero
                        };
                        options.Events = new JwtBearerEvents
                        {
                            OnTokenValidated = AdditionalValidation
                        };
                    });
            // Инициализируем контроллеры
            services.AddControllers();
        }

        public void Configure(IApplicationBuilder app, IWebHostEnvironment env, ILogger<Startup> logger)
        {
            logger.LogInformation("Status SSL: {0}", ssl);

            if (env.IsDevelopment())
            {
                app.UseDeveloperExceptionPage();
            }
            else
            {
                // Отсылаем заголовок Strict-Transport-Security, чтобы избежать обращения к незащищенному http
                // Это стандартная необходимая защита
                if (ssl) app.UseHsts();
            }

            // Перенаправление на httpS
            if (ssl) app.UseHttpsRedirection();

            app.UseRouting();

            app.UseAuthentication();
            app.UseAuthorization();

            app.UseEndpoints(endpoints =>
            {
                // Ищем вызываемые контроллеры и передаём управление им
                endpoints.MapControllers();
                // Ответ при переходе в корневой узел
                endpoints.MapGet("/", async context =>
                {
                    logger.LogInformation("Processing request {0}", context.Request.Path);
                    var sb = new System.Text.StringBuilder()
                        .Append("<center><h1>Интерфейс работает и принимает запросы!</center></h1>");
                    context.Response.ContentType = "text/html;charset=utf-8";
                    await context.Response.WriteAsync(sb.ToString());
                });
            });
        }
    }
}
