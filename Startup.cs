using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
// Переменная настроек для appsettings
using Microsoft.Extensions.Configuration;
// Подключение базы данных
using Microsoft.EntityFrameworkCore;
using SUEQ_API.Models;
// StringBuilder
using System;

namespace SUEQ_API
{
    public class Startup
    {
        private readonly IConfiguration Configuration;
        public Startup(IConfiguration configuration)
        {
            Configuration = configuration;
        }

        public void ConfigureServices(IServiceCollection services)
        {
            // Настройка передаваемого заголовка STS
            services.AddHsts(options =>
            {
                options.Preload = true; // Загружается заранее
                options.IncludeSubDomains = true; // Включает поддомены
                options.MaxAge = TimeSpan.FromDays(30); // Пусть срок жизни 30 дней, если нужно отключить установить срок 0
            });
            // Настройка перенаправления на httpS
            services.AddHttpsRedirection(options =>
            {
                options.RedirectStatusCode = StatusCodes.Status307TemporaryRedirect; // Статус принимаемый по умолчанию
                options.HttpsPort = 44344; // Порт по умолчанию 443, для отладки пусть используем 44344
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
            // Инициализируем контроллеры
            services.AddControllers();
        }

        public void Configure(IApplicationBuilder app, IWebHostEnvironment env)
        {
            if (env.IsDevelopment())
            {
                app.UseDeveloperExceptionPage();
            }
            else
            {
                // Отсылаем заголовок Strict-Transport-Security, чтобы избежать обращения к незащищенному http
                // Это стандартная необходимая защита
                app.UseHsts();
            }
            // Перенаправление на httpS
            app.UseHttpsRedirection();

            app.UseRouting();
            // Включение авторизации
            app.UseAuthorization();

            app.UseEndpoints(endpoints =>
            {
                // Ищем вызываемые контроллеры и передаём управление им
                endpoints.MapControllers();
                // Ответ при переходе в корневой узел
                endpoints.MapGet("/", async context =>
                {
                    var sb = new System.Text.StringBuilder()
                        .Append("<center><h1>Интерфейс работает и принимает запросы!</center></h1>");
                    context.Response.ContentType = "text/html;charset=utf-8";
                    await context.Response.WriteAsync(sb.ToString());
                });
            });
        }
    }
}
