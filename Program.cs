using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Server.Kestrel.Https;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Hosting;
using System.Net;

namespace SUEQ_API
{
    public class Program
    {
        public static void Main(string[] args)
        {
            CreateHostBuilder(args).Build().Run();
        }

        public static int Https_port { get; private set; }
        public static bool Ssl { get; private set; }

        public static IHostBuilder CreateHostBuilder(string[] args) =>
            Host.CreateDefaultBuilder(args)
                .UseWindowsService() // Программа будет работать как служба
                // Переопределение переменных окружения
                .ConfigureAppConfiguration((hostingContext, config) =>
                {
                    // config.Sources.Clear(); // Очищает все поставщики конфигурации
                    // var env = hostingContext.HostingEnvironment; // env.EnvironmentName
                    config.AddJsonFile("Properties/appsettings.json", false, false);
                    config.AddEnvironmentVariables();
                    // Возможность задавать значения из командной строки
                    if (args != null)
                    {
                        config.AddCommandLine(args);
                    }
                })
                .ConfigureWebHostDefaults(webBuilder =>
                {
                    var AppSettings = new ConfigurationBuilder().AddJsonFile("Properties/appsettings.json").Build();
                    Https_port = System.Convert.ToInt32(AppSettings["HttpsPort"]); // Диапазон существующих портов вписывается в int32
                    Ssl = Https_port != 0;

                    webBuilder.ConfigureKestrel(o =>
                    {
                        o.Configure(AppSettings.GetSection("Kestrel"));
                        o.Listen(IPAddress.Any, System.Convert.ToInt32(AppSettings["HttpPort"]));
                        // Требовать сертификат, если включен httpS
                        if (Ssl)
                        {
                            o.Listen(IPAddress.Any, Https_port,
                                    listenOptions =>
                                    {
                                        listenOptions.UseHttps(AppSettings["Certificate:PFX"],
                                            AppSettings["Certificate:Password"]);
                                    });
                            o.ConfigureHttpsDefaults(o =>
                            {
                                o.ClientCertificateMode = ClientCertificateMode.RequireCertificate;
                            });
                        }
                    });

                    webBuilder.UseStartup<Startup>();
                });
    }
}
