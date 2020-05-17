namespace SUEQ_API.Models
{
    public class Position
    {
        public int Id { get; set; }
        public int Place { get; set; }
        public int QueueId { get; set; } 
        public virtual Queue Queue { get; set; }
        public int UserId { get; set; }
        public User User { get; set; }
    }
}
