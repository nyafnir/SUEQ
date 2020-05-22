using Microsoft.EntityFrameworkCore;

namespace SUEQ_API.Models
{
    public class SUEQContext : DbContext
    {
        public SUEQContext(DbContextOptions<SUEQContext> options)
            : base(options)
        {
            // Создаём базу при первом обращении
            Database.EnsureCreated();
        }

        // Подключаем таблицы - указываем сущности
        public DbSet<User> Users { get; set; }
        public DbSet<Queue> Queues { get; set; }
        public DbSet<Position> Positions { get; set; }

        public DbSet<Refresh> Refreshs { get; set; }
    }
}