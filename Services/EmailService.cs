using System.Net;
using System.Net.Mail;
using System.Net.Mime;
using System.Threading.Tasks;

namespace SUEQ_API.Services
{
    public class EmailService
    {
        public class ModelMessage
        {
            public string ToEmail;
            public string ToName;
            public string Text;
            public string Html;
        }

        public static Task SendMail(ModelMessage message)
        {
            MailMessage mailMsg = new MailMessage
            {
                From = new MailAddress(Startup.Configuration["SMTP:Usermail"], Startup.Configuration["SMTP:Username"])
            };
            mailMsg.To.Add(new MailAddress(message.ToEmail, message.ToName));

            mailMsg.Subject = message.ToName;

            mailMsg.AlternateViews.Add(AlternateView.CreateAlternateViewFromString(message.Text, null, MediaTypeNames.Text.Plain));
            mailMsg.AlternateViews.Add(AlternateView.CreateAlternateViewFromString(message.Html, null, MediaTypeNames.Text.Html));

            SmtpClient smtpClient = new SmtpClient(Startup.Configuration["SMTP:Host"], System.Convert.ToInt32(Startup.Configuration["SMTP:Port"]));
            NetworkCredential credentials = new NetworkCredential(Startup.Configuration["SMTP:Usermail"], Startup.Configuration["SMTP:Password"]);
            smtpClient.Credentials = credentials;
            smtpClient.EnableSsl = Program.Ssl;

            smtpClient.Send(mailMsg);

            return Task.CompletedTask;
        }
    }
}
