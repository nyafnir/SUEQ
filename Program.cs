using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Hosting;

namespace SUEQ_API
{
    public class Program
    {
        public static void Main(string[] args)
        {
            CreateHostBuilder(args).Build().Run();
        }

        public static IHostBuilder CreateHostBuilder(string[] args) =>
            Host.CreateDefaultBuilder(args)
                // Переопределение переменных окружения
                .ConfigureAppConfiguration((hostingContext, config) =>
                {
                    var env = hostingContext.HostingEnvironment;
                    config
                        .AddJsonFile(
                            "appsettings.json",
                            optional: false, // Файл является обязательным
                            reloadOnChange: true // При сохранении изменений файл перезагружается
                        )
                        .AddJsonFile(
                            $"appsettings.{env.EnvironmentName}.json",
                            optional: true,
                            reloadOnChange: true
                        );
                    config.AddEnvironmentVariables();

                })
                .ConfigureWebHostDefaults(webBuilder =>
                {
                    webBuilder.UseStartup<Startup>();
                });


    }
}
