using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Configuration;
using Microsoft.AspNetCore.Server.Kestrel.Https;

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
                    config.AddJsonFile("appsettings.json");
                    config.AddEnvironmentVariables();
                    // Возможность задавать значения из командной строки
                    if (args != null)
                    {
                        config.AddCommandLine(args);
                    }
                })
                .ConfigureWebHostDefaults(webBuilder =>
                {
                    webBuilder.UseStartup<Startup>();
                    var AppSettings = new ConfigurationBuilder().AddJsonFile("appsettings.json").Build();
                    webBuilder.UseUrls(AppSettings["urls"]);
                    // Требовать сертификат
                    if (AppSettings["https_port"] != "0")
                        webBuilder.ConfigureKestrel(o =>
                        {
                            o.ConfigureHttpsDefaults(o =>
                                o.ClientCertificateMode = ClientCertificateMode.RequireCertificate);
                        });
                });
    }
}
