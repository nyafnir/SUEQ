using Microsoft.IdentityModel.Tokens;
using System.Text;

namespace SUEQ_API
{
    public class TokenOptions
    {
        public const string ISSUER = "SUEQ-API"; // Издатель токена
        public const string AUDIENCE = "UEQ-Client"; // Потребитель токена
        const string KEY = "{j$V$JMCpD~s2Rh{p5~LzfAa#t7VVrd"; // Ключ для шифрации
        public const int LIFETIME = 43200; // Срок жизни токена (по умолчанию) 24 часа (1440), а максимум 30 дней (43200)

        public static SymmetricSecurityKey GetSymmetricSecurityKey()
        {
            return new SymmetricSecurityKey(Encoding.ASCII.GetBytes(KEY));
        }
    }
}
